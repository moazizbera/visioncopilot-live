# Production Deployment Checklist

Use this checklist before deploying VisionCopilot Live to production.

## ✅ Pre-Deployment Checklist

### Environment Configuration

- [ ] **Environment Variables Set**
  - [ ] `ENVIRONMENT=production`
  - [ ] `DEBUG=False`
  - [ ] `GEMINI_API_KEY` - valid API key set
  - [ ] `SESSION_SECRET_KEY` - strong secret key (not default)
  - [ ] `ALLOWED_ORIGINS` - production frontend URL(s) only

- [ ] **Remove Development Settings**
  - [ ] No `localhost` in ALLOWED_ORIGINS for production
  - [ ] Debug mode disabled
  - [ ] Development dependencies excluded

### Security

- [ ] **API Keys Secured**
  - [ ] Gemini API key stored securely (Secret Manager recommended)
  - [ ] Session secret key is strong and unique
  - [ ] No secrets in code or version control

- [ ] **CORS Properly Configured**
  - [ ] Only production domains in ALLOWED_ORIGINS
  - [ ] Credentials handling configured correctly
  - [ ] Methods restricted to necessary ones

- [ ] **API Documentation**
  - [ ] `/docs` endpoint disabled in production
  - [ ] `/redoc` endpoint disabled in production

### Docker & Infrastructure

- [ ] **Docker Images Built**
  - [ ] Backend image built successfully
  - [ ] Frontend image built successfully
  - [ ] Images pushed to container registry

- [ ] **Container Configuration**
  - [ ] Health checks configured
  - [ ] Port 8080 exposed (Cloud Run requirement)
  - [ ] Non-root user configured (backend)
  - [ ] `.dockerignore` files present

### Cloud Run Specific

- [ ] **Service Configuration**
  - [ ] Min instances: 0 (or as needed)
  - [ ] Max instances: configured based on load
  - [ ] Memory: Backend 2Gi, Frontend 512Mi
  - [ ] CPU: Backend 2, Frontend 1
  - [ ] Timeout: Backend 300s, Frontend 60s

- [ ] **Networking**
  - [ ] Backend URL added to frontend CORS
  - [ ] Frontend URL added to backend CORS
  - [ ] Custom domains configured (if applicable)

### Testing

- [ ] **Local Testing Complete**
  - [ ] Docker Compose runs successfully
  - [ ] All features work locally
  - [ ] WebSocket connections stable

- [ ] **Pre-Production Testing**
  - [ ] Health checks return 200 OK
  - [ ] API endpoints responding correctly
  - [ ] WebSocket connections established
  - [ ] Camera capture working
  - [ ] Screen capture working
  - [ ] Voice input working
  - [ ] AI responses working

### Monitoring & Logging

- [ ] **Logging Configured**
  - [ ] Structured logging enabled
  - [ ] Log level appropriate (INFO for production)
  - [ ] Sensitive data not logged

- [ ] **Monitoring Setup**
  - [ ] Cloud Monitoring alerts configured
  - [ ] Error rate monitoring
  - [ ] Latency monitoring
  - [ ] Uptime monitoring

### Documentation

- [ ] **Deployment Docs Updated**
  - [ ] README.md has correct URLs
  - [ ] DEPLOYMENT.md is current
  - [ ] Architecture diagram available

- [ ] **Runbooks Created**
  - [ ] Deployment procedure documented
  - [ ] Rollback procedure documented
  - [ ] Troubleshooting guide available

## 🚀 Deployment Steps

### 1. Build & Test Locally

```bash
# Build images
docker build -f infrastructure/Dockerfile.backend -t backend:test .
docker build -f infrastructure/Dockerfile.frontend -t frontend:test .

# Run locally
docker-compose -f infrastructure/docker-compose.yml up

# Test all features
# - Health check: http://localhost:8080/api/health
# - Frontend: http://localhost:3000
# - Test chat, camera, screen, voice, streaming
```

### 2. Push to Registry

```bash
# Tag and push backend
docker tag backend:test us-central1-docker.pkg.dev/PROJECT_ID/visioncopilot/backend:latest
docker push us-central1-docker.pkg.dev/PROJECT_ID/visioncopilot/backend:latest

# Tag and push frontend
docker tag frontend:test us-central1-docker.pkg.dev/PROJECT_ID/visioncopilot/frontend:latest
docker push us-central1-docker.pkg.dev/PROJECT_ID/visioncopilot/frontend:latest
```

### 3. Deploy to Cloud Run

```bash
# Deploy backend first
gcloud run deploy visioncopilot-backend \
    --image=us-central1-docker.pkg.dev/PROJECT_ID/visioncopilot/backend:latest \
    --region=us-central1 \
    --platform=managed \
    --allow-unauthenticated \
    --port=8080 \
    --memory=2Gi \
    --cpu=2 \
    --timeout=300 \
    --set-env-vars="ENVIRONMENT=production,DEBUG=False,GEMINI_API_KEY=$GEMINI_API_KEY"

# Get backend URL
BACKEND_URL=$(gcloud run services describe visioncopilot-backend \
    --region=us-central1 --format='value(status.url)')

# Deploy frontend
gcloud run deploy visioncopilot-frontend \
    --image=us-central1-docker.pkg.dev/PROJECT_ID/visioncopilot/frontend:latest \
    --region=us-central1 \
    --platform=managed \
    --allow-unauthenticated \
    --port=8080

# Get frontend URL
FRONTEND_URL=$(gcloud run services describe visioncopilot-frontend \
    --region=us-central1 --format='value(status.url)')

# Update backend CORS
gcloud run services update visioncopilot-backend \
    --region=us-central1 \
    --update-env-vars="ALLOWED_ORIGINS=$FRONTEND_URL"
```

### 4. Verify Deployment

```bash
# Check backend health
curl $BACKEND_URL/api/health

# Check frontend
curl $FRONTEND_URL/health

# View logs
gcloud run services logs read visioncopilot-backend --region=us-central1 --limit=50
gcloud run services logs read visioncopilot-frontend --region=us-central1 --limit=50
```

### 5. Test Production

- [ ] Open frontend URL in browser
- [ ] Test chat functionality
- [ ] Test camera capture
- [ ] Test screen capture
- [ ] Test voice input
- [ ] Test live streaming
- [ ] Check WebSocket connections
- [ ] Verify AI responses
- [ ] Test error handling

## 🔄 Post-Deployment

### Monitoring

```bash
# Set up uptime monitoring
gcloud monitoring uptime-check-configs create http visioncopilot-frontend \
    --display-name="VisionCopilot Frontend" \
    --uri=$FRONTEND_URL

gcloud monitoring uptime-check-configs create http visioncopilot-backend \
    --display-name="VisionCopilot Backend" \
    --uri=$BACKEND_URL/api/health
```

### Alerts

```bash
# Create alert for high error rate
gcloud alpha monitoring policies create \
    --notification-channels=CHANNEL_ID \
    --display-name="VisionCopilot High Error Rate" \
    --condition-display-name="Error rate > 5%" \
    --condition-threshold-value=0.05 \
    --condition-threshold-duration=300s
```

### Regular Maintenance

- [ ] Monitor logs daily
- [ ] Review error rates weekly
- [ ] Update dependencies monthly
- [ ] Backup session data (if persisted)
- [ ] Review and renew API keys as needed

## 🚨 Rollback Procedure

If deployment fails or issues arise:

```bash
# List revisions
gcloud run revisions list --service=visioncopilot-backend --region=us-central1

# Rollback to previous revision
gcloud run services update-traffic visioncopilot-backend \
    --region=us-central1 \
    --to-revisions=PREVIOUS_REVISION=100

# Verify rollback
curl $BACKEND_URL/api/health
```

## 📊 Success Criteria

Deployment is successful when:

- ✅ Health checks return 200 OK
- ✅ Frontend loads without errors
- ✅ Backend API responds correctly
- ✅ WebSocket connections establish
- ✅ AI features work (chat, vision, voice)
- ✅ No critical errors in logs
- ✅ Response times < 3s (excluding AI processing)
- ✅ Uptime > 99.5%

## 🔗 Resources

- [Deployment Guide](DEPLOYMENT.md)
- [Architecture Documentation](architecture.md)
- [Google Cloud Run Docs](https://cloud.google.com/run/docs)
- [Gemini API Docs](https://ai.google.dev/docs)

---

**Last Updated**: Phase 6A - Deployment Readiness
