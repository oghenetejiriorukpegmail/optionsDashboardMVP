#!/bin/bash

# Docker setup validation script
# Tests that the Docker configuration works correctly

set -e

echo "🔍 Docker Setup Validation"
echo "=========================="

# Test 1: Check Docker availability
echo "1️⃣  Testing Docker availability..."
if ! docker --version > /dev/null 2>&1; then
    echo "❌ Docker not found or not running"
    exit 1
fi
echo "✅ Docker is available: $(docker --version)"

# Test 2: Check docker-compose availability
echo "2️⃣  Testing docker-compose availability..."
if ! docker-compose --version > /dev/null 2>&1; then
    echo "❌ docker-compose not found"
    exit 1
fi
echo "✅ docker-compose is available: $(docker-compose --version)"

# Test 3: Validate docker-compose.yml syntax
echo "3️⃣  Validating docker-compose.yml syntax..."
if ! docker-compose config > /dev/null 2>&1; then
    echo "❌ docker-compose.yml syntax error"
    docker-compose config
    exit 1
fi
echo "✅ docker-compose.yml syntax is valid"

# Test 4: Check if required files exist
echo "4️⃣  Checking required files..."
REQUIRED_FILES=(
    "Dockerfile"
    ".dockerignore"
    "docker-compose.yml"
    "package.json"
    "scripts/init-db.js"
    "scripts/docker-init.sh"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        echo "❌ Required file missing: $file"
        exit 1
    fi
done
echo "✅ All required files exist"

# Test 5: Check environment file
echo "5️⃣  Checking environment configuration..."
if [ ! -f ".env" ] && [ ! -f ".env.docker" ]; then
    echo "❌ No environment file found (.env or .env.docker)"
    exit 1
fi

if [ -f ".env" ]; then
    if grep -q "your_.*_key_here" .env; then
        echo "⚠️  Warning: .env file contains placeholder API keys"
        echo "   Update with real API keys for production use"
    fi
fi
echo "✅ Environment configuration found"

# Test 6: Build test (dry run)
echo "6️⃣  Testing Docker build (dry run)..."
if ! docker-compose build --dry-run > /dev/null 2>&1; then
    echo "❌ Docker build test failed"
    exit 1
fi
echo "✅ Docker build validation passed"

# Test 7: Check port availability
echo "7️⃣  Checking port availability..."
if lsof -Pi :4000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "⚠️  Warning: Port 4000 is already in use"
    echo "   Stop other services using this port before starting"
else
    echo "✅ Port 4000 is available"
fi

if lsof -Pi :8080 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "⚠️  Warning: Port 8080 is already in use (Adminer)"
else
    echo "✅ Port 8080 is available"
fi

# Test 8: Validate scripts are executable
echo "8️⃣  Checking script permissions..."
SCRIPTS=(
    "scripts/docker-init.sh"
    "start-docker.sh"
)

for script in "${SCRIPTS[@]}"; do
    if [ ! -x "$script" ]; then
        echo "⚠️  Warning: $script is not executable"
        echo "   Run: chmod +x $script"
    fi
done
echo "✅ Script permissions checked"

# Test 9: Quick integration test (optional)
read -p "9️⃣  Run integration test? This will start/stop containers (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🧪 Running integration test..."
    
    # Start services
    echo "   Starting services..."
    docker-compose up -d --build
    
    # Wait for startup
    echo "   Waiting for startup..."
    sleep 30
    
    # Test health endpoint
    echo "   Testing health endpoint..."
    if curl -f http://localhost:4000/api/health > /dev/null 2>&1; then
        echo "✅ Integration test passed"
    else
        echo "❌ Integration test failed - health endpoint not responding"
        docker-compose logs app
    fi
    
    # Cleanup
    echo "   Cleaning up..."
    docker-compose down
    
else
    echo "⏭️  Integration test skipped"
fi

echo ""
echo "🎉 Validation Complete!"
echo ""
echo "Summary:"
echo "✅ Docker setup is ready for deployment"
echo "📚 See DOCKER.md for deployment instructions"
echo "🚀 Run ./start-docker.sh to start the application"