import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

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
};

// Employee API
export const employeeAPI = {
  getAll: () => api.get('/employees'),
  getById: (empId) => api.get(`/employees/${empId}`),
  create: (data) => api.post('/employees', data),
  update: (empId, data) => api.put(`/employees/${empId}`, data),
  delete: (empId) => api.delete(`/employees/${empId}`),
  checkExists: (empId) => api.get(`/employees/check/${empId}`),
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
  getEntry: (empId, date) => api.get(`/roster/${empId}/${date}`),
  export: () => api.get('/roster/export', { responseType: 'blob' }),
};

// Stats API
export const statsAPI = {
  get: () => api.get('/stats'),
};

export default api;
