#!/bin/bash

# Universal Docker startup script for Options Dashboard MVP
# Works on Linux, macOS, and Windows (with WSL/Git Bash)

set -e

echo "🚀 Options Dashboard MVP - Docker Startup"
echo "=========================================="

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop or Docker Engine."
    exit 1
fi

# Check if docker-compose is available
if ! command -v docker-compose > /dev/null 2>&1; then
    echo "❌ docker-compose not found. Please install docker-compose."
    exit 1
fi

# Check if .env file exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.docker .env
    echo "⚠️  IMPORTANT: Edit .env file with your actual API keys before proceeding!"
    echo "   Required keys: ALPHA_VANTAGE_API_KEY, POLYGON_API_KEY, etc."
    read -p "Press Enter after you've updated the API keys..."
fi

# Parse command line arguments
MODE="production"
BUILD=false
LOGS=false

while [[ $# -gt 0 ]]; do
    case $1 in
        -d|--dev|--development)
            MODE="development"
            shift
            ;;
        -b|--build)
            BUILD=true
            shift
            ;;
        -l|--logs)
            LOGS=true
            shift
            ;;
        --tools)
            MODE="tools"
            shift
            ;;
        -h|--help)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  -d, --dev          Start in development mode"
            echo "  -b, --build        Force rebuild of containers"
            echo "  -l, --logs         Show logs after startup"
            echo "  --tools            Start with database tools (Adminer)"
            echo "  -h, --help         Show this help message"
            exit 0
            ;;
        *)
            echo "Unknown option $1"
            exit 1
            ;;
    esac
done

echo "🔧 Mode: $MODE"

# Build command based on mode
COMPOSE_CMD="docker-compose"
COMPOSE_FILES="-f docker-compose.yml"

case $MODE in
    development)
        COMPOSE_FILES="$COMPOSE_FILES -f docker-compose.dev.yml"
        echo "🛠️  Starting in development mode..."
        ;;
    production)
        COMPOSE_FILES="$COMPOSE_FILES -f docker-compose.prod.yml"
        echo "🏭 Starting in production mode..."
        ;;
    tools)
        COMPOSE_CMD="$COMPOSE_CMD --profile tools"
        echo "🔧 Starting with database tools..."
        ;;
esac

# Stop any running containers
echo "🛑 Stopping any existing containers..."
$COMPOSE_CMD $COMPOSE_FILES down

# Build if requested or if images don't exist
if [ "$BUILD" = true ]; then
    echo "🏗️  Building containers..."
    $COMPOSE_CMD $COMPOSE_FILES build --no-cache
fi

# Start services
echo "🚀 Starting services..."
if [ "$MODE" = "development" ]; then
    $COMPOSE_CMD $COMPOSE_FILES up -d
else
    $COMPOSE_CMD $COMPOSE_FILES up -d
fi

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 10

# Health check
echo "🔍 Checking service health..."
if curl -f http://localhost:4000/api/health > /dev/null 2>&1; then
    echo "✅ Application is running successfully!"
    echo ""
    echo "🌐 Web Application: http://localhost:4000"
    if [ "$MODE" = "tools" ] || [ "$MODE" = "development" ]; then
        echo "🗄️  Database Admin: http://localhost:8080"
    fi
else
    echo "⚠️  Application may still be starting up..."
    echo "   Check logs with: docker-compose logs -f app"
fi

# Show logs if requested
if [ "$LOGS" = true ]; then
    echo ""
    echo "📋 Showing logs (Press Ctrl+C to exit):"
    $COMPOSE_CMD $COMPOSE_FILES logs -f
fi

echo ""
echo "🎉 Startup complete!"
echo ""
echo "Management commands:"
echo "  View logs:      docker-compose logs -f"
echo "  Stop services:  docker-compose down"
echo "  Restart:        docker-compose restart"