/**
 * Camera Service
 * Handles camera access and frame capture
 */

export class CameraService {
  private stream: MediaStream | null = null;
  private videoElement: HTMLVideoElement | null = null;

  /**
   * Start camera stream
   */
  async startCamera(videoElement?: HTMLVideoElement): Promise<MediaStream> {
    try {
      this.videoElement = videoElement || null;

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        }
      });

      this.stream = stream;
      
      if (videoElement) {
        videoElement.srcObject = stream;
        await videoElement.play();
      }

      console.log('Camera started successfully');
      return stream;
    } catch (error) {
      console.error('Error starting camera:', error);
      throw new Error('Failed to access camera. Please check permissions.');
    }
  }

  /**
   * Stop camera stream
   */
  stopCamera(): void {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }

    if (this.videoElement) {
      this.videoElement.srcObject = null;
    }

    console.log('Camera stopped');
  }

  /**
   * Capture current frame as base64
   */
  captureFrame(): string | null {
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

      console.log('Frame captured:', base64Image.length, 'chars');
      return base64Image;
    } catch (error) {
      console.error('Error capturing frame:', error);
      return null;
    }
  }

  /**
   * Check if camera is active
   */
  isActive(): boolean {
    return this.stream !== null && this.stream.active;
  }

  /**
   * Get available cameras
   */
  async getAvailableCameras(): Promise<MediaDeviceInfo[]> {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices.filter(device => device.kind === 'videoinput');
    } catch (error) {
      console.error('Error getting cameras:', error);
      return [];
    }
  }

  /**
   * Switch to specific camera
   */
  async switchCamera(deviceId: string, videoElement: HTMLVideoElement): Promise<void> {
    this.stopCamera();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          deviceId: { exact: deviceId },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

      this.stream = stream;
      this.videoElement = videoElement;
      videoElement.srcObject = stream;
      await videoElement.play();

      console.log('Switched to camera:', deviceId);
    } catch (error) {
      console.error('Error switching camera:', error);
      throw error;
    }
  }
}

export const cameraService = new CameraService();
