"""
Pydantic Models for API Requests and Responses
"""

from datetime import datetime
from typing import Optional, Dict, Any, List, Literal
from pydantic import BaseModel, Field
from uuid import UUID


# ============================================================================
# Session Models
# ============================================================================

class SessionCreate(BaseModel):
    """Request model for creating a new session"""
    user_id: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


class SessionResponse(BaseModel):
    """Response model for session data"""
    session_id: str
    user_id: Optional[str] = None
    created_at: datetime
    last_active: datetime
    is_active: bool
    metadata: Optional[Dict[str, Any]] = None


class SessionStatus(BaseModel):
    """Session status information"""
    session_id: str
    is_active: bool
    duration_seconds: float


# ============================================================================
# Message Models
# ============================================================================

class MessageCreate(BaseModel):
    """Request model for creating a message"""
    content: str
    message_type: Literal["text", "voice", "image"] = "text"
    metadata: Optional[Dict[str, Any]] = None


class MessageResponse(BaseModel):
    """Response model for a message"""
    message_id: str
    session_id: str
    content: str
    message_type: str
    role: Literal["user", "assistant"]
    timestamp: datetime
    metadata: Optional[Dict[str, Any]] = None


# ============================================================================
# AI Processing Models
# ============================================================================

class AIRequest(BaseModel):
    """Request model for AI processing"""
    prompt: str
    session_id: str
    include_history: bool = True
    max_history: int = 10
    stream: bool = False


class AIResponse(BaseModel):
    """Response model for AI processing"""
    session_id: str
    response: str
    timestamp: datetime
    model: str = "gemini-pro"
    metadata: Optional[Dict[str, Any]] = None


# ============================================================================
# Media Models
# ============================================================================

class MediaFrame(BaseModel):
    """Model for media frame data"""
    frame_type: Literal["camera", "screen"]
    data: str  # Base64 encoded image
    timestamp: datetime
    metadata: Optional[Dict[str, Any]] = None


class VoiceData(BaseModel):
    """Model for voice input data"""
    audio_data: str  # Base64 encoded audio
    format: str = "webm"
    sample_rate: int = 48000
    timestamp: datetime


# ============================================================================
# WebSocket Models
# ============================================================================

class WSMessage(BaseModel):
    """WebSocket message format"""
    type: Literal["text", "image", "audio", "ping", "pong", "error"]
    data: Any
    session_id: Optional[str] = None
    timestamp: Optional[datetime] = None
    metadata: Optional[Dict[str, Any]] = None


class WSResponse(BaseModel):
    """WebSocket response format"""
    type: Literal["response", "stream", "error", "status"]
    data: Any
    session_id: str
    timestamp: datetime


# ============================================================================
# Error Models
# ============================================================================

class ErrorResponse(BaseModel):
    """Standard error response"""
    error: str
    detail: Optional[str] = None
    timestamp: datetime
    request_id: Optional[str] = None


# ============================================================================
# Health Check Models
# ============================================================================

class HealthResponse(BaseModel):
    """Health check response"""
    status: str
    service: str
    version: str
    timestamp: datetime
    components: Dict[str, str] = Field(default_factory=dict)
