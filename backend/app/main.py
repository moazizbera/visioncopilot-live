"""
VisionCopilot Live - Main FastAPI Application
"""

from datetime import datetime
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError

from app.core.config import settings
from app.core.logger import app_logger
from app.core.session_manager import session_manager
from app.core.exceptions import (
    VisionCopilotException,
    visioncopilot_exception_handler,
    validation_exception_handler,
    general_exception_handler
)
from app.models.schemas import HealthResponse

# Import routers
from app.api import sessions, chat, websocket, vision


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan context manager for startup and shutdown events
    """
    # Startup
    app_logger.info("Starting VisionCopilot Live API")
    app_logger.info(f"Debug mode: {settings.debug}")
    
    # Validate critical configuration
    if not settings.gemini_api_key:
        error_msg = (
            "GEMINI_API_KEY is not configured. "
            "Please set the GEMINI_API_KEY environment variable or add it to your .env file. "
            "The application cannot function without a valid Gemini API key."
        )
        app_logger.error(error_msg)
        raise ValueError(error_msg)
    
    app_logger.info("✓ Gemini API key configured")
    
    # Start session cleanup task
    await session_manager.start_cleanup_task()
    app_logger.info("Session cleanup task started")
    
    yield
    
    # Shutdown
    app_logger.info("Shutting down VisionCopilot Live API")
    await session_manager.stop_cleanup_task()
    app_logger.info("Session cleanup task stopped")


# Initialize FastAPI app
app = FastAPI(
    title=settings.app_name,
    description="Backend API for VisionCopilot Live - A multimodal AI assistant",
    version=settings.app_version,
    lifespan=lifespan,
    # Disable docs in production for security
    docs_url="/docs" if not settings.is_production else None,
    redoc_url="/redoc" if not settings.is_production else None,
)

# Configure CORS with proper security settings
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    max_age=3600,  # Cache preflight requests for 1 hour
)

# Log CORS configuration
app_logger.info(f"CORS enabled for origins: {settings.cors_origins}")

# Register exception handlers
app.add_exception_handler(VisionCopilotException, visioncopilot_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(Exception, general_exception_handler)

# Register routers
app.include_router(sessions.router, prefix="/api")
app.include_router(chat.router, prefix="/api")
app.include_router(vision.router, prefix="/api")
app.include_router(websocket.router, prefix="/api")


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "status": "ok",
        "message": "VisionCopilot Live API is running",
        "version": settings.app_version,
        "docs": "/docs"
    }


@app.get("/health")
async def health():
    """Simple health check for Cloud Run and load balancers"""
    return {"status": "ok"}


@app.get("/api/health", response_model=HealthResponse)
async def health_check():
    """
    Detailed health check endpoint
    
    Returns:
        Health status with component information
    """
    # Check components
    components = {
        "api": "healthy",
        "sessions": "healthy"
    }
    
    # Check if Gemini is configured
    if settings.gemini_api_key:
        components["gemini"] = "configured"
    else:
        components["gemini"] = "not_configured"
    
    session_count = session_manager.get_session_count()
    components["active_sessions"] = str(session_count)
    
    return HealthResponse(
        status="healthy",
        service="visioncopilot-live",
        version=settings.app_version,
        timestamp=datetime.now(),
        components=components
    )


@app.get("/api/info")
async def info():
    """API information endpoint"""
    return {
        "name": settings.app_name,
        "version": settings.app_version,
        "debug": settings.debug,
        "endpoints": {
            "sessions": "/api/sessions",
            "chat": "/api/chat",
            "vision": "/api/vision",
            "websocket": "/ws/{session_id}",
            "health": "/api/health"
        }
    }


if __name__ == "__main__":
    import uvicorn
    
    app_logger.info(f"Starting server on {settings.host}:{settings.port}")
    
    uvicorn.run(
        app,
        host=settings.host,
        port=settings.port,
        log_level="info" if settings.debug else "warning"
    )
