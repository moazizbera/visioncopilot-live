#!/bin/bash
# Quick Deploy to Google Cloud Run - For Hackathon Proof
# This script deploys VisionCopilot Live to GCP Cloud Run

set -e

echo "🚀 VisionCopilot Live - Google Cloud Run Deployment Script"
echo "=========================================================="
echo ""

# Check prerequisites
if ! command -v gcloud &> /dev/null; then
    echo "❌ Error: gcloud CLI not found"
    echo "Install from: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

if ! command -v docker &> /dev/null; then
    echo "❌ Error: Docker not found"
    echo "Install from: https://docs.docker.com/get-docker/"
    exit 1
fi

# Get project ID
echo "📋 Enter your Google Cloud Project ID:"
read -p "Project ID: " PROJECT_ID

if [ -z "$PROJECT_ID" ]; then
    echo "❌ Error: Project ID is required"
    exit 1
fi

echo ""
echo "🔑 Enter your Gemini API Key:"
read -s -p "Gemini API Key: " GEMINI_API_KEY
echo ""

if [ -z "$GEMINI_API_KEY" ]; then
    echo "❌ Error: Gemini API Key is required"
    exit 1
fi

# Set project
echo ""
echo "⚙️  Setting up Google Cloud project..."
gcloud config set project $PROJECT_ID

# Enable APIs
echo ""
echo "🔌 Enabling required Google Cloud APIs..."
gcloud services enable \
    run.googleapis.com \
    artifactregistry.googleapis.com \
    cloudbuild.googleapis.com

# Create Artifact Registry repository (if not exists)
echo ""
echo "📦 Creating Artifact Registry repository..."
gcloud artifacts repositories create visioncopilot \
    --repository-format=docker \
    --location=us-central1 \
    --description="VisionCopilot Live - Gemini Hackathon" \
    2>/dev/null || echo "Repository already exists, continuing..."

# Configure Docker auth
echo ""
echo "🔐 Configuring Docker authentication..."
gcloud auth configure-docker us-central1-docker.pkg.dev

# Build and deploy backend
echo ""
echo "🏗️  Building backend image..."
BACKEND_IMAGE="us-central1-docker.pkg.dev/$PROJECT_ID/visioncopilot/backend:latest"
docker build -f infrastructure/Dockerfile.backend -t $BACKEND_IMAGE .

echo ""
echo "⬆️  Pushing backend image to Artifact Registry..."
docker push $BACKEND_IMAGE

echo ""
echo "🚀 Deploying backend to Cloud Run..."
gcloud run deploy visioncopilot-backend \
    --image=$BACKEND_IMAGE \
    --platform=managed \
    --region=us-central1 \
    --allow-unauthenticated \
    --port=8080 \
    --memory=2Gi \
    --cpu=2 \
    --timeout=300 \
    --set-env-vars="ENVIRONMENT=production,PORT=8080,DEBUG=False,GEMINI_API_KEY=$GEMINI_API_KEY" \
    --max-instances=10 \
    --min-instances=0

# Get backend URL
BACKEND_URL=$(gcloud run services describe visioncopilot-backend \
    --region=us-central1 \
    --format='value(status.url)')

echo ""
echo "✅ Backend deployed successfully!"
echo "   URL: $BACKEND_URL"

# Build and deploy frontend
echo ""
echo "🏗️  Building frontend image..."
FRONTEND_IMAGE="us-central1-docker.pkg.dev/$PROJECT_ID/visioncopilot/frontend:latest"

# Update CORS in backend to allow frontend
gcloud run services update visioncopilot-backend \
    --region=us-central1 \
    --update-env-vars="ALLOWED_ORIGINS=https://*.run.app,http://localhost:5173"

docker build \
    -f infrastructure/Dockerfile.frontend \
    --build-arg VITE_BACKEND_URL=$BACKEND_URL \
    -t $FRONTEND_IMAGE .

echo ""
echo "⬆️  Pushing frontend image to Artifact Registry..."
docker push $FRONTEND_IMAGE

echo ""
echo "🚀 Deploying frontend to Cloud Run..."
gcloud run deploy visioncopilot-frontend \
    --image=$FRONTEND_IMAGE \
    --platform=managed \
    --region=us-central1 \
    --allow-unauthenticated \
    --port=80 \
    --memory=512Mi \
    --cpu=1 \
    --timeout=60 \
    --max-instances=5 \
    --min-instances=0

# Get frontend URL
FRONTEND_URL=$(gcloud run services describe visioncopilot-frontend \
    --region=us-central1 \
    --format='value(status.url)')

echo ""
echo "=========================================================="
echo "🎉 Deployment Complete!"
echo "=========================================================="
echo ""
echo "📱 Frontend URL: $FRONTEND_URL"
echo "🔧 Backend URL:  $BACKEND_URL"
echo ""
echo "🏆 HACKATHON PROOF:"
echo "1. Visit GCP Console: https://console.cloud.google.com/run?project=$PROJECT_ID"
echo "2. Take screenshot of deployed services"
echo "3. Or use these URLs as proof of deployment"
echo ""
echo "🧪 Test your deployment:"
echo "   curl $BACKEND_URL/health"
echo ""
echo "📊 View logs:"
echo "   gcloud run services logs read visioncopilot-backend --region=us-central1"
echo ""
echo "🛡️  Security: Don't forget to delete when done testing:"
echo "   gcloud run services delete visioncopilot-backend --region=us-central1 --quiet"
echo "   gcloud run services delete visioncopilot-frontend --region=us-central1 --quiet"
echo ""
