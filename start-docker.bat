@echo off
setlocal enabledelayedexpansion

echo 🚀 Options Dashboard MVP - Docker Startup (Windows)
echo =====================================================

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker is not running. Please start Docker Desktop.
    pause
    exit /b 1
)

REM Check if .env file exists
if not exist .env (
    echo 📝 Creating .env file from template...
    copy .env.docker .env >nul
    echo ⚠️  IMPORTANT: Edit .env file with your actual API keys!
    echo    Required keys: ALPHA_VANTAGE_API_KEY, POLYGON_API_KEY, etc.
    pause
)

REM Parse arguments (simplified for batch)
set MODE=production
set BUILD_FLAG=
set LOGS_FLAG=false

:parse_args
if "%1"=="--dev" (
    set MODE=development
    shift
    goto parse_args
)
if "%1"=="--build" (
    set BUILD_FLAG=--build
    shift
    goto parse_args
)
if "%1"=="--logs" (
    set LOGS_FLAG=true
    shift
    goto parse_args
)
if "%1"=="--help" (
    echo Usage: start-docker.bat [OPTIONS]
    echo.
    echo Options:
    echo   --dev     Start in development mode
    echo   --build   Force rebuild of containers
    echo   --logs    Show logs after startup
    echo   --help    Show this help message
    exit /b 0
)
if not "%1"=="" (
    shift
    goto parse_args
)

echo 🔧 Mode: %MODE%

REM Build compose command
set COMPOSE_FILES=-f docker-compose.yml

if "%MODE%"=="development" (
    set COMPOSE_FILES=!COMPOSE_FILES! -f docker-compose.dev.yml
    echo 🛠️  Starting in development mode...
) else (
    set COMPOSE_FILES=!COMPOSE_FILES! -f docker-compose.prod.yml
    echo 🏭 Starting in production mode...
)

REM Stop existing containers
echo 🛑 Stopping any existing containers...
docker-compose %COMPOSE_FILES% down

REM Start services
echo 🚀 Starting services...
docker-compose %COMPOSE_FILES% up -d %BUILD_FLAG%

REM Wait for services
echo ⏳ Waiting for services to start...
timeout /t 10 /nobreak >nul

REM Health check
echo 🔍 Checking service health...
curl -f http://localhost:4000/api/health >nul 2>&1
if errorlevel 1 (
    echo ⚠️  Application may still be starting up...
    echo    Check logs with: docker-compose logs -f app
) else (
    echo ✅ Application is running successfully!
    echo.
    echo 🌐 Web Application: http://localhost:4000
    if "%MODE%"=="development" echo 🗄️  Database Admin: http://localhost:8080
)

if "%LOGS_FLAG%"=="true" (
    echo.
    echo 📋 Showing logs (Press Ctrl+C to exit):
    docker-compose %COMPOSE_FILES% logs -f
)

echo.
echo 🎉 Startup complete!
echo.
echo Management commands:
echo   View logs:      docker-compose logs -f
echo   Stop services:  docker-compose down
echo   Restart:        docker-compose restart

pause