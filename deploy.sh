#!/bin/bash
# Production Deployment Script for Linux/Mac
set -e

echo "======================================"
echo "RMS Production Deployment"
echo "======================================"
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "ERROR: Docker is not running!"
    echo "Please start Docker and try again."
    exit 1
fi

echo "[1/5] Checking environment configuration..."
if [ ! -f .env ]; then
    echo "WARNING: .env file not found!"
    echo "Creating from .env.example..."
    cp .env.example .env
    echo ""
    echo "IMPORTANT: Please edit .env file and update:"
    echo "  - SECRET_KEY"
    echo "  - ADMIN_PASSWORD"
    echo "  - CORS_ORIGINS"
    echo ""
    read -p "Press Enter to continue after editing .env..."
fi

echo "[2/5] Stopping existing containers..."
docker-compose -f docker-compose.prod.yml down

echo "[3/5] Building production images..."
docker-compose -f docker-compose.prod.yml build

echo "[4/5] Starting production services..."
docker-compose -f docker-compose.prod.yml up -d

echo "[5/5] Waiting for services to be ready..."
sleep 10

echo ""
echo "======================================"
echo "Deployment Status"
echo "======================================"
docker-compose -f docker-compose.prod.yml ps

echo ""
echo "======================================"
echo "Health Check"
echo "======================================"
echo "Testing backend..."
if curl -s http://localhost:5000/api/validate > /dev/null; then
    echo "[OK] Backend is running"
else
    echo "[WARN] Backend may not be ready yet"
fi

echo "Testing frontend..."
if curl -s http://localhost:8088 > /dev/null; then
    echo "[OK] Frontend is running"
else
    echo "[WARN] Frontend may not be ready yet"
fi

echo ""
echo "======================================"
echo "Deployment Complete!"
echo "======================================"
echo ""
echo "Application URL: http://localhost:8088"
echo ""
echo "View logs: docker-compose -f docker-compose.prod.yml logs -f"
echo "Stop app:  docker-compose -f docker-compose.prod.yml down"
echo ""
