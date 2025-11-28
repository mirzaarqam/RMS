# 🚀 Production Deployment Guide - RMS Application

## Overview
This guide covers deploying the RMS (Roster Management System) to production using Docker.

---

## 📋 Prerequisites

### Required Software
- **Docker** (20.10+)
- **Docker Compose** (2.0+)
- **Git** (for version control)

### Recommended Server Specs
- **Minimum**: 1 CPU, 2GB RAM, 20GB disk
- **Recommended**: 2 CPU, 4GB RAM, 40GB disk
- **OS**: Ubuntu 20.04+, Debian 11+, or Windows Server 2019+

---

## 🔧 Pre-Deployment Setup

### 1. Prepare Production Environment

**On Linux/Ubuntu Server:**
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo apt install docker-compose-plugin

# Verify installation
docker --version
docker compose version
```

**On Windows Server:**
- Install Docker Desktop for Windows
- Enable WSL2
- Verify Docker is running

### 2. Clone Repository (If deploying to server)

```bash
git clone https://github.com/mirzaarqam/RMS.git
cd RMS
```

### 3. Configure Environment Variables

```bash
# Copy example env file
cp .env.example .env

# Edit with your production values
nano .env  # or use any text editor
```

**Important:** Change these values in `.env`:
- `SECRET_KEY` - Generate a strong random key
- `ADMIN_PASSWORD` - Set a secure password
- `CORS_ORIGINS` - Add your domain

### 4. Secure Database Credentials

**Update api.py for production credentials:**
- Change default admin username/password
- Use environment variables for sensitive data

```python
# In api.py, update login endpoint:
username = os.getenv('ADMIN_USERNAME', 'admin')
password = os.getenv('ADMIN_PASSWORD', 'your-secure-password')
```

---

## 🚀 Deployment Steps

### Option 1: Docker Compose (Recommended)

#### Step 1: Build Production Images

```bash
cd C:\Users\arqam.mirza\PycharmProjects\RMS

# Build images
docker-compose -f docker-compose.prod.yml build
```

#### Step 2: Start Services

```bash
# Start in detached mode
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose -f docker-compose.prod.yml logs -f
```

#### Step 3: Verify Deployment

```bash
# Check running containers
docker ps

# Check backend health
curl http://localhost:5000/api/validate

# Check frontend
curl http://localhost:8088
```

#### Step 4: Access Application

Open browser: **http://localhost:8088** or **http://your-server-ip:8088**

---

### Option 2: Manual Docker Commands

```bash
# Build backend
docker build -f Dockerfile.backend -t rms-backend:prod .

# Build frontend
docker build -f Dockerfile.frontend -t rms-frontend:prod .

# Create network
docker network create rms-network

# Run backend
docker run -d \
  --name rms-backend-prod \
  --network rms-network \
  -p 5000:5000 \
  -v $(pwd)/database.db:/app/database.db \
  --restart always \
  rms-backend:prod

# Run frontend
docker run -d \
  --name rms-frontend-prod \
  --network rms-network \
  -p 8088:80 \
  --restart always \
  rms-frontend:prod
```

---

## 🌐 Domain & SSL Setup (Production Server)

### 1. Configure Domain

**Update your DNS:**
- Add A record: `rms.yourdomain.com` → `your-server-ip`
- Wait for DNS propagation (5-30 minutes)

### 2. Install Nginx Reverse Proxy

```bash
sudo apt install nginx certbot python3-certbot-nginx

# Create nginx config
sudo nano /etc/nginx/sites-available/rms
```

**Nginx Configuration:**
```nginx
server {
    listen 80;
    server_name rms.yourdomain.com;

    location / {
        proxy_pass http://localhost:8088;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /api {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/rms /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 3. Enable SSL (HTTPS)

```bash
# Get SSL certificate
sudo certbot --nginx -d rms.yourdomain.com

# Auto-renewal is configured automatically
# Test renewal
sudo certbot renew --dry-run
```

---

## 🔒 Security Hardening

### 1. Firewall Configuration

```bash
# Ubuntu/Debian
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable

# Block direct access to app ports
sudo ufw deny 5000
sudo ufw deny 8088
```

### 2. Change Default Credentials

**Update in api.py:**
```python
# Don't use hardcoded credentials in production!
username = os.getenv('ADMIN_USERNAME')
password = os.getenv('ADMIN_PASSWORD')
```

### 3. Enable HTTPS Only

Update `nginx.conf` to redirect HTTP to HTTPS.

### 4. Database Backups

```bash
# Create backup script
cat > backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/backups/rms"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR
cp database.db $BACKUP_DIR/database_$DATE.db
# Keep only last 7 days
find $BACKUP_DIR -name "database_*.db" -mtime +7 -delete
EOF

chmod +x backup.sh

# Add to crontab (daily at 2 AM)
(crontab -l 2>/dev/null; echo "0 2 * * * /path/to/backup.sh") | crontab -
```

---

## 📊 Monitoring & Maintenance

### Check Application Health

```bash
# Check container status
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs --tail=100 -f

# Check resource usage
docker stats
```

### Application Logs

```bash
# Backend logs
docker logs rms-backend-prod --tail=100 -f

# Frontend logs
docker logs rms-frontend-prod --tail=100 -f
```

### Database Health

```bash
# Backup database
docker exec rms-backend-prod cp /app/database.db /app/data/database_backup.db

# Check database size
docker exec rms-backend-prod ls -lh /app/database.db
```

---

## 🔄 Updates & Rollbacks

### Deploy Updates

```bash
# Pull latest code
git pull origin main

# Rebuild and restart
docker-compose -f docker-compose.prod.yml up -d --build

# Or with zero-downtime
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d --no-deps --build backend
docker-compose -f docker-compose.prod.yml up -d --no-deps --build frontend
```

### Rollback

```bash
# Stop current version
docker-compose -f docker-compose.prod.yml down

# Checkout previous version
git checkout <previous-commit-hash>

# Rebuild
docker-compose -f docker-compose.prod.yml up -d --build
```

---

## 🐛 Troubleshooting

### Containers Not Starting

```bash
# Check logs
docker-compose -f docker-compose.prod.yml logs

# Restart services
docker-compose -f docker-compose.prod.yml restart

# Rebuild from scratch
docker-compose -f docker-compose.prod.yml down -v
docker-compose -f docker-compose.prod.yml up -d --build
```

### Database Issues

```bash
# Access container shell
docker exec -it rms-backend-prod /bin/bash

# Check database
sqlite3 database.db "SELECT COUNT(*) FROM employees;"
```

### Connection Issues

```bash
# Test backend
curl http://localhost:5000/api/validate

# Test frontend
curl http://localhost:8088

# Check network
docker network inspect rms_rms-network
```

### High Memory Usage

```bash
# Restart services
docker-compose -f docker-compose.prod.yml restart

# Limit resources in docker-compose.prod.yml
# Add under each service:
resources:
  limits:
    cpus: '1'
    memory: 1G
```

---

## 📈 Performance Optimization

### 1. Enable Gzip Compression

Already configured in `nginx.conf`.

### 2. Database Optimization

```sql
-- Run periodically
VACUUM;
ANALYZE;
```

### 3. Caching

Add Redis for session management (optional):
```yaml
# Add to docker-compose.prod.yml
redis:
  image: redis:alpine
  restart: always
```

---

## 🎯 Production Checklist

- [ ] Environment variables configured
- [ ] Default credentials changed
- [ ] SSL certificate installed
- [ ] Firewall configured
- [ ] Database backup script running
- [ ] Monitoring setup
- [ ] DNS configured
- [ ] Application tested
- [ ] Error logging configured
- [ ] Documentation updated

---

## 📞 Quick Commands Reference

```bash
# Start production
docker-compose -f docker-compose.prod.yml up -d

# Stop production
docker-compose -f docker-compose.prod.yml down

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Restart
docker-compose -f docker-compose.prod.yml restart

# Update
docker-compose -f docker-compose.prod.yml up -d --build

# Backup database
docker cp rms-backend-prod:/app/database.db ./backup_$(date +%Y%m%d).db
```

---

## 🌍 Deployment Platforms

### Deploy to Cloud

#### AWS EC2
1. Launch EC2 instance (t2.small or larger)
2. Install Docker
3. Configure security groups (ports 80, 443)
4. Follow deployment steps above

#### DigitalOcean
1. Create Droplet (Docker marketplace image)
2. SSH into droplet
3. Clone repo and deploy

#### Azure
1. Create VM with Docker
2. Configure NSG rules
3. Deploy application

#### Google Cloud Platform
1. Create Compute Engine instance
2. Enable HTTP/HTTPS traffic
3. Deploy with Docker

---

## 🆘 Support

For issues:
1. Check logs: `docker-compose logs`
2. Verify configuration files
3. Check firewall settings
4. Review error messages

---

**Deployment Date:** November 28, 2025  
**Version:** 1.0  
**Environment:** Production  
**Port:** 8088 (Frontend), 5000 (Backend)
