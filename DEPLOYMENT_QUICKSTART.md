# Quick Native Deployment Commands

## 🚀 One-Line Deploy (Ubuntu/Debian)

```bash
# Automated deployment
curl -sSL https://raw.githubusercontent.com/mirzaarqam/RMS/main/deploy-native.sh | sudo bash
```

---

## 📦 Manual Quick Setup

### On Server (Linux)

```bash
# 1. Install dependencies
sudo apt update
sudo apt install -y python3 python3-pip python3-venv nginx git curl

# Install Node.js 20.x LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# 2. Create directory
sudo mkdir -p /var/www/rms
cd /var/www/rms

# 3. Upload files (run from your Windows machine)
# scp -r C:\Users\arqam.mirza\PycharmProjects\RMS\* user@server:/var/www/rms/

# 4. Setup backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements_prod.txt

# 5. Build frontend
cd frontend
npm install
npm run build
cd ..

# 6. Setup systemd service
sudo cp rms-backend.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable rms-backend
sudo systemctl start rms-backend

# 7. Setup Nginx
sudo cp rms-nginx.conf /etc/nginx/sites-available/rms
sudo ln -s /etc/nginx/sites-available/rms /etc/nginx/sites-enabled/rms
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx

# 8. Configure firewall
sudo ufw allow 8088/tcp
sudo ufw enable
```

### Access
```
http://YOUR_SERVER_IP:8088
```

---

## 🔧 Service Management

```bash
# Backend Service
sudo systemctl start rms-backend      # Start
sudo systemctl stop rms-backend       # Stop
sudo systemctl restart rms-backend    # Restart
sudo systemctl status rms-backend     # Status
sudo systemctl enable rms-backend     # Auto-start on boot

# Nginx
sudo systemctl restart nginx          # Restart
sudo systemctl reload nginx           # Reload config
sudo nginx -t                         # Test config
```

---

## 📊 View Logs

```bash
# Backend logs (live)
sudo journalctl -u rms-backend -f

# Backend app logs
sudo tail -f /var/log/rms/access.log
sudo tail -f /var/log/rms/error.log

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

---

## 🔄 Update Application

```bash
cd /var/www/rms

# Backup database
sudo cp database.db database_backup_$(date +%Y%m%d).db

# Pull new code (if using git)
git pull

# Update backend
source venv/bin/activate
pip install -r requirements_prod.txt

# Rebuild frontend
cd frontend
npm install
npm run build
cd ..

# Restart
sudo systemctl restart rms-backend
sudo systemctl reload nginx
```

---

## 🐛 Troubleshooting

```bash
# Check if services are running
sudo systemctl status rms-backend
sudo systemctl status nginx

# Check ports
sudo netstat -tlnp | grep -E '5000|8088'

# Test backend manually
cd /var/www/rms
source venv/bin/activate
python api.py

# Test API
curl http://localhost:5000/api/validate

# Test frontend
curl http://localhost:8088

# Fix permissions
sudo chown -R www-data:www-data /var/www/rms
sudo chmod -R 755 /var/www/rms
```

---

## 🔒 Security

```bash
# Install SSL (Let's Encrypt)
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com

# Setup database backups (cron)
sudo crontab -e
# Add: 0 2 * * * cp /var/www/rms/database.db /var/backups/rms/db_$(date +\%Y\%m\%d).db
```

---

## 📁 Important Paths

```
Application:     /var/www/rms
Virtual Env:     /var/www/rms/venv
Frontend Build:  /var/www/rms/frontend/build
Database:        /var/www/rms/database.db
Backend Logs:    /var/log/rms/
Service File:    /etc/systemd/system/rms-backend.service
Nginx Config:    /etc/nginx/sites-available/rms
```

---

## ✅ Quick Verification

```bash
# All checks in one command
echo "Backend:" && sudo systemctl is-active rms-backend && \
echo "Nginx:" && sudo systemctl is-active nginx && \
echo "API:" && curl -s http://localhost:5000/api/validate && \
echo "Frontend:" && curl -s -o /dev/null -w "%{http_code}" http://localhost:8088
```

---

## 📞 Support Commands

```bash
# Service failed?
sudo journalctl -u rms-backend -n 100 --no-pager

# Nginx failed?
sudo nginx -t && sudo tail -20 /var/log/nginx/error.log

# Port conflict?
sudo lsof -i :8088
sudo lsof -i :5000

# Reset everything
sudo systemctl stop rms-backend
sudo systemctl stop nginx
sudo systemctl start rms-backend
sudo systemctl start nginx
```

---

**Access URL:** http://SERVER_IP:8088  
**API URL:** http://SERVER_IP:5000/api  
**Default Login:** admin / (set in .env)
