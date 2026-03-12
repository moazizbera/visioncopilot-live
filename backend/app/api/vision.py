"""
Vision API Routes
Handles image and screen analysis requests
"""

from datetime import datetime
from typing import Optional
from fastapi import APIRouter, HTTPException, status, File, UploadFile
from pydantic import BaseModel

from app.core.session_manager import session_manager
from app.core.gemini_service import gemini_service
from app.core.image_processor import image_processor
from app.core.logger import app_logger
from app.models.schemas import AIResponse

router = APIRouter(prefix="/vision", tags=["vision"])


class ImageAnalysisRequest(BaseModel):
    """Request model for image analysis"""
    session_id: str
    prompt: str
    image_base64: str
    include_history: bool = True


class ScreenAnalysisRequest(BaseModel):
    """Request model for screen capture analysis"""
    session_id: str
    prompt: str
    screen_base64: str
    context: Optional[str] = None


class CameraAnalysisRequest(BaseModel):
    """Request model for camera frame analysis"""
    session_id: str
    prompt: str
    frame_base64: str


@router.post("/analyze-image", response_model=AIResponse)
async def analyze_image(request: ImageAnalysisRequest):
    """
    Analyze an image with AI vision
    
    Args:
        request: Image analysis request
        
    Returns:
        AI analysis response
    """
    # Validate session
    session = session_manager.get_session(request.session_id)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found or expired"
        )
    
    try:
        # Validate and get image info
        image_info = image_processor.get_image_info(request.image_base64)
        app_logger.info(f"Analyzing image: {image_info.get('width')}x{image_info.get('height')}")
        
        # Add user message to session
        session_manager.add_message_to_session(
            session_id=request.session_id,
            content=f"[Image] {request.prompt}",
            role="user",
            message_type="image",
            metadata={"image_info": image_info}
        )
        
        # Get conversation history if requested
        history = None
        if request.include_history:
            history = session_manager.get_session_history(request.session_id, max_messages=10)
        
        # Analyze image
        response_text = await gemini_service.analyze_image(
            prompt=request.prompt,
            image_base64=request.image_base64,
            history=history
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
            model="gemini-2.5-flash",
            metadata={"image_analyzed": True}
        )
        
    except ValueError as e:
        app_logger.error(f"Image validation error: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        app_logger.error(f"Error analyzing image: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to analyze image"
        )


@router.post("/analyze-screen", response_model=AIResponse)
async def analyze_screen(request: ScreenAnalysisRequest):
    """
    Analyze a screen capture
    
    Args:
        request: Screen analysis request
        
    Returns:
        AI analysis response
    """
    # Validate session
    session = session_manager.get_session(request.session_id)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found or expired"
        )
    
    try:
        # Get screen info
        screen_info = image_processor.get_image_info(request.screen_base64)
        app_logger.info(f"Analyzing screen: {screen_info.get('width')}x{screen_info.get('height')}")
        
        # Add user message to session
        context_text = f" (Context: {request.context})" if request.context else ""
        session_manager.add_message_to_session(
            session_id=request.session_id,
            content=f"[Screen Share] {request.prompt}{context_text}",
            role="user",
            message_type="image",
            metadata={"type": "screen_capture", "screen_info": screen_info}
        )
        
        # Analyze screen
        response_text = await gemini_service.analyze_screen_capture(
            prompt=request.prompt,
            screen_base64=request.screen_base64,
            context=request.context
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
            model="gemini-2.5-flash",
            metadata={"screen_analyzed": True}
        )
        
    except ValueError as e:
        app_logger.error(f"Screen validation error: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        app_logger.error(f"Error analyzing screen: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to analyze screen capture"
        )


@router.post("/analyze-camera", response_model=AIResponse)
async def analyze_camera(request: CameraAnalysisRequest):
    """
    Analyze a camera frame
    
    Args:
        request: Camera analysis request
        
    Returns:
        AI analysis response
    """
    # Validate session
    session = session_manager.get_session(request.session_id)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found or expired"
        )
    
    try:
        # Get frame info
        frame_info = image_processor.get_image_info(request.frame_base64)
        app_logger.info(f"Analyzing camera frame: {frame_info.get('width')}x{frame_info.get('height')}")
        
        # Add user message to session
        session_manager.add_message_to_session(
            session_id=request.session_id,
            content=f"[Camera] {request.prompt}",
            role="user",
            message_type="image",
            metadata={"type": "camera_frame", "frame_info": frame_info}
        )
        
        # Analyze camera frame
        response_text = await gemini_service.analyze_camera_frame(
            prompt=request.prompt,
            frame_base64=request.frame_base64
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
            model="gemini-2.5-flash",
            metadata={"camera_analyzed": True}
        )
        
    except ValueError as e:
        app_logger.error(f"Camera frame validation error: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        app_logger.error(f"Error analyzing camera frame: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to analyze camera frame"
        )


@router.post("/optimize-image")
async def optimize_image(image_base64: str, max_size_kb: int = 500):
    """
    Optimize an image for transmission
    
    Args:
        image_base64: Base64 encoded image
        max_size_kb: Maximum size in kilobytes
        
    Returns:
        Optimized base64 image
    """
    try:
        optimized = image_processor.optimize_for_api(image_base64, max_size_kb)
        
        original_info = image_processor.get_image_info(image_base64)
        optimized_info = image_processor.get_image_info(optimized)
        
        return {
            "optimized_image": optimized,
            "original_size_kb": original_info.get("size_kb"),
            "optimized_size_kb": optimized_info.get("size_kb"),
            "compression_ratio": original_info.get("size_kb", 0) / optimized_info.get("size_kb", 1)
        }
        
    except Exception as e:
        app_logger.error(f"Error optimizing image: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to optimize image"
        )


@router.get("/image-info")
async def get_image_info(image_base64: str):
    """
    Get information about an image
    
    Args:
        image_base64: Base64 encoded image
        
    Returns:
        Image information
    """
    try:
        info = image_processor.get_image_info(image_base64)
        return info
    except Exception as e:
        app_logger.error(f"Error getting image info: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to get image information"
        )
