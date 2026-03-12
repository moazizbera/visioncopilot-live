"""
Session Model - Internal representation
"""

from datetime import datetime, timedelta
from typing import Optional, Dict, Any, List
from uuid import uuid4
from dataclasses import dataclass, field


@dataclass
class Message:
    """Represents a single message in a conversation"""
    message_id: str
    content: str
    role: str  # 'user' or 'assistant'
    message_type: str  # 'text', 'voice', 'image'
    timestamp: datetime
    metadata: Optional[Dict[str, Any]] = None


@dataclass
class Session:
    """
    Represents a user session with conversation history
    """
    session_id: str
    created_at: datetime
    last_active: datetime
    is_active: bool = True
    user_id: Optional[str] = None
    messages: List[Message] = field(default_factory=list)
    metadata: Optional[Dict[str, Any]] = None
    
    def add_message(
        self,
        content: str,
        role: str,
        message_type: str = "text",
        metadata: Optional[Dict[str, Any]] = None
    ) -> Message:
        """
        Add a message to the session history
        
        Args:
            content: Message content
            role: 'user' or 'assistant'
            message_type: Type of message
            metadata: Optional metadata
            
        Returns:
            Created message
        """
        message = Message(
            message_id=str(uuid4()),
            content=content,
            role=role,
            message_type=message_type,
            timestamp=datetime.now(),
            metadata=metadata
        )
        self.messages.append(message)
        self.last_active = datetime.now()
        return message
    
    def get_history(self, max_messages: int = 10) -> List[Message]:
        """
        Get recent conversation history
        
        Args:
            max_messages: Maximum number of messages to return
            
        Returns:
            List of recent messages
        """
        return self.messages[-max_messages:]
    
    def is_expired(self, timeout_minutes: int = 30) -> bool:
        """
        Check if session has expired
        
        Args:
            timeout_minutes: Timeout duration in minutes
            
        Returns:
            True if session is expired
        """
        if not self.is_active:
            return True
        
        timeout = timedelta(minutes=timeout_minutes)
        return datetime.now() - self.last_active > timeout
    
    def deactivate(self):
        """Deactivate the session"""
        self.is_active = False
    
    def update_activity(self):
        """Update last activity timestamp"""
        self.last_active = datetime.now()
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert session to dictionary"""
        return {
            "session_id": self.session_id,
            "created_at": self.created_at.isoformat(),
            "last_active": self.last_active.isoformat(),
            "is_active": self.is_active,
            "user_id": self.user_id,
            "message_count": len(self.messages),
            "metadata": self.metadata
        }
