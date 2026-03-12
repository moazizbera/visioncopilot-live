import { useState } from 'react'

interface CollapsibleSectionProps {
  title: string
  icon?: string
  defaultOpen?: boolean
  children: React.ReactNode
  variant?: 'default' | 'highlight'
}

export function CollapsibleSection({ 
  title, 
  icon, 
  defaultOpen = false, 
  children,
  variant = 'default'
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  const bgClass = variant === 'highlight' 
    ? 'bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-blue-200 dark:border-blue-800'
    : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700'

  return (
    <div className={`border rounded-lg ${bgClass} overflow-hidden transition-all duration-200`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-white/50 dark:hover:bg-gray-800/50 transition"
      >
        <div className="flex items-center gap-2">
          {icon && <span>{icon}</span>}
          <span className="font-medium text-sm text-gray-700 dark:text-gray-300">{title}</span>
        </div>
        <svg
          className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

{isOpen && (
        <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700">
          {children}
        </div>
      )}
    </div>
  )
}
