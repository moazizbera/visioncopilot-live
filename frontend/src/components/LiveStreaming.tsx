import { useState, useEffect, useRef, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import { webSocketService } from '../services/webSocketService'
import { cameraService } from '../services/cameraService'
import { screenCaptureService } from '../services/screenCaptureService'
import { getTextDirection, getTextAlign } from '../utils/textDirection'

interface LiveStreamingProps {
  sessionId: string | null
  streamType: 'camera' | 'screen'
  onAnalysis?: (analysis: string) => void
  streamInterval?: number // Analysis interval in ms (from System Status)
}

export function LiveStreaming({ sessionId, streamType, onAnalysis, streamInterval = 2000 }: LiveStreamingProps) {
  const [isStreaming, setIsStreaming] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [lastAnalysis, setLastAnalysis] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([])
  const [selectedCamera, setSelectedCamera] = useState<string>('')
  const [customPrompt, setCustomPrompt] = useState<string>('')
  const [isAskingAI, setIsAskingAI] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamIntervalRef = useRef<number | null>(null)
  const analyzeIntervalRef = useRef<number | null>(null)
  // Use ref to track streaming state for cleanup
  const isStreamingRef = useRef(isStreaming)

  // Keep ref in sync
  useEffect(() => {
    isStreamingRef.current = isStreaming
  }, [isStreaming])

  // Load available cameras on mount (for camera mode)
  useEffect(() => {
    if (streamType === 'camera') {
      loadCameras()
    }
  }, [streamType])

  const loadCameras = async () => {
    try {
      const availableCameras = await cameraService.getAvailableCameras()
      setCameras(availableCameras)
      if (availableCameras.length > 0 && !selectedCamera) {
        setSelectedCamera(availableCameras[0].deviceId)
      }
    } catch (err) {
      console.error('Failed to load cameras:', err)
    }
  }

  const switchCamera = async (deviceId: string) => {
    if (!videoRef.current || !isStreaming) return

    try {
      setError(null)
      await cameraService.switchCamera(deviceId, videoRef.current)
      setSelectedCamera(deviceId)
    } catch (err) {
      setError('Failed to switch camera')
      console.error('Camera switch error:', err)
    }
  }

  // Stable stopStreaming function using refs
  const stopStreamingStable = useCallback(() => {
    // Clear intervals
    if (streamIntervalRef.current) {
      clearInterval(streamIntervalRef.current)
      streamIntervalRef.current = null
    }
    if (analyzeIntervalRef.current) {
      clearInterval(analyzeIntervalRef.current)
      analyzeIntervalRef.current = null
    }

    // Stop camera or screen capture
    if (streamType === 'camera') {
      cameraService.stopCamera()
    } else {
      screenCaptureService.stopScreenCapture()
    }

    // Clear video
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }

    setIsStreaming(false)
    setIsAnalyzing(false)

    // Notify backend if connected
    if (webSocketService.isConnected()) {
      try {
        webSocketService.controlStream('stop', streamType === 'camera' ? 'video' : 'screen')
      } catch (err) {
        console.error('Error stopping stream:', err)
      }
    }
  }, [streamType])

  useEffect(() => {
    // Register WebSocket handler
    const handler = (message: any) => {
      if (message.data?.content) {
        setLastAnalysis(message.data.content)
        if (onAnalysis) onAnalysis(message.data.content)
      }
    }
    
    webSocketService.on('frame_analysis', handler)

    // Cleanup on unmount only
    return () => {
      webSocketService.off('frame_analysis', handler)
      // Stop streaming if active - use ref for latest state
      if (isStreamingRef.current) {
        // Clear intervals
        if (streamIntervalRef.current) {
          clearInterval(streamIntervalRef.current)
        }
        if (analyzeIntervalRef.current) {
          clearInterval(analyzeIntervalRef.current)
        }
        // Stop camera or screen capture
        if (streamType === 'camera') {
          cameraService.stopCamera()
        } else {
          screenCaptureService.stopScreenCapture()
        }
      }
    }
  }, [streamType, onAnalysis])

  // Memoized frame capture function
  const captureAndSendFrame = useCallback((analyze: boolean) => {
    try {
      let frameBase64: string | null

      if (streamType === 'camera') {
        frameBase64 = cameraService.captureFrame()
      } else {
        frameBase64 = screenCaptureService.captureScreen()
      }

      if (!frameBase64) {
        console.error('Failed to capture frame')
        return
      }

      // Send frame via WebSocket if connected
      if (webSocketService.isConnected()) {
        webSocketService.sendVideoFrame(frameBase64, streamType, analyze)
      }

      if (analyze) {
        setIsAnalyzing(true)
        // Auto-clear analyzing state after 2 seconds
        setTimeout(() => setIsAnalyzing(false), 2000)
      }
    } catch (err) {
      console.error('Error capturing frame:', err)
    }
  }, [streamType])

  const startStreaming = async () => {
    if (!sessionId || !webSocketService.isConnected()) {
      setError('WebSocket not connected')
      return
    }

    try {
      setError(null)

      // Start camera or screen capture
      if (streamType === 'camera') {
        if (!videoRef.current) {
          setError('Video element not ready')
          return
        }
        await cameraService.startCamera(videoRef.current)
      } else {
        if (!videoRef.current) {
          setError('Video element not ready')
          return
        }
        await screenCaptureService.startScreenCapture(videoRef.current)
      }

      setIsStreaming(true)

      // Start streaming frames - use interval for consistent timing
      streamIntervalRef.current = setInterval(() => {
        captureAndSendFrame(false)
      }, 500) // Send frame every 500ms for smooth preview

      // Start analyzing frames using interval from System Status
      analyzeIntervalRef.current = setInterval(() => {
        captureAndSendFrame(true)
      }, streamInterval) // Use interval from System Status panel

      // Notify backend
      webSocketService.controlStream('start', streamType === 'camera' ? 'video' : 'screen', {
        prompt: streamType === 'camera' ? 'What do you see?' : 'What is on the screen?'
      })
    } catch (err: any) {
      setError(err.message || 'Failed to start streaming')
      console.error('Streaming error:', err)
    }
  }

  const stopStreaming = () => {
    stopStreamingStable()
  }

  // Ask AI custom question during streaming
  const askAIQuestion = () => {
    if (!customPrompt.trim() || !isStreaming) return

    setIsAskingAI(true)
    setError(null)

    try {
      // Capture current frame
      const frameBase64 = streamType === 'camera' 
        ? cameraService.captureFrame()
        : screenCaptureService.captureScreen()

      if (!frameBase64) {
        throw new Error('Failed to capture frame')
      }

      // Send custom prompt with frame
      webSocketService.sendVideoFrame(frameBase64, streamType, true, customPrompt)
      
      setCustomPrompt('')
      setLastAnalysis(`💬 Asked: "${customPrompt}"\n\n⏳ Waiting for AI response...`)
      
      if (onAnalysis) {
        onAnalysis(`💬 Asked: "${customPrompt}"\n\n⏳ Waiting for AI response...`)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to ask AI'
      setError(errorMessage)
    } finally {
      setIsAskingAI(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Video Preview */}
      <div className="relative bg-black rounded-lg overflow-hidden" style={{ aspectRatio: '16/9' }}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-contain ${isStreaming ? '' : 'hidden'}`}
        />
        {isStreaming && isAnalyzing && (
          <div className="absolute top-4 right-4 px-3 py-1 bg-blue-600 text-white text-sm rounded-full animate-pulse">
            🧠 Analyzing...
          </div>
        )}
        {isStreaming && (
          <div className="absolute bottom-4 left-4 px-3 py-1 bg-red-600 text-white text-sm rounded-full flex items-center gap-2">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            Live
          </div>
        )}
        {!isStreaming && (
          <div className="absolute inset-0 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <div className="text-6xl mb-2">
                {streamType === 'camera' ? '📷' : '🖥️'}
              </div>
              <p>
                {streamType === 'camera' ? 'Camera' : 'Screen'} stream not active
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Unified Streaming Controls */}
      <div className="space-y-3">
        <div className="flex gap-2">
            {!isStreaming ? (
              <button
                onClick={startStreaming}
                disabled={!sessionId || !webSocketService.isConnected()}
                className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
              >
                ▶️ Start Live Streaming
              </button>
            ) : (
              <button
                onClick={stopStreaming}
                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
              >
                ⏹️ Stop Streaming
              </button>
            )}
          </div>

          {/* Camera Selector - Only show during camera streaming with multiple cameras */}
          {isStreaming && streamType === 'camera' && cameras.length > 1 && (
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 animate-fade-in">
          <label className="block text-sm font-semibold text-blue-800 dark:text-blue-300 mb-2">
            📷 Switch Camera (Live)
          </label>
          <select
            value={selectedCamera}
            onChange={(e) => switchCamera(e.target.value)}
            className="block w-full px-3 py-2 bg-white dark:bg-gray-800 border border-blue-300 dark:border-blue-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-gray-100"
          >
            {cameras.map((camera, index) => (
              <option key={camera.deviceId} value={camera.deviceId}>
                {camera.label || `Camera ${index + 1}`}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-blue-600 dark:text-blue-400">
            💡 Switch between cameras without stopping the stream
          </p>
        </div>
      )}

      {/* Screen Source Switcher - Only show during screen streaming */}
      {isStreaming && streamType === 'screen' && (
        <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800 animate-fade-in">
          <button
            onClick={async () => {
              if (!videoRef.current) return
              try {
                setError(null)
                // Stop current screen capture
                screenCaptureService.stopScreenCapture()
                // Start new screen capture with picker
                await screenCaptureService.startScreenCapture(videoRef.current)
              } catch (err) {
                setError('Failed to change screen source')
                console.error('Screen switch error:', err)
              }
            }}
            className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition flex items-center justify-center gap-2"
          >
            🖥️ Change Screen/Window
          </button>
          <p className="mt-2 text-xs text-purple-600 dark:text-purple-400">
            💡 Select a different window, tab, or screen to share
          </p>
        </div>
      )}

        {/* Stream Info */}
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-xs text-blue-700 dark:text-blue-300">
            💡 <strong>Analysis Interval:</strong> Every {streamInterval}ms (set in System Status)
          </p>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg animate-fade-in">
          ⚠️ {error}
        </div>
      )}

      {/* Last Analysis - More Prominent */}
      {lastAnalysis && (
        <div className="p-4 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/30 dark:to-blue-900/30 rounded-lg border-2 border-green-300 dark:border-green-600 animate-fade-in shadow-md">
          <div className="flex items-start gap-2 mb-2">
            <span className="text-lg">🧠</span>
            <h4 className="text-sm font-bold text-green-800 dark:text-green-200 flex-1">
              Latest AI Analysis
            </h4>
            <span className="text-xs px-2 py-0.5 bg-green-200 dark:bg-green-700 text-green-800 dark:text-green-200 rounded-full animate-pulse">
              New
            </span>
          </div>
          <div 
            className={`text-sm leading-relaxed pl-7 prose prose-sm prose-slate dark:prose-invert max-w-none prose-headings:text-gray-900 dark:prose-headings:text-white prose-p:text-gray-800 dark:prose-p:text-gray-200 prose-li:text-gray-800 dark:prose-li:text-gray-200 prose-strong:text-gray-900 dark:prose-strong:text-white prose-code:text-blue-700 dark:prose-code:text-blue-400 prose-code:bg-blue-50 dark:prose-code:bg-gray-800 ${getTextAlign(lastAnalysis)}`}
            dir={getTextDirection(lastAnalysis)}
            style={{ textAlign: getTextDirection(lastAnalysis) === 'rtl' ? 'right' : 'left' }}
          >
            <ReactMarkdown
              components={{
                p: ({children}) => <p className={`text-gray-900 dark:text-gray-100 ${getTextAlign(String(children))}`}>{children}</p>,
                li: ({children}) => <li className={`text-gray-900 dark:text-gray-100 ${getTextAlign(String(children))}`}>{children}</li>,
                strong: ({children}) => <strong className="text-gray-900 dark:text-white font-bold">{children}</strong>,
                em: ({children}) => <em className="text-gray-800 dark:text-gray-200">{children}</em>
              }}
            >
              {lastAnalysis}
            </ReactMarkdown>
          </div>
        </div>
      )}

      {/* Interactive Chat During Streaming */}
      {isStreaming && (
        <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-lg border-2 border-blue-400 dark:border-blue-600 animate-fade-in shadow-md">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">💬</span>
            <h4 className="text-sm font-bold text-blue-800 dark:text-blue-200">
              Ask AI About the Stream
            </h4>
          </div>
          <p className="text-xs text-blue-600 dark:text-blue-400 mb-3">
            💡 Ask specific questions about what you're sharing in real-time
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && askAIQuestion()}
              placeholder={streamType === 'camera' ? 'e.g., "What object am I holding?"' : 'e.g., "Explain this code on my screen"'}
              disabled={isAskingAI}
              className="flex-1 px-3 py-2 border border-blue-300 dark:border-blue-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            />
            <button
              onClick={askAIQuestion}
              disabled={!customPrompt.trim() || isAskingAI}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isAskingAI ? (
                <>
                  <span className="animate-spin">⏳</span>
                  <span>Asking...</span>
                </>
              ) : (
                <>
                  <span>🤖</span>
                  <span>Ask</span>
                </>
              )}
            </button>
          </div>
          <div className="mt-2 flex flex-wrap gap-1">
            {streamType === 'camera' && (
              <>
                <button
                  onClick={() => setCustomPrompt('What do you see in this image?')}
                  className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-700 transition"
                >
                  What do you see?
                </button>
                <button
                  onClick={() => setCustomPrompt('Describe all objects visible')}
                  className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-700 transition"
                >
                  Describe objects
                </button>
              </>
            )}
            {streamType === 'screen' && (
              <>
                <button
                  onClick={() => setCustomPrompt('Explain what is on my screen')}
                  className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-700 transition"
                >
                  Explain this
                </button>
                <button
                  onClick={() => setCustomPrompt('What are the main points?')}
                  className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-700 transition"
                >
                  Main points
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Info */}
      <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
        Frames are analyzed every 3 seconds via WebSocket
      </div>
    </div>
  )
}
