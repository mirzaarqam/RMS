# 🚀 Native Deployment Guide (Without Docker)

## Overview
Deploy RMS application using systemd service for backend and Nginx for frontend on Ubuntu/Debian server.

---

## 📋 Prerequisites

- **Ubuntu 20.04+ or Debian 11+**
- **Root/sudo access**
- **Minimum**: 1 CPU, 2GB RAM, 20GB disk

---

## 🔧 Quick Deployment

### Option 1: Automated Script

```bash
# Upload project to server
scp -r C:\Users\arqam.mirza\PycharmProjects\RMS user@server:/tmp/

# SSH to server
ssh user@server

# Run deployment script
cd /tmp/RMS
sudo chmod +x deploy-native.sh
sudo ./deploy-native.sh
```

### Option 2: Manual Deployment

Follow steps below for detailed control.

---

## 📦 Step-by-Step Manual Deployment

### 1. Install System Dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install required packages
sudo apt install -y python3 python3-pip python3-venv nginx nodejs npm git curl

# Verify installations
python3 --version
node --version
nginx -v
```

### 2. Create Application Directory

```bash
# Create app directory
sudo mkdir -p /var/www/rms
sudo mkdir -p /var/log/rms

# Set ownership
sudo chown -R $USER:$USER /var/www/rms
sudo chown -R www-data:www-data /var/log/rms
```

### 3. Upload Application Files

**From Windows (PowerShell):**
```powershell
# Using SCP
scp -r C:\Users\arqam.mirza\PycharmProjects\RMS\* user@server:/var/www/rms/

# Or using Git
ssh user@server
cd /var/www/rms
git clone https://github.com/mirzaarqam/RMS.git .
```

### 4. Setup Python Backend

```bash
cd /var/www/rms

# Create virtual environment
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate

# Install dependencies
pip install --upgrade pip
pip install -r requirements_prod.txt

# Test backend
python api.py
# Press Ctrl+C after confirming it works
```

### 5. Build React Frontend

```bash
cd /var/www/rms/frontend

# Install dependencies
npm install

# Build production bundle
npm run build

# Verify build
ls -la build/
```

### 6. Configure Backend Service

```bash
# Copy service file
sudo cp /var/www/rms/rms-backend.service /etc/systemd/system/

# Reload systemd
sudo systemctl daemon-reload

# Enable service (auto-start on boot)
sudo systemctl enable rms-backend

# Start service
sudo systemctl start rms-backend

# Check status
sudo systemctl status rms-backend
```

### 7. Configure Nginx

```bash
# Copy nginx configuration
sudo cp /var/www/rms/rms-nginx.conf /etc/nginx/sites-available/rms

# Create symbolic link
sudo ln -s /etc/nginx/sites-available/rms /etc/nginx/sites-enabled/rms

# Remove default site
sudo rm -f /etc/nginx/sites-enabled/default

# Test nginx configuration
sudo nginx -t

# Restart nginx
sudo systemctl restart nginx

# Enable nginx (auto-start on boot)
sudo systemctl enable nginx
```

### 8. Set Proper Permissions

```bash
# Set ownership
sudo chown -R www-data:www-data /var/www/rms

# Set file permissions
sudo find /var/www/rms -type f -exec chmod 644 {} \;
sudo find /var/www/rms -type d -exec chmod 755 {} \;

# Make venv executable
sudo chmod +x /var/www/rms/venv/bin/*
```

### 9. Configure Firewall

```bash
# Allow HTTP/HTTPS
sudo ufw allow 8088/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 22/tcp

# Enable firewall
sudo ufw enable
sudo ufw status
```

---

## ✅ Verification

### Check Services

```bash
# Check backend service
sudo systemctl status rms-backend

# Check nginx
sudo systemctl status nginx

# Check if port 5000 is listening (backend)
sudo netstat -tlnp | grep 5000

# Check if port 8088 is listening (frontend)
sudo netstat -tlnp | grep 8088
```

### Test Application

```bash
# Test backend API
curl http://localhost:5000/api/validate

# Test frontend
curl http://localhost:8088

# Access from browser
http://YOUR_SERVER_IP:8088
```

---

## 📊 Monitoring & Logs

### View Logs

```bash
# Backend logs (real-time)
sudo journalctl -u rms-backend -f

# Backend access logs
sudo tail -f /var/log/rms/access.log

# Backend error logs
sudo tail -f /var/log/rms/error.log

# Nginx access logs
sudo tail -f /var/log/nginx/access.log

# Nginx error logs
sudo tail -f /var/log/nginx/error.log
```

### Service Management

```bash
# Start service
sudo systemctl start rms-backend

# Stop service
sudo systemctl stop rms-backend

# Restart service
sudo systemctl restart rms-backend

# Reload (without downtime)
sudo systemctl reload rms-backend

# Check status
sudo systemctl status rms-backend

# Enable auto-start on boot
sudo systemctl enable rms-backend

# Disable auto-start
sudo systemctl disable rms-backend
```

---

## 🔄 Updates & Maintenance

### Update Application

```bash
# Navigate to app directory
cd /var/www/rms

# Backup database
sudo cp database.db database_backup_$(date +%Y%m%d).db

# Pull latest code (if using git)
git pull origin main

# Or upload new files
# scp -r new_files user@server:/var/www/rms/

# Update backend dependencies
source venv/bin/activate
pip install -r requirements_prod.txt

# Rebuild frontend
cd frontend
npm install
npm run build
cd ..

# Restart services
sudo systemctl restart rms-backend
sudo systemctl reload nginx
```

### Rollback

```bash
# Restore database backup
sudo cp database_backup_YYYYMMDD.db database.db

# Checkout previous git version
git checkout <previous-commit-hash>

# Rebuild
source venv/bin/activate
pip install -r requirements_prod.txt
cd frontend && npm run build && cd ..

# Restart
sudo systemctl restart rms-backend
```

---

## 🔒 Security Hardening

### 1. Change Default Credentials

Edit `/var/www/rms/api.py`:
```python
# Update login credentials
if username == os.getenv('ADMIN_USERNAME', 'admin') and \
   password == os.getenv('ADMIN_PASSWORD', 'your-secure-password'):
```

### 2. SSL/HTTPS Setup

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com

# Auto-renewal test
sudo certbot renew --dry-run
```

Update `rms-nginx.conf` for HTTPS:
```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com;
    
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    
    # Rest of configuration...
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}
```

### 3. Database Backups

```bash
# Create backup script
sudo nano /usr/local/bin/backup-rms-db.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/rms"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR
cp /var/www/rms/database.db $BACKUP_DIR/database_$DATE.db
# Keep only last 7 days
find $BACKUP_DIR -name "database_*.db" -mtime +7 -delete
```

```bash
# Make executable
sudo chmod +x /usr/local/bin/backup-rms-db.sh

# Add to crontab (daily at 2 AM)
sudo crontab -e
# Add line:
0 2 * * * /usr/local/bin/backup-rms-db.sh
```

---

## 🐛 Troubleshooting

### Backend Not Starting

```bash
# Check service status
sudo systemctl status rms-backend

# Check logs
sudo journalctl -u rms-backend -n 50

# Test manually
cd /var/www/rms
source venv/bin/activate
python api.py
```

### Nginx Errors

```bash
# Test configuration
sudo nginx -t

# Check error logs
sudo tail -f /var/log/nginx/error.log

# Restart nginx
sudo systemctl restart nginx
```

### Port Already in Use

```bash
# Check what's using port 8088
sudo netstat -tlnp | grep 8088

# Kill process if needed
sudo kill -9 <PID>
```

### Permission Denied

```bash
# Fix ownership
sudo chown -R www-data:www-data /var/www/rms

# Fix permissions
sudo chmod -R 755 /var/www/rms
```

### Database Locked

```bash
# Check file permissions
ls -la /var/www/rms/database.db

# Fix permissions
sudo chown www-data:www-data /var/www/rms/database.db
sudo chmod 644 /var/www/rms/database.db
```

---

## 📈 Performance Optimization

### 1. Increase Gunicorn Workers

Edit `/etc/systemd/system/rms-backend.service`:
```ini
ExecStart=/var/www/rms/venv/bin/gunicorn --workers 8 --bind 127.0.0.1:5000 ...
```

Calculate workers: `(2 x CPU cores) + 1`

### 2. Enable Nginx Caching

Add to nginx config:
```nginx
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=rms_cache:10m max_size=100m;
proxy_cache rms_cache;
proxy_cache_valid 200 10m;
```

### 3. Database Optimization

```bash
# Optimize database
sqlite3 /var/www/rms/database.db "VACUUM; ANALYZE;"
```

---

## 📞 Quick Commands Reference

```bash
# Service Management
sudo systemctl start rms-backend
sudo systemctl stop rms-backend
sudo systemctl restart rms-backend
sudo systemctl status rms-backend

# Logs
sudo journalctl -u rms-backend -f
sudo tail -f /var/log/rms/error.log
sudo tail -f /var/log/nginx/error.log

# Nginx
sudo nginx -t
sudo systemctl reload nginx
sudo systemctl restart nginx

# Database Backup
sudo cp /var/www/rms/database.db /var/backups/rms/database_$(date +%Y%m%d).db

# Check Ports
sudo netstat -tlnp | grep -E '5000|8088'
```

---

## 🌐 Access Application

- **Local Server**: http://localhost:8088
- **Remote Server**: http://SERVER_IP:8088
- **With Domain**: http://yourdomain.com:8088
- **API Endpoint**: http://SERVER_IP:5000/api

---

## ✅ Deployment Checklist

- [ ] System dependencies installed
- [ ] Application files uploaded
- [ ] Python virtual environment created
- [ ] Backend dependencies installed
- [ ] Frontend built successfully
- [ ] Systemd service configured and running
- [ ] Nginx configured and running
- [ ] Firewall rules configured
- [ ] Application accessible
- [ ] Logs are being written
- [ ] SSL certificate installed (production)
- [ ] Database backup cron job configured
- [ ] Default credentials changed

---

**Deployment Type:** Native (No Docker)  
**Port:** 8088  
**Services:** systemd (backend) + Nginx (frontend)  
**Date:** November 28, 2025
