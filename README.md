<div align="center">

# 🎯 VisionCopilot Live

### Real-Time Multimodal AI Copilot with Vision, Voice, and Screen Understanding

[![Gemini Live Agent Challenge](https://img.shields.io/badge/Gemini%20Live%20Agent-Challenge-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev/competition)
[![Built with Gemini](https://img.shields.io/badge/Built%20with-Gemini%202.5%20Flash-34A853?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

**VisionCopilot Live transforms AI from passive Q&A into active real-time collaboration.**  
*Built for the Google Gemini Live Agent Challenge*

[🎬 Watch Demo](#-demo) • [🚀 Quick Start](#-quick-start-30-seconds) • [📖 Documentation](docs/) • [🏗️ Architecture](#-architecture)

---

</div>

## 📋 Table of Contents

- [Overview](#-overview)
- [30-Second Quick Start](#-quick-start-30-seconds)
- [Demo](#-demo)
- [Why Gemini?](#-why-gemini)
- [Key Features](#-key-features)
- [Technology Stack](#-technology-stack)
- [Architecture](#-architecture)
- [Setup & Installation](#-setup--installation)
- [Use Cases](#-use-cases)

---

## 🌟 Overview

**The Problem:** Traditional AI assistants are limited to text-based interactions, missing the rich context of what users are seeing and doing in real-time.

**Our Solution:** VisionCopilot Live enables true multimodal human-AI collaboration by combining:

| Traditional AI | VisionCopilot Live |
|---------------|-------------------|
| 📝 Text-only input | 🎤 Voice + 👁️ Vision + 💬 Text |
| ⏸️ Static responses | ⚡ Real-time streaming |
| 🤔 No visual context | 🖥️ Screen & camera understanding |
| 💬 Chat interface | 🤝 Active collaboration |

**Impact:** Transform workflows in coding, learning, document analysis, and creative tasks by giving AI the same visual context humans have.

**Impact:** Transform workflows in coding, learning, document analysis, and creative tasks by giving AI the same visual context humans have.

---

## ⚡ Quick Start (30 Seconds)

**For Judges & Reviewers:** Test VisionCopilot Live in under a minute:

```bash
# 1. Clone and navigate
git clone https://github.com/moazizbera/visioncopilot-live && cd visioncopilot-live

# 2. Setup backend (one terminal)
cd backend && cp .env.example .env
# Add your GEMINI_API_KEY to .env (get free key: https://makersuite.google.com/app/apikey)
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# 3. Setup frontend (new terminal)
cd frontend && npm install && npm run dev
# Open http://localhost:5173
```

**Try These Demo Flows:**

| Flow | Steps | Expected Result |
|------|-------|----------------|
| **Voice Chat** | Click microphone → Say "Hello, what can you help me with?" | AI responds with voice transcription and helpful response |
| **Screen Analysis** | Click "Screen" → Share screen → Ask "What do you see?" | AI describes your screen content in detail |
| **Camera Vision** | Click "Camera" → Allow camera → Ask "Analyze this image" | AI analyzes what your camera sees |

**Key Files to Review:**
- `backend/app/main.py` - FastAPI application with startup validation
- `frontend/src/App.tsx` - React app with WebSocket integration
- `ai/gemini_client.py` - Gemini 2.5 Flash integration

---

## 🎬 Demo

## 🎬 Demo

### Video Demonstrations

| Main Demo (2 min) | Extended Demo (5 min) |
|-------------------|----------------------|
| [![Watch Main Demo](docs/demo_thumbnail_main.png)](docs/demo_video_main.mp4) | [![Watch Extended Demo](docs/demo_thumbnail_extended.png)](docs/demo_video_extended.mp4) |
| Voice + Screen analysis | Full feature walkthrough |

### Interface Screenshots

<div align="center">

| 🎤 Voice Interaction | 🖥️ Screen Analysis | 💬 AI Response |
|:-------------------:|:-----------------:|:-------------:|
| ![Voice Input](docs/voice.jpeg) | ![Screen Capture](docs/screen.jpeg) | ![AI Response](docs/response.jpeg) |
| Real-time voice transcription | Live screen sharing with AI | Streaming multimodal responses |

</div>

**Demo Highlights:**
- ✅ Real-time voice transcription using Web Speech API
- ✅ Live screen/camera capture with WebRTC
- ✅ Streaming AI responses via WebSocket
- ✅ Session memory across multiple interactions
- ✅ Quick-action prompts for common workflows

---

## 🤖 Why Gemini?

VisionCopilot Live is built specifically to showcase **Gemini 2.5 Flash's unique multimodal capabilities**:

### Technical Advantages

| Feature | Why It Matters | How We Use It |
|---------|---------------|---------------|
| **Multimodal Understanding** | Processes text + images simultaneously | Stream camera/screen frames with text prompts for context-aware responses |
| **Low Latency** | Essential for real-time collaboration | Gemini 2.5 Flash provides sub-second response times for interactive UX |
| **Large Context Window** | Maintains conversation history | Store 10+ message history for coherent multi-turn conversations |
| **Vision Capabilities** | Understands complex visual scenes | Analyze code screenshots, documents, diagrams in real-time |
| **Streaming Support** | Progressive response delivery | Stream tokens as they're generated for responsive feel |

### Gemini Integration Architecture

```python
# Core implementation: ai/gemini_client.py
model = genai.GenerativeModel('models/gemini-2.5-flash')

# Multimodal prompt combining vision + text
async def generate_multimodal(prompt: str, images: List[bytes]):
    content = [prompt]
    for img in images:
        content.append(PIL.Image.open(io.BytesIO(img)))
    
    response = await model.generate_content_async(content)
    return response.text
```

### What Makes This Different

**Other AI assistants:** Upload image → Wait → Get response → Repeat

**VisionCopilot + Gemini:** Continuous visual stream → Real-time reasoning → Collaborative feedback loop

**Result:** AI copilot that "sees" your workflow and provides contextual guidance as you work.

---

## 🚀 Key Features

### Core Capabilities

| Feature | Description | Use Case |
|---------|-------------|----------|
| 🎤 **Voice Interaction** | Hands-free AI conversation with speech-to-text | Coding while explaining your thought process |
| 👁️ **Visual Understanding** | Real-time screen and camera analysis | Debug code by showing AI the error on screen |
| ⚡ **Streaming Responses** | Token-by-token AI output via WebSocket | Responsive UX with progressive answers |
| 💾 **Session Memory** | Conversation context persists across interactions | Multi-turn problem solving with context |
| 🎯 **Quick Actions** | One-click AI workflows | "Explain this", "Summarize conversation", "Next steps" |
| 📊 **Smart Summaries** | Structured session analysis | Extract key decisions and action items |

### Technical Highlights

- **WebSocket Architecture:** Bi-directional real-time communication
- **Multimodal Streaming:** Combine voice, vision, text in a single prompt
- **Session Management:** Server-side session lifecycle with automatic cleanup
- **Error Handling:** Graceful fallbacks for network, API, and permission errors
- **Responsive UI:** Mobile-friendly interface with dark mode support

---

## 🧠 Technology Stack

### Complete Tech Overview

<table>
<tr>
<th>Layer</th>
<th>Technologies</th>
<th>Purpose</th>
</tr>
<tr>
<td><strong>Frontend</strong></td>
<td>
React 18 • TypeScript • Vite<br/>
TailwindCSS • WebRTC • Web Speech API
</td>
<td>Interactive UI with real-time media capture</td>
</tr>
<tr>
<td><strong>Backend</strong></td>
<td>
Python 3.11 • FastAPI • WebSockets<br/>
Uvicorn • Pydantic • AsyncIO
</td>
<td>API orchestration and real-time communication</td>
</tr>
<tr>
<td><strong>AI Layer</strong></td>
<td>
Google Gemini 2.5 Flash<br/>
GenAI SDK • PIL • Base64 encoding
</td>
<td>Multimodal reasoning and response generation</td>
</tr>
<tr>
<td><strong>Infrastructure</strong></td>
<td>
Docker • Docker Compose<br/>
Google Cloud Run • Nginx
</td>
<td>Containerization and cloud deployment</td>
</tr>
<tr>
<td><strong>Development</strong></td>
<td>
Git • GitHub • ESLint<br/>
VS Code • Chrome DevTools
</td>
<td>Version control and development tooling</td>
</tr>
</table>

### Why This Stack?

- **React + TypeScript:** Type-safe, component-based UI for complex state management
- **FastAPI:** High-performance async Python framework with automatic OpenAPI docs
- **WebSockets:** Essential for real-time bi-directional streaming
- **Gemini 2.5 Flash:** Best-in-class multimodal AI with low latency
- **Docker:** Reproducible deployments across environments

---

## 🏗 Architecture

### System Overview

VisionCopilot Live follows a **three-tier architecture** optimized for real-time multimodal AI:

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React)                         │
│  ┌──────────┐  ┌──────────┐  ┌────────────┐  ┌──────────┐ │
│  │  Voice   │  │  Camera  │  │   Screen   │  │   Chat   │ │
│  │  Input   │  │  Capture │  │   Share    │  │  Panel   │ │
│  └────┬─────┘  └────┬─────┘  └─────┬──────┘  └────┬─────┘ │
│       │             │               │              │        │
│       └─────────────┴───────────────┴──────────────┘        │
│                          │                                   │
│                    WebSocket Client                          │
└───────────────────────────┼─────────────────────────────────┘
                            │ WSS/HTTPS
┌───────────────────────────┼─────────────────────────────────┐
│                    Backend (FastAPI)                         │
│  ┌──────────────────────────────────────────────────────┐   │
│  │            WebSocket Gateway                         │   │
│  │  • Connection management  • Message routing          │   │
│  │  • Session binding        • Real-time streaming      │   │
│  └─────────────────┬────────────────────────────────────┘   │
│                    │                                         │
│  ┌────────────┬────┴──────┬──────────────┬──────────────┐  │
│  │  Session   │   Vision  │     Chat     │   Health     │  │
│  │  Manager   │   API     │     API      │   Check      │  │
│  └─────┬──────┴───────┬───┴──────────────┴──────────────┘  │
│        │              │                                      │
└────────┼──────────────┼──────────────────────────────────────┘
         │              │
┌────────┼──────────────┼──────────────────────────────────────┐
│        │     AI Layer (Gemini)                │              │
│  ┌─────┴──────┐  ┌────┴─────────┐  ┌────────┴──────────┐   │
│  │  Session   │  │  Multimodal  │  │    Response       │   │
│  │  Context   │  │  Processing  │  │    Streaming      │   │
│  └────────────┘  └──────────────┘  └───────────────────┘   │
│                   Gemini 2.5 Flash API                       │
└──────────────────────────────────────────────────────────────┘
```

### Data Flow

**1. User Interaction**
```
User → Voice/Camera/Screen → Frontend Capture → Base64 Encoding
```

**2. WebSocket Communication**
```
Frontend → WSS://backend/ws/{session_id} → Backend Router
```

**3. AI Processing**
```
Backend → Gemini API (text + images) → Streaming Response
```

**4. Real-Time Response**
```
Gemini → Backend Buffer → WebSocket Stream → Frontend Display
```

### Key Components

| Component | Responsibility | Technology |
|-----------|---------------|------------|
| **ModernHeader** | App branding, theme switcher | React, TailwindCSS |
| **ChatPanel** | Message display, voice input | React, Web Speech API |
| **ControlPanel** | Camera/screen controls | WebRTC, MediaStream API |
| **StatusPanel** | Connection & activity indicators | WebSocket events |
| **WebSocket Gateway** | Real-time message routing | FastAPI WebSocket |
| **Session Manager** | Session lifecycle & cleanup | Python AsyncIO |
| **Gemini Client** | AI API integration | Google GenAI SDK |
| **Vision API** | Image processing | PIL, Base64 |

**📖 Detailed Architecture:** See [docs/architecture.md](docs/architecture.md) for in-depth technical documentation.

---

## 🛠 Setup & Installation

### Prerequisites

| Requirement | Version | Purpose |
|------------|---------|---------|
| Python | 3.11+ | Backend runtime |
| Node.js | 18+ | Frontend build |
| npm | 9+ | Package management |
| Gemini API Key | Free tier | AI capabilities |

### Installation Steps

#### 1. Get Gemini API Key

🔑 **Get your free API key:** [Google AI Studio](https://makersuite.google.com/app/apikey)

#### 2. Backend Setup

```bash
# Navigate to backend
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env and add: GEMINI_API_KEY=your_key_here

# Start backend server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

✅ **Backend ready at:** `http://localhost:8000`  
📖 **API Docs:** `http://localhost:8000/docs`

#### 3. Frontend Setup

```bash
# Navigate to frontend (new terminal)
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

✅ **Frontend ready at:** `http://localhost:5173`

#### 4. Docker Setup (Alternative)

```bash
# Build and run with Docker Compose
docker-compose up --build

# Access application
# Frontend: http://localhost:5173
# Backend: http://localhost:8000
```

### Verification

Test your setup:

```bash
# Backend health check
curl http://localhost:8000/health

# Expected response:
# {"status":"ok"}

# WebSocket test
# Open browser console at http://localhost:5173
# Check for: "WebSocket connected"
```

### Troubleshooting

| Issue | Solution |
|-------|----------|
| `GEMINI_API_KEY not configured` | Add API key to `backend/.env` |
| `WebSocket connection failed` | Ensure backend is running on port 8000 |
| `Camera/mic permission denied` | Allow browser permissions when prompted |
| `Module not found` | Run `pip install -r requirements.txt` again |

**📖 More help:** See [SECURITY.md](SECURITY.md) for environment setup and [docs/QUICKSTART.md](docs/QUICKSTART.md) for detailed instructions.

---

## 💡 Use Cases

• Code debugging and software development\
• Document understanding and analysis\
• Learning and tutoring\
• Workflow assistance\
• Visual explanation of complex content

------------------------------------------------------------------------

# ⚙ Technical Challenges

• Low-latency multimodal streaming\
• Synchronizing voice and visual inputs\
• Managing session memory across WebSockets\
• Designing effective prompts for multimodal reasoning

------------------------------------------------------------------------

# 🔮 Future Improvements

Planned enhancements include:

• persistent AI memory\
• autonomous AI agents\
• tool-use capabilities\
• UI automation features\
• enterprise integrations

------------------------------------------------------------------------

# � Security

- **See [SECURITY.md](SECURITY.md)** for guidelines
- **Never commit `.env` files** with API keys
- **Rotate keys** if exposed
- **Use environment variables** for all sensitive configs

------------------------------------------------------------------------

# �📄 License

MIT License

------------------------------------------------------------------------

# 🙏 Acknowledgments

Created for the **Gemini Live Agent Challenge** 
Thanks to the Gemini platform for enabling advanced multimodal reasoning.
