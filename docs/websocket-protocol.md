# WebSocket Protocol

## Connection

```typescript
const socket = io('ws://localhost:8000');
```

## Events

### Client → Server

#### `connect`
Establish WebSocket connection

#### `message`
Send text message to AI
```json
{
  "type": "text",
  "content": "Hello AI"
}
```

#### `video_frame`
Send video frame for analysis
```json
{
  "type": "video",
  "data": "base64_encoded_frame",
  "timestamp": 1234567890
}
```

#### `audio_chunk`
Send audio chunk for processing
```json
{
  "type": "audio",
  "data": "base64_encoded_audio",
  "timestamp": 1234567890
}
```

### Server → Client

#### `response`
AI response message
```json
{
  "type": "text",
  "content": "AI response here",
  "timestamp": 1234567890
}
```

#### `stream`
Streaming AI response
```json
{
  "type": "stream",
  "chunk": "partial response",
  "done": false
}
```

#### `error`
Error message
```json
{
  "type": "error",
  "message": "Error description"
}
```

## Implementation Status

🟡 **In Progress** - WebSocket protocol to be implemented in next phase
