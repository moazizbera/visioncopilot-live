import { useState, useEffect, useRef } from 'react'
import { voiceInputService } from '../services/voiceInputService'

interface VoiceInputProps {
  onTranscript?: (text: string) => void
  onSend?: (text: string) => void
  className?: string
}

export function VoiceInput({ onTranscript, onSend, className = '' }: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSupported, setIsSupported] = useState(true)
  const [manualMode, setManualMode] = useState(false)
  
  // Track listening state for cleanup (avoid stale closure)
  const isListeningRef = useRef(isListening)
  // Store latest transcript in ref to avoid stale state in callbacks
  const transcriptRef = useRef(transcript)

  // Sync ref with state
  useEffect(() => {
    isListeningRef.current = isListening
  }, [isListening])

  // Sync transcript ref with state
  useEffect(() => {
    transcriptRef.current = transcript
  }, [transcript])

  useEffect(() => {
    // Check browser support
    setIsSupported(voiceInputService.isSupported())

    return () => {
      // Cleanup: stop listening on unmount (use ref to avoid stale closure)
      if (isListeningRef.current) {
        voiceInputService.stopListening()
      }
    }
  }, [])

  const handleStartListening = () => {
    setError(null)
    setTranscript('')

    voiceInputService.startListening(
      (text: string) => {
        setTranscript(text)
        transcriptRef.current = text // Update ref immediately
        if (onTranscript) {
          onTranscript(text)
        }
      },
      (err: string) => {
        setError(err)
        setIsListening(false)
      }
    )

    setIsListening(true)
  }

  const handleStopListening = () => {
    const finalTranscript = transcriptRef.current // Use ref value to avoid stale state
    voiceInputService.stopListening()
    setIsListening(false)

    // Send transcript if available (use ref value)
    if (finalTranscript && finalTranscript.trim() && onSend) {
      console.log('Sending voice transcript:', finalTranscript)
      onSend(finalTranscript)
      setTranscript('') // Clear after sending
    }
  }

  const handleClear = () => {
    setTranscript('')
    setError(null)
  }

  const handleSend = () => {
    if (transcript && onSend) {
      onSend(transcript)
      setTranscript('')
    }
  }

  if (!isSupported) {
    return (
      <div className={`voice-input ${className}`}>
        <div className="p-4 bg-yellow-100 border border-yellow-400 text-yellow-800 rounded">
          ⚠️ Voice input is not supported in your browser. Please use Chrome, Edge, or Safari.
        </div>
      </div>
    )
  }

  return (
    <div className={`voice-input ${className}`}>
      <div className="space-y-4">
        {/* Mode Toggle */}
        {error && (
          <div className="flex justify-center gap-2 p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <button
              onClick={() => setManualMode(false)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                !manualMode
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300'
              }`}
            >
              🎤 Voice Mode
            </button>
            <button
              onClick={() => { setManualMode(true); setError(null); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                manualMode
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300'
              }`}
            >
              ⌨️ Type Mode
            </button>
          </div>
        )}

        {/* Manual Input Mode */}
        {manualMode ? (
          <div className="space-y-4">
            <div className="text-center py-4">
              <span className="text-6xl">⌨️</span>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Voice recognition unavailable. Type your message below:
              </p>
            </div>
            <textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="Type your message here..."
              className="w-full h-32 p-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleSend}
              disabled={!transcript.trim()}
              className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              📤 Send Message
            </button>
          </div>
        ) : (
          <>
        {/* Listening Status */}
        <div className="flex items-center justify-center">\n          <div
            className={`w-32 h-32 rounded-full flex items-center justify-center transition-all ${
              isListening
                ? 'bg-red-500 animate-pulse shadow-lg shadow-red-500/50'
                : 'bg-blue-500 hover:bg-blue-600 cursor-pointer'
            }`}
            onClick={isListening ? handleStopListening : handleStartListening}
          >
            {isListening ? (
              <div className="text-center text-white">
                <div className="text-4xl mb-1">🎤</div>
                <div className="text-sm font-medium">Listening...</div>
              </div>
            ) : (
              <div className="text-center text-white">
                <div className="text-4xl mb-1">🎙️</div>
                <div className="text-sm font-medium">Click to speak</div>
              </div>
            )}
          </div>
        </div>

        {/* Transcript Display */}
        {transcript && (
          <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
            <div className="flex items-start justify-between mb-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Transcript
              </label>
              <button
                onClick={handleClear}
                className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                Clear
              </button>
            </div>
            <p className="text-gray-800 dark:text-gray-200">{transcript}</p>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded-lg">
            <div className="flex items-start gap-2">
              <span className="text-xl">⚠️</span>
              <div className="flex-1">
                <p className="font-semibold text-red-800 dark:text-red-300 mb-1">Voice Input Error</p>
                <p className="text-sm text-red-700 dark:text-red-400 whitespace-pre-line">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="flex gap-2">
          {!isListening ? (
            <>
              <button
                onClick={handleStartListening}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
              >
                🎤 Start Voice Input
              </button>
              {transcript && (
                <button
                  onClick={handleSend}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
                >
                  Send
                </button>
              )}
            </>
          ) : (
            <button
              onClick={handleStopListening}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
            >
              ⏹️ Stop Listening
            </button>
          )}
        </div>

        {/* Instructions */}
        <div className="text-xs text-gray-500 dark:text-gray-400 text-center space-y-1">
          <p>
            {isListening
              ? 'Speak clearly into your microphone. Click stop when done.'
              : 'Click the microphone or button to start voice input'}
          </p>
          {!isListening && (
            <p className="text-xs text-gray-400 dark:text-gray-500">
              💡 Voice recognition requires internet connection
            </p>
          )}
        </div>
        </>
        )}
      </div>
    </div>
  )
}
