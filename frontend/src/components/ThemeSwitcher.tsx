import { useState } from 'react'
import { useTheme } from '../contexts/ThemeContext'

export function ThemeSwitcher() {
  const { theme, themeName, setTheme, allThemes } = useTheme()
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="relative">
      {/* Theme Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2.5 rounded-xl transition-all duration-200 hover:scale-110"
        style={{
          background: theme.accentGradient,
          boxShadow: `0 4px 12px ${theme.panelShadow}`
        }}
        title="Change Theme"
      >
        <div className="flex items-center gap-2 text-white">
          <span className="text-lg">{theme.emoji}</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Theme Picker Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown Menu */}
          <div 
            className="absolute right-0 mt-2 w-72 rounded-2xl overflow-hidden z-50 shadow-2xl border-2 transition-all duration-300 animate-slideDown"
            style={{
              background: theme.panelBg,
              borderColor: theme.panelBorder,
              boxShadow: `0 20px 40px ${theme.panelShadow}`
            }}
          >
            {/* Header */}
            <div 
              className="px-4 py-3 border-b"
              style={{ borderColor: theme.panelBorder }}
            >
              <h3 
                className="font-bold text-sm flex items-center gap-2"
                style={{ color: theme.textPrimary }}
              >
                <span>🎨</span>
                <span>Choose Your Theme</span>
              </h3>
            </div>

            {/* Theme Grid */}
            <div className="p-3 grid grid-cols-2 gap-2 max-h-96 overflow-y-auto">
              {allThemes.map((t) => {
                const isActive = t.name === themeName
                
                return (
                  <button
                    key={t.name}
                    onClick={() => {
                      setTheme(t.name)
                      setIsOpen(false)
                    }}
                    className="relative p-3 rounded-xl transition-all duration-200 hover:scale-105 group"
                    style={{
                      background: isActive ? t.accentGradient : t.bgSecondary,
                      border: `2px solid ${isActive ? 'transparent' : t.panelBorder}`,
                      boxShadow: isActive ? `0 4px 12px ${t.panelShadow}` : 'none'
                    }}
                  >
                    {/* Theme Preview */}
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-2xl">{t.emoji}</span>
                      <span 
                        className="text-sm font-semibold"
                        style={{ 
                          color: isActive ? '#ffffff' : t.textPrimary 
                        }}
                      >
                        {t.displayName}
                      </span>
                    </div>

                    {/* Color Preview Dots */}
                    <div className="flex items-center justify-center gap-1 mt-2">
                      <div 
                        className="w-2 h-2 rounded-full"
                        style={{ background: t.accentPrimary }}
                      />
                      <div 
                        className="w-2 h-2 rounded-full"
                        style={{ background: t.accentSecondary }}
                      />
                      <div 
                        className="w-2 h-2 rounded-full"
                        style={{ background: t.success }}
                      />
                    </div>

                    {/* Active Indicator */}
                    {isActive && (
                      <div className="absolute top-2 right-2">
                        <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center">
                          <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                    )}
                  </button>
                )
              })}
            </div>

            {/* Footer */}
            <div 
              className="px-4 py-2 border-t text-center"
              style={{ 
                borderColor: theme.panelBorder,
                background: theme.bgSecondary 
              }}
            >
              <p 
                className="text-xs"
                style={{ color: theme.textTertiary }}
              >
                {allThemes.length} beautiful themes available
              </p>
            </div>
          </div>
        </>
      )}

      <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-slideDown {
          animation: slideDown 0.2s ease-out;
        }
      `}</style>
    </div>
  )
}
