import { useTheme } from '../contexts/ThemeContext'

interface QuickActionsProps {
  onActionClick: (prompt: string) => void
}

export function QuickActions({ onActionClick }: QuickActionsProps) {
  const { theme } = useTheme()
  
  const actions = [
    {
      icon: '👁️',
      title: 'Explain what you see',
      prompt: 'Explain what you see in detail',
      gradient: theme.accentGradient
    },
    {
      icon: '🖥️',
      title: 'Analyze this screen',
      prompt: 'Analyze this screen and tell me what\'s happening',
      gradient: theme.systemMessageBg
    },
    {
      icon: '📝',
      title: 'Summarize conversation',
      prompt: 'Summarize our conversation so far',
      gradient: `linear-gradient(135deg, ${theme.success} 0%, ${theme.info} 100%)`
    },
    {
      icon: '🎯',
      title: 'What should I do next?',
      prompt: 'Based on what you see, what should I do next?',
      gradient: `linear-gradient(135deg, ${theme.warning} 0%, ${theme.error} 100%)`
    }
  ]

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-6">
        <div className="text-6xl mb-3">🚀</div>
        <h4 className="text-xl font-bold mb-2" style={{ color: theme.textPrimary }}>
          VisionCopilot Live
        </h4>
        <p className="text-sm" style={{ color: theme.textSecondary }}>
          Choose a quick action to get started
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {actions.map((action) => (
          <button
            key={action.title}
            onClick={() => onActionClick(action.prompt)}
            className="group relative overflow-hidden rounded-xl p-4 text-left transition-all duration-200 hover:scale-105 hover:shadow-lg"
            style={{ background: action.gradient }}
          >
            <div className="flex items-start gap-3">
              <div className="text-3xl opacity-90 group-hover:scale-110 transition-transform">
                {action.icon}
              </div>
              <div className="flex-1">
                <h5 className="font-semibold text-white mb-1">
                  {action.title}
                </h5>
                <p className="text-xs text-white/80 line-clamp-2">
                  {action.prompt}
                </p>
              </div>
              <svg
                className="w-5 h-5 text-white/70 group-hover:text-white group-hover:translate-x-1 transition-all"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>
        ))}
      </div>

      <div className="mt-6 text-center">
        <p className="text-xs" style={{ color: theme.textTertiary }}>
          Or type your own question below
        </p>
      </div>
    </div>
  )
}
