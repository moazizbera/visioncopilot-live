/**
 * WebSocket Client Service
 * Handles real-time bidirectional communication with backend
 */

export type MessageType = 
  | 'ping' 
  | 'pong' 
  | 'text' 
  | 'image' 
  | 'audio' 
  | 'video_frame'
  | 'stream_control'
  | 'response' 
  | 'stream' 
  | 'frame_analysis'
  | 'frame_ack'
  | 'stream_status'
  | 'status' 
  | 'error'

export interface WSMessage {
  type: MessageType
  data?: any
  session_id?: string
  timestamp?: string
}

export type MessageHandler = (message: WSMessage) => void

export class WebSocketService {
  private ws: WebSocket | null = null
  private sessionId: string | null = null
  private reconnectAttempts: number = 0
  private maxReconnectAttempts: number = 5
  private reconnectDelay: number = 1000
  private messageHandlers: Map<MessageType, MessageHandler[]> = new Map()
  private isManualClose: boolean = false
  private heartbeatInterval: number | null = null
  private lastPongTime: number = Date.now()

  /**
   * Connect to WebSocket server
   */
  connect(sessionId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.sessionId = sessionId
      this.isManualClose = false

      // Determine WebSocket URL
      // In development, connect directly to backend (bypass Vite proxy for WebSocket)
      // In production, use the same host as the frontend
      const isDevelopment = import.meta.env.DEV
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      
      // Use environment variable for backend URL, fallback to localhost:8000 in development
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'localhost:8000'
      const host = isDevelopment ? backendUrl : window.location.host
      const wsUrl = `${protocol}//${host}/api/ws/${sessionId}`

      console.log('Connecting to WebSocket:', wsUrl)

      try {
        this.ws = new WebSocket(wsUrl)

        this.ws.onopen = () => {
          console.log('WebSocket connected')
          this.reconnectAttempts = 0
          this.lastPongTime = Date.now() // Reset pong timer on connection
          this.startHeartbeat()
          resolve()
        }

        this.ws.onmessage = (event) => {
          this.handleMessage(event.data)
        }

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error)
          this.emit('error', { error: 'Connection error occurred' })
          reject(error)
        }

        this.ws.onclose = (event) => {
          console.log('WebSocket closed:', event.code, event.reason)
          this.stopHeartbeat()

          // Notify UI that connection is closed
          this.emit('status', { status: 'disconnected', reason: event.reason })

          if (!this.isManualClose && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.scheduleReconnect()
          }
        }
      } catch (error) {
        console.error('Failed to create WebSocket:', error)
        reject(error)
      }
    })
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    this.isManualClose = true
    this.stopHeartbeat()

    if (this.ws) {
      this.ws.close()
      this.ws = null
    }

    this.messageHandlers.clear()
    console.log('WebSocket disconnected (manual)')
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN
  }

  /**
   * Send message to server
   */
  send(message: WSMessage): void {
    if (!this.isConnected()) {
      console.error('WebSocket not connected')
      throw new Error('WebSocket not connected')
    }

    this.ws!.send(JSON.stringify(message))
  }

  /**
   * Send text message
   */
  sendText(prompt: string, includeHistory: boolean = true, stream: boolean = false): void {
    this.send({
      type: 'text',
      data: {
        prompt,
        include_history: includeHistory,
        stream
      }
    })
  }

  /**
   * Send image for analysis
   */
  sendImage(imageBase64: string, prompt: string, imageType: string = 'unknown'): void {
    this.send({
      type: 'image',
      data: {
        image_data: imageBase64,
        prompt,
        image_type: imageType
      }
    })
  }

  /**
   * Send audio/voice message
   */
  sendAudio(transcript: string, includeHistory: boolean = true): void {
    this.send({
      type: 'audio',
      data: {
        transcript,
        include_history: includeHistory
      }
    })
  }

  /**
   * Send video frame
   */
  sendVideoFrame(frameData: string, frameType: string, analyze: boolean = false, customPrompt?: string): void {
    this.send({
      type: 'video_frame',
      data: {
        frame_data: frameData,
        frame_type: frameType,
        analyze,
        prompt: customPrompt
      }
    })
  }

  /**
   * Control streaming mode
   */
  controlStream(action: 'start' | 'stop' | 'status', mode: 'video' | 'audio' | 'screen', options?: any): void {
    this.send({
      type: 'stream_control',
      data: {
        action,
        mode,
        options
      }
    })
  }

  /**
   * Register message handler
   */
  on(messageType: MessageType, handler: MessageHandler): void {
    if (!this.messageHandlers.has(messageType)) {
      this.messageHandlers.set(messageType, [])
    }
    this.messageHandlers.get(messageType)!.push(handler)
  }

  /**
   * Unregister message handler
   */
  off(messageType: MessageType, handler: MessageHandler): void {
    const handlers = this.messageHandlers.get(messageType)
    if (handlers) {
      const index = handlers.indexOf(handler)
      if (index > -1) {
        handlers.splice(index, 1)
      }
    }
  }

  /**
   * Emit an event to handlers
   */
  private emit(messageType: MessageType, data: any): void {
    const message: WSMessage = { type: messageType, data }
    const handlers = this.messageHandlers.get(messageType)
    if (handlers) {
      handlers.forEach(handler => handler(message))
    }
  }

  /**
   * Handle incoming message
   */
  private handleMessage(data: string): void {
    try {
      const message: WSMessage = JSON.parse(data)
      
      // Update last pong time for heartbeat
      if (message.type === 'pong') {
        this.lastPongTime = Date.now()
        console.log('Received pong from server')
      }

      // Call registered handlers
      const handlers = this.messageHandlers.get(message.type)
      if (handlers) {
        handlers.forEach(handler => handler(message))
      }

      // Call wildcard handlers (listen to all messages)
      const wildcardHandlers = this.messageHandlers.get('*' as MessageType)
      if (wildcardHandlers) {
        wildcardHandlers.forEach(handler => handler(message))
      }
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error)
    }
  }

  /**
   * Schedule reconnection attempt
   */
  private scheduleReconnect(): void {
    this.reconnectAttempts++
    const delay = this.reconnectDelay * this.reconnectAttempts

    console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`)

    setTimeout(() => {
      if (this.sessionId && !this.isManualClose) {
        this.connect(this.sessionId).catch(err => {
          console.error('Reconnection failed:', err)
        })
      }
    }, delay)
  }

  /**
   * Start heartbeat to keep connection alive
   */
  private startHeartbeat(): void {
    this.stopHeartbeat()

    this.heartbeatInterval = setInterval(() => {
      if (this.isConnected()) {
        // Check if pong received recently (before sending new ping)
        const timeSinceLastPong = Date.now() - this.lastPongTime
        if (timeSinceLastPong > 35000) {
          console.warn(`No pong received for ${Math.floor(timeSinceLastPong / 1000)}s, connection may be dead`)
          this.ws?.close()
        } else {
          // Send ping only if connection is healthy
          this.send({ type: 'ping' })
        }
      }
    }, 10000) // Ping every 10 seconds
  }

  /**
   * Stop heartbeat
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
  }
}

export const webSocketService = new WebSocketService()
