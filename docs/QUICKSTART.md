# Quick Start Guide - VisionCopilot Live

## Prerequisites

- Python 3.11+
- Node.js 18+
- Gemini API Key: [Get one here](https://makersuite.google.com/app/apikey)

## Backend Setup (5 minutes)

### Step 1: Navigate to Backend

```powershell
cd backend
```

### Step 2: Create Virtual Environment

```powershell
python -m venv venv
.\venv\Scripts\activate
```

### Step 3: Install Dependencies

```powershell
pip install -r requirements.txt
```

### Step 4: Configure Environment

```powershell
# Copy the example file
cp .env.example .env

# Edit .env and add your Gemini API key
# GEMINI_API_KEY=your_actual_api_key_here
```

### Step 5: Run the Server

```powershell
python app/main.py
```

Server will start on: **http://localhost:8000**

### Step 6: Test the API

Open a new terminal and run:

```powershell
python test_api.py
```

## Frontend Setup (Coming in Phase 5)

Frontend integration will be implemented in Phase 5.

For now, you can:
- Use the API directly
- Test with curl/Postman
- Connect via WebSocket clients

## Quick API Test

### 1. Check Health

```powershell
curl http://localhost:8000/api/health
```

### 2. Create Session

```powershell
curl -X POST http://localhost:8000/api/sessions/ `
  -H "Content-Type: application/json" `
  -d '{\"user_id\": \"test_user\"}'
```

Save the `session_id` from the response.

### 3. Send Chat Message

```powershell
curl -X POST http://localhost:8000/api/chat/ `
  -H "Content-Type: application/json" `
  -d '{\"prompt\": \"Hello! Introduce yourself.\", \"session_id\": \"YOUR_SESSION_ID\", \"include_history\": false}'
```

## Available Endpoints

### REST API

- **GET** `/` - Root endpoint
- **GET** `/api/health` - Health check
- **GET** `/api/info` - API information
- **POST** `/api/sessions/` - Create session
- **GET** `/api/sessions/` - List sessions
- **GET** `/api/sessions/{id}` - Get session
- **DELETE** `/api/sessions/{id}` - Delete session
- **POST** `/api/chat/` - Send message
- **POST** `/api/chat/stream` - Stream response
- **GET** `/api/chat/{id}/history` - Get history

### WebSocket

- **WS** `/ws/{session_id}` - Real-time connection

## API Documentation

Once the server is running, visit:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## Troubleshooting

### Issue: Module not found

```powershell
# Make sure virtual environment is activated
.\venv\Scripts\activate

# Reinstall dependencies
pip install -r requirements.txt
```

### Issue: GEMINI_API_KEY error

Make sure you:
1. Created `.env` file from `.env.example`
2. Added your actual API key
3. API key is valid

### Issue: Port already in use

Change the port in `.env`:
```env
PORT=8001
```

## Next Steps

✅ **Phase 1**: Project scaffolding - COMPLETE
✅ **Phase 2**: Backend API & Gemini - COMPLETE
⏭️ **Phase 3**: Vision processing - NEXT
🔜 **Phase 4**: Voice interaction
🔜 **Phase 5**: Frontend integration
🔜 **Phase 6**: Polish and demo

## Support

- Check [docs/phase2-implementation.md](phase2-implementation.md) for detailed documentation
- Review [docs/architecture.md](architecture.md) for system architecture
- See [docs/websocket-protocol.md](websocket-protocol.md) for WebSocket details
