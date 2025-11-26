# Roster Management System

A comprehensive Roster Management System with a React frontend and Flask RESTful API backend.

## Project Structure

```
RMS/
├── api.py                    # RESTful API backend
├── app.py                    # Original Flask app (legacy)
├── requirements_api.txt      # Backend dependencies
├── database.db              # SQLite database
└── frontend/                # React frontend
    ├── package.json
    ├── public/
    │   └── index.html
    └── src/
        ├── components/
        │   ├── Layout.js
        │   ├── Navbar.js
        │   ├── Navbar.css
        │   └── ProtectedRoute.js
        ├── context/
        │   └── AuthContext.js
        ├── pages/
        │   ├── AddEmployee.js
        │   ├── AddShift.js
        │   ├── CreateRoster.js
        │   ├── Dashboard.js
        │   ├── EditEmployee.js
        │   ├── EditShift.js
        │   ├── Employees.js
        │   ├── Login.js
        │   ├── Login.css
        │   ├── Roster.js
        │   ├── RosterView.js
        │   ├── RosterView.css
        │   └── Shifts.js
        ├── services/
        │   └── api.js
        ├── App.js
        ├── index.js
        └── index.css
```

## Features

- **Employee Management**: Add, edit, and delete employees
- **Shift Management**: Configure full-day and half-day shifts with timings
- **Roster Creation**: Create monthly rosters with custom shift assignments
- **Roster View**: Visual roster calendar with color-coded status
- **✨ Month Filtering**: View rosters by specific month or complete history
- **✨ Editable Roster**: Click-to-edit any roster cell with modal interface
- **Export Functionality**: Export roster data to CSV
- **Authentication**: Secure login system
- **Responsive Design**: Professional enterprise UI that works on all devices

## Setup Instructions

### Backend Setup

1. Navigate to the RMS directory:
   ```powershell
   cd c:\Users\arqam.mirza\PycharmProjects\RMS
   ```

2. Install backend dependencies:
   ```powershell
   pip install -r requirements_api.txt
   ```

3. Run the API server:
   ```powershell
   python api.py
   ```

   The API will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to the frontend directory:
   ```powershell
   cd c:\Users\arqam.mirza\PycharmProjects\RMS\frontend
   ```

2. Install dependencies:
   ```powershell
   npm install
   ```

3. Start the development server:
   ```powershell
   npm start
   ```

   The app will open on `http://localhost:3000`

## Default Credentials

- **Username**: admin
- **Password**: password

## API Endpoints

### Authentication
- `POST /api/login` - Login
- `POST /api/logout` - Logout
- `GET /api/validate` - Validate token

### Employees
- `GET /api/employees` - Get all employees
- `GET /api/employees/<emp_id>` - Get employee by ID
- `POST /api/employees` - Create employee
- `PUT /api/employees/<emp_id>` - Update employee
- `DELETE /api/employees/<emp_id>` - Delete employee

### Shifts
- `GET /api/shifts` - Get all shifts (optional ?type=full or ?type=half)
- `GET /api/shifts/<shift_id>` - Get shift by ID
- `POST /api/shifts` - Create shift
- `PUT /api/shifts/<shift_id>` - Update shift
- `DELETE /api/shifts/<shift_id>` - Delete shift

### Roster
- `GET /api/roster` - Get complete roster (supports ?month=YYYY-MM or ?all=true)
- `POST /api/roster` - Create roster
- `PUT /api/roster/<emp_id>/<date>` - Update roster entry (for inline editing)
- `GET /api/roster/export` - Export roster to CSV

### Stats
- `GET /api/stats` - Get dashboard statistics

## Technologies Used

### Frontend
- React 18
- React Router v6
- Axios
- React Icons
- Modern CSS with Grid & Flexbox

### Backend
- Flask
- Flask-CORS
- SQLite
- Python 3.x

## Design Philosophy

The system uses a professional enterprise design with:
- Clean, modern interface
- Intuitive navigation
- Color-coded status indicators
- Responsive layout for mobile and desktop
- Professional blue gradient color scheme
- Accessible forms and tables

## Development Notes

- The frontend runs on port 3000
- The backend API runs on port 5000
- CORS is enabled for cross-origin requests
- Authentication uses token-based system
- All API requests require authentication (except login)

## Future Enhancements

- User role management
- Advanced roster analytics
- Email notifications
- Shift swap requests
- Leave management integration
- Multi-tenant support
