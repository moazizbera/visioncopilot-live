"""
Image Processing Utilities
Handles image encoding, decoding, preprocessing, and optimization
"""

import base64
import io
from typing import Optional, Tuple
from PIL import Image
from app.core.logger import app_logger


class ImageProcessor:
    """Utility class for image processing operations"""
    
    # Maximum dimensions for processed images (to reduce API costs)
    MAX_WIDTH = 1920
    MAX_HEIGHT = 1080
    
    # JPEG quality for compression
    JPEG_QUALITY = 85
    
    @staticmethod
    def base64_to_image(base64_string: str) -> Image.Image:
        """
        Convert base64 string to PIL Image
        
        Args:
            base64_string: Base64 encoded image (with or without data URL prefix)
            
        Returns:
            PIL Image object
        """
        try:
            # Remove data URL prefix if present
            if ',' in base64_string:
                base64_string = base64_string.split(',', 1)[1]
            
            # Decode base64 to bytes
            image_bytes = base64.b64decode(base64_string)
            
            # Convert to PIL Image
            image = Image.open(io.BytesIO(image_bytes))
            
            app_logger.debug(f"Decoded image: {image.size}, mode: {image.mode}")
            return image
            
        except Exception as e:
            app_logger.error(f"Error decoding base64 image: {e}")
            raise ValueError(f"Failed to decode base64 image: {e}")
    
    @staticmethod
    def image_to_base64(image: Image.Image, format: str = "JPEG") -> str:
        """
        Convert PIL Image to base64 string
        
        Args:
            image: PIL Image object
            format: Output format (JPEG, PNG, etc.)
            
        Returns:
            Base64 encoded image string
        """
        try:
            # Convert RGBA to RGB for JPEG
            if format.upper() == "JPEG" and image.mode == "RGBA":
                # Create white background
                rgb_image = Image.new("RGB", image.size, (255, 255, 255))
                rgb_image.paste(image, mask=image.split()[3])  # Use alpha channel as mask
                image = rgb_image
            
            # Save to bytes buffer
            buffer = io.BytesIO()
            image.save(buffer, format=format, quality=ImageProcessor.JPEG_QUALITY)
            buffer.seek(0)
            
            # Encode to base64
            base64_string = base64.b64encode(buffer.read()).decode('utf-8')
            
            app_logger.debug(f"Encoded image to base64: {len(base64_string)} chars")
            return base64_string
            
        except Exception as e:
            app_logger.error(f"Error encoding image to base64: {e}")
            raise ValueError(f"Failed to encode image to base64: {e}")
    
    @staticmethod
    def resize_image(
        image: Image.Image,
        max_width: Optional[int] = None,
        max_height: Optional[int] = None
    ) -> Image.Image:
        """
        Resize image while maintaining aspect ratio
        
        Args:
            image: PIL Image object
            max_width: Maximum width (default: MAX_WIDTH)
            max_height: Maximum height (default: MAX_HEIGHT)
            
        Returns:
            Resized PIL Image
        """
        max_width = max_width or ImageProcessor.MAX_WIDTH
        max_height = max_height or ImageProcessor.MAX_HEIGHT
        
        original_size = image.size
        
        # Calculate new size maintaining aspect ratio
        width, height = image.size
        
        if width > max_width or height > max_height:
            # Calculate scaling factor
            width_ratio = max_width / width
            height_ratio = max_height / height
            scale_factor = min(width_ratio, height_ratio)
            
            new_width = int(width * scale_factor)
            new_height = int(height * scale_factor)
            
            # Resize using high-quality resampling
            image = image.resize((new_width, new_height), Image.Resampling.LANCZOS)
            
            app_logger.debug(f"Resized image from {original_size} to {image.size}")
        
        return image
    
    @staticmethod
    def optimize_for_api(base64_string: str, max_size_kb: int = 500) -> str:
        """
        Optimize image for API transmission
        
        Args:
            base64_string: Base64 encoded image
            max_size_kb: Maximum size in kilobytes
            
        Returns:
            Optimized base64 encoded image
        """
        try:
            # Decode image
            image = ImageProcessor.base64_to_image(base64_string)
            
            # Resize if needed
            image = ImageProcessor.resize_image(image)
            
            # Convert to bytes to check size
            buffer = io.BytesIO()
            format = "JPEG" if image.mode == "RGB" else "PNG"
            quality = ImageProcessor.JPEG_QUALITY
            
            # Try reducing quality if image is too large
            while True:
                buffer = io.BytesIO()
                image.save(buffer, format=format, quality=quality)
                size_kb = len(buffer.getvalue()) / 1024
                
                if size_kb <= max_size_kb or quality <= 50:
                    break
                
                quality -= 10
                app_logger.debug(f"Reducing quality to {quality} (size: {size_kb:.1f}KB)")
            
            # Encode to base64
            buffer.seek(0)
            optimized_base64 = base64.b64encode(buffer.read()).decode('utf-8')
            
            final_size_kb = len(optimized_base64) / 1024 * 0.75  # Base64 overhead
            app_logger.info(f"Optimized image: {final_size_kb:.1f}KB (quality: {quality})")
            
            return optimized_base64
            
        except Exception as e:
            app_logger.error(f"Error optimizing image: {e}")
            # Return original if optimization fails
            return base64_string
    
    @staticmethod
    def prepare_for_gemini(base64_string: str) -> bytes:
        """
        Prepare image for Gemini API
        
        Args:
            base64_string: Base64 encoded image
            
        Returns:
            Image bytes suitable for Gemini API
        """
        try:
            # Decode and optimize
            image = ImageProcessor.base64_to_image(base64_string)
            image = ImageProcessor.resize_image(image)
            
            # Convert to bytes
            buffer = io.BytesIO()
            format = "JPEG" if image.mode in ("RGB", "L") else "PNG"
            
            if format == "JPEG" and image.mode == "RGBA":
                # Convert RGBA to RGB
                rgb_image = Image.new("RGB", image.size, (255, 255, 255))
                rgb_image.paste(image, mask=image.split()[3])
                image = rgb_image
            
            image.save(buffer, format=format, quality=ImageProcessor.JPEG_QUALITY)
            buffer.seek(0)
            
            return buffer.read()
            
        except Exception as e:
            app_logger.error(f"Error preparing image for Gemini: {e}")
            raise ValueError(f"Failed to prepare image: {e}")
    
    @staticmethod
    def get_image_info(base64_string: str) -> dict:
        """
        Get information about an image
        
        Args:
            base64_string: Base64 encoded image
            
        Returns:
            Dictionary with image information
        """
        try:
            image = ImageProcessor.base64_to_image(base64_string)
            
            return {
                "width": image.size[0],
                "height": image.size[1],
                "mode": image.mode,
                "format": image.format or "Unknown",
                "size_bytes": len(base64_string) * 0.75,  # Approximate
                "size_kb": len(base64_string) * 0.75 / 1024
            }
            
        except Exception as e:
            app_logger.error(f"Error getting image info: {e}")
            return {"error": str(e)}


# Global instance
image_processor = ImageProcessor()
