# Deploying VisionCopilot Live to Google Cloud Run

This guide walks you through deploying VisionCopilot Live to Google Cloud Run for production use.

## Prerequisites

1. **Google Cloud Account** with billing enabled
2. **Google Cloud CLI** (`gcloud`) installed and configured
3. **Docker** installed locally
4. **Gemini API Key** from [Google AI Studio](https://makersuite.google.com/app/apikey)

## Step 1: Configure Google Cloud Project

```bash
# Set your project ID
export PROJECT_ID="your-project-id"
gcloud config set project $PROJECT_ID

# Enable required APIs
gcloud services enable \
    run.googleapis.com \
    containerregistry.googleapis.com \
    cloudbuild.googleapis.com \
    artifactregistry.googleapis.com
```

## Step 2: Create Artifact Registry Repository

```bash
# Create repository for Docker images
gcloud artifacts repositories create visioncopilot \
    --repository-format=docker \
    --location=us-central1 \
    --description="VisionCopilot Live container images"

# Configure Docker authentication
gcloud auth configure-docker us-central1-docker.pkg.dev
```

## Step 3: Build and Push Backend Image

```bash
# Set image names
export BACKEND_IMAGE="us-central1-docker.pkg.dev/$PROJECT_ID/visioncopilot/backend:latest"

# Build backend image
docker build -f infrastructure/Dockerfile.backend -t $BACKEND_IMAGE .

# Push to Artifact Registry
docker push $BACKEND_IMAGE
```

## Step 4: Deploy Backend to Cloud Run

```bash
# Deploy backend service
gcloud run deploy visioncopilot-backend \
    --image=$BACKEND_IMAGE \
    --platform=managed \
    --region=us-central1 \
    --allow-unauthenticated \
    --port=8080 \
    --memory=2Gi \
    --cpu=2 \
    --timeout=300 \
    --set-env-vars="ENVIRONMENT=production,PORT=8080,DEBUG=False" \
    --set-env-vars="GEMINI_API_KEY=your_gemini_api_key_here" \
    --set-env-vars="SESSION_SECRET_KEY=your_production_secret_key" \
    --max-instances=10 \
    --min-instances=0

# Get the backend URL
export BACKEND_URL=$(gcloud run services describe visioncopilot-backend \
    --region=us-central1 \
    --format='value(status.url)')

echo "Backend deployed at: $BACKEND_URL"
```

## Step 5: Build and Push Frontend Image

```bash
# Set frontend image name
export FRONTEND_IMAGE="us-central1-docker.pkg.dev/$PROJECT_ID/visioncopilot/frontend:latest"

# Build frontend image with backend URL
docker build \
    -f infrastructure/Dockerfile.frontend \
    --build-arg VITE_API_URL=/api \
    -t $FRONTEND_IMAGE .

# Push to Artifact Registry
docker push $FRONTEND_IMAGE
```

## Step 6: Deploy Frontend to Cloud Run

```bash
# Deploy frontend service
gcloud run deploy visioncopilot-frontend \
    --image=$FRONTEND_IMAGE \
    --platform=managed \
    --region=us-central1 \
    --allow-unauthenticated \
    --port=8080 \
    --memory=512Mi \
    --cpu=1 \
    --timeout=60 \
    --max-instances=10 \
    --min-instances=0

# Get the frontend URL
export FRONTEND_URL=$(gcloud run services describe visioncopilot-frontend \
    --region=us-central1 \
    --format='value(status.url)')

echo "Frontend deployed at: $FRONTEND_URL"
```

## Step 7: Update Backend CORS Configuration

```bash
# Update backend with frontend URL for CORS
gcloud run services update visioncopilot-backend \
    --region=us-central1 \
    --update-env-vars="ALLOWED_ORIGINS=$FRONTEND_URL"
```

## Step 8: Configure Custom Domain (Optional)

```bash
# Map custom domain to frontend
gcloud run domain-mappings create \
    --service=visioncopilot-frontend \
    --domain=your-domain.com \
    --region=us-central1

# Map custom domain to backend
gcloud run domain-mappings create \
    --service=visioncopilot-backend \
    --domain=api.your-domain.com \
    --region=us-central1

# Update CORS with custom domains
gcloud run services update visioncopilot-backend \
    --region=us-central1 \
    --update-env-vars="ALLOWED_ORIGINS=https://your-domain.com"
```

## Environment Variables

### Backend Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `ENVIRONMENT` | No | `development` | Environment mode (development/staging/production) |
| `PORT` | No | `8080` | Server port (Cloud Run uses 8080) |
| `DEBUG` | No | `False` | Enable debug mode |
| `GEMINI_API_KEY` | **Yes** | - | Google Gemini API key |
| `ALLOWED_ORIGINS` | No | localhost URLs | Comma-separated CORS origins |
| `SESSION_SECRET_KEY` | **Yes** | - | Secret key for session encryption |
| `SESSION_TIMEOUT_MINUTES` | No | `30` | Session timeout duration |
| `WS_HEARTBEAT_INTERVAL` | No | `30` | WebSocket heartbeat interval |

### Frontend Build Arguments

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_URL` | `/api` | Backend API URL |

## Continuous Deployment with Cloud Build

Create `cloudbuild.yaml` in project root:

```yaml
steps:
  # Build Backend
  - name: 'gcr.io/cloud-builders/docker'
    args:
      - 'build'
      - '-f'
      - 'infrastructure/Dockerfile.backend'
      - '-t'
      - 'us-central1-docker.pkg.dev/$PROJECT_ID/visioncopilot/backend:$COMMIT_SHA'
      - '-t'
      - 'us-central1-docker.pkg.dev/$PROJECT_ID/visioncopilot/backend:latest'
      - '.'
  
  # Build Frontend
  - name: 'gcr.io/cloud-builders/docker'
    args:
      - 'build'
      - '-f'
      - 'infrastructure/Dockerfile.frontend'
      - '-t'
      - 'us-central1-docker.pkg.dev/$PROJECT_ID/visioncopilot/frontend:$COMMIT_SHA'
      - '-t'
      - 'us-central1-docker.pkg.dev/$PROJECT_ID/visioncopilot/frontend:latest'
      - '.'
  
  # Push Backend
  - name: 'gcr.io/cloud-builders/docker'
    args:
      - 'push'
      - 'us-central1-docker.pkg.dev/$PROJECT_ID/visioncopilot/backend:$COMMIT_SHA'
  
  # Push Frontend
  - name: 'gcr.io/cloud-builders/docker'
    args:
      - 'push'
      - 'us-central1-docker.pkg.dev/$PROJECT_ID/visioncopilot/frontend:$COMMIT_SHA'
  
  # Deploy Backend
  - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
    entrypoint: gcloud
    args:
      - 'run'
      - 'deploy'
      - 'visioncopilot-backend'
      - '--image'
      - 'us-central1-docker.pkg.dev/$PROJECT_ID/visioncopilot/backend:$COMMIT_SHA'
      - '--region'
      - 'us-central1'
      - '--platform'
      - 'managed'
  
  # Deploy Frontend
  - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
    entrypoint: gcloud
    args:
      - 'run'
      - 'deploy'
      - 'visioncopilot-frontend'
      - '--image'
      - 'us-central1-docker.pkg.dev/$PROJECT_ID/visioncopilot/frontend:$COMMIT_SHA'
      - '--region'
      - 'us-central1'
      - '--platform'
      - 'managed'

images:
  - 'us-central1-docker.pkg.dev/$PROJECT_ID/visioncopilot/backend:$COMMIT_SHA'
  - 'us-central1-docker.pkg.dev/$PROJECT_ID/visioncopilot/backend:latest'
  - 'us-central1-docker.pkg.dev/$PROJECT_ID/visioncopilot/frontend:$COMMIT_SHA'
  - 'us-central1-docker.pkg.dev/$PROJECT_ID/visioncopilot/frontend:latest'

timeout: 1800s
```

### Set up Cloud Build Trigger

```bash
# Create trigger for main branch
gcloud builds triggers create github \
    --repo-name=visioncopilot-live \
    --repo-owner=your-github-username \
    --branch-pattern="^main$" \
    --build-config=cloudbuild.yaml
```

## Monitoring and Logs

```bash
# View backend logs
gcloud run services logs read visioncopilot-backend \
    --region=us-central1 \
    --limit=50

# View frontend logs
gcloud run services logs read visioncopilot-frontend \
    --region=us-central1 \
    --limit=50

# Stream logs in real-time
gcloud run services logs tail visioncopilot-backend \
    --region=us-central1
```

## Cost Optimization

### Recommended Settings for Production

- **Min Instances**: 0 (scale to zero when not in use)
- **Max Instances**: 10 (adjust based on traffic)
- **Memory**: Backend 2Gi, Frontend 512Mi
- **CPU**: Backend 2, Frontend 1
- **Timeout**: Backend 300s (for AI processing), Frontend 60s

### Estimated Costs

Based on default settings with moderate usage:
- **Backend**: ~$10-30/month
- **Frontend**: ~$5-15/month
- **Gemini API**: Pay per request (see Google AI pricing)

## Troubleshooting

### Backend Not Responding

```bash
# Check backend health
curl $BACKEND_URL/api/health

# Check logs for errors
gcloud run services logs read visioncopilot-backend --region=us-central1 --limit=100
```

### CORS Errors

```bash
# Verify CORS configuration
gcloud run services describe visioncopilot-backend \
    --region=us-central1 \
    --format="value(spec.template.spec.containers[0].env)"

# Update CORS origins
gcloud run services update visioncopilot-backend \
    --region=us-central1 \
    --update-env-vars="ALLOWED_ORIGINS=https://your-frontend-url.run.app"
```

### WebSocket Connection Issues

WebSockets are fully supported on Cloud Run. Ensure:
1. Backend timeout is set to at least 300s
2. Frontend properly handles reconnection
3. No aggressive proxies between client and server

## Security Best Practices

1. **Use Secret Manager** for sensitive values:
   ```bash
   # Store Gemini API key in Secret Manager
   echo -n "your_api_key" | gcloud secrets create gemini-api-key --data-file=-
   
   # Grant Cloud Run access
   gcloud secrets add-iam-policy-binding gemini-api-key \
       --member="serviceAccount:PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
       --role="roles/secretmanager.secretAccessor"
   
   # Deploy with secret
   gcloud run deploy visioncopilot-backend \
       --image=$BACKEND_IMAGE \
       --update-secrets=GEMINI_API_KEY=gemini-api-key:latest
   ```

2. **Enable VPC Connector** for private resources
3. **Use Cloud Armor** for DDoS protection
4. **Enable Cloud Logging** for audit trails
5. **Set up Cloud Monitoring** for alerts

## Rollback

```bash
# List revisions
gcloud run revisions list --service=visioncopilot-backend --region=us-central1

# Rollback to previous revision
gcloud run services update-traffic visioncopilot-backend \
    --region=us-central1 \
    --to-revisions=REVISION_NAME=100
```

## Support

For issues with deployment:
- Check [Cloud Run Documentation](https://cloud.google.com/run/docs)
- Review application logs
- Verify environment variables
- Test locally with Docker first

---

**Next Steps**: After successful deployment, configure monitoring, set up alerts, and implement your CI/CD pipeline.
