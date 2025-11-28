@echo off
REM Production Deployment Script for Windows
echo ======================================
echo RMS Production Deployment
echo ======================================
echo.

REM Check if Docker is running
docker info >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Docker is not running!
    echo Please start Docker Desktop and try again.
    pause
    exit /b 1
)

echo [1/5] Checking environment configuration...
if not exist .env (
    echo WARNING: .env file not found!
    echo Creating from .env.example...
    copy .env.example .env
    echo.
    echo IMPORTANT: Please edit .env file and update:
    echo   - SECRET_KEY
    echo   - ADMIN_PASSWORD
    echo   - CORS_ORIGINS
    echo.
    pause
)

echo [2/5] Stopping existing containers...
docker-compose -f docker-compose.prod.yml down

echo [3/5] Building production images...
docker-compose -f docker-compose.prod.yml build

echo [4/5] Starting production services...
docker-compose -f docker-compose.prod.yml up -d

echo [5/5] Waiting for services to be ready...
timeout /t 10 /nobreak >nul

echo.
echo ======================================
echo Deployment Status
echo ======================================
docker-compose -f docker-compose.prod.yml ps

echo.
echo ======================================
echo Health Check
echo ======================================
echo Testing backend...
curl -s http://localhost:5000/api/validate >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [OK] Backend is running
) else (
    echo [WARN] Backend may not be ready yet
)

echo Testing frontend...
curl -s http://localhost:8088 >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [OK] Frontend is running
) else (
    echo [WARN] Frontend may not be ready yet
)

echo.
echo ======================================
echo Deployment Complete!
echo ======================================
echo.
echo Application URL: http://localhost:8088
echo.
echo View logs: docker-compose -f docker-compose.prod.yml logs -f
echo Stop app:  docker-compose -f docker-compose.prod.yml down
echo.
pause
