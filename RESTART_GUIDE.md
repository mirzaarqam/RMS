# RMS - Restart Instructions

## After Changes - Quick Restart Guide

### Backend API Server

1. **Stop the current API server** (Press `Ctrl+C` in the terminal running api.py)

2. **Restart the API server:**
   ```powershell
   cd c:\Users\arqam.mirza\PycharmProjects\RMS
   python api.py
   ```

3. **Verify it's running:** You should see:
   ```
   * Running on http://0.0.0.0:5000
   ```

### Frontend React App

1. **The frontend will auto-reload** if it's already running (React hot reload)

2. **If you need to restart manually:**
   - Stop the current server (Press `Ctrl+C`)
   - Restart:
   ```powershell
   cd c:\Users\arqam.mirza\PycharmProjects\RMS\frontend
   npm start
   ```

3. **Verify it opens:** Browser should open to `http://localhost:3000`

## Testing the New Features

### Test 1: Month Filtering
1. Login to the application
2. Navigate to **Roster → View Roster**
3. You should see a month filter dropdown
4. Try selecting different months
5. Click "Complete Roster History" to see all data

### Test 2: Edit Roster Entries
1. In the Roster View, hover over any cell with data
2. You should see a blue edit icon appear
3. Click the edit icon
4. A modal dialog should open
5. Select a different shift or OFF day
6. Click "Save Changes"
7. The roster should refresh with your changes

## Troubleshooting

### If edit button doesn't appear:
- Make sure you're hovering over a cell with roster data
- Check browser console for JavaScript errors
- Try refreshing the page

### If month filter doesn't show:
- Make sure you have roster data in the database
- Check the API response in browser dev tools
- Restart the backend API server

### If changes don't save:
- Check that the backend API is running
- Look for error messages in the modal
- Verify the API endpoint is accessible at `http://localhost:5000`

## Quick Health Check

Run these commands to verify everything is working:

**Check API:**
```powershell
curl http://localhost:5000/api/stats
```

Should return JSON with statistics (might need authentication).

**Check Frontend:**
Open browser to `http://localhost:3000` - should see login page.

---

**Need Help?** Check the console logs in both terminals for error messages.
