import { useState, useEffect, useCallback } from 'react'
import { webSocketService } from '../services/webSocketService'
import { useTheme } from '../contexts/ThemeContext'

interface StreamButtonProps {
  sessionId: string | null
  streamType: 'camera' | 'screen'
  streamInterval: number
  wsConnected: boolean
  onStreamingChange?: (isStreaming: boolean) => void
}

export function StreamButton({ 
  sessionId, 
  streamType, 
  streamInterval,
  wsConnected,
  onStreamingChange 
}: StreamButtonProps) {
  const { theme } = useTheme()
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const streamStatusHandler = useCallback((message: any) => {
    const { mode, status } = message.data
    const currentMode = streamType === 'camera' ? 'video' : 'screen'
    
    if (mode === currentMode) {
      const streaming = status === 'started'
      setIsStreaming(streaming)
      if (onStreamingChange) onStreamingChange(streaming)
    }
  }, [streamType, onStreamingChange])

  const errorHandler = useCallback((message: any) => {
    setError(message.data?.error || 'Streaming error')
  }, [])

  useEffect(() => {
    webSocketService.on('stream_status', streamStatusHandler)
    webSocketService.on('error', errorHandler)

    return () => {
      webSocketService.off('stream_status', streamStatusHandler)
      webSocketService.off('error', errorHandler)
    }
  }, [streamStatusHandler, errorHandler])

  const handleStartStream = () => {
    // Double-check connection before starting
    if (!webSocketService.isConnected()) {
      setError('WebSocket connection lost. Please reconnect.')
      if (onStreamingChange) onStreamingChange(false)
      return
    }

    const mode = streamType === 'camera' ? 'video' : 'screen'
    const prompt = streamType === 'camera' 
      ? 'What do you see in the camera feed?' 
      : 'What is visible on the screen?'
    
    try {
      webSocketService.controlStream('start', mode, {
        prompt,
        interval: streamInterval
      })
      setIsStreaming(true)
      if (onStreamingChange) onStreamingChange(true)
    } catch (err) {
      setError('Failed to start streaming: ' + (err as Error).message)
      setIsStreaming(false)
      if (onStreamingChange) onStreamingChange(false)
    }
  }

  const handleStopStream = () => {
    const mode = streamType === 'camera' ? 'video' : 'screen'
    webSocketService.controlStream('stop', mode)
    setIsStreaming(false)
    if (onStreamingChange) onStreamingChange(false)
  }

  return (
    <div className="space-y-3">
      {/* Error Display */}
      {error && (
        <div className="p-3 rounded-lg" style={{ background: '#fee', color: '#c00' }}>
          <p className="text-sm">⚠️ {error}</p>
        </div>
      )}

      {/* Stream Status Indicator */}
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
              {isStreaming ? `🟢 Streaming (every ${streamInterval}ms)` : '⚪ Ready to stream'}
            </p>
          </div>
        </div>
        
        {/* Start/Stop Button */}
        <button
          onClick={isStreaming ? handleStopStream : handleStartStream}
          disabled={!wsConnected || !sessionId}
          className={`w-full px-6 py-3 rounded-xl font-semibold shadow-lg transition transform hover:scale-105 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed`}
          style={{
            background: isStreaming 
              ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' 
              : wsConnected ? theme.accentGradient : theme.bgSecondary,
            color: wsConnected ? '#ffffff' : theme.textSecondary
          }}
        >
          <span>{isStreaming ? '⏹️' : '▶️'}</span>
          <span>{isStreaming ? 'Stop Streaming' : 'Start Streaming'}</span>
        </button>

        {!wsConnected && (
          <p className="text-xs text-center mt-2" style={{ color: theme.textSecondary }}>
            ⚠️ Connect WebSocket in System Status panel first
          </p>
        )}
      </div>

      {/* Info Box */}
      <div className="p-3 rounded-lg" style={{ 
        background: `${theme.accentPrimary}15`,
        borderColor: `${theme.accentPrimary}40`,
        borderWidth: '1px',
        borderStyle: 'solid'
      }}>
        <p className="text-xs" style={{ color: theme.textPrimary }}>
          💡 <strong>How it works:</strong> Stream will use the interval ({streamInterval}ms) set in System Status panel. Analysis results appear in chat.
        </p>
      </div>
    </div>
  )
}
