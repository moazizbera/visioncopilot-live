interface LoadingSpinnerProps {
  message?: string
  size?: 'small' | 'medium' | 'large'
  fullScreen?: boolean
}

export const LoadingSpinner = ({ 
  message = 'Loading...', 
  size = 'medium',
  fullScreen = false 
}: LoadingSpinnerProps) => {
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-8 h-8',
    large: 'w-12 h-12'
  }

  const containerClasses = fullScreen
    ? 'fixed inset-0 bg-white dark:bg-gray-900 bg-opacity-75 dark:bg-opacity-75 flex items-center justify-center z-50'
    : 'flex items-center justify-center p-6'

  return (
    <div className={containerClasses}>
      <div className="text-center">
        <div className="flex justify-center mb-4">
          {/* Spinner */}
          <div className={`${sizeClasses[size]} border-4 border-blue-200 dark:border-gray-600 border-t-blue-600 dark:border-t-blue-400 rounded-full animate-spin`}></div>
        </div>
        <p className="text-gray-700 dark:text-gray-300 font-medium">{message}</p>
      </div>
    </div>
  )
}

export const InlineLoader = ({ message = 'Processing...' }: { message?: string }) => {
  return (
    <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-4 flex items-center gap-3">
      <div className="w-5 h-5 border-3 border-blue-200 dark:border-blue-600 border-t-blue-600 dark:border-t-blue-400 rounded-full animate-spin flex-shrink-0"></div>
      <span className="text-blue-800 dark:text-blue-200 font-medium">{message}</span>
    </div>
  )
}

export const AnalysisLoader = ({ type = 'image' }: { type?: 'image' | 'ai' | 'session' }) => {
  const messages = {
    image: 'Analyzing image...',
    ai: 'Gemini is thinking...',
    session: 'Initializing session...'
  }

  const icons = {
    image: '🔍',
    ai: '✨',
    session: '⚙️'
  }

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 rounded-lg p-6 text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 bg-white dark:bg-gray-800 rounded-full shadow-lg mb-4">
        <span className="text-3xl animate-pulse">{icons[type]}</span>
      </div>
      <div className="flex justify-center mb-3">
        <div className="w-8 h-8 border-4 border-blue-200 dark:border-gray-600 border-t-blue-600 dark:border-t-blue-400 rounded-full animate-spin"></div>
      </div>
      <p className="text-gray-700 dark:text-gray-300 font-semibold">{messages[type]}</p>
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">This may take a few seconds...</p>
    </div>
  )
}
