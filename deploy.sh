#!/bin/bash

echo "🚀 MERN Stack Deployment Script for Vercel"
echo "=========================================="

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
echo "🔍 Checking prerequisites..."

if ! command_exists git; then
    echo "❌ Git is not installed. Please install Git first."
    exit 1
fi

if ! command_exists node; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

if ! command_exists npm; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ All prerequisites are installed"

# Backend deployment preparation
echo ""
echo "🔧 Preparing Backend for Deployment..."
echo "====================================="

if [ ! -d "backend" ]; then
    echo "❌ Backend directory not found"
    exit 1
fi

cd backend

# Install dependencies
echo "📦 Installing backend dependencies..."
if npm install; then
    echo "✅ Backend dependencies installed"
else
    echo "❌ Failed to install backend dependencies"
    exit 1
fi

# Check for .env file
if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found in backend directory"
    echo "Please create .env file with the following variables:"
    echo ""
    echo "MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname"
    echo "JWT_SECRET=your_super_secret_jwt_key_here"
    echo "JWT_EXPIRE=7d"
    echo "NODE_ENV=production"
    echo "EMAIL_HOST=smtp.gmail.com"
    echo "EMAIL_PORT=587"
    echo "EMAIL_USER=your_email@gmail.com"
    echo "EMAIL_PASS=your_gmail_app_password"
    echo "CLIENT_URL=https://your-frontend-domain.vercel.app"
    echo "MAX_FILE_SIZE=5000000"
    echo ""
    read -p "Press Enter when .env file is ready..."
fi

# Git setup for backend
echo "📤 Setting up Git for backend..."
if [ ! -d ".git" ]; then
    git init
    echo "✅ Git repository initialized for backend"
fi

git add .
if git commit -m "Deploy backend to Vercel - $(date)"; then
    echo "✅ Backend code committed to Git"
else
    echo "⚠️  No changes to commit or commit failed"
fi

echo ""
echo "🔗 Backend Deployment Instructions:"
echo "=================================="
echo "1. Create a new repository on GitHub for the backend"
echo "2. Run these commands:"
echo "   git remote add origin https://github.com/yourusername/your-backend-repo.git"
echo "   git push -u origin main"
echo ""
echo "3. Go to https://vercel.com and import the backend repository"
echo "4. Set these Environment Variables in Vercel:"
echo "   • MONGODB_URI = [your MongoDB connection string]"
echo "   • JWT_SECRET = [your JWT secret key]"
echo "   • JWT_EXPIRE = 7d"
echo "   • NODE_ENV = production"
echo "   • EMAIL_HOST = smtp.gmail.com"
echo "   • EMAIL_PORT = 587"
echo "   • EMAIL_USER = [your email]"
echo "   • EMAIL_PASS = [your Gmail app password]"
echo "   • CLIENT_URL = https://your-frontend-domain.vercel.app"
echo "   • MAX_FILE_SIZE = 5000000"
echo ""
echo "5. Click 'Deploy'"

cd ..

# Frontend deployment preparation
echo ""
echo "🎨 Preparing Frontend for Deployment..."
echo "====================================="

if [ ! -d "frontend" ]; then
    echo "❌ Frontend directory not found"
    exit 1
fi

cd frontend

# Install dependencies
echo "📦 Installing frontend dependencies..."
if npm install; then
    echo "✅ Frontend dependencies installed"
else
    echo "❌ Failed to install frontend dependencies"
    exit 1
fi

# Build the project
echo "🔨 Building frontend for production..."
if npm run build; then
    echo "✅ Frontend build successful"
else
    echo "❌ Frontend build failed"
    exit 1
fi

# Git setup for frontend
echo "📤 Setting up Git for frontend..."
if [ ! -d ".git" ]; then
    git init
    echo "✅ Git repository initialized for frontend"
fi

git add .
if git commit -m "Deploy frontend to Vercel - $(date)"; then
    echo "✅ Frontend code committed to Git"
else
    echo "⚠️  No changes to commit or commit failed"
fi

echo ""
echo "🔗 Frontend Deployment Instructions:"
echo "==================================="
echo "1. Create a new repository on GitHub for the frontend"
echo "2. Run these commands:"
echo "   git remote add origin https://github.com/yourusername/your-frontend-repo.git"
echo "   git push -u origin main"
echo ""
echo "3. Go to https://vercel.com and import the frontend repository"
echo "4. The VITE_API_URL is already configured in vercel.json"
echo "   OR manually set: VITE_API_URL = https://your-backend-domain.vercel.app/api"
echo ""
echo "5. Click 'Deploy'"

cd ..

echo ""
echo "🎉 DEPLOYMENT PREPARATION COMPLETE!"
echo "==================================="
echo ""
echo "📋 SUMMARY:"
echo "=========="
echo "✅ Backend prepared with dependencies and Git setup"
echo "✅ Frontend built successfully and ready for deployment"
echo "✅ Environment variables documented"
echo "✅ Deployment instructions provided"
echo ""
echo "🚀 NEXT STEPS:"
echo "1. Create GitHub repositories"
echo "2. Push code to GitHub"
echo "3. Import to Vercel and set environment variables"
echo "4. Deploy and test your application!"
echo ""
echo "🎊 Your MERN application is ready to go live!"
echo ""
echo "Need help? Check the README.md file for detailed instructions."