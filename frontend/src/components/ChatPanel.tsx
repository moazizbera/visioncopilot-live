import { useRef, useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { getTextDirection, getTextAlign } from '../utils/textDirection'
import { QuickActions } from './QuickActions'
import { ThinkingIndicator } from './ThinkingIndicator'
import { useTheme } from '../contexts/ThemeContext'

interface Message {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  type?: 'text' | 'image' | 'system' | 'summary'
}

interface ChatPanelProps {
  messages: Message[]
  loading: boolean
  currentMessage: string
  onMessageChange: (message: string) => void
  onSend: () => void
  sessionId: string | null
  onToggleHide?: () => void
  onToggleFullscreen?: () => void
  isFullscreen?: boolean
  isSpeaking?: boolean
  onStopVoice?: () => void
  onSummaryGenerated?: (summary: string) => void
  onVoiceClick?: () => void
  onCameraClick?: () => void
  onScreenClick?: () => void
}

export function ChatPanel({
  messages,
  loading,
  currentMessage,
  onMessageChange,
  onSend,
  sessionId,
  onToggleHide,
  onToggleFullscreen,
  isFullscreen = false,
  isSpeaking = false,
  onStopVoice,
  onSummaryGenerated,
  onVoiceClick,
  onCameraClick,
  onScreenClick
}: ChatPanelProps) {
  const { theme } = useTheme()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [generatingSummary, setGeneratingSummary] = useState(false)

  // Auto-scroll to latest message
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (!loading && currentMessage.trim()) {
        onSend()
      }
    }
  }

  const handleGenerateSummary = async () => {
    if (!sessionId || generatingSummary) return
    
    setGeneratingSummary(true)
    try {
      const response = await fetch(`/api/chat/${sessionId}/summary`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: response.statusText }))
        throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      
      // Call parent callback with the summary
      if (onSummaryGenerated) {
        onSummaryGenerated(data.summary)
      }
      
    } catch (error: any) {
      console.error('Error generating summary:', error)
      alert(`Failed to generate summary: ${error.message}`)
    } finally {
      setGeneratingSummary(false)
    }
  }

  return (
    <div 
      className={`rounded-2xl shadow-lg flex flex-col transition-colors ${isFullscreen ? 'fixed inset-0 z-50 m-4' : ''}`}
      style={{ 
        background: theme.panelBg,
        borderColor: theme.panelBorder,
        borderWidth: '1px',
        borderStyle: 'solid',
        height: isFullscreen ? 'calc(100vh - 2rem)' : 'auto'
      }}
    >
      {/* Header */}
      <div className="p-3 border-b flex items-center justify-between" style={{ borderColor: theme.panelBorder }}>
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-bold flex items-center gap-2" style={{ color: theme.textPrimary }}>
            <span>💬</span>
            Conversation
          </h3>
          {messages.length > 0 && (
            <span 
              className="text-xs px-2 py-0.5 rounded-full font-semibold"
              style={{ 
                background: `${theme.accentPrimary}20`,
                color: theme.accentPrimary 
              }}
              title={`${messages.length} messages in this conversation`}
            >
              {messages.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {onToggleFullscreen && (
            <button
              onClick={onToggleFullscreen}
              className="p-1.5 rounded-lg transition hover:opacity-80"
              style={{ background: theme.bgSecondary, color: theme.textSecondary }}
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
              className="p-1.5 rounded-lg transition hover:opacity-80"
              style={{ background: theme.bgSecondary, color: theme.textSecondary }}
              title="Hide Panel"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div 
        className="flex-1 px-4 py-3 space-y-2 relative"
      >
        {messages.length === 0 && (
          <div className="py-4">
            {/* Quick Actions */}
            <QuickActions
              onActionClick={(prompt) => {
                onMessageChange(prompt)
                onSend()
              }}
            />
          </div>
        )}

        {messages.length > 0 && (
          <div className="mb-2">
            <button
              onClick={handleGenerateSummary}
              disabled={!sessionId || generatingSummary || loading}
              className="w-full px-3 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg font-semibold shadow-md transition transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2 text-sm"
              title="Generate a comprehensive summary of this conversation"
            >
              <span>✨</span>
              <span>{generatingSummary ? 'Generating...' : 'Generate Summary'}</span>
            </button>
          </div>
        )}

        {messages.map((msg, idx) => {
          // Special styling for system/summary messages
          if (msg.role === 'system' || msg.type === 'summary') {
            return (
              <div key={idx} className="w-full">
                <div 
                  className="border-2 rounded-2xl p-5 shadow-md transition-colors"
                  style={{ 
                    background: theme.systemMessageBg,
                    borderColor: theme.accentPrimary 
                  }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-2xl">📊</span>
                    <span className="text-sm font-bold uppercase tracking-wide text-white">
                      Session Summary
                    </span>
                  </div>
                  <div className="prose prose-sm max-w-none">
                    <ReactMarkdown
                      components={{
                        p: ({children}) => <p className="mb-2 text-white/95">{children}</p>,
                        li: ({children}) => <li className="text-white/95">{children}</li>,
                        strong: ({children}) => <strong className="font-bold text-white">{children}</strong>,
                        h1: ({children}) => <h1 className="text-lg font-bold mt-4 mb-2 text-white">{children}</h1>,
                        h2: ({children}) => <h2 className="text-base font-bold mt-3 mb-2 text-white">{children}</h2>
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  </div>
                  <button
                    onClick={() => navigator.clipboard.writeText(msg.content)}
                    className="mt-4 px-3 py-1.5 text-sm rounded-lg transition flex items-center gap-2 hover:opacity-90"
                    style={{ background: 'rgba(255, 255, 255, 0.2)', color: '#ffffff' }}
                    title="Copy summary to clipboard"
                  >
                    <span>📋</span>
                    <span>Copy Summary</span>
                  </button>
                </div>
              </div>
            )
          }

          // Regular user/assistant messages
          return (
            <div
              key={idx}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className="max-w-[80%] rounded-xl px-3 py-2 transition-colors"
                style={{
                  background: msg.role === 'user' ? theme.userMessageBg : theme.aiMessageBg,
                  color: msg.role === 'user' ? '#ffffff' : theme.textPrimary
                }}
              >
                <div className="flex items-start gap-2 mb-0.5">
                  <span className="text-base">
                    {msg.role === 'user' ? '👤' : '🤖'}
                  </span>
                  <span className="text-xs font-semibold opacity-70">
                    {msg.role === 'user' ? 'You' : 'VisionCopilot'}
                  </span>
                </div>
                <div 
                  className={`text-sm ${msg.role === 'assistant' ? 'prose prose-sm max-w-none' : ''}`}
                  dir={getTextDirection(msg.content)}
                  style={{ textAlign: getTextDirection(msg.content) === 'rtl' ? 'right' : 'left' }}
                >
                  {msg.role === 'assistant' ? (
                    <ReactMarkdown
                      components={{
                        p: ({children}) => <p className={`text-gray-800 dark:text-gray-200 mb-1 ${getTextAlign(String(children))}`}>{children}</p>,
                        li: ({children}) => <li className={`text-gray-800 dark:text-gray-200 ${getTextAlign(String(children))}`}>{children}</li>,
                        strong: ({children}) => <strong className="font-bold">{children}</strong>
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  ) : (
                    <span className={getTextAlign(msg.content)}>{msg.content}</span>
                  )}
                </div>
              </div>
            </div>
          )
        })}

        {(loading || generatingSummary) && (
          <ThinkingIndicator visible={loading || generatingSummary} />
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-3 border-t" style={{ borderColor: theme.panelBorder }}>
        <div className="flex gap-2 items-end">
          <div className="flex-1 flex flex-col gap-2">
            <textarea
              value={currentMessage}
              onChange={(e) => onMessageChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message... (Enter to send, Shift+Enter for new line)"
              className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:border-transparent resize-none"
              style={{
                background: theme.bgSecondary,
                color: theme.textPrimary,
                borderColor: theme.panelBorder
              }}
              rows={2}
              disabled={!sessionId || loading}
            />
            {/* Quick Action Icons */}
            <div className="flex gap-1.5 items-center">
              {onVoiceClick && (
                <button
                  onClick={onVoiceClick}
                  disabled={!sessionId || loading}
                  className="px-2.5 py-1.5 rounded-lg transition hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 text-xs font-medium shadow-sm"
                  style={{ 
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: '#ffffff'
                  }}
                  title="Voice Input"
                >
                  <span>🎤</span>
                  <span>Voice</span>
                </button>
              )}
              {onCameraClick && (
                <button
                  onClick={onCameraClick}
                  disabled={!sessionId || loading}
                  className="px-2.5 py-1.5 rounded-lg transition hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 text-xs font-medium shadow-sm"
                  style={{ 
                    background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                    color: '#ffffff'
                  }}
                  title="Camera Capture"
                >
                  <span>📷</span>
                  <span>Camera</span>
                </button>
              )}
              {onScreenClick && (
                <button
                  onClick={onScreenClick}
                  disabled={!sessionId || loading}
                  className="px-2.5 py-1.5 rounded-lg transition hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 text-xs font-medium shadow-sm"
                  style={{ 
                    background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                    color: '#ffffff'
                  }}
                  title="Screen Capture"
                >
                  <span>🖥️</span>
                  <span>Screen</span>
                </button>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            {isSpeaking && onStopVoice && (
              <button
                onClick={onStopVoice}
                className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg transition text-xs font-medium flex items-center gap-1.5 shadow whitespace-nowrap"
                title="Stop Voice"
              >
                <span>🔇</span>
                <span>Stop</span>
              </button>
            )}
            <button
              onClick={onSend}
              disabled={!sessionId || !currentMessage.trim() || loading}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow transform hover:scale-105"
            >
              {loading ? '⏳' : '📤'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
