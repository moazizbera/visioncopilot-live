import { useEffect, useState } from 'react'

interface ErrorDisplayProps {
  error: string | null
  onDismiss?: () => void
  autoHide?: boolean
  autoHideDelay?: number
}

export const ErrorDisplay = ({ 
  error, 
  onDismiss,
  autoHide = true,
  autoHideDelay = 5000 
}: ErrorDisplayProps) => {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (error) {
      setIsVisible(true)
      
      if (autoHide) {
        const timer = setTimeout(() => {
          setIsVisible(false)
          if (onDismiss) {
            setTimeout(onDismiss, 300) // Wait for animation
          }
        }, autoHideDelay)
        
        return () => clearTimeout(timer)
      }
    } else {
      setIsVisible(false)
    }
  }, [error, autoHide, autoHideDelay, onDismiss])

  if (!error) {
    return null
  }

  return (
    <div
      className={`fixed top-4 right-4 z-50 max-w-md transition-all duration-300 ${
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}
    >
      <div className="bg-red-50 border-l-4 border-red-500 p-4 shadow-lg rounded-lg">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-red-500"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-medium text-red-800">Error</h3>
            <div className="mt-1 text-sm text-red-700">
              {error}
            </div>
          </div>
          {onDismiss && (
            <button
              onClick={() => {
                setIsVisible(false)
                setTimeout(onDismiss, 300)
              }}
              className="ml-3 flex-shrink-0 inline-flex text-red-400 hover:text-red-600 focus:outline-none transition"
            >
              <span className="sr-only">Dismiss</span>
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          )}
        </div>
        {autoHide && (
          <div className="mt-2">
            <div className="h-1 bg-red-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-red-500 transition-all"
                style={{
                  animation: `shrink ${autoHideDelay}ms linear`
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
