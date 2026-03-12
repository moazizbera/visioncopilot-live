import { ReactNode } from 'react'

interface DashboardPanelProps {
  title: string
  icon?: string
  children: ReactNode
  className?: string
  highlight?: boolean
  status?: 'active' | 'inactive' | 'loading'
}

export const DashboardPanel = ({
  title,
  icon,
  children,
  className = '',
  highlight = false,
  status
}: DashboardPanelProps) => {
  const getStatusColor = () => {
    switch (status) {
      case 'active':
        return 'border-green-500'
      case 'loading':
        return 'border-yellow-500'
      case 'inactive':
        return 'border-gray-300'
      default:
        return 'border-gray-200'
    }
  }

  const getStatusIndicator = () => {
    switch (status) {
      case 'active':
        return <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
      case 'loading':
        return <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
      default:
        return null
    }
  }

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg border-2 transition-all ${getStatusColor()} ${
        highlight ? 'ring-4 ring-blue-300 dark:ring-blue-600' : ''
      } ${className}`}
    >
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {icon && <span className="text-2xl">{icon}</span>}
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
              {title}
            </h2>
          </div>
          {getStatusIndicator()}
        </div>
      </div>
      <div className="p-4">{children}</div>
    </div>
  )
}
