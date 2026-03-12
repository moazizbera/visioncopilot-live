"""
Gemini AI Service
Wraps the Gemini client and provides business logic
"""

import sys
from pathlib import Path
from typing import Optional, List, AsyncGenerator
import google.generativeai as genai
from PIL import Image as PILImage
import io

# Add parent directory to path to import ai module
sys.path.insert(0, str(Path(__file__).parent.parent.parent.parent))

from ai.gemini_client import GeminiClient, get_gemini_client
from app.core.config import settings
from app.core.logger import app_logger
from app.core.image_processor import image_processor
from app.models.session import Message


class GeminiService:
    """
    Service layer for Gemini AI interactions
    Handles prompt construction, context management, and response processing
    """
    
    SYSTEM_PROMPT = """
You are VisionCopilot Live, a real-time multimodal AI assistant.

You help users understand screens, camera input, and conversations.
You analyze visual content, explain context, and provide helpful guidance.

Respond clearly and concisely.
When analyzing images or screens, explain what you see and why it matters.

Be friendly, professional, and focus on actionable insights.
"""
    
    def __init__(self):
        """Initialize Gemini service"""
        self._client: Optional[GeminiClient] = None
        app_logger.info("GeminiService initialized")
    
    def _get_client(self) -> GeminiClient:
        """Get or create Gemini client instance"""
        if self._client is None:
            if not settings.gemini_api_key:
                app_logger.error("GEMINI_API_KEY not configured")
                raise ValueError("GEMINI_API_KEY is not configured")
            
            self._client = GeminiClient(api_key=settings.gemini_api_key)
            app_logger.info("Gemini client initialized")
        
        return self._client
    
    def _build_prompt_with_history(
        self,
        user_prompt: str,
        history: Optional[List[Message]] = None
    ) -> str:
        """
        Build a prompt that includes conversation history
        
        Args:
            user_prompt: Current user prompt
            history: Previous conversation messages
            
        Returns:
            Formatted prompt with context
        """
        # Start with system prompt
        context_parts = [self.SYSTEM_PROMPT]
        
        if history:
            # Add conversation history
            context_parts.append("\nPrevious conversation:")
            for msg in history:
                role = "User" if msg.role == "user" else "Assistant"
                context_parts.append(f"{role}: {msg.content}")
        
        # Add current request
        context_parts.append(f"\nCurrent request:\nUser: {user_prompt}")
        
        return "\n".join(context_parts)
    
    async def generate_response(
        self,
        prompt: str,
        history: Optional[List[Message]] = None,
        include_history: bool = True
    ) -> str:
        """
        Generate a text response from Gemini
        
        Args:
            prompt: User prompt
            history: Conversation history
            include_history: Whether to include history in prompt
            
        Returns:
            Generated response text
        """
        try:
            client = self._get_client()
            
            # Build prompt with context if requested
            if include_history and history:
                full_prompt = self._build_prompt_with_history(prompt, history)
            else:
                full_prompt = prompt
            
            app_logger.debug(f"Generating response for prompt: {prompt[:100]}...")
            
            # Generate response
            response = await client.generate_text(full_prompt)
            
            app_logger.info("Successfully generated response from Gemini")
            return response
            
        except Exception as e:
            app_logger.error(f"Error generating response: {e}")
            raise
    
    async def generate_multimodal_response(
        self,
        prompt: str,
        images: Optional[List[bytes]] = None,
        history: Optional[List[Message]] = None
    ) -> str:
        """
        Generate a multimodal response from text and images
        
        Args:
            prompt: User prompt
            images: List of image bytes
            history: Conversation history
            
        Returns:
            Generated response text
        """
        try:
            client = self._get_client()
            
            # Build prompt with context
            if history:
                full_prompt = self._build_prompt_with_history(prompt, history)
            else:
                full_prompt = prompt
            
            app_logger.debug(f"Generating multimodal response with {len(images) if images else 0} images")
            
            # Generate response
            response = await client.generate_multimodal(full_prompt, images)
            
            app_logger.info("Successfully generated multimodal response from Gemini")
            return response
            
        except Exception as e:
            app_logger.error(f"Error generating multimodal response: {e}")
            raise
    
    async def analyze_image(
        self,
        prompt: str,
        image_base64: str,
        history: Optional[List[Message]] = None
    ) -> str:
        """
        Analyze a single image with text prompt
        
        Args:
            prompt: Question or instruction about the image
            image_base64: Base64 encoded image
            history: Conversation history
            
        Returns:
            Generated response text
        """
        try:
            # Validate and optimize image
            app_logger.debug("Processing image for analysis")
            image_bytes = image_processor.prepare_for_gemini(image_base64)
            
            # Convert bytes to PIL Image for Gemini
            image = PILImage.open(io.BytesIO(image_bytes))
            
            # Build prompt with history if available
            if history:
                full_prompt = self._build_prompt_with_history(prompt, history)
            else:
                full_prompt = prompt
            
            # Use vision model directly
            if not settings.gemini_api_key:
                raise ValueError("GEMINI_API_KEY not configured")
            
            genai.configure(api_key=settings.gemini_api_key)
            model = genai.GenerativeModel('models/gemini-2.5-flash')
            
            app_logger.info(f"Analyzing image with prompt: {prompt[:100]}...")
            
            # Generate response
            response = await model.generate_content_async([full_prompt, image])
            
            if not response or not response.text:
                raise ValueError("Empty response from Gemini Vision")
            
            app_logger.info("Successfully analyzed image with Gemini Vision")
            return response.text
            
        except Exception as e:
            app_logger.error(f"Error analyzing image: {e}")
            raise
    
    async def analyze_screen_capture(
        self,
        prompt: str,
        screen_base64: str,
        context: Optional[str] = None
    ) -> str:
        """
        Analyze a screen capture
        
        Args:
            prompt: Question about the screen
            screen_base64: Base64 encoded screen capture
            context: Additional context about what user is doing
            
        Returns:
            Analysis response
        """
        try:
            # Add screen-specific context to prompt
            enhanced_prompt = f"""You are analyzing a user's screen capture.
            
User's question: {prompt}

{f'Additional context: {context}' if context else ''}

Please provide a helpful analysis of what you see on the screen."""

            return await self.analyze_image(enhanced_prompt, screen_base64)
            
        except Exception as e:
            app_logger.error(f"Error analyzing screen capture: {e}")
            raise
    
    async def analyze_camera_frame(
        self,
        prompt: str,
        frame_base64: str,
        frame_context: Optional[dict] = None
    ) -> str:
        """
        Analyze a camera frame
        
        Args:
            prompt: Question about the camera view
            frame_base64: Base64 encoded camera frame
            frame_context: Metadata about the frame (timestamp, etc.)
            
        Returns:
            Analysis response
        """
        try:
            # Add camera-specific context
            enhanced_prompt = f"""You are analyzing a camera frame.

User's question: {prompt}

Please describe what you see and answer the user's question."""

            return await self.analyze_image(enhanced_prompt, frame_base64)
            
        except Exception as e:
            app_logger.error(f"Error analyzing camera frame: {e}")
            raise
    
    async def stream_response(
        self,
        prompt: str,
        history: Optional[List[Message]] = None
    ) -> AsyncGenerator[str, None]:
        """
        Stream response tokens from Gemini
        
        Args:
            prompt: User prompt
            history: Conversation history
            
        Yields:
            Response tokens
        """
        try:
            client = self._get_client()
            
            # Build prompt with context
            if history:
                full_prompt = self._build_prompt_with_history(prompt, history)
            else:
                full_prompt = prompt
            
            app_logger.debug("Starting response stream")
            
            # Stream response
            async for chunk in client.stream_response(full_prompt):
                yield chunk
            
            app_logger.info("Completed response stream")
            
        except Exception as e:
            app_logger.error(f"Error streaming response: {e}")
            raise
    
    async def generate_session_summary(
        self,
        session_history: List[Message]
    ) -> str:
        """
        Generate a comprehensive summary of the entire conversation session
        
        Args:
            session_history: Full list of conversation messages
            
        Returns:
            Structured summary of the session
        """
        try:
            if not session_history:
                return "No conversation history to summarize."
            
            client = self._get_client()
            
            # Build conversation transcript
            transcript_parts = ["Conversation transcript:"]
            for msg in session_history:
                role = "User" if msg.role == "user" else "Assistant"
                transcript_parts.append(f"\n{role}: {msg.content}")
            
            transcript = "\n".join(transcript_parts)
            
            # Create structured summarization prompt
            summary_prompt = f"""Analyze the following conversation and provide a comprehensive structured summary.

{transcript}

Please provide a clear, organized summary with the following sections:

📋 **KEY TOPICS DISCUSSED**
(List the main topics covered in the conversation)

💡 **IMPORTANT FINDINGS**
(Highlight key insights, facts, or information discovered)

✅ **DECISIONS MADE**
(Any decisions, conclusions, or agreements reached)

❓ **OPEN QUESTIONS**
(Unresolved questions or topics that need follow-up)

🎯 **ACTION ITEMS**
(Any tasks, recommendations, or next steps identified)

Keep the summary concise but comprehensive. Use bullet points for clarity.
If a section doesn't apply to this conversation, write "None" for that section."""

            app_logger.info(f"Generating session summary for {len(session_history)} messages")
            
            # Generate summary
            response = await client.generate_text(summary_prompt)
            
            app_logger.info("Successfully generated session summary")
            return response
            
        except Exception as e:
            app_logger.error(f"Error generating session summary: {e}")
            raise


# Global Gemini service instance
gemini_service = GeminiService()
