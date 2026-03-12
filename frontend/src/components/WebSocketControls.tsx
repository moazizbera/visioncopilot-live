import { useState, useEffect } from 'react'
import { webSocketService } from '../services/webSocketService'
import { useTheme } from '../contexts/ThemeContext'

interface WebSocketControlsProps {
  sessionId: string | null
  onConnectionChange?: (connected: boolean) => void
  interval: number
  onIntervalChange: (interval: number) => void
}

export function WebSocketControls({ 
  sessionId, 
  onConnectionChange,
  interval,
  onIntervalChange
}: WebSocketControlsProps) {
  const { theme } = useTheme()
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const statusHandler = (message: any) => {
      if (message.data?.status === 'connected') {
        setIsConnected(true)
        if (onConnectionChange) onConnectionChange(true)
      } else if (message.data?.status === 'disconnected') {
        setIsConnected(false)
        if (onConnectionChange) onConnectionChange(false)
        setError('Connection lost: ' + (message.data?.reason || 'Unknown reason'))
      }
    }

    const errorHandler = (message: any) => {
      setError(message.data?.error || 'Connection error')
      setIsConnected(false)
      if (onConnectionChange) onConnectionChange(false)
    }

    webSocketService.on('status', statusHandler)
    webSocketService.on('error', errorHandler)

    return () => {
      webSocketService.off('status', statusHandler)
      webSocketService.off('error', errorHandler)
    }
  }, [onConnectionChange])

  const handleConnect = async () => {
    if (!sessionId) {
      setError('No session ID available')
      return
    }

    try {
      await webSocketService.connect(sessionId)
      setIsConnected(true)
      setError(null)
      if (onConnectionChange) onConnectionChange(true)
    } catch (err) {
      setError('Failed to connect')
      console.error('WebSocket connection error:', err)
    }
  }

  const handleDisconnect = () => {
    webSocketService.disconnect()
    setIsConnected(false)
    if (onConnectionChange) onConnectionChange(false)
  }

  return (
    <div className="space-y-3">
      {/* Connection Status */}
      <div 
        className="p-3 rounded-lg flex items-center gap-3"
        style={{ background: theme.bgSecondary }}
      >
        <div 
          className={`w-3 h-3 rounded-full ${isConnected ? 'animate-pulse' : ''}`}
          style={{ background: isConnected ? theme.success : theme.textTertiary }}
        />
        <span className="text-sm font-medium flex-1" style={{ color: theme.textPrimary }}>
          {isConnected ? '✓ WebSocket Connected' : '⚪ WebSocket Disconnected'}
        </span>
      </div>

      {/* Connect/Disconnect Button */}
      {!isConnected ? (
        <button
          onClick={handleConnect}
          disabled={!sessionId}
          className="w-full px-4 py-2.5 rounded-lg font-semibold shadow-md transition transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ 
            background: sessionId ? theme.accentGradient : theme.bgSecondary,
            color: sessionId ? '#ffffff' : theme.textSecondary
          }}
        >
          🔌 Connect WebSocket
        </button>
      ) : (
        <button
          onClick={handleDisconnect}
          className="w-full px-4 py-2.5 rounded-lg font-semibold shadow-md transition transform hover:scale-105"
          style={{ 
            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
            color: '#ffffff'
          }}
        >
          ⏹️ Disconnect
        </button>
      )}

      {/* Analysis Interval Slider - Only when connected */}
      {isConnected && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium" style={{ color: theme.textPrimary }}>
              Analysis Interval: {interval}ms
            </span>
          </div>
          <input
            type="range"
            min="1000"
            max="10000"
            step="500"
            value={interval}
            onChange={(e) => onIntervalChange(parseInt(e.target.value))}
            className="w-full h-2 rounded-lg appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, ${theme.accentPrimary} 0%, ${theme.accentPrimary} ${((interval - 1000) / 9000) * 100}%, ${theme.bgSecondary} ${((interval - 1000) / 9000) * 100}%, ${theme.bgSecondary} 100%)`
            }}
          />
          <div className="flex justify-between text-xs" style={{ color: theme.textSecondary }}>
            <span>1s (Fast)</span>
            <span>10s (Slow)</span>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div 
          className="p-2 rounded-lg text-sm"
          style={{ background: '#fee', color: '#c00' }}
        >
          ⚠️ {error}
        </div>
      )}

      {/* Info Message */}
      <p className="text-xs text-center" style={{ color: theme.textSecondary }}>
        💡 How it works: {isConnected ? 'Go to Camera or Screen modal and enable Continuous Stream' : 'Connect to enable streaming features'}
      </p>
    </div>
  )
}
