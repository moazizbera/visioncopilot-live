"""
Session Manager Service
Manages session lifecycle, storage, and cleanup
"""

from datetime import datetime
from typing import Optional, Dict, List
from uuid import uuid4
import asyncio

from app.models.session import Session, Message
from app.core.config import settings
from app.core.logger import app_logger


class SessionManager:
    """
    Manages user sessions in-memory
    
    In production, this should be replaced with Redis or a database
    """
    
    def __init__(self):
        self._sessions: Dict[str, Session] = {}
        self._cleanup_task: Optional[asyncio.Task] = None
        app_logger.info("SessionManager initialized")
    
    async def start_cleanup_task(self):
        """Start background task to clean up expired sessions"""
        if self._cleanup_task is None:
            self._cleanup_task = asyncio.create_task(self._cleanup_loop())
            app_logger.info("Session cleanup task started")
    
    async def stop_cleanup_task(self):
        """Stop the cleanup task"""
        if self._cleanup_task:
            self._cleanup_task.cancel()
            try:
                await self._cleanup_task
            except asyncio.CancelledError:
                pass
            self._cleanup_task = None
            app_logger.info("Session cleanup task stopped")
    
    async def _cleanup_loop(self):
        """Background task to periodically clean up expired sessions"""
        while True:
            try:
                await asyncio.sleep(300)  # Check every 5 minutes
                await self.cleanup_expired_sessions()
            except asyncio.CancelledError:
                break
            except Exception as e:
                app_logger.error(f"Error in cleanup loop: {e}")
    
    async def cleanup_expired_sessions(self) -> int:
        """
        Remove expired sessions
        
        Returns:
            Number of sessions cleaned up
        """
        expired_sessions = [
            session_id
            for session_id, session in self._sessions.items()
            if session.is_expired(settings.session_timeout_minutes)
        ]
        
        for session_id in expired_sessions:
            del self._sessions[session_id]
            app_logger.info(f"Cleaned up expired session: {session_id}")
        
        if expired_sessions:
            app_logger.info(f"Cleaned up {len(expired_sessions)} expired sessions")
        
        return len(expired_sessions)
    
    def create_session(
        self,
        user_id: Optional[str] = None,
        metadata: Optional[Dict] = None
    ) -> Session:
        """
        Create a new session
        
        Args:
            user_id: Optional user identifier
            metadata: Optional metadata
            
        Returns:
            Created session
        """
        session_id = str(uuid4())
        now = datetime.now()
        
        session = Session(
            session_id=session_id,
            created_at=now,
            last_active=now,
            is_active=True,
            user_id=user_id,
            metadata=metadata or {}
        )
        
        self._sessions[session_id] = session
        app_logger.info(f"Created new session: {session_id}")
        
        return session
    
    def get_session(self, session_id: str) -> Optional[Session]:
        """
        Get a session by ID
        
        Args:
            session_id: Session identifier
            
        Returns:
            Session if found, None otherwise
        """
        session = self._sessions.get(session_id)
        
        if session:
            # Check if expired
            if session.is_expired(settings.session_timeout_minutes):
                app_logger.warning(f"Session {session_id} has expired")
                session.deactivate()
                return None
            
            # Update activity
            session.update_activity()
        
        return session
    
    def delete_session(self, session_id: str) -> bool:
        """
        Delete a session
        
        Args:
            session_id: Session identifier
            
        Returns:
            True if session was deleted, False if not found
        """
        if session_id in self._sessions:
            del self._sessions[session_id]
            app_logger.info(f"Deleted session: {session_id}")
            return True
        
        return False
    
    def list_active_sessions(self) -> List[Session]:
        """
        Get all active sessions
        
        Returns:
            List of active sessions
        """
        return [
            session
            for session in self._sessions.values()
            if session.is_active and not session.is_expired(settings.session_timeout_minutes)
        ]
    
    def get_session_count(self) -> int:
        """
        Get total number of sessions
        
        Returns:
            Session count
        """
        return len(self._sessions)
    
    def add_message_to_session(
        self,
        session_id: str,
        content: str,
        role: str,
        message_type: str = "text",
        metadata: Optional[Dict] = None
    ) -> Optional[Message]:
        """
        Add a message to a session
        
        Args:
            session_id: Session identifier
            content: Message content
            role: 'user' or 'assistant'
            message_type: Type of message
            metadata: Optional metadata
            
        Returns:
            Created message if successful, None if session not found
        """
        session = self.get_session(session_id)
        
        if not session:
            app_logger.warning(f"Cannot add message: session {session_id} not found")
            return None
        
        message = session.add_message(content, role, message_type, metadata)
        app_logger.debug(f"Added {role} message to session {session_id}")
        
        return message
    
    def get_session_history(
        self,
        session_id: str,
        max_messages: int = 10
    ) -> Optional[List[Message]]:
        """
        Get conversation history for a session
        
        Args:
            session_id: Session identifier
            max_messages: Maximum number of messages to return
            
        Returns:
            List of messages if session found, None otherwise
        """
        session = self.get_session(session_id)
        
        if not session:
            return None
        
        return session.get_history(max_messages)


# Global session manager instance
session_manager = SessionManager()
