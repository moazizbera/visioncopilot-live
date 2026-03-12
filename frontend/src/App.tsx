import { useState, useEffect, useRef, useCallback } from 'react'
import { 
  WelcomeScreen,
  ModernHeader,
  ControlPanel,
  ChatPanel,
  StatusPanel,
  LiveStreaming,
  ErrorDisplay,
  SessionHistory,
  Sidebar,
  CameraView,
  VoiceInput
} from './components'
import { textToSpeechService } from './services/textToSpeechService'
import { webSocketService } from './services/webSocketService'
import { screenCaptureService } from './services/screenCaptureService'
import { ThemeProvider, useTheme } from './contexts/ThemeContext'

interface Message {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  type?: 'text' | 'image' | 'system' | 'summary'
}

function MainApp() {
  const { theme } = useTheme()
  
  // Session and connection state
  const [showWelcome, setShowWelcome] = useState(true)
  const [isInitializing, setIsInitializing] = useState(false)
  const [_status, setStatus] = useState<string>('Checking connection...')
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [wsConnected, setWsConnected] = useState(false)
  
  // Message history tracking
  const [messages, setMessages] = useState<Message[]>([])
  const [currentMessage, setCurrentMessage] = useState<string>('')
  const [loading, setLoading] = useState(false)
  
  // Active mode state
  const [activeMode, setActiveMode] = useState<'text' | 'voice' | 'camera' | 'screen'>('text')
  
  // Activity tracking for status indicators
  const [cameraActive, setCameraActive] = useState(false)
  const [screenActive, setScreenActive] = useState(false)
  const [voiceListening] = useState(false) // Tracked internally by VoiceInput
  const [streamingActive, setStreamingActive] = useState(false)
  
  // Sidebar state
  const [historySidebarOpen, setHistorySidebarOpen] = useState(false)
  
  // Voice state
  const [isSpeaking, setIsSpeaking] = useState(false)
  
  // Floating screen share state
  const [showFloatingScreenShare, setShowFloatingScreenShare] = useState(false)
  
  // Panel visibility and fullscreen state
  const [hiddenPanels, setHiddenPanels] = useState<Set<string>>(new Set()) // Empty - all panels visible by default
  const [fullscreenPanel, setFullscreenPanel] = useState<string | null>(null)
  
  // Feature modals
  const [showCameraModal, setShowCameraModal] = useState(false)
  const [showVoiceModal, setShowVoiceModal] = useState(false)
  
  // Modal tab states
  const [cameraTab, setCameraTab] = useState<'capture' | 'stream'>('capture')
  const [screenTab, setScreenTab] = useState<'capture' | 'stream'>('capture')
  
  // WebSocket streaming settings
  const [streamInterval, setStreamInterval] = useState(2000) // ms between frame analyses
  
  // Error handling
  const [error, setError] = useState<string | null>(null)

  // Refs for stable references
  const streamingResponseRef = useRef<string>('')

  // Panel control functions
  const togglePanelVisibility = (panelId: string) => {
    setHiddenPanels(prev => {
      const newSet = new Set(prev)
      if (newSet.has(panelId)) {
        newSet.delete(panelId)
      } else {
        newSet.add(panelId)
      }
      return newSet
    })
  }

  const toggleFullscreen = (panelId: string) => {
    setFullscreenPanel(prev => prev === panelId ? null : panelId)
  }

  // WebSocket handlers
  const responseHandler = useCallback((message: any) => {
    if (message.data?.content) {
      const assistantMsg: Message = {
        role: 'assistant',
        content: message.data.content,
        timestamp: new Date(),
        type: 'text'
      }
      setMessages(prev => [...prev, assistantMsg])
      setIsSpeaking(true)
      textToSpeechService.speak(message.data.content)
        .then(() => setIsSpeaking(false))
        .catch((err) => {
          console.error(err)
          setIsSpeaking(false)
        })
    }
  }, [])

  const streamHandler = useCallback((message: any) => {
    if (message.data?.chunk && !message.data?.done) {
      streamingResponseRef.current += message.data.chunk
    } else if (message.data?.done) {
      const assistantMsg: Message = {
        role: 'assistant',
        content: streamingResponseRef.current,
        timestamp: new Date(),
        type: 'text'
      }
      setMessages(prev => [...prev, assistantMsg])
      streamingResponseRef.current = ''
    }
  }, [])

  const frameAnalysisHandler = useCallback((message: any) => {
    if (message.data?.content) {
      const assistantMsg: Message = {
        role: 'assistant',
        content: message.data.content,
        timestamp: new Date(),
        type: 'image'
      }
      setMessages(prev => [...prev, assistantMsg])
    }
  }, [])

  // WebSocket setup
  useEffect(() => {
    webSocketService.on('response', responseHandler)
    webSocketService.on('stream', streamHandler)
    webSocketService.on('frame_analysis', frameAnalysisHandler)

    return () => {
      webSocketService.off('response', responseHandler)
      webSocketService.off('stream', streamHandler)
      webSocketService.off('frame_analysis', frameAnalysisHandler)
      webSocketService.disconnect()
    }
  }, [responseHandler, streamHandler, frameAnalysisHandler])

  const initializeSession = async () => {
    setIsInitializing(true)
    setError(null)
    
    try {
      // Check health
      const healthRes = await fetch('/api/health')
      const healthData = await healthRes.json()
      setStatus(`✅ Connected: ${healthData.service} v${healthData.version}`)

      // Create session
      const sessionRes = await fetch('/api/sessions/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: 'demo_user' })
      })
      const sessionData = await sessionRes.json()
      setSessionId(sessionData.session_id)

      // Connect WebSocket
      try {
        await webSocketService.connect(sessionData.session_id)
        setWsConnected(true)
      } catch (wsError) {
        console.error('WebSocket connection error:', wsError)
        setWsConnected(false)
        setError('WebSocket connection failed. Real-time features may not work.')
      }

      setShowWelcome(false)
      
      // Add welcome message
      setMessages([{
        role: 'assistant',
        content: 'Hello! I\'m VisionCopilot Live. I can help you with text chat, voice conversations, camera analysis, screen sharing, and live streaming. How can I assist you today?',
        timestamp: new Date(),
        type: 'system'
      }])
      
    } catch (error) {
      const errorMessage = 'Backend not connected. Please ensure the server is running.'
      setStatus('❌ ' + errorMessage)
      setError(errorMessage)
      console.error('Connection error:', error)
    } finally {
      setIsInitializing(false)
    }
  }

  const handleSendMessage = useCallback(async () => {
    if (!sessionId || !currentMessage.trim() || loading) return

    // Check if screen sharing is active - if so, capture screen and send with message
    if (showFloatingScreenShare && screenCaptureService.isActive()) {
      const screenCapture = screenCaptureService.captureScreen()
      if (!screenCapture) {
        setError('Failed to capture screen. Please try again.')
        return
      }

      // Add user message to history
      const userMsg: Message = {
        role: 'user',
        content: `🖥️ [Screen Share] ${currentMessage}`,
        timestamp: new Date(),
        type: 'image'
      }
      setMessages(prev => [...prev, userMsg])
      const promptText = currentMessage
      setCurrentMessage('')
      setLoading(true)
      setError(null)

      try {
        const res = await fetch('/api/vision/analyze-screen', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            session_id: sessionId,
            prompt: promptText,
            screen_base64: screenCapture
          })
        })

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({ detail: res.statusText }))
          throw new Error(errorData.detail || `HTTP ${res.status}: ${res.statusText}`)
        }

        const data = await res.json()
        
        // Add assistant response
        const assistantMsg: Message = {
          role: 'assistant',
          content: data.response,
          timestamp: new Date(),
          type: 'image'
        }
        setMessages(prev => [...prev, assistantMsg])
        
        setIsSpeaking(true)
        textToSpeechService.speak(data.response)
          .then(() => setIsSpeaking(false))
          .catch((err) => {
            console.error(err)
            setIsSpeaking(false)
          })
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to analyze screen'
        setError(errorMessage)
        
        const errorMsg: Message = {
          role: 'assistant',
          content: 'Error: ' + errorMessage,
          timestamp: new Date(),
          type: 'system'
        }
        setMessages(prev => [...prev, errorMsg])
      } finally {
        setLoading(false)
      }
      return
    }

    // Normal text chat (no screen sharing active)
    // Add user message to history
    const userMsg: Message = {
      role: 'user',
      content: currentMessage,
      timestamp: new Date(),
      type: 'text'
    }
    setMessages(prev => [...prev, userMsg])
    setCurrentMessage('')
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/chat/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          prompt: currentMessage,
          include_history: true
        })
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ detail: res.statusText }))
        throw new Error(errorData.detail || `HTTP ${res.status}: ${res.statusText}`)
      }

      const data = await res.json()
      
      // Add assistant response
      const assistantMsg: Message = {
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
        type: 'text'
      }
      setMessages(prev => [...prev, assistantMsg])
      
      setIsSpeaking(true)
      textToSpeechService.speak(data.response)
        .then(() => setIsSpeaking(false))
        .catch((err) => {
          console.error(err)
          setIsSpeaking(false)
        })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get response from AI'
      setError(errorMessage)
      
      const errorMsg: Message = {
        role: 'assistant',
        content: 'Error: ' + errorMessage,
        timestamp: new Date(),
        type: 'system'
      }
      setMessages(prev => [...prev, errorMsg])
    } finally {
      setLoading(false)
    }
  }, [sessionId, currentMessage, loading, showFloatingScreenShare])

  const handleVoiceInput = useCallback(async (transcript: string) => {
    if (!sessionId || !transcript.trim() || loading) return
    
    // Add user message
    const userMsg: Message = {
      role: 'user',
      content: transcript,
      timestamp: new Date(),
      type: 'text'
    }
    setMessages(prev => [...prev, userMsg])
    setLoading(true)

    try {
      const res = await fetch('/api/chat/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          prompt: transcript,
          include_history: true
        })
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ detail: res.statusText }))
        throw new Error(errorData.detail || `HTTP ${res.status}: ${res.statusText}`)
      }

      const data = await res.json()
      
      const assistantMsg: Message = {
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
        type: 'text'
      }
      setMessages(prev => [...prev, assistantMsg])
      
      setIsSpeaking(true)
      textToSpeechService.speak(data.response)
        .then(() => setIsSpeaking(false))
        .catch((err) => {
          console.error(err)
          setIsSpeaking(false)
        })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get response'
      const errorMsg: Message = {
        role: 'assistant',
        content: 'Error: ' + errorMessage,
        timestamp: new Date(),
        type: 'system'
      }
      setMessages(prev => [...prev, errorMsg])
    } finally {
      setLoading(false)
    }
  }, [sessionId, loading])

  const handleCameraCapture = useCallback(async (imageBase64: string) => {
    if (!sessionId || loading) return

    setCameraActive(true)
    setLoading(true)
    setError(null)

    // Add user message
    const userMsg: Message = {
      role: 'user',
      content: '📷 Camera image captured',
      timestamp: new Date(),
      type: 'image'
    }
    setMessages(prev => [...prev, userMsg])

    try {
      const res = await fetch('/api/vision/analyze-camera', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          prompt: 'What do you see in this camera view?',
          frame_base64: imageBase64
        })
      })

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`)
      }

      const data = await res.json()
      
      const assistantMsg: Message = {
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
        type: 'image'
      }
      setMessages(prev => [...prev, assistantMsg])
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to analyze camera frame'
      setError(errorMessage)
      
      const errorMsg: Message = {
        role: 'assistant',
        content: 'Error: ' + errorMessage,
        timestamp: new Date(),
        type: 'system'
      }
      setMessages(prev => [...prev, errorMsg])
    } finally {
      setLoading(false)
      setCameraActive(false)
    }
  }, [sessionId, loading])

  const handleScreenShareToggle = useCallback(() => {
    setShowFloatingScreenShare(!showFloatingScreenShare)
    setScreenActive(!showFloatingScreenShare)
  }, [showFloatingScreenShare])

  const handleScreenCapture = useCallback(async (imageBase64: string) => {
    if (!sessionId || loading) return

    setScreenActive(true)
    setLoading(true)
    setError(null)

    // Add user message
    const userMsg: Message = {
      role: 'user',
      content: '🖥️ Screen captured',
      timestamp: new Date(),
      type: 'image'
    }
    setMessages(prev => [...prev, userMsg])

    try {
      const res = await fetch('/api/vision/analyze-screen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          prompt: 'What do you see on my screen? Please describe it.',
          screen_base64: imageBase64
        })
      })

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`)
      }

      const data = await res.json()
      
      const assistantMsg: Message = {
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
        type: 'image'
      }
      setMessages(prev => [...prev, assistantMsg])
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to analyze screen'
      setError(errorMessage)
      
      const errorMsg: Message = {
        role: 'assistant',
        content: 'Error: ' + errorMessage,
        timestamp: new Date(),
        type: 'system'
      }
      setMessages(prev => [...prev, errorMsg])
    } finally {
      setLoading(false)
      setScreenActive(false)
    }
  }, [sessionId, loading])

  const handleClearSession = useCallback(() => {
    setMessages([])
    setCurrentMessage('')
    setStatus('Session cleared')
  }, [])

  const handleSamplePrompt = useCallback((prompt: string) => {
    setCurrentMessage(prompt)
    setActiveMode('text')
  }, [])

  const handleStopVoice = useCallback(() => {
    textToSpeechService.stop()
    setIsSpeaking(false)
  }, [])

  // Handle session summary generation
  const handleSummaryGenerated = useCallback((summary: string) => {
    const summaryMsg: Message = {
      role: 'system',
      content: summary,
      timestamp: new Date(),
      type: 'summary'
    }
    setMessages(prev => [...prev, summaryMsg])
  }, [])

  // Show welcome screen if not initialized
  if (showWelcome) {
    return (
      <WelcomeScreen 
        onStart={initializeSession} 
        onSamplePrompt={handleSamplePrompt}
        isInitializing={isInitializing} 
      />
    )
  }

  return (
    <div 
      className="min-h-screen transition-colors duration-300" 
      style={{ background: theme.bgPrimary }}
    >
      {/* Error Display */}
      <ErrorDisplay error={error} onDismiss={() => setError(null)} />
      
      {/* Modern Header */}
      <ModernHeader sessionId={sessionId} />
      
      {/* Main Dashboard - 3 Panel Layout */}
      <div className="container mx-auto px-4 py-6">
        {/* Fullscreen overlay */}
        {fullscreenPanel && (
          <div className="fixed top-0 left-0 right-0 bottom-0 bg-gray-900/95 z-[60] p-4">
            {fullscreenPanel === 'controls' && (
              <ControlPanel
                sessionId={sessionId}
                activeMode={activeMode}
                onModeChange={setActiveMode}
                onCameraCapture={handleCameraCapture}
                onScreenCapture={handleScreenShareToggle}
                onVoiceInput={handleVoiceInput}
                onClearSession={handleClearSession}
                isFullscreen={true}
                onToggleFullscreen={() => toggleFullscreen('controls')}
              />
            )}
            {fullscreenPanel === 'chat' && (
              <ChatPanel
                messages={messages}
                loading={loading}
                currentMessage={currentMessage}
                onMessageChange={setCurrentMessage}
                onSend={handleSendMessage}
                sessionId={sessionId}
                isSpeaking={isSpeaking}
                onStopVoice={handleStopVoice}
                onSummaryGenerated={handleSummaryGenerated}
                isFullscreen={true}
                onToggleFullscreen={() => toggleFullscreen('chat')}
                onVoiceClick={() => setShowVoiceModal(true)}
                onCameraClick={() => setShowCameraModal(true)}
                onScreenClick={() => setShowFloatingScreenShare(true)}
              />
            )}
            {fullscreenPanel === 'status' && (
              <StatusPanel
                wsConnected={wsConnected}
                streamingActive={streamingActive}
                cameraActive={cameraActive}
                screenActive={screenActive}
                voiceListening={voiceListening}
                onOpenHistory={() => setHistorySidebarOpen(true)}
                isFullscreen={true}
                onToggleFullscreen={() => toggleFullscreen('status')}
                sessionId={sessionId}
                onConnectionChange={setWsConnected}
                streamInterval={streamInterval}
                onIntervalChange={setStreamInterval}
              />
            )}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* LEFT PANEL - Controls */}
          {!hiddenPanels.has('controls') && !fullscreenPanel && (
            <div className="lg:col-span-3 order-1 lg:sticky lg:top-6 lg:self-start">
              <ControlPanel
                sessionId={sessionId}
                activeMode={activeMode}
                onModeChange={(mode) => {
                  setActiveMode(mode)
                  // Open appropriate modal based on mode
                  if (mode === 'camera') {
                    setShowCameraModal(true)
                  } else if (mode === 'voice') {
                    setShowVoiceModal(true)
                  } else if (mode === 'screen') {
                    setShowFloatingScreenShare(true)
                  }
                }}
                onCameraCapture={() => setShowCameraModal(true)}
                onScreenCapture={handleScreenShareToggle}
                onVoiceInput={handleVoiceInput}
                onClearSession={handleClearSession}
                onToggleHide={() => togglePanelVisibility('controls')}
                onToggleFullscreen={() => toggleFullscreen('controls')}
              />
            </div>
          )}
          
          {/* CENTER PANEL - Chat/Conversation */}
          {!hiddenPanels.has('chat') && !fullscreenPanel && (
            <div className={`order-2 ${
              hiddenPanels.has('controls') && hiddenPanels.has('status') ? 'lg:col-span-12' :
              hiddenPanels.has('controls') || hiddenPanels.has('status') ? 'lg:col-span-9' :
              'lg:col-span-6'
            }`}>
              <ChatPanel
                messages={messages}
                loading={loading}
                currentMessage={currentMessage}
                onMessageChange={setCurrentMessage}
                onSend={handleSendMessage}
                sessionId={sessionId}
                isSpeaking={isSpeaking}
                onStopVoice={handleStopVoice}
                onSummaryGenerated={handleSummaryGenerated}
                onToggleHide={() => togglePanelVisibility('chat')}
                onToggleFullscreen={() => toggleFullscreen('chat')}
                onVoiceClick={() => setShowVoiceModal(true)}
                onCameraClick={() => setShowCameraModal(true)}
                onScreenClick={() => setShowFloatingScreenShare(true)}
              />
            </div>
          )}
          
          {/* RIGHT PANEL - Status */}
          {!hiddenPanels.has('status') && !fullscreenPanel && (
            <div className="lg:col-span-3 order-3 lg:sticky lg:top-6 lg:self-start">
              <StatusPanel
                wsConnected={wsConnected}
                streamingActive={streamingActive}
                cameraActive={cameraActive}
                screenActive={screenActive}
                voiceListening={voiceListening}
                onOpenHistory={() => setHistorySidebarOpen(true)}
                onToggleHide={() => togglePanelVisibility('status')}
                onToggleFullscreen={() => toggleFullscreen('status')}
                sessionId={sessionId}
                onConnectionChange={setWsConnected}
                streamInterval={streamInterval}
                onIntervalChange={setStreamInterval}
              />
            </div>
          )}
          
        </div>

        {/* Show hidden panels bar */}
        {(hiddenPanels.has('controls') || hiddenPanels.has('chat') || hiddenPanels.has('status')) && !fullscreenPanel && (
          <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 rounded-full shadow-lg px-4 py-2 flex gap-2 z-30" style={{ background: theme.panelBg, borderColor: theme.panelBorder, borderWidth: '1px', borderStyle: 'solid' }}>
            {hiddenPanels.has('controls') && (
              <button
                onClick={() => togglePanelVisibility('controls')}
                className="px-3 py-1.5 text-white text-sm rounded-full transition flex items-center gap-1"
                style={{ background: theme.accentGradient }}
                title="Show Controls"
              >
                <span>⚙️</span>
                <span>Show Controls</span>
              </button>
            )}
            {hiddenPanels.has('chat') && (
              <button
                onClick={() => togglePanelVisibility('chat')}
                className="px-3 py-1.5 text-white text-sm rounded-full transition flex items-center gap-1"
                style={{ background: theme.accentGradient }}
                title="Show Chat"
              >
                <span>💬</span>
                <span>Show Chat</span>
              </button>
            )}
            {hiddenPanels.has('status') && (
              <button
                onClick={() => togglePanelVisibility('status')}
                className="px-3 py-1.5 text-white text-sm rounded-full transition flex items-center gap-1"
                style={{ background: theme.accentGradient }}
                title="Show Status"
              >
                <span>📊</span>
                <span>Show Status</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Session History Sidebar */}
      <Sidebar
        isOpen={historySidebarOpen}
        onClose={() => setHistorySidebarOpen(false)}
        title="📋 Session History"
      >
        <SessionHistory
          sessionId={sessionId}
          onLoadResponse={(content) => {
            setCurrentMessage(content)
            setHistorySidebarOpen(false)
          }}
        />
      </Sidebar>

      {/* Floating Screen Share */}
      {/* Screen Capture/Stream Modal */}
      {showFloatingScreenShare && (
        <div 
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowFloatingScreenShare(false)
              setScreenActive(false)
              screenCaptureService.stopScreenCapture()
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setShowFloatingScreenShare(false)
              setScreenActive(false)
              screenCaptureService.stopScreenCapture()
            }
          }}
        >
          <div 
            className="rounded-2xl shadow-2xl w-full mx-auto flex flex-col animate-fade-in-up"
            style={{
              background: theme.panelBg,
              borderColor: theme.panelBorder,
              borderWidth: '2px',
              borderStyle: 'solid',
              maxWidth: '48rem',
              maxHeight: '90vh'
            }}
          >
            <div className="p-4 border-b flex items-center justify-between flex-shrink-0" style={{ borderColor: theme.panelBorder, background: theme.panelBg }}>
              <h3 className="text-lg font-bold flex items-center gap-2" style={{ color: theme.textPrimary }}>
                <span>🖥️</span>
                Screen
              </h3>
              <button
                onClick={() => {
                  setShowFloatingScreenShare(false)
                  setScreenActive(false)
                  screenCaptureService.stopScreenCapture()
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
            
            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              {/* Tab Navigation */}
              <div className="flex gap-2 border-b pb-3" style={{ borderColor: theme.panelBorder }}>
                <button
                  onClick={() => setScreenTab('capture')}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                    screenTab === 'capture' ? 'shadow-md' : 'opacity-60 hover:opacity-100'
                  }`}
                  style={{
                    background: screenTab === 'capture' ? theme.accentGradient : theme.bgSecondary,
                    color: screenTab === 'capture' ? 'white' : theme.textSecondary
                  }}
                >
                  📸 Single Capture
                </button>
                <button
                  onClick={() => setScreenTab('stream')}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                    screenTab === 'stream' ? 'shadow-md' : 'opacity-60 hover:opacity-100'
                  }`}
                  style={{
                    background: screenTab === 'stream' ? theme.accentGradient : theme.bgSecondary,
                    color: screenTab === 'stream' ? 'white' : theme.textSecondary
                  }}
                >
                  📡 Continuous Stream
                </button>
              </div>
              
              {/* Tab Content */}
              {screenTab === 'capture' ? (
                /* Single Capture Tab */
                <>
                  {/* Preview Placeholder with consistent sizing */}
                  <div 
                    className="relative bg-gray-900 rounded-lg overflow-hidden flex items-center justify-center"
                    style={{ aspectRatio: '16/9' }}
                  >
                    <div className="text-center p-8">
                      <div className="text-6xl mb-4">🖥️</div>
                      <p className="text-lg font-semibold text-white mb-2">Screen Capture</p>
                      <p className="text-sm text-gray-400">Click the button below to select your screen</p>
                    </div>
                  </div>
                  <button
                    onClick={async () => {
                      const screen = await screenCaptureService.captureOneTimeScreen()
                      if (screen) {
                        handleScreenCapture(screen)
                        setShowFloatingScreenShare(false)
                        setScreenActive(false)
                      }
                    }}
                    className="w-full px-6 py-3 rounded-xl font-semibold shadow-lg transition transform hover:scale-105"
                    style={{ background: theme.accentGradient, color: '#ffffff' }}
                  >
                    📸 Capture Screen
                  </button>
                  <p className="text-sm text-center" style={{ color: theme.textSecondary }}>
                    💡 Click capture to share your screen frames with AI
                  </p>
                </>
              ) : (
                /* Continuous Stream Tab */
                <div className="space-y-4">
                  {!wsConnected ? (
                    /* WebSocket Not Connected - Show Prompt */
                    <div className="text-center py-8 space-y-4">
                      <div className="text-6xl mb-4">🔌</div>
                      <h4 className="text-lg font-semibold" style={{ color: theme.textPrimary }}>
                        WebSocket Not Connected
                      </h4>
                      <p className="text-sm max-w-md mx-auto" style={{ color: theme.textSecondary }}>
                        To use continuous screen streaming, you need to connect to WebSocket first.
                      </p>
                      <div 
                        className="p-4 rounded-xl mx-auto max-w-md"
                        style={{ 
                          background: `${theme.accentPrimary}15`,
                          borderColor: `${theme.accentPrimary}40`,
                          borderWidth: '1px',
                          borderStyle: 'solid'
                        }}
                      >
                        <p className="text-sm font-medium mb-2" style={{ color: theme.textPrimary }}>
                          💡 Quick Steps:
                        </p>
                        <ol className="text-sm text-left space-y-1" style={{ color: theme.textSecondary }}>
                          <li>1. Open <strong style={{ color: theme.textPrimary }}>System Status</strong> panel (right side)</li>
                          <li>2. Click <strong style={{ color: theme.textPrimary }}>🔌 Connect WebSocket</strong></li>
                          <li>3. Set your preferred analysis interval</li>
                          <li>4. Come back here to start streaming!</li>
                        </ol>
                      </div>
                    </div>
                  ) : (
                    /* WebSocket Connected - Show Unified Streaming UI */
                    <LiveStreaming 
                      sessionId={sessionId} 
                      streamType="screen"
                      streamInterval={streamInterval}
                      onAnalysis={(analysis) => {
                        const compactAnalysis = analysis.length > 150 
                          ? `🖥️ Screen Stream: ${analysis.substring(0, 147)}...` 
                          : `🖥️ Screen Stream: ${analysis}`
                        
                        const msg: Message = {
                          role: 'assistant',
                          content: compactAnalysis,
                          timestamp: new Date(),
                          type: 'image'
                        }
                        setMessages(prev => [...prev, msg])
                        setStreamingActive(true)
                        setScreenActive(true)
                      }}
                    />
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Camera Capture Modal */}
      {showCameraModal && (
        <div 
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowCameraModal(false)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') setShowCameraModal(false)
          }}
        >
          <div 
            className="rounded-2xl shadow-2xl w-full mx-auto flex flex-col animate-fade-in-up"
            style={{
              background: theme.panelBg,
              borderColor: theme.panelBorder,
              borderWidth: '2px',
              borderStyle: 'solid',
              maxWidth: '42rem',
              maxHeight: '90vh'
            }}
          >
            <div className="p-4 border-b flex items-center justify-between flex-shrink-0" style={{ borderColor: theme.panelBorder, background: theme.panelBg }}>
              <h3 className="text-lg font-bold flex items-center gap-2" style={{ color: theme.textPrimary }}>
                <span>📷</span>
                Camera
              </h3>
              <button
                onClick={() => setShowCameraModal(false)}
                className="p-2 rounded-lg hover:opacity-80 transition"
                style={{ background: theme.bgSecondary, color: theme.textSecondary }}
                title="Close (Esc)"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              {/* Tab Navigation */}
              <div className="flex gap-2 border-b pb-3" style={{ borderColor: theme.panelBorder }}>
                <button
                  onClick={() => setCameraTab('capture')}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                    cameraTab === 'capture' ? 'shadow-md' : 'opacity-60 hover:opacity-100'
                  }`}
                  style={{
                    background: cameraTab === 'capture' ? theme.accentGradient : theme.bgSecondary,
                    color: cameraTab === 'capture' ? 'white' : theme.textSecondary
                  }}
                >
                  📸 Single Capture
                </button>
                <button
                  onClick={() => setCameraTab('stream')}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                    cameraTab === 'stream' ? 'shadow-md' : 'opacity-60 hover:opacity-100'
                  }`}
                  style={{
                    background: cameraTab === 'stream' ? theme.accentGradient : theme.bgSecondary,
                    color: cameraTab === 'stream' ? 'white' : theme.textSecondary
                  }}
                >
                  📡 Continuous Stream
                </button>
              </div>
              
              {/* Tab Content */}
              {cameraTab === 'capture' ? (
                /* Single Capture Tab */
                <>
                  <CameraView 
                    onCapture={(imageBase64: string) => {
                      handleCameraCapture(imageBase64)
                      setShowCameraModal(false)
                    }} 
                  />
                  <p className="text-sm text-center" style={{ color: theme.textSecondary }}>
                    💡 Click capture to analyze the image with AI
                  </p>
                </>
              ) : (
                /* Continuous Stream Tab */
                <div className="space-y-4">
                  {!wsConnected ? (
                    /* WebSocket Not Connected - Show Prompt */
                    <div className="text-center py-8 space-y-4">
                      <div className="text-6xl mb-4">🔌</div>
                      <h4 className="text-lg font-semibold" style={{ color: theme.textPrimary }}>
                        WebSocket Not Connected
                      </h4>
                      <p className="text-sm max-w-md mx-auto" style={{ color: theme.textSecondary }}>
                        To use continuous camera streaming, you need to connect to WebSocket first.
                      </p>
                      <div 
                        className="p-4 rounded-xl mx-auto max-w-md"
                        style={{ 
                          background: `${theme.accentPrimary}15`,
                          borderColor: `${theme.accentPrimary}40`,
                          borderWidth: '1px',
                          borderStyle: 'solid'
                        }}
                      >
                        <p className="text-sm font-medium mb-2" style={{ color: theme.textPrimary }}>
                          💡 Quick Steps:
                        </p>
                        <ol className="text-sm text-left space-y-1" style={{ color: theme.textSecondary }}>
                          <li>1. Open <strong style={{ color: theme.textPrimary }}>System Status</strong> panel (right side)</li>
                          <li>2. Click <strong style={{ color: theme.textPrimary }}>🔌 Connect WebSocket</strong></li>
                          <li>3. Set your preferred analysis interval</li>
                          <li>4. Come back here to start streaming!</li>
                        </ol>
                      </div>
                    </div>
                  ) : (
                    /* WebSocket Connected - Show Unified Streaming UI */
                    <LiveStreaming 
                      sessionId={sessionId} 
                      streamType="camera"
                      streamInterval={streamInterval}
                      onAnalysis={(analysis) => {
                        const compactAnalysis = analysis.length > 150 
                          ? `📷 Camera Stream: ${analysis.substring(0, 147)}...` 
                          : `📷 Camera Stream: ${analysis}`
                        
                        const msg: Message = {
                          role: 'assistant',
                          content: compactAnalysis,
                          timestamp: new Date(),
                          type: 'image'
                        }
                        setMessages(prev => [...prev, msg])
                        setStreamingActive(true)
                        setCameraActive(true)
                      }}
                    />
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Voice Chat Modal */}
      {showVoiceModal && (
        <div 
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowVoiceModal(false)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') setShowVoiceModal(false)
          }}
        >
          <div 
            className="rounded-2xl shadow-2xl w-full mx-auto flex flex-col animate-fade-in-up"
            style={{
              background: theme.panelBg,
              borderColor: theme.panelBorder,
              borderWidth: '2px',
              borderStyle: 'solid',
              maxWidth: '28rem',
              maxHeight: '90vh'
            }}
          >
            <div className="p-4 border-b flex items-center justify-between flex-shrink-0" style={{ borderColor: theme.panelBorder }}>
              <h3 className="text-lg font-bold flex items-center gap-2" style={{ color: theme.textPrimary }}>
                <span>🎤</span>
                Voice Chat
              </h3>
              <button
                onClick={() => setShowVoiceModal(false)}
                className="p-2 rounded-lg hover:opacity-80 transition"
                style={{ background: theme.bgSecondary, color: theme.textSecondary }}
                title="Close (Esc)"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              <VoiceInput 
                onTranscript={(transcript: string) => {
                  handleVoiceInput(transcript)
                  setShowVoiceModal(false)
                }} 
              />
              <p className="text-sm text-center" style={{ color: theme.textSecondary }}>
                💡 Speak your message and it will be sent to the AI
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function App() {
  return (
    <ThemeProvider>
      <MainApp />
    </ThemeProvider>
  )
}

export default App
