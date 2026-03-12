# 🎯 VisionCopilot Live Architecture

## System Overview

VisionCopilot Live is a multimodal AI assistant that enables real-time interaction through camera, screen sharing, and voice input.

## Architecture Layers

### 1️⃣ Frontend Layer (React + TypeScript)

**Location:** `/frontend`

**Components:**
- Camera capture interface
- Screen sharing controls
- Voice input handler
- WebSocket client for real-time communication
- UI components built with TailwindCSS

**Key Technologies:**
- React 18
- TypeScript
- Vite (build tool)
- WebRTC (media capture)
- Native WebSocket (real-time communication)
- TailwindCSS (styling)

**Responsibilities:**
- Capture user media (camera, screen, audio)
- Send data streams to backend
- Receive and display AI responses
- Manage UI state and user interactions

---

### 2️⃣ Backend Layer (FastAPI + Python)

**Location:** `/backend`

**Structure:**
```
backend/
├── app/
│   ├── main.py          # FastAPI application entry
│   ├── api/             # API route handlers
│   ├── core/            # Configuration & utilities
│   └── models/          # Data models
```

**Key Technologies:**
- FastAPI
- Uvicorn (ASGI server)
- WebSockets
- Python 3.11+

**Responsibilities:**
- REST API endpoints
- WebSocket gateway for real-time communication
- Session management
- Request validation
- Route media streams to AI layer

---

### 3️⃣ AI Agent Layer (Gemini Integration)

**Location:** `/ai`

**Components:**
- Gemini API client
- Prompt orchestration
- Multimodal processing (text + images)
- Response streaming

**Key Technologies:**
- Google Generative AI SDK
- Gemini Pro (text)
- Gemini Pro Vision (multimodal)

**Responsibilities:**
- Process text prompts
- Analyze images from camera/screen
- Generate AI responses
- Stream responses back to user

---

### 4️⃣ Infrastructure Layer

**Location:** `/infrastructure`

**Components:**
- Docker containers
- Nginx reverse proxy
- Docker Compose orchestration

**Files:**
- `Dockerfile.backend` - Backend container
- `Dockerfile.frontend` - Frontend container
- `docker-compose.yml` - Service orchestration
- `nginx.conf` - Reverse proxy configuration

**Responsibilities:**
- Containerization
- Service orchestration
- Load balancing
- Production deployment

---

## Data Flow

```
User Interface (React)
    ↓ (WebSocket/HTTP)
Backend API (FastAPI)
    ↓ (Function Call)
AI Agent (Gemini)
    ↓ (Response)
Backend API
    ↓ (WebSocket Stream)
User Interface
```

## Communication Patterns

### REST API
- Health checks
- Session management
- Configuration endpoints

### WebSocket
- Real-time media streaming
- AI response streaming
- Bidirectional communication

## Security Considerations

- API key management via environment variables
- CORS configuration
- Session authentication
- Input validation

## Scalability

- Stateless backend design
- Horizontal scaling ready
- Docker containerization
- Cloud deployment compatible

---

## Development Workflow

1. **Local Development:**
   - Backend: `python backend/app/main.py`
   - Frontend: `npm run dev` (in frontend/)

2. **Docker Development:**
   - `docker-compose up`

3. **Production Deployment:**
   - Build containers
   - Deploy to cloud (AWS, GCP, Azure)
   - Configure environment variables

---

## Future Enhancements

- [ ] Add authentication layer
- [ ] Implement session persistence
- [ ] Add monitoring and logging
- [ ] Support multiple AI models
- [ ] Implement caching layer
- [ ] Add rate limiting
