"""
Application Configuration
Manages environment variables and application settings
"""

from typing import List
from pydantic_settings import BaseSettings
from pydantic import Field, field_validator


class Settings(BaseSettings):
    """Application settings from environment variables"""
    
    # API Configuration
    app_name: str = "VisionCopilot Live API"
    app_version: str = "0.1.0"
    environment: str = Field(default="development", alias="ENVIRONMENT")
    debug: bool = Field(default=False, alias="DEBUG")
    
    # Server Configuration
    host: str = Field(default="0.0.0.0", alias="HOST")
    port: int = Field(default=8080, alias="PORT")  # Cloud Run uses 8080
    
    # CORS Configuration
    allowed_origins: str = Field(
        default="http://localhost:5173,http://localhost:3000,http://localhost:8080",
        alias="ALLOWED_ORIGINS"
    )
    
    # Gemini API Configuration
    gemini_api_key: str = Field(default="", alias="GEMINI_API_KEY")
    
    # Session Configuration
    session_secret_key: str = Field(
        default="change_this_secret_key_in_production",
        alias="SESSION_SECRET_KEY"
    )
    session_timeout_minutes: int = Field(default=30, alias="SESSION_TIMEOUT_MINUTES")
    
    # WebSocket Configuration
    ws_heartbeat_interval: int = Field(default=30, alias="WS_HEARTBEAT_INTERVAL")
    
    class Config:
        env_file = ".env"
        case_sensitive = False
        extra = "allow"
    
    @field_validator('environment')
    @classmethod
    def validate_environment(cls, v: str) -> str:
        """Ensure environment is valid"""
        allowed = ['development', 'staging', 'production']
        if v.lower() not in allowed:
            raise ValueError(f'Environment must be one of: {allowed}')
        return v.lower()
    
    @property
    def is_production(self) -> bool:
        """Check if running in production"""
        return self.environment == 'production'
    
    @property
    def is_development(self) -> bool:
        """Check if running in development"""
        return self.environment == 'development'
    
    @property
    def cors_origins(self) -> List[str]:
        """Parse CORS origins from comma-separated string"""
        origins = [origin.strip() for origin in self.allowed_origins.split(",")]
        
        # In production, filter out localhost origins for security
        if self.is_production:
            origins = [o for o in origins if 'localhost' not in o and '127.0.0.1' not in o]
        
        return origins


# Global settings instance
settings = Settings()
