# \ud83e\uddf1 Frontend Components Reference

Complete guide to VisionCopilot Live React components

---

## \ud83d\udccb Table of Contents

- [Core Components](#core-components)
- [Feature Components](#feature-components)
- [UI Components](#ui-components)
- [Contexts & Hooks](#contexts--hooks)
- [Services](#services)
- [Component Tree](#component-tree)

---

## \ud83c\udfaf Core Components

### App.tsx

**Purpose:** Main application container

**State:**
- `isConnected`: WebSocket connection status
- `sessionId`: Current session identifier
- `messages`: Chat message history
- `isStreaming`: AI response streaming state

**Key Methods:**
```typescript
handleSendMessage(content: string, images?: string[])
handleWebSocketMessage(event: MessageEvent)
```

**Usage:**
```tsx
<App />
```

---

### ModernHeader.tsx

**Purpose:** Application header with branding and theme toggle

**Props:**
```typescript
interface ModernHeaderProps {
  onThemeToggle?: () => void;
}
```

**Features:**
- App logo and title
- Theme switcher (light/dark)
- Session status indicator

---

### ChatPanel.tsx

**Purpose:** Main chat interface for messages and input

**Props:**
```typescript
interface ChatPanelProps {
  messages: Message[];
  onSendMessage: (content: string) => void;
  isStreaming: boolean;
  isConnected: boolean;
}
```

**Features:**
- Message list with auto-scroll
- Voice input integration
- Quick action buttons
- Typing indicators
- Message formatting with Markdown

**Usage:**
```tsx
<ChatPanel
  messages={messages}
  onSendMessage={handleSend}
  isStreaming={streaming}
  isConnected={connected}
/>
```

---

## \ud83c\udf1f Feature Components

### VoiceInput.tsx

**Purpose:** Voice-to-text input using Web Speech API

**Props:**
```typescript
interface VoiceInputProps {
  onTranscript: (text: string) => void;
  onError?: (error: Error) => void;
  disabled?: boolean;
}
```

**State:**
- `isListening`: Recording status
- `transcript`: Current transcription
- `interimTranscript`: Partial results

**Browser Support:**
```typescript
const isSupported = 'webkitSpeechRecognition' in window || 
                    'SpeechRecognition' in window;
```

**Usage:**
```tsx
<VoiceInput
  onTranscript={(text) => handleSend(text)}
  disabled={!isConnected}
/>
```

---

### CameraView.tsx

**Purpose:** Camera capture for multimodal AI

**Props:**
```typescript
interface CameraViewProps {
  onCapture: (imageData: string) => void;
  onError?: (error: Error) => void;
  isActive: boolean;
}
```

**Features:**
- Live camera preview
- Snapshot capture
- Auto-compression
- Permission handling

**MediaStream Configuration:**
```typescript
const constraints = {
  video: {
    width: { ideal: 1280 },
    height: { ideal: 720 },
    facingMode: 'user'
  }
};
```

**Usage:**
```tsx
<CameraView
  onCapture={(img) => handleSend('Analyze this', [img])}
  isActive={cameraActive}
/>
```

---

### ScreenCapture.tsx

**Purpose:** Screen sharing for visual context

**Props:**
```typescript
interface ScreenCaptureProps {
  onCapture: (imageData: string) => void;
  onError?: (error: Error) => void;
}
```

**Features:**
- Full screen capture
- Window/tab selection
- Automatic frame encoding

**API Used:**
```typescript
navigator.mediaDevices.getDisplayMedia({
  video: { mediaSource: 'screen' }
})
```

---

### QuickActions.tsx

**Purpose:** One-click AI workflow triggers

**Props:**
```typescript
interface QuickActionsProps {
  onAction: (prompt: string) => void;
  disabled?: boolean;
}
```

**Predefined Actions:**
```typescript
const actions = [
  { id: 'explain', label: 'Explain', prompt: 'Explain this in detail' },
  { id: 'summarize', label: 'Summarize', prompt: 'Summarize the key points' },
  { id: 'improve', label: 'Improve', prompt: 'How can this be improved?' },
  { id: 'debug', label: 'Debug', prompt: 'Help me debug this issue' }
];
```

---

## \ud83c\udfa8 UI Components

### ThinkingIndicator.tsx

**Purpose:** Visual feedback during AI processing

**Props:**
```typescript
interface ThinkingIndicatorProps {
  isVisible: boolean;
  message?: string;
}
```

**Animation:**
- Pulsing dots
- Custom message support
- Smooth fade in/out

---

### StatusIndicators.tsx

**Purpose:** Connection and activity status

**Props:**
```typescript
interface StatusIndicatorsProps {
  isConnected: boolean;
  isStreaming: boolean;
  sessionId?: string;
}
```

**States:**
- \ud83d\udfe2 Connected (green)
- \ud83d\udd34 Disconnected (red)
- \ud83d\udfe1 Streaming (pulsing yellow)

---

### ConnectionStatus.tsx

**Purpose:** Detailed connection information

**Props:**
```typescript
interface ConnectionStatusProps {
  status: 'connected' | 'disconnected' | 'connecting';
  latency?: number;
  onReconnect?: () => void;
}
```

**Features:**
-  Status badge with indicator
- Latency display
- Reconnect button
- Last connected timestamp

---

### ErrorDisplay.tsx

**Purpose:** User-friendly error messages

**Props:**
```typescript
interface ErrorDisplayProps {
  error: Error | string;
  onDismiss?: () => void;
  action?: {
    label: string;
    onClick: () => void;
  };
}
```

**Error Types:**
- Network errors (with retry)
- Permission errors (with guide)
- API errors (with details)
- Validation errors

---

### ErrorBoundary.tsx

**Purpose:** React error boundary for crash recovery

**Props:**
```typescript
interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}
```

**Features:**
- Catches React rendering errors
- Display fallback UI
- Error logging
- Auto-recovery option

**Usage:**
```tsx
<ErrorBoundary fallback={<ErrorPage />}>
  <App />
</ErrorBoundary>
```

---

### ThemeSwitcher.tsx

**Purpose:** Dark/light mode toggle

**Features:**
- Persists preference to localStorage
- Smooth transition animation
- System preference detection

**Implementation:**
```typescript
const [theme, setTheme] = useState<'light' | 'dark'>(
  () => localStorage.getItem('theme') || 
        (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
);
```

---

## \ud83d\udd0c Contexts & Hooks

### ThemeContext.tsx

**Purpose:** Global theme state management

```typescript
interface ThemeContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
};
```

**Usage:**
```tsx
function MyComponent() {
  const { theme, toggleTheme } = useTheme();
  return <button onClick={toggleTheme}>Toggle to {theme === 'light' ? 'dark' : 'light'}</button>;
}
```

---

### Custom Hooks

#### useWebSocket

**Purpose:** WebSocket connection management

```typescript
function useWebSocket(url: string, sessionId: string) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<any>(null);
  
  // ... WebSocket logic
  
  return { isConnected, lastMessage, sendMessage };
}
```

#### useVoiceRecognition

**Purpose:** Speech-to-text functionality

```typescript
function useVoiceRecognition() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  
  // ... Web Speech API logic
  
  return { isListening, transcript, startListening, stopListening };
}
```

---

## \ud83d\udee0\ufe0f Services

### webSocketService.ts

**Purpose:** WebSocket communication layer

**Methods:**
```typescript
class WebSocketService {
  connect(sessionId: string): Promise<void>
  disconnect(): void
  sendMessage(message: any): void
  onMessage(callback: (data: any) => void): void
  onError(callback: (error: Error) => void): void
}
```

**Message Format:**
```typescript
interface WebSocketMessage {
  type: 'text' | 'multimodal' | 'voice';
  content: string;
  images?: string[];
  session_id: string;
}
```

---

### voiceInputService.ts

**Purpose:** Voice recognition wrapper

**Methods:**
```typescript
class VoiceInputService {
  start(): Promise<void>
  stop(): void
  onResult(callback: (transcript: string) => void): void
  onError(callback: (error: Error) => void): void
}
```

---

### screenCaptureService.ts

**Purpose:** Screen/window capture utility

**Methods:**
```typescript
class ScreenCaptureService {
  async captureScreen(): Promise<string>  // Returns base64
  async stopCapture(): Promise<void>
}
```

---

### cameraService.ts

**Purpose:** Camera access and capture

**Methods:**
```typescript
class CameraService {
  async startCamera(constraints?: MediaStreamConstraints): Promise<MediaStream>
  async captureFrame(video: HTMLVideoElement): Promise<string>
  stopCamera(stream: MediaStream): void
}
```

---

### textToSpeechService.ts

**Purpose:** AI response audio playback

**Methods:**
```typescript
class TextToSpeechService {
  speak(text: string, options?: SpeechSynthesisOptions): void
  stop(): void
  pause(): void
  resume(): void
}
```

---

## \ud83c\udf33 Component Tree

```
App.tsx
\u251c\u2500\u2500 ErrorBoundary.tsx
\u2502   \u2514\u2500\u2500 ThemeProvider
\u2502       \u251c\u2500\u2500 ModernHeader.tsx
\u2502       \u2502   \u2514\u2500\u2500 ThemeSwitcher.tsx
\u2502       \u251c\u2500\u2500 StatusIndicators.tsx
\u2502       \u2502   \u251c\u2500\u2500 ConnectionStatus.tsx
\u2502       \u2502   \u2514\u2500\u2500 StatusPanel.tsx
\u2502       \u251c\u2500\u2500 ChatPanel.tsx
\u2502       \u2502   \u251c\u2500\u2500 VoiceInput.tsx
\u2502       \u2502   \u251c\u2500\u2500 QuickActions.tsx
\u2502       \u2502   \u251c\u2500\u2500 ThinkingIndicator.tsx
\u2502       \u2502   \u2514\u2500\u2500 MessageList
\u2502       \u251c\u2500\u2500 ControlPanel.tsx
\u2502       \u2502   \u251c\u2500\u2500 CameraView.tsx
\u2502       \u2502   \u251c\u2500\u2500 ScreenCapture.tsx
\u2502       \u2502   \u2514\u2500\u2500 StreamingControls.tsx
\u2502       \u2514\u2500\u2500 ErrorDisplay.tsx
\u2514\u2500\u2500 Services (injected)
    \u251c\u2500\u2500 webSocketService
    \u251c\u2500\u2500 voiceInputService
    \u251c\u2500\u2500 screenCaptureService
    \u251c\u2500\u2500 cameraService
    \u2514\u2500\u2500 textToSpeechService
```

---

## \ud83d\udcdd Type Definitions

Complete TypeScript interfaces in `frontend/src/types/index.ts`:

```typescript
// Message types
export interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: number;
  images?: string[];
  metadata?: {
    latency?: number;
    tokens?: number;
  };
}

// Session types
export interface Session {
  id: string;
  created_at: string;
  last_activity: string;
  message_count: number;
}

// WebSocket message types
export interface WSMessage {
  type: 'text' | 'multimodal' | 'voice' | 'error';
  content: string;
  session_id: string;
  images?: string[];
  metadata?: Record<string, any>;
}

// Component prop types
export interface BaseComponentProps {
  className?: string;
  disabled?: boolean;
}
```

---

## \ud83d\udee0\ufe0f Development Guidelines

### Component Best Practices

1. **Prop Validation:** Use TypeScript interfaces
2. **Error Handling:** Wrap async code in try-catch
3. **Accessibility:** Add ARIA labels
4. **Performance:** Use React.memo for expensive components
5. **Testing:** Write unit tests for logic

### Example Component Template

```tsx
import React, { useState, useEffect } from 'react';

interface MyComponentProps {
  title: string;
  onAction: (data: string) => void;
  disabled?: boolean;
}

export const MyComponent: React.FC<MyComponentProps> = ({ 
  title, 
  onAction, 
  disabled = false 
}) => {
  const [state, setState] = useState('');

  useEffect(() => {
    // Side effects
    return () => {
      // Cleanup
    };
  }, []);

  const handleClick = () => {
    try {
      onAction(state);
    } catch (error) {
      console.error('Error in MyComponent:', error);
    }
  };

  return (
    <div className="my-component">
      <h2>{title}</h2>
      <button 
        onClick={handleClick}
        disabled={disabled}
        aria-label="Perform action"
      >
        Action
      </button>
    </div>
  );
};
```

---

## \ud83e\uddea Testing Components

### Unit Test Example

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { VoiceInput } from './VoiceInput';

describe('VoiceInput', () => {
  it('renders microphone button', () => {
    render(<VoiceInput onTranscript={jest.fn()} />);
    expect(screen.getByLabelText(/microphone/i)).toBeInTheDocument();
  });

  it('calls onTranscript when speech detected', async () => {
    const handleTranscript = jest.fn();
    render(<VoiceInput onTranscript={handleTranscript} />);
    
    // ... test logic
    
    expect(handleTranscript).toHaveBeenCalledWith('test transcript');
  });
});
```

---

## \ud83d\udcda Additional Resources

- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [TailwindCSS Docs](https://tailwindcss.com/docs)
- [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)
- [WebRTC API](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API)

---

**Need component help?** [Open a discussion](https://github.com/moazizbera/visioncopilot-live/discussions)
