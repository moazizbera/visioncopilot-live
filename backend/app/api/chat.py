"""
Chat API Routes
Handles text-based chat interactions with Gemini
"""

from datetime import datetime
from fastapi import APIRouter, HTTPException, status
from fastapi.responses import StreamingResponse

from app.models.schemas import AIRequest, AIResponse, MessageResponse
from app.core.session_manager import session_manager
from app.core.gemini_service import gemini_service
from app.core.logger import app_logger

router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("/", response_model=AIResponse)
async def send_message(request: AIRequest):
    """
    Send a message and get AI response
    
    Args:
        request: AI request with prompt and session info
        
    Returns:
        AI response
    """
    # Validate session
    session = session_manager.get_session(request.session_id)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found or expired"
        )
    
    try:
        # Add user message to session
        session_manager.add_message_to_session(
            session_id=request.session_id,
            content=request.prompt,
            role="user",
            message_type="text"
        )
        
        # Get conversation history if requested
        history = None
        if request.include_history:
            history = session_manager.get_session_history(
                request.session_id,
                max_messages=request.max_history
            )
        
        # Generate response
        app_logger.info(f"Generating response for session: {request.session_id}")
        response_text = await gemini_service.generate_response(
            prompt=request.prompt,
            history=history,
            include_history=request.include_history
        )
        
        # Add assistant response to session
        session_manager.add_message_to_session(
            session_id=request.session_id,
            content=response_text,
            role="assistant",
            message_type="text"
        )
        
        return AIResponse(
            session_id=request.session_id,
            response=response_text,
            timestamp=datetime.now(),
            model="gemini-2.5-flash"
        )
        
    except ValueError as e:
        app_logger.error(f"Configuration error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="AI service not properly configured"
        )
    except Exception as e:
        error_msg = str(e)
        app_logger.error(f"Error generating response: {e}")
        
        # Check for quota exceeded error
        if "quota" in error_msg.lower() or "429" in error_msg or "ResourceExhausted" in error_msg:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="API quota exceeded. Please try again later or upgrade your API plan."
            )
        
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate response: {error_msg[:200]}"
        )


@router.post("/stream")
async def stream_message(request: AIRequest):
    """
    Send a message and stream AI response
    
    Args:
        request: AI request with prompt and session info
        
    Returns:
        Streaming response
    """
    # Validate session
    session = session_manager.get_session(request.session_id)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found or expired"
        )
    
    # Add user message to session
    session_manager.add_message_to_session(
        session_id=request.session_id,
        content=request.prompt,
        role="user",
        message_type="text"
    )
    
    # Get conversation history if requested
    history = None
    if request.include_history:
        history = session_manager.get_session_history(
            request.session_id,
            max_messages=request.max_history
        )
    
    async def response_generator():
        """Generate streaming response chunks"""
        try:
            full_response = []
            
            async for chunk in gemini_service.stream_response(
                prompt=request.prompt,
                history=history
            ):
                full_response.append(chunk)
                yield chunk
            
            # Save complete response to session
            complete_response = "".join(full_response)
            session_manager.add_message_to_session(
                session_id=request.session_id,
                content=complete_response,
                role="assistant",
                message_type="text"
            )
            
        except Exception as e:
            app_logger.error(f"Error streaming response: {e}")
            yield f"Error: {str(e)}"
    
    return StreamingResponse(
        response_generator(),
        media_type="text/plain"
    )


@router.get("/{session_id}/history")
async def get_chat_history(session_id: str, max_messages: int = 10):
    """
    Get chat history for a session
    
    Args:
        session_id: Session identifier
        max_messages: Maximum number of messages to return
        
    Returns:
        List of messages
    """
    session = session_manager.get_session(session_id)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found or expired"
        )
    
    history = session.get_history(max_messages)
    
    return [
        MessageResponse(
            message_id=msg.message_id,
            session_id=session_id,
            content=msg.content,
            message_type=msg.message_type,
            role=msg.role,
            timestamp=msg.timestamp,
            metadata=msg.metadata
        )
        for msg in history
    ]


@router.post("/{session_id}/summary")
async def generate_summary(session_id: str):
    """
    Generate a comprehensive summary of the conversation session
    
    Args:
        session_id: Session identifier
        
    Returns:
        Summary of the conversation
    """
    # Validate session
    session = session_manager.get_session(session_id)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found or expired"
        )
    
    try:
        # Get full session history
        history = session_manager.get_session_history(
            session_id,
            max_messages=None  # Get all messages
        )
        
        if not history:
            return {
                "summary": "No conversation history to summarize yet. Start chatting to generate a summary!"
            }
        
        app_logger.info(f"Generating summary for session: {session_id} with {len(history)} messages")
        
        # Generate summary using Gemini
        summary_text = await gemini_service.generate_session_summary(history)
        
        # Add summary as a system message to session
        session_manager.add_message_to_session(
            session_id=session_id,
            content=summary_text,
            role="system",
            message_type="summary"
        )
        
        return {
            "summary": summary_text,
            "message_count": len(history),
            "timestamp": datetime.now().isoformat()
        }
        
    except ValueError as e:
        app_logger.error(f"Configuration error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="AI service not properly configured"
        )
    except Exception as e:
        error_msg = str(e)
        app_logger.error(f"Error generating summary: {e}")
        
        # Check for quota exceeded error
        if "quota" in error_msg.lower() or "429" in error_msg or "ResourceExhausted" in error_msg:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="API quota exceeded. Please try again later or upgrade your API plan."
            )
        
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate summary: {error_msg[:200]}"
        )
