import { useTheme } from '../contexts/ThemeContext'
import { ThemeSwitcher } from './ThemeSwitcher'

interface ModernHeaderProps {
  sessionId: string | null
}

export function ModernHeader({ sessionId }: ModernHeaderProps) {
  const { theme } = useTheme()
  
  return (
    <header 
      className="sticky top-0 z-50 shadow-lg transition-all duration-300"
      style={{ 
        background: theme.accentGradient 
      }}
    >
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2 text-white">
              <span className="text-3xl">🚀</span>
              VisionCopilot Live
            </h1>
            <p className="text-sm text-white/80 mt-0.5">From Chat to Collaboration</p>
          </div>
          
          <div className="flex items-center gap-3">
            {sessionId && (
              <div className="text-xs bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full text-white">
                Session: {sessionId.substring(0, 8)}...
              </div>
            )}
            <ThemeSwitcher />
          </div>
        </div>
      </div>
    </header>
  )
}
