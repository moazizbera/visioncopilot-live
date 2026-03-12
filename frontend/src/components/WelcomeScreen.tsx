import { useState } from 'react'
import { useTheme } from '../contexts/ThemeContext'

interface WelcomeScreenProps {
  onStart: () => void
  onSamplePrompt?: (prompt: string) => void
  isInitializing?: boolean
}

export const WelcomeScreen = ({ onStart, onSamplePrompt, isInitializing = false }: WelcomeScreenProps) => {
  const { theme } = useTheme()
  const [showFeatures, setShowFeatures] = useState(false)

  const samplePrompts = [
    { icon: '📷', text: 'Describe what you see in the camera', category: 'Camera' },
    { icon: '🖥️', text: 'Help me understand this screen', category: 'Screen' },
    { icon: '🔍', text: 'Explain this object in detail', category: 'Analysis' },
  ]

  const handleSampleClick = (prompt: string) => {
    if (onSamplePrompt) {
      onSamplePrompt(prompt)
    }
    onStart()
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 transition-colors" style={{ background: theme.bgPrimary }}>
      <div className="max-w-4xl w-full">
        {/* Main Welcome Card */}
        <div className="rounded-2xl shadow-2xl p-8 md:p-12 mb-6" style={{ background: theme.panelBg }}>
          {/* Logo/Icon */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-4 shadow-lg" style={{ background: theme.accentGradient }}>
              <span className="text-4xl">🚀</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-4" style={{ color: theme.textPrimary }}>
              VisionCopilot Live
            </h1>
            <p className="text-xl max-w-2xl mx-auto" style={{ color: theme.textSecondary }}>
              Your Multimodal AI Assistant with Real-Time Vision, Voice, and Screen Understanding
            </p>
          </div>

          {/* Feature Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <div className="flex items-start gap-3 p-4 rounded-lg" style={{ background: theme.bgSecondary }}>
              <span className="text-2xl">💬</span>
              <div>
                <h3 className="font-semibold mb-1" style={{ color: theme.textPrimary }}>
                  Intelligent Chat
                </h3>
                <p className="text-sm" style={{ color: theme.textSecondary }}>
                  Text and voice conversations powered by Gemini AI
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-lg" style={{ background: theme.bgSecondary }}>
              <span className="text-2xl">📷</span>
              <div>
                <h3 className="font-semibold mb-1" style={{ color: theme.textPrimary }}>
                  Camera Vision
                </h3>
                <p className="text-sm" style={{ color: theme.textSecondary }}>
                  Analyze what you show through your camera in real-time
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-lg" style={{ background: theme.bgSecondary }}>
              <span className="text-2xl">🖥️</span>
              <div>
                <h3 className="font-semibold mb-1" style={{ color: theme.textPrimary }}>
                  Screen Sharing
                </h3>
                <p className="text-sm" style={{ color: theme.textSecondary }}>
                  Share your screen and get AI insights on what you're viewing
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-lg" style={{ background: theme.bgSecondary }}>
              <span className="text-2xl">📡</span>
              <div>
                <h3 className="font-semibold mb-1" style={{ color: theme.textPrimary }}>
                  Live Streaming
                </h3>
                <p className="text-sm" style={{ color: theme.textSecondary }}>
                  Continuous frame analysis for real-time interactions
                </p>
              </div>
            </div>
          </div>

          {/* Sample Prompts */}
          {onSamplePrompt && (
            <div className="mb-6 rounded-lg p-5" style={{ background: theme.bgSecondary }}>
              <h3 className="text-center text-sm font-semibold mb-3" style={{ color: theme.textPrimary }}>
                ✨ Try asking:
              </h3>
              <div className="flex flex-col sm:flex-row gap-2 justify-center">
                {samplePrompts.map((prompt, index) => (
                  <button
                    key={index}
                    onClick={() => handleSampleClick(prompt.text)}
                    disabled={isInitializing}
                    className="px-4 py-2.5 rounded-lg shadow-sm hover:shadow-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 justify-center transition"
                    style={{ 
                      background: theme.panelBg, 
                      color: theme.textPrimary,
                      borderWidth: '1px',
                      borderStyle: 'solid',
                      borderColor: theme.panelBorder
                    }}
                  >
                    <span>{prompt.icon}</span>
                    <span className="hidden sm:inline">{prompt.text}</span>
                    <span className="sm:hidden">{prompt.category}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Call to Action */}
          <div className="text-center space-y-4">
            <button
              onClick={onStart}
              disabled={isInitializing}
              className="px-8 py-4 text-lg font-semibold rounded-lg shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95 transition-all text-white"
              style={{ background: theme.accentGradient }}
            >
              {isInitializing ? (
                <span className="flex items-center gap-3">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Initializing Session...
                </span>
              ) : (
                'Start Experience'
              )}
            </button>

            <button
              onClick={() => setShowFeatures(!showFeatures)}
              className="block mx-auto text-sm transition"
              style={{ color: theme.textSecondary }}
            >
              {showFeatures ? 'Hide' : 'Show'} Technical Details →
            </button>
          </div>
        </div>

        {/* Technical Details (Collapsible) */}
        {showFeatures && (
          <div className="rounded-xl shadow-lg p-6 animate-fadeIn" style={{ background: theme.panelBg }}>
            <h3 className="text-lg font-semibold mb-4" style={{ color: theme.textPrimary }}>
              🔧 Technical Details
            </h3>
            <div className="space-y-3 text-sm" style={{ color: theme.textSecondary }}>
              <div className="flex items-start gap-2">
                <span className="text-green-500">✓</span>
                <span><strong>Frontend:</strong> React + TypeScript + TailwindCSS</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-500">✓</span>
                <span><strong>Backend:</strong> Python FastAPI with WebSocket support</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-500">✓</span>
                <span><strong>AI Model:</strong> Google Gemini (multimodal capabilities)</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-500">✓</span>
                <span><strong>Features:</strong> Real-time vision, streaming, voice, and text chat</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
