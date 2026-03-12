/**
 * Text-to-Speech Service
 * Handles voice output using Web Speech API
 */

export interface VoiceOptions {
  lang?: string
  pitch?: number
  rate?: number
  volume?: number
  voice?: SpeechSynthesisVoice
}

export class TextToSpeechService {
  private synthesis: SpeechSynthesis | null = null
  private voices: SpeechSynthesisVoice[] = []
  private isSpeaking: boolean = false

  constructor() {
    this.initializeSpeechSynthesis()
  }

  /**
   * Initialize Web Speech Synthesis API
   */
  private initializeSpeechSynthesis(): void {
    if ('speechSynthesis' in window) {
      this.synthesis = window.speechSynthesis

      // Load available voices
      this.loadVoices()

      // Voices might not be loaded immediately
      if (speechSynthesis.onvoiceschanged !== undefined) {
        speechSynthesis.onvoiceschanged = () => {
          this.loadVoices()
        }
      }
    } else {
      console.error('Text-to-speech not supported in this browser')
    }
  }

  /**
   * Load available voices
   */
  private loadVoices(): void {
    if (this.synthesis) {
      this.voices = this.synthesis.getVoices()
      console.log('Loaded', this.voices.length, 'voices')
    }
  }

  /**
   * Speak text
   */
  speak(text: string, options: VoiceOptions = {}): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.synthesis) {
        reject(new Error('Text-to-speech not available'))
        return
      }

      // Cancel any ongoing speech
      this.stop()

      const utterance = new SpeechSynthesisUtterance(text)

      // Apply options
      if (options.lang) utterance.lang = options.lang
      if (options.pitch !== undefined) utterance.pitch = options.pitch
      if (options.rate !== undefined) utterance.rate = options.rate
      if (options.volume !== undefined) utterance.volume = options.volume
      if (options.voice) utterance.voice = options.voice

      // Event handlers
      utterance.onstart = () => {
        this.isSpeaking = true
        console.log('Started speaking:', text.substring(0, 50))
      }

      utterance.onend = () => {
        this.isSpeaking = false
        console.log('Finished speaking')
        resolve()
      }

      utterance.onerror = (event) => {
        this.isSpeaking = false
        console.error('Speech synthesis error:', event)
        reject(new Error(event.error))
      }

      // Start speaking
      this.synthesis.speak(utterance)
    })
  }

  /**
   * Stop speaking
   */
  stop(): void {
    if (this.synthesis && this.isSpeaking) {
      this.synthesis.cancel()
      this.isSpeaking = false
      console.log('Stopped speaking')
    }
  }

  /**
   * Pause speaking
   */
  pause(): void {
    if (this.synthesis && this.isSpeaking) {
      this.synthesis.pause()
      console.log('Paused speaking')
    }
  }

  /**
   * Resume speaking
   */
  resume(): void {
    if (this.synthesis) {
      this.synthesis.resume()
      console.log('Resumed speaking')
    }
  }

  /**
   * Check if currently speaking
   */
  getIsSpeaking(): boolean {
    return this.isSpeaking
  }

  /**
   * Check if speech synthesis is supported
   */
  isSupported(): boolean {
    return 'speechSynthesis' in window
  }

  /**
   * Get available voices
   */
  getVoices(): SpeechSynthesisVoice[] {
    if (this.voices.length === 0) {
      this.loadVoices()
    }
    return this.voices
  }

  /**
   * Get voice by name
   */
  getVoiceByName(name: string): SpeechSynthesisVoice | undefined {
    return this.voices.find(voice => voice.name === name)
  }

  /**
   * Get default voice for language
   */
  getDefaultVoice(lang: string = 'en-US'): SpeechSynthesisVoice | undefined {
    return this.voices.find(voice => voice.lang === lang && voice.default) ||
           this.voices.find(voice => voice.lang.startsWith(lang.split('-')[0]))
  }
}

export const textToSpeechService = new TextToSpeechService()
