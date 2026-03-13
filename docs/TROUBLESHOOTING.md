# \ud83d\udd27 Troubleshooting Guide

Common issues and solutions for VisionCopilot Live

---

## \ud83d\udea8 Common Issues

### Backend Issues

#### 1. `GEMINI_API_KEY not found`

**Error Message:**
```
ValueError: GEMINI_API_KEY not found in environment variables
```

**Cause:** API key not configured in environment

**Solution:**
```bash
cd backend
cp .env.example .env
# Edit .env and add your API key
echo "GEMINI_API_KEY=your_actual_key_here" >> .env
```

**Get API Key:** [Google AI Studio](https://makersuite.google.com/app/apikey)

---

#### 2. `ModuleNotFoundError` Python Dependencies

**Error Message:**
```
ModuleNotFoundError: No module named 'fastapi'
```

**Cause:** Python dependencies not installed

**Solution:**
```bash
cd backend
python -m venv venv
# Activate venv
source venv/bin/activate  # macOS/Linux
# or
venv\Scripts\activate  # Windows

pip install -r requirements.txt
```

---

#### 3. `Port 8000 already in use`

**Error Message:**
```
ERROR: [Errno 48] Address already in use
```

**Cause:** Another process using port 8000

**Solution (Option 1):** Kill existing process
```bash
# Find process on port 8000
lsof -i :8000  # macOS/Linux
netstat -ano | findstr :8000  # Windows

# Kill process
kill -9 <PID>  # macOS/Linux
taskkill /PID <PID> /F  # Windows
```

**Solution (Option 2):** Use different port
```bash
uvicorn app.main:app --reload --port 8001
```

---

#### 4. `CORS` Error

**Error Message:**
```
Access to XMLHttpRequest has been blocked by CORS policy
```

**Cause:** Frontend origin not in allowed list

**Solution:**
```bash
# Edit backend/.env
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000,http://your-domain.com
```

---

### Frontend Issues

#### 5. `WebSocket connection failed`

**Error Message:**
```console
WebSocket connection to 'ws://localhost:8000/api/ws/...' failed
```

**Cause:** Backend not running or wrong URL

**Solution:**
1. Ensure backend is running:
   ```bash
   curl http://localhost:8000/health
   # Should return: {"status":"ok"}
   ```

2. Check WebSocket URL in `frontend/.env`:
   ```bash
   VITE_BACKEND_URL=http://localhost:8000
   VITE_WS_URL=ws://localhost:8000
   ```

3. Restart frontend:
   ```bash
   cd frontend
   npm run dev
   ```

---

#### 6. `npm install` Fails

**Error Message:**
```
npm ERR! code ERESOLVEunable to resolve dependency tree
```

**Cause:** Dependency conflicts

**Solution:**
```bash
cd frontend

# Clear cache
rm -rf node_modules package-lock.json
npm cache clean --force

# Reinstall
npm install --legacy-peer-deps
```

---

#### 7. Camera/Microphone Permission Denied

**Error Message:**
```
NotAllowedError: Permission denied
```

**Cause:** Browser permissions not granted

**Solution:**

**Chrome:**
1. Click lock icon in address bar
2. Set Camera and Microphone to "Allow"
3. Reload page

**Firefox:**
1. Click "i" icon in address bar
2. Click "More information"
3. Go to "Permissions"
4. Allow Camera and Microphone
5. Reload page

**Safari:**
1. Settings \u2192 Websites \u2192 Camera/Microphone
2. Allow for your site
3. Reload page

---

#### 8. Dark Mode Not Working

**Symptom:** Theme doesn't change when toggling

**Cause:** localStorage issue or CSS not loading

**Solution:**
```javascript
// Open browser console (F12) and run:
localStorage.clear()
location.reload()
```

---

### Deployment Issues

#### 9. Docker Build Fails

**Error Message:**
```
ERROR: failed to solve: process "/bin/sh -c pip install -r requirements.txt" did not complete successfully
```

**Cause:** Network issues or invalid requirements.txt

**Solution:**
```bash
# Rebuild with no cache
docker-compose build --no-cache

# If still failing, check requirements.txt
cd backend
pip install -r requirements.txt  # Test locally first
```

---

#### 10. Cloud Run Deployment Fails

**Error Message:**
```
ERROR: (gcloud.run.deploy) Container failed to start
```

**Cause:** Missing environment variables or startup error

**Solution:**
```bash
# Check Cloud Run logs
gcloud run services logs visioncopilot-backend --limit 50

# Ensure all env vars are set
gcloud run services update visioncopilot-backend \
  --set-env-vars GEMINI_API_KEY=your_key
```

---

## \ud83d\udc1b Debugging Tips

### Backend Debugging

**Enable Debug Mode:**
```bash
# backend/.env
DEBUG=True
LOG_LEVEL=DEBUG
```

**Check Logs:**
```bash
# Watch backend logs
tail -f backend/logs/app.log

# Test API manually
curl -X POST http://localhost:8000/api/sessions
curl http://localhost:8000/api/sessions/{session_id}
```

**Test WebSocket:**
```javascript
// Browser console
const ws = new WebSocket('ws://localhost:8000/api/ws/test123');
ws.onopen = () => console.log('Connected');
ws.onmessage = (e) => console.log('Message:', e.data);
ws.send(JSON.stringify({type: 'text', content: 'Hello', session_id: 'test123'}));
```

---

### Frontend Debugging

**Check Network Tab:**
1. Open DevTools (F12)
2. Go to Network tab
3. Filter by "WS" for WebSocket
4. Check connection status and messages

**Console Errors:**
1. Open DevTools Console (F12)
2. Look for red errors
3. Check for CORS, WebSocket, or API errors

**React DevTools:**
1. Install [React DevTools extension](https://react.dev/learn/react-developer-tools)
2. Inspect component state
3. Check hooks and context

---

## \ud83e\uddf0 Performance Issues

### Slow Response Time

**Symptom:** AI responses taking >3 seconds

**Cause:** Network latency or large images

**Solutions:**
1. **Optimize images:**
   ```javascript
   // Reduce image quality in frontend
   const MAX_IMAGE_SIZE = 800; // px
   const JPEG_QUALITY = 0.7;
   ```

2. **Check Gemini API status:**
   - Visit [Google Cloud Status](https://status.cloud.google.com/)

3. **Use faster Gemini model:**
   ```python
   # backend/app/core/gemini_service.py
   model = genai.GenerativeModel('models/gemini-2.0-flash-exp')
   ```

---

### High Memory Usage

**Symptom:** Application using >1GB RAM

**Cause:** Session accumulation or memory leaks

**Solutions:**
1. **Check active sessions:**
   ```bash
   curl http://localhost:8000/api/sessions
   ```

2. **Configure session timeout:**
   ```bash
   # backend/.env
   SESSION_TIMEOUT_MINUTES=15
   ```

3. **Restart services:**
   ```bash
   # Backend
   pkill -f uvicorn
   uvicorn app.main:app --reload

   # Frontend
   npm run dev
   ```

---

## \ud83d\udd0d Verification Scripts

### Health Check Script

Create `scripts/health-check.sh`:
```bash
#!/bin/bash

echo "Checking VisionCopilot Live health..."

# Backend health
if curl -s http://localhost:8000/health | grep -q "ok"; then
    echo "\u2705 Backend: Healthy"
else
    echo "\u274c Backend: Down"
fi

# Frontend health
if curl -s http://localhost:5173 > /dev/null 2>&1; then
    echo "\u2705 Frontend: Healthy"
else
    echo "\u274c Frontend: Down"
fi

# WebSocket test
if timeout 2 bash -c 'cat < /dev/null > /dev/tcp/localhost/8000'; then
    echo "\u2705 WebSocket: Available"
else
    echo "\u274c WebSocket: Not available"
fi
```

Run with:
```bash
chmod +x scripts/health-check.sh
./scripts/health-check.sh
```

---

### Dependency Check Script

Create `scripts/check-deps.sh`:
```bash
#!/bin/bash

echo "Checking dependencies..."

# Python
if python --version | grep -q "3.11"; then
    echo "\u2705 Python 3.11+"
else
    echo "\u274c Python: Needs 3.11+"
fi

# Node
if node --version | grep -qE "v(1[8-9]|2[0-9])"; then
    echo "\u2705 Node.js 18+"
else
    echo "\u274c Node.js: Needs 18+"
fi

# pip packages
cd backend
if pip freeze | grep -q "fastapi"; then
    echo "\u2705 Python packages installed"
else
    echo "\u274c Python packages: Not installed"
fi

# npm packages
cd ../frontend
if [ -d "node_modules" ]; then
    echo "\u2705 Node packages installed"
else
    echo "\u274c Node packages: Not installed"
fi
```

---

## \ud83d\udcde Getting Help

### Where to Get Support

1. **Documentation:**
   - [README.md](../README.mdSection) - Main guide  
   - [SECURITY.md](../SECURITY.md) - Security practices
   - [docs/QUICKSTART.md](QUICKSTART.md) - Setup guide
   - [docs/architecture.md](architecture.md) - Technical details

2. **GitHub:**
   - [Issues](https://github.com/moazizbera/visioncopilot-live/issues) - Report bugs
   - [Discussions](https://github.com/moazizbera/visioncopilot-live/discussions) - Ask questions

3. **Community:**
   - Check [existing issues](https://github.com/moazizbera/visioncopilot-live/issues)
   - Search [discussions](https://github.com/moazizbera/visioncopilot-live/discussions)

---

## \ud83e\uddd1\u200d\ud83d\udcbb Reporting Issues

### Issue Template

When reporting an issue, include:

```markdown
**Environment:**
- OS: [e.g., macOS 14, Windows 11, Ubuntu 22.04]
- Python version: [e.g., 3.11.5]
- Node version: [e.g., 20.10.0]
- Browser: [e.g., Chrome 120]

**Description:**
[Clear description of the issue]

**Steps to Reproduce:**
1. [First step]
2. [Second step]
3. [...]

**Expected Behavior:**
[What should happen]

**Actual Behavior:**
[What actually happens]

**Error Logs:**
```
[Paste relevant error logs]
```

**Screenshots:**
[If applicable]
```

---

## \u2705 Checklist for Setup

Before asking for help, verify:

- [ ] Python 3.11+ installed
- [ ] Node.js 18+ installed
- [ ] `GEMINI_API_KEY` configured in `backend/.env`
- [ ] Backend dependencies installed (`pip install -r requirements.txt`)
- [ ] Frontend dependencies installed (`npm install`)
- [ ] Backend running on port 8000
- [ ] Frontend running on port 5173
- [ ] Browser permissions granted for camera/microphone
- [ ] No console errors in browser DevTools
- [ ] `/health` endpoint returns `{"status":"ok"}`

---

**Still having issues?** [Open an issue](https://github.com/moazizbera/visioncopilot-live/issues/new)
