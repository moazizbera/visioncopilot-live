# Session Management

## Overview

Sessions track user interactions and maintain state throughout a conversation with the AI assistant.

## Session Lifecycle

1. **Creation** - When a user connects via WebSocket
2. **Active** - During ongoing interaction
3. **Dormant** - Inactive but preserved
4. **Expired** - Removed after timeout

## Data Structure

```python
class Session:
    id: str
    user_id: Optional[str]
    created_at: datetime
    last_active: datetime
    state: Dict[str, Any]
    media_config: MediaConfig
```

## Implementation (To be added)

- Session store (Redis/In-memory)
- Session timeout management
- State persistence
- Session recovery
