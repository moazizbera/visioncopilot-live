import { useState, useEffect } from 'react'
import { useTheme } from '../contexts/ThemeContext'

interface ThinkingIndicatorProps {
  visible: boolean
}

export function ThinkingIndicator({ visible }: ThinkingIndicatorProps) {
  const { theme } = useTheme()
  const [step, setStep] = useState(0)

  const steps = [
    { icon: '📥', text: 'Capturing input...', color: theme.info },
    { icon: '🧠', text: 'Analyzing with Gemini...', color: theme.accentPrimary },
    { icon: '✨', text: 'Generating response...', color: theme.success }
  ]

  useEffect(() => {
    if (!visible) {
      setStep(0)
      return
    }

    const interval = setInterval(() => {
      setStep((prev) => (prev + 1) % steps.length)
    }, 1500)

    return () => clearInterval(interval)
  }, [visible, steps.length])

  if (!visible) return null

  const currentStep = steps[step]

  return (
    <div className="flex justify-start">
      <div 
        className="rounded-2xl px-5 py-4 shadow-md border transition-colors" 
        style={{ 
          background: theme.bgSecondary,
          borderColor: theme.panelBorder 
        }}
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <span className="text-2xl animate-pulse">
              {currentStep.icon}
            </span>
            <div className="absolute -bottom-1 -right-1">
              <div className="w-3 h-3 rounded-full animate-ping" style={{ background: theme.accentPrimary }} />
              <div className="absolute top-0 left-0 w-3 h-3 rounded-full" style={{ background: theme.accentPrimary }} />
            </div>
          </div>
          
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold" style={{ color: theme.textPrimary }}>
                VisionCopilot
              </span>
              <div className="flex gap-1">
                {steps.map((_, idx) => (
                  <div
                    key={idx}
                    className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                      idx === step ? 'scale-125' : ''
                    }`}
                    style={{ 
                      background: idx === step 
                        ? theme.accentPrimary 
                        : idx < step 
                        ? theme.textTertiary 
                        : theme.bgTertiary
                    }}
                  />
                ))}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium animate-pulse" style={{ color: currentStep.color }}>
                {currentStep.text}
              </span>
              
              <div className="flex gap-1">
                <div className="w-1 h-1 rounded-full animate-bounce" style={{ background: currentStep.color, animationDelay: '0ms' }} />
                <div className="w-1 h-1 rounded-full animate-bounce" style={{ background: currentStep.color, animationDelay: '150ms' }} />
                <div className="w-1 h-1 rounded-full animate-bounce" style={{ background: currentStep.color, animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
