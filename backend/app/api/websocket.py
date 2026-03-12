"""
WebSocket Endpoint for Real-time Communication
"""

import json
from datetime import datetime
from typing import Dict
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from fastapi.websockets import WebSocketState

from app.models.schemas import WSMessage, WSResponse
from app.core.session_manager import session_manager
from app.core.gemini_service import gemini_service
from app.core.logger import app_logger

router = APIRouter()


class ConnectionManager:
    """Manages WebSocket connections"""
    
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
        self.streaming_modes: Dict[str, dict] = {}  # Track continuous streaming states
    
    async def connect(self, websocket: WebSocket, session_id: str):
        """Accept and register a WebSocket connection"""
        await websocket.accept()
        self.active_connections[session_id] = websocket
        app_logger.info(f"WebSocket connected: {session_id}")
    
    def disconnect(self, session_id: str):
        """Remove a WebSocket connection"""
        if session_id in self.active_connections:
            del self.active_connections[session_id]
            app_logger.info(f"WebSocket disconnected: {session_id}")
        
        # Clean up streaming modes
        if session_id in self.streaming_modes:
            del self.streaming_modes[session_id]
    
    async def send_message(self, session_id: str, message: dict):
        """Send a message to a specific connection"""
        if session_id in self.active_connections:
            websocket = self.active_connections[session_id]
            if websocket.client_state == WebSocketState.CONNECTED:
                await websocket.send_json(message)
    
    async def send_error(self, session_id: str, error: str):
        """Send an error message"""
        await self.send_message(session_id, {
            "type": "error",
            "data": {"error": error},
            "timestamp": datetime.now().isoformat()
        })
    
    def set_streaming_mode(self, session_id: str, mode: str, enabled: bool, options: dict = None):
        """Set continuous streaming mode for a session"""
        if session_id not in self.streaming_modes:
            self.streaming_modes[session_id] = {}
        
        self.streaming_modes[session_id][mode] = {
            "enabled": enabled,
            "options": options or {}
        }
        app_logger.info(f"Streaming mode '{mode}' set to {enabled} for {session_id}")
    
    def get_streaming_mode(self, session_id: str, mode: str) -> dict:
        """Get streaming mode status"""
        if session_id in self.streaming_modes and mode in self.streaming_modes[session_id]:
            return self.streaming_modes[session_id][mode]
        return {"enabled": False, "options": {}}


manager = ConnectionManager()


@router.websocket("/ws/{session_id}")
async def websocket_endpoint(websocket: WebSocket, session_id: str):
    """
    WebSocket endpoint for real-time communication
    
    Args:
        websocket: WebSocket connection
        session_id: Session identifier
    """
    # Validate session exists
    session = session_manager.get_session(session_id)
    if not session:
        await websocket.close(code=4004, reason="Session not found")
        return
    
    await manager.connect(websocket, session_id)
    
    # Send connection confirmation
    await manager.send_message(session_id, {
        "type": "status",
        "data": {
            "status": "connected",
            "session_id": session_id
        },
        "timestamp": datetime.now().isoformat()
    })
    
    try:
        while True:
            # Receive message from client
            data = await websocket.receive_text()
            
            try:
                # Parse message
                message_data = json.loads(data)
                message_type = message_data.get("type")
                content = message_data.get("data")
                
                app_logger.debug(f"Received WebSocket message: {message_type}")
                
                # Handle different message types
                if message_type == "ping":
                    # Heartbeat
                    await manager.send_message(session_id, {
                        "type": "pong",
                        "timestamp": datetime.now().isoformat()
                    })
                
                elif message_type == "text":
                    # Text message - generate AI response
                    await handle_text_message(session_id, content)
                
                elif message_type == "image":
                    # Image data for vision analysis
                    await handle_image_message(session_id, content)
                
                elif message_type == "audio":
                    # Audio data for voice processing
                    await handle_audio_message(session_id, content)
                
                elif message_type == "stream_control":
                    # Control continuous streaming modes
                    await handle_stream_control(session_id, content)
                
                elif message_type == "video_frame":
                    # Continuous video frame processing
                    await handle_video_frame(session_id, content)
                
                else:
                    await manager.send_error(
                        session_id,
                        f"Unknown message type: {message_type}"
                    )
            
            except json.JSONDecodeError:
                await manager.send_error(session_id, "Invalid JSON message")
            except Exception as e:
                app_logger.error(f"Error processing WebSocket message: {e}")
                await manager.send_error(session_id, str(e))
    
    except WebSocketDisconnect:
        manager.disconnect(session_id)
        app_logger.info(f"Client disconnected: {session_id}")
    except Exception as e:
        app_logger.error(f"WebSocket error: {e}")
        manager.disconnect(session_id)


async def handle_text_message(session_id: str, content: dict):
    """
    Handle text message and generate AI response
    
    Args:
        session_id: Session identifier
        content: Message content
    """
    try:
        prompt = content.get("prompt", "")
        include_history = content.get("include_history", True)
        stream = content.get("stream", False)
        
        if not prompt:
            await manager.send_error(session_id, "Empty prompt")
            return
        
        # Add user message to session
        session_manager.add_message_to_session(
            session_id=session_id,
            content=prompt,
            role="user",
            message_type="text"
        )
        
        # Get conversation history
        history = None
        if include_history:
            history = session_manager.get_session_history(session_id, max_messages=10)
        
        if stream:
            # Stream response
            full_response = []
            async for chunk in gemini_service.stream_response(prompt, history):
                full_response.append(chunk)
                await manager.send_message(session_id, {
                    "type": "stream",
                    "data": {"chunk": chunk, "done": False},
                    "session_id": session_id,
                    "timestamp": datetime.now().isoformat()
                })
            
            # Send completion signal
            await manager.send_message(session_id, {
                "type": "stream",
                "data": {"chunk": "", "done": True},
                "session_id": session_id,
                "timestamp": datetime.now().isoformat()
            })
            
            # Save complete response
            complete_response = "".join(full_response)
            session_manager.add_message_to_session(
                session_id=session_id,
                content=complete_response,
                role="assistant",
                message_type="text"
            )
        else:
            # Generate complete response
            response = await gemini_service.generate_response(
                prompt=prompt,
                history=history,
                include_history=include_history
            )
            
            # Add assistant response to session
            session_manager.add_message_to_session(
                session_id=session_id,
                content=response,
                role="assistant",
                message_type="text"
            )
            
            # Send response
            await manager.send_message(session_id, {
                "type": "response",
                "data": {"content": response},
                "session_id": session_id,
                "timestamp": datetime.now().isoformat()
            })
    
    except Exception as e:
        app_logger.error(f"Error handling text message: {e}")
        await manager.send_error(session_id, f"Failed to generate response: {str(e)}")


async def handle_image_message(session_id: str, content: dict):
    """
    Handle image message for vision analysis
    
    Args:
        session_id: Session identifier
        content: Message content with image data
    """
    try:
        prompt = content.get("prompt", "What do you see in this image?")
        image_base64 = content.get("image_data", "")
        image_type = content.get("image_type", "unknown")  # camera, screen, or uploaded
        
        if not image_base64:
            await manager.send_error(session_id, "No image data provided")
            return
        
        # Add user message
        session_manager.add_message_to_session(
            session_id=session_id,
            content=f"[{image_type.title()}] {prompt}",
            role="user",
            message_type="image",
            metadata={"image_type": image_type}
        )
        
        # Get conversation history
        history = session_manager.get_session_history(session_id, max_messages=10)
        
        # Analyze based on image type
        if image_type == "screen":
            response = await gemini_service.analyze_screen_capture(
                prompt=prompt,
                screen_base64=image_base64,
                context=content.get("context")
            )
        elif image_type == "camera":
            response = await gemini_service.analyze_camera_frame(
                prompt=prompt,
                frame_base64=image_base64
            )
        else:
            response = await gemini_service.analyze_image(
                prompt=prompt,
                image_base64=image_base64,
                history=history
            )
        
        # Add assistant response
        session_manager.add_message_to_session(
            session_id=session_id,
            content=response,
            role="assistant",
            message_type="text"
        )
        
        # Send response
        await manager.send_message(session_id, {
            "type": "response",
            "data": {
                "content": response,
                "image_analyzed": True,
                "image_type": image_type
            },
            "session_id": session_id,
            "timestamp": datetime.now().isoformat()
        })
    
    except Exception as e:
        app_logger.error(f"Error handling image message: {e}")
        await manager.send_error(session_id, f"Failed to analyze image: {str(e)}")


async def handle_audio_message(session_id: str, content: dict):
    """
    Handle audio message for voice processing
    
    Args:
        session_id: Session identifier
        content: Message content with audio data
    """
    try:
        audio_data = content.get("audio_data", "")
        transcript = content.get("transcript", "")
        
        if not transcript and not audio_data:
            await manager.send_error(session_id, "No audio data or transcript provided")
            return
        
        # If transcript provided, treat as text message
        if transcript:
            await handle_text_message(session_id, {
                "prompt": transcript,
                "include_history": content.get("include_history", True),
                "stream": content.get("stream", False)
            })
        else:
            # Audio processing (future enhancement with speech-to-text API)
            await manager.send_message(session_id, {
                "type": "status",
                "data": {"message": "Audio processing available - send transcript for now"},
                "timestamp": datetime.now().isoformat()
            })
    
    except Exception as e:
        app_logger.error(f"Error handling audio message: {e}")
        await manager.send_error(session_id, f"Failed to process audio: {str(e)}")


async def handle_stream_control(session_id: str, content: dict):
    """
    Handle streaming mode control messages
    
    Args:
        session_id: Session identifier
        content: Control parameters
    """
    try:
        action = content.get("action")  # start, stop, status
        mode = content.get("mode")  # video, audio, screen
        options = content.get("options", {})
        
        if action == "start":
            manager.set_streaming_mode(session_id, mode, True, options)
            await manager.send_message(session_id, {
                "type": "stream_status",
                "data": {
                    "mode": mode,
                    "status": "started",
                    "options": options
                },
                "timestamp": datetime.now().isoformat()
            })
        
        elif action == "stop":
            manager.set_streaming_mode(session_id, mode, False)
            await manager.send_message(session_id, {
                "type": "stream_status",
                "data": {
                    "mode": mode,
                    "status": "stopped"
                },
                "timestamp": datetime.now().isoformat()
            })
        
        elif action == "status":
            all_modes = {}
            for m in ["video", "audio", "screen"]:
                all_modes[m] = manager.get_streaming_mode(session_id, m)
            
            await manager.send_message(session_id, {
                "type": "stream_status",
                "data": {
                    "modes": all_modes
                },
                "timestamp": datetime.now().isoformat()
            })
    
    except Exception as e:
        app_logger.error(f"Error handling stream control: {e}")
        await manager.send_error(session_id, f"Failed to control stream: {str(e)}")


async def handle_video_frame(session_id: str, content: dict):
    """
    Handle continuous video frame processing
    
    Args:
        session_id: Session identifier
        content: Frame data and metadata
    """
    try:
        # Check if video streaming is enabled
        mode_info = manager.get_streaming_mode(session_id, "video")
        if not mode_info.get("enabled"):
            await manager.send_error(session_id, "Video streaming not enabled")
            return
        
        frame_data = content.get("frame_data", "")
        frame_type = content.get("frame_type", "camera")  # camera or screen
        analyze = content.get("analyze", False)  # Whether to analyze this frame
        
        if not frame_data:
            return  # Skip empty frames
        
        # Only analyze if requested (not every frame)
        if analyze:
            options = mode_info.get("options", {})
            prompt = options.get("prompt", "What do you see?")
            
            # Analyze the frame
            if frame_type == "screen":
                response = await gemini_service.analyze_screen_capture(
                    prompt=prompt,
                    screen_base64=frame_data
                )
            else:  # camera
                response = await gemini_service.analyze_camera_frame(
                    prompt=prompt,
                    frame_base64=frame_data
                )
            
            # Send analysis result
            await manager.send_message(session_id, {
                "type": "frame_analysis",
                "data": {
                    "content": response,
                    "frame_type": frame_type
                },
                "timestamp": datetime.now().isoformat()
            })
        else:
            # Acknowledge frame receipt
            await manager.send_message(session_id, {
                "type": "frame_ack",
                "data": {"frame_type": frame_type},
                "timestamp": datetime.now().isoformat()
            })
    
    except Exception as e:
        app_logger.error(f"Error handling video frame: {e}")
        # Don't send error for every frame failure, just log it
