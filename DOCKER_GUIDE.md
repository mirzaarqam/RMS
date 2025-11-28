# 🐳 Docker Deployment Guide - RMS Application

## Prerequisites

1. **Install Docker Desktop for Windows**
   - Download from: https://www.docker.com/products/docker-desktop/
   - Install and restart your computer
   - Make sure Docker Desktop is running (system tray icon)

2. **Verify Installation**
   ```powershell
   docker --version
   docker-compose --version
   ```

---

## 🚀 Quick Start

### 1. Build and Start the Application

Open PowerShell in the RMS directory and run:

```powershell
# Navigate to project directory
cd C:\Users\arqam.mirza\PycharmProjects\RMS

# Build and start all services
docker-compose up -d --build
```

**What this does:**
- Builds backend Docker image (Python + Flask)
- Builds frontend Docker image (React + Nginx)
- Starts both containers
- Backend runs on port 5000
- Frontend runs on **port 8088** (accessible in browser)

### 2. Access the Application

Open your browser and go to:
```
http://localhost:8088
```

---

## 📋 Common Commands

### Start the Application
```powershell
docker-compose up -d
```
*(-d flag runs in detached/background mode)*

### Stop the Application
```powershell
docker-compose down
```

### Stop and Remove All Data
```powershell
docker-compose down -v
```
*(-v flag removes volumes/data)*

### View Running Containers
```powershell
docker-compose ps
```

### View Logs
```powershell
# All services
docker-compose logs -f

# Backend only
docker-compose logs -f backend

# Frontend only
docker-compose logs -f frontend
```

### Rebuild After Code Changes
```powershell
docker-compose up -d --build
```

### Restart a Specific Service
```powershell
# Restart backend
docker-compose restart backend

# Restart frontend
docker-compose restart frontend
```

---

## 🔍 Troubleshooting

### Check if Containers are Running
```powershell
docker ps
```
You should see:
- `rms-backend` (port 5000)
- `rms-frontend` (port 8088)

### Check Container Logs for Errors
```powershell
# Backend logs
docker logs rms-backend

# Frontend logs
docker logs rms-frontend
```

### Port 8088 Already in Use?
If port 8088 is occupied, edit `docker-compose.yml`:
```yaml
frontend:
  ports:
    - "8089:80"  # Change 8088 to 8089 or any free port
```
Then restart: `docker-compose up -d`

### Database Not Persisting?
Data is stored in `./data` directory. Check if the folder exists:
```powershell
ls ./data
```

### Cannot Connect to Backend?
1. Check backend is running: `docker logs rms-backend`
2. Verify backend URL in frontend build
3. Restart services: `docker-compose restart`

### Need to Rebuild from Scratch?
```powershell
# Stop and remove everything
docker-compose down -v

# Remove images
docker rmi rms-backend rms-frontend

# Rebuild
docker-compose up -d --build
```

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────┐
│  Browser (http://localhost:8088)        │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│  Frontend Container (rms-frontend)      │
│  - React App (Built)                    │
│  - Nginx Server                         │
│  - Port: 8088:80                        │
└────────────────┬────────────────────────┘
                 │ /api/* requests
                 ▼
┌─────────────────────────────────────────┐
│  Backend Container (rms-backend)        │
│  - Flask API                            │
│  - Python 3.11                          │
│  - Port: 5000:5000                      │
│  - SQLite Database (./data volume)      │
└─────────────────────────────────────────┘
```

---

## 📁 Project Structure

```
RMS/
├── docker-compose.yml       # Main orchestration file
├── Dockerfile.backend       # Backend container definition
├── Dockerfile.frontend      # Frontend container definition
├── nginx.conf               # Nginx configuration for frontend
├── .dockerignore            # Files to exclude from Docker
├── api.py                   # Flask backend
├── requirements.txt         # Python dependencies
├── roster.csv               # Initial data
├── data/                    # SQLite database (persisted)
└── frontend/
    ├── package.json
    ├── public/
    └── src/
```

---

## 🔧 Configuration

### Change Port Mapping

Edit `docker-compose.yml`:

```yaml
frontend:
  ports:
    - "YOUR_PORT:80"  # Change left side to your desired port
```

### Environment Variables

Add to `docker-compose.yml` under backend service:

```yaml
backend:
  environment:
    - FLASK_ENV=production
    - DATABASE_PATH=/app/data/roster.db
    - SECRET_KEY=your-secret-key
```

### Volume Mounting for Development

To edit code without rebuilding:

```yaml
backend:
  volumes:
    - ./api.py:/app/api.py
    - ./data:/app/data
```

---

## 🔄 Development vs Production

### Current Setup (Production-like)
- Frontend is built and served by Nginx
- Backend runs Flask in production mode
- Data persists in `./data` volume

### For Development Mode
If you want hot-reload during development, run:

```powershell
# Backend
cd C:\Users\arqam.mirza\PycharmProjects\RMS
python api.py

# Frontend (new terminal)
cd C:\Users\arqam.mirza\PycharmProjects\RMS\frontend
npm start
```

Use Docker for testing/deployment, local servers for active development.

---

## 📊 Monitoring

### View Resource Usage
```powershell
docker stats
```

### Check Container Health
```powershell
docker-compose ps
```

### View All Docker Images
```powershell
docker images
```

---

## 🧹 Cleanup

### Remove Stopped Containers
```powershell
docker container prune
```

### Remove Unused Images
```powershell
docker image prune -a
```

### Remove Everything (Fresh Start)
```powershell
docker system prune -a --volumes
```

---

## ✅ Verification Checklist

After starting with `docker-compose up -d`:

- [ ] Check containers are running: `docker ps`
- [ ] Backend logs show no errors: `docker logs rms-backend`
- [ ] Frontend logs show no errors: `docker logs rms-frontend`
- [ ] Can access http://localhost:8088 in browser
- [ ] Login page loads correctly
- [ ] Can log in (admin/admin123)
- [ ] Dashboard loads with data
- [ ] API calls work (check Network tab in browser)

---

## 🎯 Quick Reference

| Action | Command |
|--------|---------|
| Start | `docker-compose up -d` |
| Stop | `docker-compose down` |
| Rebuild | `docker-compose up -d --build` |
| View logs | `docker-compose logs -f` |
| Restart | `docker-compose restart` |
| Access URL | `http://localhost:8088` |

---

## 📞 Support

### Common Issues

1. **Port conflicts**: Change port in docker-compose.yml
2. **Build fails**: Check Dockerfile syntax and file paths
3. **Can't connect**: Verify both containers are running with `docker ps`
4. **Data loss**: Check ./data directory exists and has permissions

### Useful Commands for Debugging

```powershell
# Enter backend container shell
docker exec -it rms-backend /bin/sh

# Enter frontend container shell
docker exec -it rms-frontend /bin/sh

# View network configuration
docker network inspect rms_rms-network

# Check volume
docker volume ls
```

---

## 🎉 Success!

If you can access http://localhost:8088 and see the RMS login page, congratulations! Your application is running in Docker containers.

**Next Steps:**
1. Log in with admin/admin123
2. Test all features (employees, shifts, roster)
3. Verify data persists after `docker-compose down` and `docker-compose up -d`
4. Test export functionality

---

**Created:** November 28, 2025  
**Port:** 8088 (customized for your environment)  
**Containers:** rms-backend, rms-frontend  
**Network:** rms-network
