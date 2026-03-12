import { useState, useRef, useEffect } from 'react'
import { screenCaptureService } from '../services/screenCaptureService'
import { useTheme } from '../contexts/ThemeContext'

interface FloatingScreenShareProps {
  onCapture?: (imageBase64: string) => void
  onClose?: () => void
}

export function FloatingScreenShare({ onCapture, onClose }: FloatingScreenShareProps) {
  const { theme } = useTheme()
  const [isActive, setIsActive] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const isActiveRef = useRef(isActive)

  useEffect(() => {
    isActiveRef.current = isActive
  }, [isActive])

  useEffect(() => {
    return () => {
      if (isActiveRef.current) {
        screenCaptureService.stopScreenCapture()
      }
    }
  }, [])

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
    <div 
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleStop()
          if (onClose) onClose()
        }
      }}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          handleStop()
          if (onClose) onClose()
        }
      }}
    >
      <div 
        className="rounded-2xl shadow-2xl max-w-3xl w-full animate-fade-in-up"
        style={{
          background: theme.panelBg,
          borderColor: theme.panelBorder,
          borderWidth: '2px',
          borderStyle: 'solid'
        }}
      >
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: theme.panelBorder }}>
          <h3 className="text-lg font-bold flex items-center gap-2" style={{ color: theme.textPrimary }}>
            <span>🖥️</span>
            Screen Sharing
          </h3>
          <button
            onClick={() => {
              handleStop()
              if (onClose) onClose()
            }}
            className="p-2 rounded-lg hover:opacity-80 transition"
            style={{ background: theme.bgSecondary, color: theme.textSecondary }}
            title="Close (Esc)"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Screen Preview */}
          <div className="relative rounded-xl overflow-hidden" style={{ background: theme.bgSecondary }}>
            <video
              ref={videoRef}
              className="w-full h-auto max-h-96"
              style={{ background: '#000' }}
              autoPlay
              playsInline
              muted
            />

            {!isActive && (
              <div className="absolute inset-0 flex items-center justify-center" style={{ background: `${theme.bgSecondary}dd` }}>
                <div className="text-center p-6">
                  <div className="text-6xl mb-3">🖥️</div>
                  <p className="text-lg font-semibold" style={{ color: theme.textPrimary }}>Not sharing</p>
                  <p className="text-sm mt-2" style={{ color: theme.textSecondary }}>Click "Start Sharing" to begin</p>
                </div>
              </div>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <div className="p-3 rounded-lg" style={{ background: '#fee', borderColor: '#fcc', borderWidth: '1px', borderStyle: 'solid' }}>
              <p className="text-sm text-red-700">⚠️ {error}</p>
            </div>
          )}

          {/* Controls */}
          <div className="space-y-3">
            {!isActive ? (
              <button
                onClick={handleStart}
                className="w-full px-6 py-3 rounded-xl font-semibold shadow-lg transition transform hover:scale-105 flex items-center justify-center gap-3 text-lg"
                style={{ background: theme.accentGradient, color: '#ffffff' }}
              >
                <span>▶️</span>
                <span>Start Sharing</span>
              </button>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={handleCapture}
                    className="px-4 py-3 rounded-xl font-semibold shadow-md transition transform hover:scale-105 flex items-center justify-center gap-2"
                    style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: '#ffffff' }}
                  >
                    <span>📸</span>
                    <span>Capture</span>
                  </button>
                  <button
                    onClick={handleStop}
                    className="px-4 py-3 rounded-xl font-semibold shadow-md transition transform hover:scale-105 flex items-center justify-center gap-2"
                    style={{ background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', color: '#ffffff' }}
                  >
                    <span>⏹️</span>
                    <span>Stop</span>
                  </button>
                </div>
                <button
                  onClick={async () => {
                    if (!videoRef.current) return
                    try {
                      setError(null)
                      screenCaptureService.stopScreenCapture()
                      await screenCaptureService.startScreenCapture(videoRef.current)
                    } catch (err) {
                      setError(err instanceof Error ? err.message : 'Failed to change screen')
                      setIsActive(false)
                    }
                  }}
                  className="w-full px-4 py-3 rounded-xl font-semibold shadow-md transition transform hover:scale-105 flex items-center justify-center gap-2"
                  style={{ background: 'linear-gradient(135deg, #a855f7 0%, #9333ea 100%)', color: '#ffffff' }}
                >
                  <span>🔄</span>
                  <span>Change Screen/Window</span>
                </button>
              </>
            )}
          </div>

          {/* Status Message */}
          {isActive && (
            <div className="p-3 rounded-xl" style={{ background: `${theme.accentPrimary}15`, borderColor: `${theme.accentPrimary}40`, borderWidth: '1px', borderStyle: 'solid' }}>
              <p className="text-sm flex items-center gap-2" style={{ color: theme.textPrimary }}>
                <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#10b981' }}></span>
                <span>✓ Screen sharing active - You can type questions in the chat while sharing!</span>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
