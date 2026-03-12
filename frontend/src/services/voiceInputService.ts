/**
 * Voice Input Service
 * Handles speech recognition and voice input
 */

export class VoiceInputService {
  private recognition: any = null
  private isListening: boolean = false
  private onResultCallback: ((transcript: string) => void) | null = null
  private onErrorCallback: ((error: string) => void) | null = null

  constructor() {
    this.initializeSpeechRecognition()
  }

  /**
   * Initialize Web Speech API
   */
  private initializeSpeechRecognition(): void {
    // Check browser support
    const SpeechRecognition = 
      (window as any).SpeechRecognition || 
      (window as any).webkitSpeechRecognition

    if (!SpeechRecognition) {
      console.error('Speech recognition not supported in this browser')
      return
    }

    this.recognition = new SpeechRecognition()
    this.recognition.continuous = false
    this.recognition.interimResults = true
    this.recognition.lang = 'en-US'

    // Event handlers
    this.recognition.onresult = (event: any) => {
      const results = event.results
      const lastResult = results[results.length - 1]
      const transcript = lastResult[0].transcript

      if (lastResult.isFinal && this.onResultCallback) {
        this.onResultCallback(transcript)
        console.log('Final transcript:', transcript)
      }
    }

    this.recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error)
      
      // Don't immediately set to false - wait for onend event
      // This prevents race conditions
      
      if (this.onErrorCallback) {
        let errorMessage = event.error
        
        // Provide more helpful error messages
        switch (event.error) {
          case 'network':
            errorMessage = 'Speech recognition network error. The browser\'s speech API uses Google\'s servers. Please:\n• Check your internet connection\n• Try speaking again\n• Or type your message instead'
            break
          case 'not-allowed':
            errorMessage = 'Microphone access denied. Please allow microphone permissions in your browser settings.'
            break
          case 'no-speech':
            errorMessage = 'No speech detected. Please speak clearly and try again.'
            break
          case 'aborted':
            errorMessage = 'Speech recognition stopped. Please try again.'
            break
          case 'audio-capture':
            errorMessage = 'Microphone error: No microphone found or it\'s being used by another application. Please check your microphone and try again.'
            break
          case 'service-not-allowed':
            errorMessage = 'Speech recognition service not allowed. Please use HTTPS or localhost.'
            break
          default:
            errorMessage = `Speech recognition error: ${event.error}. Please try typing your message instead.`
        }
        
        this.onErrorCallback(errorMessage)
      }
    }

    this.recognition.onend = () => {
      this.isListening = false
      console.log('Speech recognition ended')
    }
  }

  /**
   * Start listening for voice input
   */
  startListening(
    onResult: (transcript: string) => void,
    onError?: (error: string) => void
  ): void {
    if (!this.recognition) {
      const error = 'Speech recognition not available in this browser. Please type your message instead.'
      console.error(error)
      if (onError) onError(error)
      return
    }

    if (this.isListening) {
      console.warn('Already listening')
      return
    }

    // Check if online before attempting speech recognition
    if (!navigator.onLine) {
      const error = 'No internet connection detected. Speech recognition requires internet. Please check your connection or type your message.'
      console.error(error)
      if (onError) onError(error)
      return
    }

    this.onResultCallback = onResult
    this.onErrorCallback = onError || null

    try {
      this.recognition.start()
      this.isListening = true
      console.log('Started listening...')
    } catch (error: any) {
      console.error('Error starting speech recognition:', error)
      this.isListening = false
      
      // Handle specific errors
      if (error.message && error.message.includes('already started')) {
        console.warn('Recognition already started, attempting to reset...')
        this.recognition.stop()
        // Try again after a short delay
        setTimeout(() => {
          try {
            this.recognition.start()
            this.isListening = true
          } catch (retryError) {
            if (onError) onError('Failed to start voice recognition. Please try typing your message instead.')
          }
        }, 100)
      } else {
        if (onError) onError('Failed to start voice recognition. Please try typing your message instead.')
      }
    }
  }

  /**
   * Stop listening
   */
  stopListening(): void {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop()
        this.isListening = false
        console.log('Stopped listening')
      } catch (error) {
        console.error('Error stopping speech recognition:', error)
        // Force set to false even if stop fails
        this.isListening = false
      }
    }
  }

  /**
   * Check if currently listening
   */
  getIsListening(): boolean {
    return this.isListening
  }

  /**
   * Check if speech recognition is supported
   */
  isSupported(): boolean {
    const SpeechRecognition = 
      (window as any).SpeechRecognition || 
      (window as any).webkitSpeechRecognition

    return !!SpeechRecognition
  }

  /**
   * Set language for speech recognition
   */
  setLanguage(lang: string): void {
    if (this.recognition) {
      this.recognition.lang = lang
      console.log('Language set to:', lang)
    }
  }

  /**
   * Enable continuous listening
   */
  setContinuous(continuous: boolean): void {
    if (this.recognition) {
      this.recognition.continuous = continuous
    }
  }
}

export const voiceInputService = new VoiceInputService()
