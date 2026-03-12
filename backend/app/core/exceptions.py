"""
Custom Exception Handlers
"""

from datetime import datetime
from fastapi import Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError

from app.core.logger import app_logger


class VisionCopilotException(Exception):
    """Base exception for VisionCopilot errors"""
    
    def __init__(self, message: str, status_code: int = 500):
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)


class SessionNotFoundException(VisionCopilotException):
    """Raised when a session is not found"""
    
    def __init__(self, session_id: str):
        super().__init__(
            f"Session not found: {session_id}",
            status_code=status.HTTP_404_NOT_FOUND
        )


class AIServiceException(VisionCopilotException):
    """Raised when AI service encounters an error"""
    
    def __init__(self, message: str):
        super().__init__(
            f"AI service error: {message}",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


async def visioncopilot_exception_handler(
    request: Request,
    exc: VisionCopilotException
) -> JSONResponse:
    """Handle VisionCopilot custom exceptions"""
    app_logger.error(f"VisionCopilot exception: {exc.message}")
    
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": exc.message,
            "timestamp": datetime.now().isoformat(),
            "path": str(request.url)
        }
    )


async def validation_exception_handler(
    request: Request,
    exc: RequestValidationError
) -> JSONResponse:
    """Handle request validation errors"""
    app_logger.warning(f"Validation error: {exc.errors()}")
    
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": "Validation error",
            "detail": exc.errors(),
            "timestamp": datetime.now().isoformat(),
            "path": str(request.url)
        }
    )


async def general_exception_handler(
    request: Request,
    exc: Exception
) -> JSONResponse:
    """Handle unexpected exceptions"""
    app_logger.error(f"Unexpected error: {str(exc)}", exc_info=True)
    
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "Internal server error",
            "detail": str(exc),
            "timestamp": datetime.now().isoformat(),
            "path": str(request.url)
        }
    )
