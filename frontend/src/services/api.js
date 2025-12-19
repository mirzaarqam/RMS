import axios from 'axios';

// Use environment variable or detect API URL
const getApiBaseUrl = () => {
  // In production, use the same host as the frontend
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  
  // Default: use current host + port 5000 for API
  // This works for both localhost and production servers
  const protocol = window.location.protocol;
  const hostname = window.location.hostname;
  
  // If accessing via port 8088 (nginx), use same host with port 5000
  return `${protocol}//${hostname}:5000/api`;
};

const API_BASE_URL = getApiBaseUrl();

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = token;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (username, password) => api.post('/login', { username, password }),
  logout: () => api.post('/logout'),
  validate: () => api.get('/validate'),
  changePassword: (current_password, new_password, confirm_password) =>
    api.put('/users/me/password', { current_password, new_password, confirm_password }),
};

// Admin APIs
export const teamsAPI = {
  list: () => api.get('/teams'),
  create: (data) => api.post('/teams', data),
  update: (id, data) => api.put(`/teams/${id}`, data),
  remove: (id) => api.delete(`/teams/${id}`),
};

export const usersAPI = {
  list: () => api.get('/users'),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  remove: (id) => api.delete(`/users/${id}`),
  resetPassword: (username, password) => api.put(`/users/${username}/password`, { password }),
};

export const settingsAPI = {
  get: () => api.get('/settings'),
  set: (key, value) => api.put(`/settings/${key}`, { value }),
};

// Employee API
export const employeeAPI = {
  getAll: (teamId) => api.get('/employees', { params: teamId ? { team_id: teamId } : {} }),
  getById: (empId, teamId) => api.get(`/employees/${empId}`, { params: teamId ? { team_id: teamId } : {} }),
  create: (data) => api.post('/employees', data),
  update: (empId, data) => api.put(`/employees/${empId}`, data),
  delete: (empId, teamId) => api.delete(`/employees/${empId}`, { params: teamId ? { team_id: teamId } : {} }),
  checkExists: (empId, teamId) => api.get(`/employees/check/${empId}`, { params: teamId ? { team_id: teamId } : {} }),
};

// Shift API
export const shiftAPI = {
  getAll: (type = null) => api.get('/shifts', { params: type ? { type } : {} }),
  getById: (shiftId) => api.get(`/shifts/${shiftId}`),
  create: (data) => api.post('/shifts', data),
  update: (shiftId, data) => api.put(`/shifts/${shiftId}`, data),
  delete: (shiftId) => api.delete(`/shifts/${shiftId}`),
};

// Roster API
export const rosterAPI = {
  get: (params = {}) => api.get('/roster', { params }),
  create: (data) => api.post('/roster', data),
  update: (empId, date, data) => api.put(`/roster/${empId}/${date}`, data),
  getEntry: (empId, date, params = {}) => api.get(`/roster/${empId}/${date}`, { params }),
  export: (params = {}) => api.get('/roster/export', { params, responseType: 'blob' }),
  deleteEmployeeRoster: (empId, month, teamId) => api.delete('/roster/employee', { 
    params: { emp_id: empId, month: month, team_id: teamId } 
  }),
};

// Stats API
export const statsAPI = {
  get: (params = {}) => api.get('/stats', { params }),
};

export default api;
