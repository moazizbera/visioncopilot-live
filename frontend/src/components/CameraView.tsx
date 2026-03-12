import { useState, useRef, useEffect } from 'react'
import { cameraService } from '../services/cameraService'

interface CameraViewProps {
  onCapture?: (imageBase64: string) => void
  className?: string
}

export function CameraView({ onCapture, className = '' }: CameraViewProps) {
  const [isActive, setIsActive] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([])
  const videoRef = useRef<HTMLVideoElement>(null)
  // Use ref to track camera state for cleanup (avoid stale closure in useEffect)
  const isActiveRef = useRef(isActive)

  // Keep ref in sync with state
  useEffect(() => {
    isActiveRef.current = isActive
  }, [isActive])

  useEffect(() => {
    // Load available cameras
    loadCameras()

    // Cleanup on unmount - use ref to avoid stale closure
    return () => {
      if (isActiveRef.current) {
        cameraService.stopCamera()
      }
    }
  }, []) // intentionally empty - cleanup uses ref

  const loadCameras = async () => {
    try {
      const availableCameras = await cameraService.getAvailableCameras()
      setCameras(availableCameras)
    } catch (err) {
      console.error('Failed to load cameras:', err)
    }
  }

  const handleStart = async () => {
    if (!videoRef.current) return

    try {
      setError(null)
      await cameraService.startCamera(videoRef.current)
      setIsActive(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start camera')
      setIsActive(false)
    }
  }

  const handleStop = () => {
    cameraService.stopCamera()
    setIsActive(false)
  }

  const handleCapture = () => {
    const frame = cameraService.captureFrame()
    if (frame && onCapture) {
      onCapture(frame)
    }
  }

  const handleSwitchCamera = async (deviceId: string) => {
    if (!videoRef.current) return

    try {
      setError(null)
      await cameraService.switchCamera(deviceId, videoRef.current)
    } catch (err) {
      setError('Failed to switch camera')
    }
  }

  return (
    <div className={`camera-view ${className}`}>
      <div className="relative bg-gray-900 rounded-lg overflow-hidden" style={{ aspectRatio: '16/9' }}>
        <video
          ref={videoRef}
          className="w-full h-full object-contain bg-black"
          autoPlay
          playsInline
          muted
        />

        {!isActive && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-800 bg-opacity-75">
            <div className="text-center">
              <div className="text-6xl mb-4">📷</div>
              <p className="text-white text-lg mb-4">Camera not active</p>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-2 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <div className="mt-4 flex gap-2 flex-wrap">
        {!isActive ? (
          <button
            onClick={handleStart}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          >
            Start Camera
          </button>
        ) : (
          <>
            <button
              onClick={handleStop}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
            >
              Stop Camera
            </button>
            <button
              onClick={handleCapture}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
            >
              Capture Frame
            </button>
          </>
        )}
      </div>

      {isActive && cameras.length > 1 && (
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <label className="block text-sm font-semibold text-blue-800 dark:text-blue-300 mb-2">
            📷 Switch Camera
          </label>
          <select
            onChange={(e) => handleSwitchCamera(e.target.value)}
            className="block w-full px-3 py-2 bg-white dark:bg-gray-800 border border-blue-300 dark:border-blue-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-gray-100"
          >
            {cameras.map((camera, index) => (
              <option key={camera.deviceId} value={camera.deviceId}>
                {camera.label || `Camera ${index + 1}`}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-blue-600 dark:text-blue-400">
            💡 Switch between available cameras
          </p>
        </div>
      )}
    </div>
  )
}
