import { useState, useEffect, useCallback } from 'react'
import { webSocketService } from '../services/webSocketService'
import { useTheme } from '../contexts/ThemeContext'

interface StreamingControlsProps {
  sessionId: string | null
  streamType: 'camera' | 'screen'
  onStatusChange?: (status: string) => void
}

export function StreamingControls({ sessionId, streamType, onStatusChange }: StreamingControlsProps) {
  const { theme } = useTheme()
  const [isConnected, setIsConnected] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [streamInterval, setStreamInterval] = useState(2000) // ms between frame analyses

  // Memoize handlers to prevent unnecessary effect re-runs
  const statusHandler = useCallback((message: any) => {
    if (message.data?.status === 'connected') {
      setIsConnected(true)
      if (onStatusChange) onStatusChange('Connected to WebSocket')
    }
  }, [onStatusChange])

  const errorHandler = useCallback((message: any) => {
    setError(message.data?.error || 'Unknown error')
    if (onStatusChange) onStatusChange(`Error: ${message.data?.error}`)
  }, [onStatusChange])

  const streamStatusHandler = useCallback((message: any) => {
    const { mode, status } = message.data
    const currentMode = streamType === 'camera' ? 'video' : 'screen'
    
    if (mode === currentMode) {
      setIsStreaming(status === 'started')
      if (status === 'started') {
        if (onStatusChange) onStatusChange(`Started ${streamType} streaming`)
      } else {
        if (onStatusChange) onStatusChange(`Stopped ${streamType} streaming`)
      }
    }
  }, [streamType, onStatusChange])

  useEffect(() => {
    // Register WebSocket event handlers
    webSocketService.on('status', statusHandler)
    webSocketService.on('error', errorHandler)
    webSocketService.on('stream_status', streamStatusHandler)

    return () => {
      webSocketService.off('status', statusHandler)
      webSocketService.off('error', errorHandler)
      webSocketService.off('stream_status', streamStatusHandler)
    }
  }, [statusHandler, errorHandler, streamStatusHandler])

  // Auto-connect to WebSocket when component mounts if we have a session
  useEffect(() => {
    if (sessionId && !isConnected) {
      handleConnect()
    }
  }, [sessionId])

  const handleConnect = async () => {
    if (!sessionId) {
      setError('No session ID available')
      return
    }

    try {
      await webSocketService.connect(sessionId)
      setIsConnected(true)
      setError(null)
      if (onStatusChange) onStatusChange('Connected to WebSocket')
    } catch (err) {
      setError('Failed to connect to WebSocket')
      console.error('WebSocket connection error:', err)
    }
  }

  const handleStartStream = async () => {
    // Auto-connect if not connected
    if (!isConnected) {
      await handleConnect()
    }

    const mode = streamType === 'camera' ? 'video' : 'screen'
    const prompt = streamType === 'camera' 
      ? 'What do you see in the camera feed?' 
      : 'What is visible on the screen?'
    
    webSocketService.controlStream('start', mode, {
      prompt,
      interval: streamInterval
    })
    setIsStreaming(true)
  }

  const handleStopStream = () => {
    const mode = streamType === 'camera' ? 'video' : 'screen'
    webSocketService.controlStream('stop', mode)
    setIsStreaming(false)
  }

  return (
    <div className="space-y-4">
      {/* Connection Status - Minimal */}
      <div className="flex items-center gap-2 p-3 rounded-lg" style={{ background: theme.bgSecondary }}>
        <div
          className={`w-2.5 h-2.5 rounded-full ${
            isConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
          }`}
        />
        <span className="text-sm font-medium" style={{ color: theme.textPrimary }}>
          {isConnected ? '✓ WebSocket Connected' : '⚠️ Connecting...'}
        </span>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-3 rounded-lg" style={{ background: '#fee', borderColor: '#fcc', borderWidth: '1px', borderStyle: 'solid' }}>
          <p className="text-sm text-red-700">⚠️ {error}</p>
        </div>
      )}

      {/* Stream Interval Control */}
      <div className="p-4 rounded-lg" style={{ background: theme.bgSecondary }}>
        <label className="block text-sm font-medium mb-3" style={{ color: theme.textPrimary }}>
          Analysis Interval: <span style={{ color: theme.accentPrimary }}>{streamInterval}ms</span>
        </label>
        <input
          type="range"
          min="1000"
          max="10000"
          step="500"
          value={streamInterval}
          onChange={(e) => setStreamInterval(Number(e.target.value))}
          className="w-full"
          style={{ accentColor: theme.accentPrimary }}
        />
        <div className="flex justify-between text-xs mt-2" style={{ color: theme.textSecondary }}>
          <span>1s (Fast)</span>
          <span>10s (Slow)</span>
        </div>
      </div>

      {/* Active Stream Indicator */}
      <div className="p-4 rounded-xl border" style={{ 
        background: `${theme.accentPrimary}10`,
        borderColor: `${theme.accentPrimary}40`
      }}>
        <div className="flex items-center gap-3 mb-3">
          <span className="text-2xl">
            {streamType === 'camera' ? '📷' : '🖥️'}
          </span>
          <div className="flex-1">
            <h4 className="font-semibold" style={{ color: theme.textPrimary }}>
              {streamType === 'camera' ? 'Camera Stream' : 'Screen Stream'}
            </h4>
            <p className="text-xs" style={{ color: theme.textSecondary }}>
              {isStreaming ? `🟢 Currently streaming (every ${streamInterval}ms)` : '⚪ Ready to stream'}
            </p>
          </div>
        </div>
        
        {/* Single Start/Stop Button */}
        <button
          onClick={isStreaming ? handleStopStream : handleStartStream}
          disabled={!sessionId}
          className={`w-full px-6 py-3 rounded-xl font-semibold shadow-lg transition transform hover:scale-105 flex items-center justify-center gap-2 text-white`}
          style={{
            background: isStreaming 
              ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' 
              : theme.accentGradient
          }}
        >
          <span>{isStreaming ? '⏹️' : '▶️'}</span>
          <span>{isStreaming ? 'Stop Streaming' : 'Start Streaming'}</span>
        </button>
      </div>

      {/* Info Box */}
      <div className="p-4 rounded-lg" style={{ 
        background: `${theme.accentPrimary}15`,
        borderColor: `${theme.accentPrimary}40`,
        borderWidth: '1px',
        borderStyle: 'solid'
      }}>
        <p className="text-sm" style={{ color: theme.textPrimary }}>
          💡 <strong>How it works:</strong> Frames from the selected source will be captured at your chosen interval and sent to AI for real-time analysis. Results appear in the conversation panel.
        </p>
      </div>
    </div>
  )
}
