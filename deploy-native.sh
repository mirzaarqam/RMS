#!/bin/bash
# RMS Production Deployment Script (Native - No Docker)
# For Ubuntu/Debian Linux servers

set -e

echo "======================================"
echo "RMS Production Deployment (Native)"
echo "======================================"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "Please run as root (use sudo)"
    exit 1
fi

# Variables
APP_DIR="/var/www/rms"
APP_USER="www-data"
LOG_DIR="/var/log/rms"

echo "[1/8] Installing system dependencies..."
apt update
apt install -y python3 python3-pip python3-venv nginx nodejs npm git curl

echo "[2/8] Creating application directory..."
mkdir -p $APP_DIR
mkdir -p $LOG_DIR
chown -R $APP_USER:$APP_USER $LOG_DIR

echo "[3/8] Copying application files..."
# Copy current directory to app directory
cp -r . $APP_DIR/
cd $APP_DIR

echo "[4/8] Setting up Python backend..."
# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install Python dependencies
pip install --upgrade pip
pip install -r requirements_prod.txt

# Set permissions
chown -R $APP_USER:$APP_USER $APP_DIR

echo "[5/8] Building React frontend..."
cd frontend
npm install
npm run build
cd ..

echo "[6/8] Configuring systemd service..."
# Copy service file
cp rms-backend.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable rms-backend
systemctl start rms-backend

echo "[7/8] Configuring Nginx..."
# Copy nginx config
cp rms-nginx.conf /etc/nginx/sites-available/rms
ln -sf /etc/nginx/sites-available/rms /etc/nginx/sites-enabled/rms

# Remove default nginx site
rm -f /etc/nginx/sites-enabled/default

# Test nginx configuration
nginx -t

# Restart nginx
systemctl restart nginx

echo "[8/8] Checking service status..."
echo ""
echo "Backend service status:"
systemctl status rms-backend --no-pager
echo ""
echo "Nginx status:"
systemctl status nginx --no-pager

echo ""
echo "======================================"
echo "Deployment Complete!"
echo "======================================"
echo ""
echo "Application URL: http://$(hostname -I | awk '{print $1}'):8088"
echo ""
echo "Useful commands:"
echo "  View backend logs: journalctl -u rms-backend -f"
echo "  View nginx logs:   tail -f /var/log/nginx/error.log"
echo "  Restart backend:   sudo systemctl restart rms-backend"
echo "  Restart nginx:     sudo systemctl restart nginx"
echo ""
