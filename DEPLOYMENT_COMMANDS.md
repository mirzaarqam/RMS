# Quick Deployment Commands

## Local Production Test (Windows)
```powershell
# Navigate to project
cd C:\Users\arqam.mirza\PycharmProjects\RMS

# Option 1: Use deployment script
.\deploy.bat

# Option 2: Manual commands
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Stop
docker-compose -f docker-compose.prod.yml down
```

## Production Server Deployment (Linux)
```bash
# Clone repository
git clone https://github.com/mirzaarqam/RMS.git
cd RMS

# Setup environment
cp .env.example .env
nano .env  # Edit configuration

# Make deployment script executable
chmod +x deploy.sh

# Deploy
./deploy.sh

# Or manual
docker-compose -f docker-compose.prod.yml up -d --build
```

## Access Application
- Frontend: http://localhost:8088
- Backend API: http://localhost:5000/api
- Default Login: admin / (password from .env)

## Monitoring
```powershell
# Check status
docker ps

# View logs
docker logs rms-backend-prod -f
docker logs rms-frontend-prod -f

# Check resource usage
docker stats

# Health check
curl http://localhost:5000/api/validate
curl http://localhost:8088
```

## Updates
```powershell
# Pull latest code
git pull

# Rebuild and restart
docker-compose -f docker-compose.prod.yml up -d --build

# Or rebuild specific service
docker-compose -f docker-compose.prod.yml up -d --build backend
```

## Backup Database
```powershell
# Copy from container
docker cp rms-backend-prod:/app/database.db ./backup_database.db

# Or use volume
copy .\database.db .\backups\database_backup_YYYYMMDD.db
```

## Troubleshooting
```powershell
# Restart services
docker-compose -f docker-compose.prod.yml restart

# View detailed logs
docker-compose -f docker-compose.prod.yml logs --tail=200

# Clean rebuild
docker-compose -f docker-compose.prod.yml down -v
docker-compose -f docker-compose.prod.yml up -d --build

# Access container shell
docker exec -it rms-backend-prod /bin/bash
```

## Cloud Deployment (Example: AWS EC2)
```bash
# SSH to server
ssh ubuntu@your-server-ip

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker ubuntu

# Clone and deploy
git clone https://github.com/mirzaarqam/RMS.git
cd RMS
cp .env.example .env
nano .env  # Update with production values
sudo docker-compose -f docker-compose.prod.yml up -d --build

# Setup firewall
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

## SSL/HTTPS Setup (with Nginx)
```bash
# Install Certbot
sudo apt install nginx certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d yourdomain.com

# Auto-renewal
sudo certbot renew --dry-run
```
