#!/bin/bash

echo "🚀 Starting MERN Stack Deployment to Vercel"
echo "==========================================="

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
fi

# Deploy Backend
echo "📦 Deploying Backend..."
cd backend

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Please create it from .env.example"
    echo "Run: cp .env.example .env"
    echo "Then edit the values with your MongoDB Atlas credentials"
    exit 1
fi

# Deploy backend
vercel --prod

# Get backend URL
BACKEND_URL=$(vercel ls | grep "https://" | head -1 | awk '{print $2}')
echo "✅ Backend deployed at: $BACKEND_URL"

cd ..

# Deploy Frontend
echo "🎨 Deploying Frontend..."
cd frontend

# Set environment variable for frontend
echo "VITE_API_URL=$BACKEND_URL/api" > .env.production

# Deploy frontend
vercel --prod

# Get frontend URL
FRONTEND_URL=$(vercel ls | grep "https://" | head -1 | awk '{print $2}')
echo "✅ Frontend deployed at: $FRONTEND_URL"

cd ..

echo ""
echo "🎉 Deployment Complete!"
echo "======================"
echo "📱 Frontend: $FRONTEND_URL"
echo "🔧 Backend:  $BACKEND_URL"
echo ""
echo "📝 Next Steps:"
echo "1. Update CLIENT_URL in backend environment variables to: $FRONTEND_URL"
echo "2. Test the application"
echo "3. Set up custom domain (optional)"
echo ""
echo "Happy coding! 🚀"