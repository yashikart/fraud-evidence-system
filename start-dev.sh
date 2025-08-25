#!/bin/bash

# Development startup script for fraud dashboard

echo "🚀 Starting Fraud Dashboard Development Environment"

# Check if MongoDB is running
if ! pgrep -x "mongod" > /dev/null; then
    echo "📦 Starting MongoDB..."
    # For macOS with Homebrew
    if command -v brew &> /dev/null; then
        brew services start mongodb-community
    else
        # For Linux/Docker
        docker run -d --name mongo-dev -p 27017:27017 mongo:6
    fi
fi

# Start Backend
echo "🔧 Starting Backend Server..."
cd Backend
npm install
npm start &
BACKEND_PID=$!

# Wait for backend to start
echo "⏳ Waiting for backend to start..."
sleep 5

# Start Frontend
echo "🎨 Starting Frontend..."
cd ../Frontend
npm install
npm start &
FRONTEND_PID=$!

echo "✅ Development environment started!"
echo "📊 Frontend: http://localhost:3000"
echo "🔧 Backend: http://localhost:5050"
echo "🗄️ MongoDB: mongodb://localhost:27017"

# Function to cleanup on exit
cleanup() {
    echo "🛑 Shutting down..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit
}

# Trap cleanup function on script exit
trap cleanup SIGINT SIGTERM

# Wait for processes
wait
