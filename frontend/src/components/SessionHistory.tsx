import { useState, useEffect } from 'react'

interface HistoryMessage {
  message_id: string
  role: 'user' | 'assistant'
  content: string
  message_type: string
  timestamp: string
}

interface SessionHistoryProps {
  sessionId: string | null
  onLoadResponse?: (content: string) => void
}

export function SessionHistory({ sessionId, onLoadResponse }: SessionHistoryProps) {
  const [history, setHistory] = useState<HistoryMessage[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    if (sessionId) {
      loadHistory()
    }
  }, [sessionId])

  const loadHistory = async () => {
    if (!sessionId) return

    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/chat/${sessionId}/history?max_messages=20`)
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`)
      }

      const data = await res.json()
      setHistory(data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load history'
      setError(errorMessage)
      console.error('History load error:', err)
    } finally {
      setLoading(false)
    }
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`
    return date.toLocaleDateString()
  }

  const getMessageIcon = (role: string, type: string) => {
    if (role === 'user') {
      if (type === 'image') return '📷'
      if (type === 'voice') return '🎤'
      return '👤'
    }
    return '🤖'
  }

  if (!sessionId) {
    return (
      <div className="p-6 text-center text-gray-500 dark:text-gray-400">
        <p className="text-4xl mb-2">📋</p>
        <p>Start a session to view conversation history</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="p-6 text-center">
        <div className="animate-spin text-4xl mb-2">⏳</div>
        <p className="text-gray-600 dark:text-gray-400">Loading history...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 rounded-lg">
        <p className="font-semibold">❌ {error}</p>
        <button
          onClick={loadHistory}
          className="mt-2 px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition"
        >
          Retry
        </button>
      </div>
    )
  }

  if (history.length === 0) {
    return (
      <div className="p-6 text-center text-gray-500 dark:text-gray-400">
        <p className="text-4xl mb-2">💬</p>
        <p>No conversation history yet</p>
        <p className="text-sm mt-1">Start chatting to see your messages here</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
          📋 Session History ({history.length} messages)
        </h3>
        <button
          onClick={loadHistory}
          className="px-3 py-1 text-xs bg-blue-100 hover:bg-blue-200 dark:bg-blue-900 dark:hover:bg-blue-800 text-blue-700 dark:text-blue-300 rounded transition"
        >
          🔄 Refresh
        </button>
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {history.map((msg) => (
          <div
            key={msg.message_id}
            className={`p-3 rounded-lg border transition ${
              msg.role === 'user'
                ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
            }`}
          >
            <div className="flex items-start justify-between gap-2 mb-1">
              <div className="flex items-center gap-2">
                <span className="text-lg">{getMessageIcon(msg.role, msg.message_type)}</span>
                <span className={`text-xs font-semibold ${
                  msg.role === 'user'
                    ? 'text-blue-700 dark:text-blue-300'
                    : 'text-green-700 dark:text-green-300'
                }`}>
                  {msg.role === 'user' ? 'You' : 'AI Assistant'}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {formatTimestamp(msg.timestamp)}
                </span>
              </div>
              {msg.role === 'assistant' && (
                <button
                  onClick={() => onLoadResponse?.(msg.content)}
                  className="text-xs px-2 py-0.5 bg-green-600 hover:bg-green-700 text-white rounded transition"
                  title="Load this response"
                >
                  📖 View
                </button>
              )}
            </div>
            
            <div 
              className={`text-sm text-gray-700 dark:text-gray-300 ${
                expandedId === msg.message_id ? '' : 'line-clamp-2'
              }`}
            >
              {msg.content}
            </div>
            
            {msg.content.length > 100 && (
              <button
                onClick={() => setExpandedId(expandedId === msg.message_id ? null : msg.message_id)}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline mt-1"
              >
                {expandedId === msg.message_id ? '▲ Show less' : '▼ Show more'}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
