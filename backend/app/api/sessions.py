"""
Session API Routes
Handles session creation, retrieval, and management
"""

from datetime import datetime
from typing import List
from fastapi import APIRouter, HTTPException, status

from app.models.schemas import SessionCreate, SessionResponse, SessionStatus
from app.core.session_manager import session_manager
from app.core.logger import app_logger

router = APIRouter(prefix="/sessions", tags=["sessions"])


@router.post("/", response_model=SessionResponse, status_code=status.HTTP_201_CREATED)
async def create_session(session_data: SessionCreate):
    """
    Create a new session
    
    Args:
        session_data: Session creation data
        
    Returns:
        Created session information
    """
    try:
        session = session_manager.create_session(
            user_id=session_data.user_id,
            metadata=session_data.metadata
        )
        
        app_logger.info(f"Created session via API: {session.session_id}")
        
        return SessionResponse(
            session_id=session.session_id,
            user_id=session.user_id,
            created_at=session.created_at,
            last_active=session.last_active,
            is_active=session.is_active,
            metadata=session.metadata
        )
    except Exception as e:
        app_logger.error(f"Error creating session: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create session"
        )


@router.get("/{session_id}", response_model=SessionResponse)
async def get_session(session_id: str):
    """
    Get session information by ID
    
    Args:
        session_id: Session identifier
        
    Returns:
        Session information
    """
    session = session_manager.get_session(session_id)
    
    if not session:
        app_logger.warning(f"Session not found: {session_id}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found or expired"
        )
    
    return SessionResponse(
        session_id=session.session_id,
        user_id=session.user_id,
        created_at=session.created_at,
        last_active=session.last_active,
        is_active=session.is_active,
        metadata=session.metadata
    )


@router.delete("/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_session(session_id: str):
    """
    Delete a session
    
    Args:
        session_id: Session identifier
    """
    deleted = session_manager.delete_session(session_id)
    
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )
    
    app_logger.info(f"Deleted session via API: {session_id}")


@router.get("/{session_id}/status", response_model=SessionStatus)
async def get_session_status(session_id: str):
    """
    Get session status
    
    Args:
        session_id: Session identifier
        
    Returns:
        Session status
    """
    session = session_manager.get_session(session_id)
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found or expired"
        )
    
    duration = (datetime.now() - session.created_at).total_seconds()
    
    return SessionStatus(
        session_id=session.session_id,
        is_active=session.is_active,
        duration_seconds=duration
    )


@router.get("/", response_model=List[SessionResponse])
async def list_sessions():
    """
    List all active sessions
    
    Returns:
        List of active sessions
    """
    sessions = session_manager.list_active_sessions()
    
    return [
        SessionResponse(
            session_id=session.session_id,
            user_id=session.user_id,
            created_at=session.created_at,
            last_active=session.last_active,
            is_active=session.is_active,
            metadata=session.metadata
        )
        for session in sessions
    ]
