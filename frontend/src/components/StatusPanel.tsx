import { useTheme } from '../contexts/ThemeContext'
import { WebSocketControls } from './WebSocketControls'

interface StatusPanelProps {
  wsConnected: boolean
  streamingActive: boolean
  cameraActive: boolean
  screenActive?: boolean
  voiceListening: boolean
  onOpenHistory?: () => void
  onToggleHide?: () => void
  onToggleFullscreen?: () => void
  isFullscreen?: boolean
  // WebSocket connection
  sessionId: string | null
  onConnectionChange?: (connected: boolean) => void
  streamInterval: number
  onIntervalChange: (interval: number) => void
}

export function StatusPanel({ 
  wsConnected, 
  streamingActive, 
  cameraActive, 
  screenActive = false,
  voiceListening,
  onOpenHistory,
  onToggleHide,
  onToggleFullscreen,
  isFullscreen = false,
  sessionId,
  onConnectionChange,
  streamInterval,
  onIntervalChange
}: StatusPanelProps) {
  const { theme } = useTheme()
  
  const StatusBadge = ({ 
    label, 
    active, 
    color 
  }: { 
    label: string
    active: boolean
    color: 'green' | 'blue' | 'yellow' | 'red' | 'gray'
  }) => {
    const colorMap = {
      green: theme.success,
      blue: theme.info,
      yellow: theme.warning,
      red: theme.error,
      gray: theme.textTertiary
    }

    return (
      <div 
        className="flex items-center justify-between p-3 rounded-lg transition-colors"
        style={{ background: theme.bgSecondary }}
      >
        <span className="text-sm font-medium" style={{ color: theme.textPrimary }}>
          {label}
        </span>
        <div className="flex items-center gap-2">
          <div 
            className={`w-3 h-3 rounded-full ${active ? 'animate-pulse' : ''}`}
            style={{ background: active ? colorMap[color] : theme.textTertiary }}
          />
          <span className="text-xs" style={{ color: theme.textSecondary }}>
            {active ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>
    )
  }

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
          <span>📊</span>
          System Status
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
      <div className="space-y-3">
        <StatusBadge 
          label="WebSocket" 
          active={wsConnected} 
          color={wsConnected ? 'green' : 'red'} 
        />
        <StatusBadge 
          label="Streaming" 
          active={streamingActive} 
          color="blue" 
        />
        <StatusBadge 
          label="Camera" 
          active={cameraActive} 
          color="green" 
        />
        <StatusBadge 
          label="Screen Share" 
          active={screenActive} 
          color="blue" 
        />
        <StatusBadge 
          label="Voice" 
          active={voiceListening} 
          color="yellow" 
        />
      </div>
      
      {/* WebSocket Connection Controls */}
      <div className="mt-4 pt-4 border-t" style={{ borderColor: theme.panelBorder }}>
        <h4 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: theme.textPrimary }}>
          <span>🌐</span>
          WebSocket Connection
        </h4>
        <WebSocketControls
          sessionId={sessionId}
          onConnectionChange={onConnectionChange}
          interval={streamInterval}
          onIntervalChange={onIntervalChange}
        />
      </div>
      
      <div className="mt-4 pt-4 border-t" style={{ borderColor: theme.panelBorder }}>
        {onOpenHistory && (
          <button
            onClick={onOpenHistory}
            className="w-full px-4 py-2.5 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-md hover:shadow-lg mb-3"
          >
            <span>📋</span>
            <span>View History</span>
          </button>
        )}
        <div className="text-xs space-y-1" style={{ color: theme.textTertiary }}>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ background: theme.success }} />
            <span>Connected</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ background: theme.textTertiary }} />
            <span>Disconnected</span>
          </div>
        </div>
      </div>
    </div>
  )
}
