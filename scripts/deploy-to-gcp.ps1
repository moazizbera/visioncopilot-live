# Quick Deploy to Google Cloud Run - For Hackathon Proof (PowerShell)
# This script deploys VisionCopilot Live to GCP Cloud Run

Write-Host "🚀 VisionCopilot Live - Google Cloud Run Deployment Script" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host ""

# Check prerequisites
if (-not (Get-Command gcloud -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Error: gcloud CLI not found" -ForegroundColor Red
    Write-Host "Install from: https://cloud.google.com/sdk/docs/install"
    exit 1
}

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Error: Docker not found" -ForegroundColor Red
    Write-Host "Install from: https://docs.docker.com/get-docker/"
    exit 1
}

# Get project ID
$PROJECT_ID = Read-Host "📋 Enter your Google Cloud Project ID"

if ([string]::IsNullOrWhiteSpace($PROJECT_ID)) {
    Write-Host "❌ Error: Project ID is required" -ForegroundColor Red
    exit 1
}

Write-Host ""
$GEMINI_API_KEY = Read-Host "🔑 Enter your Gemini API Key" -AsSecureString
$GEMINI_API_KEY_PLAIN = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($GEMINI_API_KEY)
)

if ([string]::IsNullOrWhiteSpace($GEMINI_API_KEY_PLAIN)) {
    Write-Host "❌ Error: Gemini API Key is required" -ForegroundColor Red
    exit 1
}

# Set project
Write-Host ""
Write-Host "⚙️  Setting up Google Cloud project..." -ForegroundColor Yellow
gcloud config set project $PROJECT_ID

# Enable APIs
Write-Host ""
Write-Host "🔌 Enabling required Google Cloud APIs..." -ForegroundColor Yellow
gcloud services enable run.googleapis.com artifactregistry.googleapis.com cloudbuild.googleapis.com

# Create Artifact Registry repository
Write-Host ""
Write-Host "📦 Creating Artifact Registry repository..." -ForegroundColor Yellow
gcloud artifacts repositories create visioncopilot `
    --repository-format=docker `
    --location=us-central1 `
    --description="VisionCopilot Live - Gemini Hackathon" 2>$null

if ($LASTEXITCODE -ne 0) {
    Write-Host "Repository already exists, continuing..." -ForegroundColor Gray
}

# Configure Docker auth
Write-Host ""
Write-Host "🔐 Configuring Docker authentication..." -ForegroundColor Yellow
gcloud auth configure-docker us-central1-docker.pkg.dev

# Build and deploy backend
Write-Host ""
Write-Host "🏗️  Building backend image..." -ForegroundColor Yellow
$BACKEND_IMAGE = "us-central1-docker.pkg.dev/$PROJECT_ID/visioncopilot/backend:latest"
docker build -f infrastructure/Dockerfile.backend -t $BACKEND_IMAGE .

Write-Host ""
Write-Host "⬆️  Pushing backend image to Artifact Registry..." -ForegroundColor Yellow
docker push $BACKEND_IMAGE

Write-Host ""
Write-Host "🚀 Deploying backend to Cloud Run..." -ForegroundColor Yellow
gcloud run deploy visioncopilot-backend `
    --image=$BACKEND_IMAGE `
    --platform=managed `
    --region=us-central1 `
    --allow-unauthenticated `
    --port=8080 `
    --memory=2Gi `
    --cpu=2 `
    --timeout=300 `
    --set-env-vars="ENVIRONMENT=production,PORT=8080,DEBUG=False,GEMINI_API_KEY=$GEMINI_API_KEY_PLAIN" `
    --max-instances=10 `
    --min-instances=0

# Get backend URL
$BACKEND_URL = (gcloud run services describe visioncopilot-backend `
    --region=us-central1 `
    --format='value(status.url)')

Write-Host ""
Write-Host "✅ Backend deployed successfully!" -ForegroundColor Green
Write-Host "   URL: $BACKEND_URL" -ForegroundColor Cyan

# Update CORS
Write-Host ""
Write-Host "🔧 Updating CORS configuration..." -ForegroundColor Yellow
gcloud run services update visioncopilot-backend `
    --region=us-central1 `
    --update-env-vars="ALLOWED_ORIGINS=https://*.run.app,http://localhost:5173"

# Build and deploy frontend
Write-Host ""
Write-Host "🏗️  Building frontend image..." -ForegroundColor Yellow
$FRONTEND_IMAGE = "us-central1-docker.pkg.dev/$PROJECT_ID/visioncopilot/frontend:latest"

docker build `
    -f infrastructure/Dockerfile.frontend `
    --build-arg VITE_BACKEND_URL=$BACKEND_URL `
    -t $FRONTEND_IMAGE .

Write-Host ""
Write-Host "⬆️  Pushing frontend image to Artifact Registry..." -ForegroundColor Yellow
docker push $FRONTEND_IMAGE

Write-Host ""
Write-Host "🚀 Deploying frontend to Cloud Run..." -ForegroundColor Yellow
gcloud run deploy visioncopilot-frontend `
    --image=$FRONTEND_IMAGE `
    --platform=managed `
    --region=us-central1 `
    --allow-unauthenticated `
    --port=80 `
    --memory=512Mi `
    --cpu=1 `
    --timeout=60 `
    --max-instances=5 `
    --min-instances=0

# Get frontend URL
$FRONTEND_URL = (gcloud run services describe visioncopilot-frontend `
    --region=us-central1 `
    --format='value(status.url)')

Write-Host ""
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "🎉 Deployment Complete!" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
Write-Host ""
Write-Host "📱 Frontend URL: $FRONTEND_URL" -ForegroundColor Cyan
Write-Host "🔧 Backend URL:  $BACKEND_URL" -ForegroundColor Cyan
Write-Host ""
Write-Host "🏆 HACKATHON PROOF:" -ForegroundColor Yellow
Write-Host "1. Visit GCP Console: https://console.cloud.google.com/run?project=$PROJECT_ID"
Write-Host "2. Take screenshot of deployed services"
Write-Host "3. Or use these URLs as proof of deployment"
Write-Host ""
Write-Host "🧪 Test your deployment:"
Write-Host "   curl $BACKEND_URL/health"
Write-Host ""
Write-Host "📊 View logs:"
Write-Host "   gcloud run services logs read visioncopilot-backend --region=us-central1"
Write-Host ""
Write-Host "🛡️  Security: Don't forget to delete when done testing:" -ForegroundColor Red
Write-Host "   gcloud run services delete visioncopilot-backend --region=us-central1 --quiet"
Write-Host "   gcloud run services delete visioncopilot-frontend --region=us-central1 --quiet"
Write-Host ""
