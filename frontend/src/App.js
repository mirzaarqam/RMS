import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Employees from './pages/Employees';
import AddEmployee from './pages/AddEmployee';
import EditEmployee from './pages/EditEmployee';
import Shifts from './pages/Shifts';
import AddShift from './pages/AddShift';
import EditShift from './pages/EditShift';
import Roster from './pages/Roster';
import CreateRoster from './pages/CreateRoster';
import RosterView from './pages/RosterView';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />

          <Route path="/employees" element={
            <ProtectedRoute>
              <Employees />
            </ProtectedRoute>
          } />

          <Route path="/employees/add" element={
            <ProtectedRoute>
              <AddEmployee />
            </ProtectedRoute>
          } />

          <Route path="/employees/edit/:empId" element={
            <ProtectedRoute>
              <EditEmployee />
            </ProtectedRoute>
          } />

          <Route path="/shifts" element={
            <ProtectedRoute>
              <Shifts />
            </ProtectedRoute>
          } />

          <Route path="/shifts/add" element={
            <ProtectedRoute>
              <AddShift />
            </ProtectedRoute>
          } />

          <Route path="/shifts/edit/:shiftId" element={
            <ProtectedRoute>
              <EditShift />
            </ProtectedRoute>
          } />

          <Route path="/roster" element={
            <ProtectedRoute>
              <Roster />
            </ProtectedRoute>
          } />

          <Route path="/roster/create" element={
            <ProtectedRoute>
              <CreateRoster />
            </ProtectedRoute>
          } />

          <Route path="/roster/view" element={
            <ProtectedRoute>
              <RosterView />
            </ProtectedRoute>
          } />

          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
