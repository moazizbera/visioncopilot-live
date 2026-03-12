import { useTheme } from '../contexts/ThemeContext'

interface ControlPanelProps {
  sessionId: string | null
  activeMode: 'text' | 'voice' | 'camera' | 'screen'
  onModeChange: (mode: 'text' | 'voice' | 'camera' | 'screen') => void
  onClearSession: () => void
  onToggleHide?: () => void
  onToggleFullscreen?: () => void
  isFullscreen?: boolean
  // Legacy props (not used, modals handle these now)
  onCameraCapture?: (imageBase64: string) => void
  onScreenCapture?: () => void
  onVoiceInput?: (transcript: string) => void
}

export function ControlPanel({
  sessionId,
  activeMode,
  onModeChange,
  onClearSession,
  onToggleHide,
  onToggleFullscreen,
  isFullscreen = false
}: ControlPanelProps) {
  const { theme } = useTheme()
  
  const ModeButton = ({ 
    mode, 
    icon, 
    label 
  }: { 
    mode: typeof activeMode
    icon: string
    label: string
  }) => (
    <button
      onClick={() => onModeChange(mode)}
      className={`w-full px-4 py-3 rounded-xl font-medium transition transform hover:scale-105 flex items-center gap-3 shadow-md`}
      style={{
        background: activeMode === mode ? theme.accentGradient : theme.bgSecondary,
        color: activeMode === mode ? '#ffffff' : theme.textPrimary
      }}
    >
      <span className="text-xl">{icon}</span>
      <span>{label}</span>
    </button>
  )

  return (
    <div 
      className={`rounded-2xl shadow-lg p-5 transition-colors ${isFullscreen ? 'h-full w-full' : ''}`}
      style={{ 
        background: theme.panelBg,
        borderColor: theme.panelBorder,
        borderWidth: '1px',
        borderStyle: 'solid'
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold flex items-center gap-2" style={{ color: theme.textPrimary }}>
          <span>🎮</span>
          Controls
        </h3>
        {(onToggleHide || onToggleFullscreen) && (
          <div className="flex items-center gap-1">
            {onToggleFullscreen && (
              <button
                onClick={onToggleFullscreen}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition text-gray-600 dark:text-gray-300"
                title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
              >
                {isFullscreen ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                  </svg>
                )}
              </button>
            )}
            {onToggleHide && !isFullscreen && (
              <button
                onClick={onToggleHide}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition text-gray-600 dark:text-gray-300"
                title="Hide Panel"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        )}
      </div>
      
      {/* Mode Selection */}
      <div className="space-y-2 mb-6">
        <ModeButton mode="text" icon="💬" label="Text Chat" />
        <ModeButton mode="voice" icon="🎤" label="Voice Chat" />
        <ModeButton mode="camera" icon="📷" label="Camera" />
        <ModeButton mode="screen" icon="🖥️" label="Screen" />
      </div>

      {/* Info Message */}
      {activeMode !== 'text' && (
        <div className="mb-6 p-3 rounded-xl" style={{ background: `${theme.accentPrimary}15`, borderColor: `${theme.accentPrimary}40`, borderWidth: '1px', borderStyle: 'solid' }}>
          <p className="text-sm text-center" style={{ color: theme.textPrimary }}>
            💡 {activeMode === 'voice' ? 'Voice chat modal' : 
                 activeMode === 'camera' ? 'Camera with capture & streaming' :
                 activeMode === 'screen' ? 'Screen share with capture & streaming' : ''}
          </p>
        </div>
      )}

      {/* Session Controls */}
      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={onClearSession}
          disabled={!sessionId}
          className="w-full px-4 py-2 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/30 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2"
        >
          <span>🗑️</span>
          Clear Session
        </button>
      </div>
    </div>
  )
}
