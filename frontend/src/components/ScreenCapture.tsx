import { useState, useRef, useEffect } from 'react'
import { screenCaptureService } from '../services/screenCaptureService'

interface ScreenCaptureProps {
  onCapture?: (imageBase64: string) => void
  className?: string
}

export function ScreenCapture({ onCapture, className = '' }: ScreenCaptureProps) {
  const [isActive, setIsActive] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  // Use ref to track active state for cleanup (avoid stale closure)
  const isActiveRef = useRef(isActive)

  // Keep ref in sync with state
  useEffect(() => {
    isActiveRef.current = isActive
  }, [isActive])

  useEffect(() => {
    // Cleanup on unmount - use ref to avoid stale closure
    return () => {
      if (isActiveRef.current) {
        screenCaptureService.stopScreenCapture()
      }
    }
  }, []) // intentionally empty - cleanup uses ref

  const handleStart = async () => {
    if (!videoRef.current) return

    try {
      setError(null)
      await screenCaptureService.startScreenCapture(videoRef.current)
      setIsActive(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start screen capture')
      setIsActive(false)
    }
  }

  const handleStop = () => {
    screenCaptureService.stopScreenCapture()
    setIsActive(false)
  }

  const handleCapture = () => {
    const screen = screenCaptureService.captureScreen()
    if (screen && onCapture) {
      onCapture(screen)
    }
  }

  return (
    <div className={`screen-capture ${className}`}>
      <div className="relative bg-gray-900 rounded-lg overflow-hidden">
        <video
          ref={videoRef}
          className="w-full h-auto max-h-96 bg-black"
          autoPlay
          playsInline
          muted
        />

        {!isActive && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-800 bg-opacity-75">
            <div className="text-center">
              <div className="text-6xl mb-4">🖥️</div>
              <p className="text-white text-lg mb-4">Screen sharing not active</p>
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
            Start Screen Share
          </button>
        ) : (
          <>
            <button
              onClick={handleStop}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
            >
              Stop Sharing
            </button>
            <button
              onClick={handleCapture}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
            >
              Capture Screen
            </button>
          </>
        )}
      </div>

      {isActive && (
        <div className="mt-4 space-y-2">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700 text-blue-800 dark:text-blue-300 rounded text-sm flex items-center gap-2">
            <span className="text-lg">✓</span>
            <span>Screen is being shared</span>
          </div>
          <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
            <button
              onClick={async () => {
                if (!videoRef.current) return
                try {
                  setError(null)
                  // Stop current and restart with new selection
                  screenCaptureService.stopScreenCapture()
                  await screenCaptureService.startScreenCapture(videoRef.current)
                } catch (err) {
                  setError(err instanceof Error ? err.message : 'Failed to change screen')
                  setIsActive(false)
                }
              }}
              className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition flex items-center justify-center gap-2"
            >
              🖥️ Change Screen/Window
            </button>
            <p className="mt-2 text-xs text-purple-600 dark:text-purple-400">
              💡 Select a different window, tab, or entire screen
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
