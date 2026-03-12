import { useEffect, useState } from 'react'

interface ConnectionStatusProps {
  isConnected: boolean
  sessionId: string | null
  backendStatus?: string
  compact?: boolean
}

export const ConnectionStatus = ({ 
  isConnected, 
  sessionId, 
  backendStatus = 'Unknown',
  compact = false
}: ConnectionStatusProps) => {
  const [showDetails, setShowDetails] = useState(false)

  // Auto-hide success message after 5 seconds
  useEffect(() => {
    if (isConnected && !compact) {
      const timer = setTimeout(() => setShowDetails(false), 5000)
      return () => clearTimeout(timer)
    }
  }, [isConnected, compact])

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        {/* WebSocket Status */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-gray-800 rounded-full shadow-sm">
          <div className={`w-2 h-2 rounded-full ${
            isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
          }`} />
          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>

        {/* Session ID (if available) */}
        {sessionId && (
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-gray-800 rounded-full shadow-sm">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Session: {sessionId.substring(0, 8)}...
            </span>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="mb-6">
      <div 
        className={`rounded-lg shadow-lg overflow-hidden transition-all cursor-pointer ${
          isConnected 
            ? 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800' 
            : 'bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border border-red-200 dark:border-red-800'
        }`}
        onClick={() => setShowDetails(!showDetails)}
      >
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Status Indicator */}
            <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
              isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500 animate-pulse'
            }`} />
            
            {/* Status Text */}
            <div>
              <p className={`font-semibold ${
                isConnected 
                  ? 'text-green-800 dark:text-green-300' 
                  : 'text-red-800 dark:text-red-300'
              }`}>
                {isConnected ? '✓ All Systems Connected' : '⚠ Connection Issues'}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {isConnected 
                  ? 'Backend API and WebSocket are operational' 
                  : 'Having trouble connecting to the backend'
                }
              </p>
            </div>
          </div>

          {/* Expand Icon */}
          <button className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
            <svg 
              className={`w-5 h-5 transition-transform ${showDetails ? 'rotate-180' : ''}`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        {/* Expanded Details */}
        {showDetails && (
          <div className="px-4 pb-4 space-y-2 border-t border-gray-200 dark:border-gray-700 pt-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Backend Status:</span>
              <span className={`font-medium ${
                backendStatus.includes('✅') 
                  ? 'text-green-700 dark:text-green-400' 
                  : 'text-red-700 dark:text-red-400'
              }`}>
                {backendStatus}
              </span>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">WebSocket:</span>
              <span className={`font-medium ${
                isConnected 
                  ? 'text-green-700 dark:text-green-400' 
                  : 'text-red-700 dark:text-red-400'
              }`}>
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>

            {sessionId && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Session ID:</span>
                <span className="font-mono text-xs text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                  {sessionId}
                </span>
              </div>
            )}

            {!isConnected && (
              <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded border border-yellow-200 dark:border-yellow-800">
                <p className="text-sm text-yellow-800 dark:text-yellow-300 font-medium mb-1">
                  Troubleshooting Tips:
                </p>
                <ul className="text-xs text-yellow-700 dark:text-yellow-400 space-y-1">
                  <li>• Ensure the backend server is running</li>
                  <li>• Check your network connection</li>
                  <li>• Try refreshing the page</li>
                  <li>• Verify CORS settings if running locally</li>
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
