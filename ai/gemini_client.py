"""
Gemini AI Client
Handles communication with Google's Gemini API
"""

import os
from typing import Optional, List, Dict, Any
import google.generativeai as genai


class GeminiClient:
    """Client for interacting with Gemini AI"""
    
    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize Gemini client
        
        Args:
            api_key: Gemini API key. If not provided, reads from GEMINI_API_KEY env var
        """
        self.api_key = api_key or os.getenv("GEMINI_API_KEY")
        if not self.api_key:
            raise ValueError("GEMINI_API_KEY not found in environment variables")
        
        genai.configure(api_key=self.api_key)
        # Use gemini-2.5-flash which may have different quota
        self.model = genai.GenerativeModel('models/gemini-2.5-flash')
        self.vision_model = genai.GenerativeModel('models/gemini-2.5-flash')
    
    async def generate_text(self, prompt: str) -> str:
        """
        Generate text response from prompt
        
        Args:
            prompt: Input text prompt
            
        Returns:
            Generated text response
        """
        response = await self.model.generate_content_async(prompt)
        return response.text
    
    async def generate_multimodal(
        self, 
        prompt: str, 
        images: Optional[List[bytes]] = None
    ) -> str:
        """
        Generate response from text and images
        
        Args:
            prompt: Input text prompt
            images: List of image bytes
            
        Returns:
            Generated response
        """
        content = [prompt]
        
        if images:
            # Process images (placeholder for actual image processing)
            content.extend(images)
        
        response = await self.vision_model.generate_content_async(content)
        return response.text
    
    async def stream_response(self, prompt: str):
        """
        Stream response tokens
        
        Args:
            prompt: Input text prompt
            
        Yields:
            Response tokens
        """
        response = await self.model.generate_content_async(
            prompt,
            stream=True
        )
        
        async for chunk in response:
            yield chunk.text


# Singleton instance
_client: Optional[GeminiClient] = None


def get_gemini_client() -> GeminiClient:
    """Get or create Gemini client singleton"""
    global _client
    if _client is None:
        _client = GeminiClient()
    return _client
