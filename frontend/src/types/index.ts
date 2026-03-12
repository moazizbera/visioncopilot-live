// TypeScript type definitions

export interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface Session {
  id: string;
  createdAt: Date;
  active: boolean;
}

export interface MediaConfig {
  video: boolean;
  audio: boolean;
  screen: boolean;
}
