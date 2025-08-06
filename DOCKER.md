# 🐳 Docker Deployment Guide

This guide covers deploying the Options Dashboard MVP using Docker containers across Windows, Linux, and macOS.

## 📋 Prerequisites

- Docker Desktop (Windows/macOS) or Docker Engine (Linux)
- Docker Compose v2.0+
- At least 4GB RAM available for Docker
- 2GB free disk space

### Platform-Specific Setup

#### Windows
1. Install [Docker Desktop for Windows](https://docs.docker.com/desktop/install/windows-install/)
2. Enable WSL2 backend (recommended)
3. Open PowerShell or Command Prompt as Administrator

#### macOS  
1. Install [Docker Desktop for Mac](https://docs.docker.com/desktop/install/mac-install/)
2. Open Terminal

#### Linux (Ubuntu/Debian)
```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Add user to docker group
sudo usermod -aG docker $USER
newgrp docker
```

## 🚀 Quick Start

### 1. Clone and Prepare Environment

```bash
# Clone the repository (if not already cloned)
git clone <repository-url>
cd optionsDashboardMVP

# Copy environment template
cp .env.docker .env

# Edit .env with your actual API keys
nano .env  # Linux/macOS
notepad .env  # Windows
```

### 2. Configure API Keys

Edit `.env` file and replace placeholder values:

```env
# Required: Replace with your actual API keys
ALPHA_VANTAGE_API_KEY=your_actual_alpha_vantage_key
POLYGON_API_KEY=your_actual_polygon_key
TWELVE_DATA_API_KEY=your_actual_twelve_data_key
MARKETDATA_APP_API_KEY1=your_actual_marketdata_key_1
MARKETDATA_APP_API_KEY2=your_actual_marketdata_key_2

# Optional: IBKR Configuration
IBKR_GATEWAY_URL=https://localhost:5000
IBKR_ACCOUNT_ID=your_ibkr_account_id
```

### 3. Deploy with Docker Compose

```bash
# Build and start all services
docker-compose up --build -d

# View logs
docker-compose logs -f app

# Check service status
docker-compose ps
```

### 4. Access the Application

- **Web Application**: http://localhost:4000
- **Database Admin** (optional): http://localhost:8080

## 📊 Service Architecture

The Docker setup includes:

- **app**: Next.js application container
- **db**: SQLite database container for data persistence  
- **adminer** (optional): Web-based database management

## 🔧 Management Commands

### Starting Services
```bash
# Start all services
docker-compose up -d

# Start with database admin tools
docker-compose --profile tools up -d

# Start only the app (if database exists)
docker-compose up app -d
```

### Stopping Services
```bash
# Stop all services
docker-compose down

# Stop and remove volumes (⚠️ deletes database)
docker-compose down -v
```

### Viewing Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f app

# Last 100 lines
docker-compose logs --tail=100 app
```

### Database Management
```bash
# Initialize database manually
docker-compose exec app node scripts/init-db.js

# Backup database
docker-compose exec app cp /app/data/options_scanner.db /app/data/backup_$(date +%Y%m%d).db

# Access database directly
docker-compose exec db sh
```

## 🔄 Updates and Rebuilds

### Updating Application Code
```bash
# Pull latest changes
git pull origin main

# Rebuild and restart
docker-compose up --build -d

# Force rebuild (clears cache)
docker-compose build --no-cache app
docker-compose up -d
```

### Managing Data
```bash
# List docker volumes
docker volume ls

# Inspect app data volume
docker volume inspect optionsdashboardmvp_app_data

# Backup data volume
docker run --rm -v optionsdashboardmvp_app_data:/data -v $(pwd):/backup alpine tar czf /backup/data-backup.tar.gz -C /data .
```

## 🐛 Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# Windows
netstat -ano | findstr :4000
taskkill /PID <PID> /F

# Linux/macOS  
lsof -ti:4000
kill -9 <PID>
```

#### Database Initialization Failed
```bash
# Remove existing database and restart
docker-compose down
docker volume rm optionsdashboardmvp_app_data
docker-compose up -d
```

#### Permission Issues (Linux)
```bash
# Fix ownership
sudo chown -R $USER:$USER .
```

#### Build Failures
```bash
# Clear Docker cache
docker system prune -a

# Remove old images
docker image prune -a

# Clean rebuild
docker-compose build --no-cache
```

### Health Checks

#### Application Health
```bash
# Check if app is responding
curl -f http://localhost:4000/api/health || echo "App not healthy"

# Check container health
docker-compose exec app npm run test
```

#### Database Health
```bash
# Verify database structure
docker-compose exec app node -e "
const sqlite3 = require('sqlite3');
const db = new sqlite3.Database('/app/data/options_scanner.db');
db.all('SELECT name FROM sqlite_master WHERE type=\"table\"', (err, tables) => {
  console.log('Tables:', tables);
  db.close();
});
"
```

## 📈 Performance Optimization

### Resource Limits
Add to docker-compose.yml:
```yaml
services:
  app:
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 2G
        reservations:
          cpus: '0.5'
          memory: 512M
```

### Volume Optimization
```bash
# Use named volumes for better performance
volumes:
  app_data:
    driver: local
    driver_opts:
      type: none
      o: bind
      device: ./data
```

## 🔒 Security Considerations

### Production Deployment
1. **Environment Variables**: Never commit real API keys
2. **Network Security**: Use Docker networks for service isolation
3. **User Permissions**: Run containers as non-root users
4. **Resource Limits**: Set appropriate CPU/memory limits
5. **Log Management**: Implement log rotation

### Reverse Proxy Setup (Nginx)
```yaml
# docker-compose.yml addition
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
```

## 📝 Development vs Production

### Development
```bash
# Use development compose file
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up
```

### Production
```bash
# Production optimizations
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

## 🆘 Support

If you encounter issues:

1. Check the logs: `docker-compose logs -f`
2. Verify all services are running: `docker-compose ps`
3. Test API endpoints: `curl http://localhost:4000/api/health`
4. Check database connectivity: Access adminer at http://localhost:8080

## 📚 Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Next.js Docker Guide](https://nextjs.org/docs/deployment#docker-image)