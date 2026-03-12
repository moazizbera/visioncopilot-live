/**
 * Screen Capture Service
 * Handles screen sharing and capture
 */

export class ScreenCaptureService {
  private stream: MediaStream | null = null;
  private videoElement: HTMLVideoElement | null = null;

  /**
   * Start screen capture
   */
  async startScreenCapture(videoElement?: HTMLVideoElement): Promise<MediaStream> {
    try {
      this.videoElement = videoElement || null;

      // @ts-ignore - getDisplayMedia may not be in types
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          // @ts-ignore - cursor is valid but not in types
          cursor: 'always',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      });

      this.stream = stream;
      
      if (videoElement) {
        videoElement.srcObject = stream;
        await videoElement.play();
      }

      // Listen for stream end (user stops sharing)
      stream.getVideoTracks()[0].addEventListener('ended', () => {
        this.stopScreenCapture();
        console.log('Screen sharing stopped by user');
      });

      console.log('Screen capture started successfully');
      return stream;
    } catch (error) {
      console.error('Error starting screen capture:', error);
      throw new Error('Failed to start screen capture. User may have denied permission.');
    }
  }

  /**
   * Stop screen capture
   */
  stopScreenCapture(): void {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }

    if (this.videoElement) {
      this.videoElement.srcObject = null;
    }

    console.log('Screen capture stopped');
  }

  /**
   * Capture current screen frame as base64
   */
  captureScreen(): string | null {
    if (!this.videoElement) {
      console.error('Video element not initialized');
      return null;
    }

    try {
      const canvas = document.createElement('canvas');
      canvas.width = this.videoElement.videoWidth;
      canvas.height = this.videoElement.videoHeight;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Failed to get canvas context');
      }

      ctx.drawImage(this.videoElement, 0, 0);

      // Get base64 image (JPEG for smaller size)
      const base64Image = canvas.toDataURL('image/jpeg', 0.85);

      console.log('Screen captured:', base64Image.length, 'chars');
      return base64Image;
    } catch (error) {
      console.error('Error capturing screen:', error);
      return null;
    }
  }

  /**
   * Check if screen capture is active
   */
  isActive(): boolean {
    return this.stream !== null && this.stream.active;
  }

  /**
   * Get screen dimensions
   */
  getDimensions(): { width: number; height: number } | null {
    if (!this.videoElement) {
      return null;
    }

    return {
      width: this.videoElement.videoWidth,
      height: this.videoElement.videoHeight
    };
  }

  /**
   * Capture screen one time without persistent stream
   * Returns base64 image directly
   */
  async captureOneTimeScreen(): Promise<string | null> {
    try {
      // @ts-ignore - getDisplayMedia may not be in types
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          // @ts-ignore - cursor is valid but not in types
          cursor: 'always',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      });

      // Create temporary video element
      const video = document.createElement('video');
      video.srcObject = stream;
      video.muted = true;
      
      // Wait for video to load
      await video.play();
      
      // Wait for video to have dimensions
      await new Promise(resolve => {
        const checkDimensions = () => {
          if (video.videoWidth > 0 && video.videoHeight > 0) {
            resolve(true);
          } else {
            requestAnimationFrame(checkDimensions);
          }
        };
        checkDimensions();
      });

      // Capture frame
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Failed to get canvas context');
      }

      ctx.drawImage(video, 0, 0);
      const base64Image = canvas.toDataURL('image/jpeg', 0.85);

      // Stop stream immediately
      stream.getTracks().forEach(track => track.stop());

      console.log('One-time screen captured:', base64Image.length, 'chars');
      return base64Image;
    } catch (error) {
      console.error('Error capturing one-time screen:', error);
      return null;
    }
  }
}

export const screenCaptureService = new ScreenCaptureService();
