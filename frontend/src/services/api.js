// src/services/api.js - API Service Layer
import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    // Log successful responses for debugging
    if (response.config.url?.includes('/auth/profile')) {
      console.log('Profile update response:', response);
    }
    return response;
  },
  (error) => {
    // Log errors for debugging
    if (error.config?.url?.includes('/auth/profile')) {
      console.log('Profile update error:', error);
      console.log('Error response:', error.response);
    }

    // Handle 401 errors (unauthorized)
    if (error.response?.status === 401) {
      // Only remove token if it's not a login/register request
      const isAuthRequest = error.config.url?.includes('/auth/login') ||
                           error.config.url?.includes('/auth/register');

      if (!isAuthRequest) {
        localStorage.removeItem('token');
        // Redirect to login page
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

// Authentication API
export const authAPI = {
  login: (credentials) => api.post('/api/auth/login', credentials),
  register: (userData) => api.post('/api/auth/register', userData),
  logout: () => api.post('/api/auth/logout'),
  getMe: () => api.get('/api/auth/me'),
  updateProfile: (userData) => api.put('/api/auth/profile', userData),
  changePassword: (data) => api.put('/api/auth/change-password', data),
  verifyEmail: (data) => api.post('/api/auth/verify-email', data),
  resendVerification: (data) => api.post('/api/auth/resend-verification', data),
  forgotPassword: (data) => api.post('/api/auth/forgot-password', data),
  resetPassword: (data) => api.post('/api/auth/reset-password', data),
};

// Rooms API
export const roomsAPI = {
  getRooms: (params = {}) => api.get('/api/rooms', { params }),
  getRoom: (id) => api.get(`/api/rooms/${id}`),
  checkAvailability: (id, data) => api.post(`/api/rooms/${id}/check-availability`, data),
  getCalendar: (id, params = {}) => api.get(`/api/rooms/${id}/calendar`, { params }),

  // Admin only
  createRoom: (formData) => api.post('/api/rooms', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  updateRoom: (id, formData) => api.put(`/api/rooms/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  deleteRoom: (id) => api.delete(`/api/rooms/${id}`),
  toggleRoomStatus: (id) => api.patch(`/api/rooms/${id}/toggle-status`),
};

// Bookings API
export const bookingsAPI = {
  createBooking: (formData) => api.post('/api/bookings', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getMyBookings: (params = {}) => api.get('/api/bookings/my-bookings', { params }),
  getBooking: (id) => api.get(`/api/bookings/${id}`),
  updateBooking: (id, formData) => api.put(`/api/bookings/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  cancelBooking: (id) => api.patch(`/api/bookings/${id}/cancel`),
  deleteBooking: (id) => api.delete(`/api/bookings/${id}`),

  // Admin only
  getAllBookings: (params = {}) => api.get('/api/bookings', { params }),
  updateBookingStatus: (id, data) => api.patch(`/api/bookings/${id}/status`, data),
  deleteBookingAdmin: (id) => api.delete(`/api/bookings/admin/${id}`),
  getBookingStats: (params = {}) => api.get('/api/bookings/admin/stats', { params }),
  getUpcomingBookings: (params = {}) => api.get('/api/bookings/admin/upcoming', { params }),
};

// Tours API
export const toursAPI = {
  createTour: (data) => api.post('/api/tours', data),
  getMyTours: (params = {}) => api.get('/api/tours/my-tours', { params }),
  getTour: (id) => api.get(`/api/tours/${id}`),
  updateTour: (id, data) => api.put(`/api/tours/${id}`, data),
  cancelTour: (id) => api.patch(`/api/tours/${id}/cancel`),
  getAvailableSlots: (params = {}) => api.get('/api/tours/available-slots', { params }),
  getTourCalendar: (params = {}) => api.get('/api/tours/calendar', { params }),

  // Admin only
  getAllTours: (params = {}) => api.get('/api/tours', { params }),
  updateTourStatus: (id, data) => api.patch(`/api/tours/${id}/status`, data),
  getTourStats: (params = {}) => api.get('/api/tours/admin/stats', { params }),
  getUpcomingTours: (params = {}) => api.get('/api/tours/admin/upcoming', { params }),
  deleteTourAdmin: (id) => api.delete(`/api/tours/admin/${id}`),
};

// Admin API
export const adminAPI = {
  getDashboard: () => api.get('/api/admin/dashboard'),
  getStats: (params = {}) => api.get('/api/admin/stats', { params }),
  getUsers: (params = {}) => api.get('/api/admin/users', { params }),
  getUser: (id) => api.get(`/api/admin/users/${id}`),
  updateUserStatus: (id, data) => api.patch(`/api/admin/users/${id}/status`, data),
  deleteUser: (id) => api.delete(`/api/admin/users/${id}`),
  bulkAction: (data) => api.post('/api/admin/bulk-action', data),
  exportData: (type, params = {}) => api.get(`/api/admin/export/${type}`, {
    params,
    responseType: 'blob'
  }),
  getSettings: () => api.get('/api/admin/settings'),
};

// File upload helper
export const uploadFile = async (file, type = 'document') => {
  const formData = new FormData();
  formData.append(type, file);

  return api.post('/api/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

// Helper function to build file URL
export const getFileUrl = (filePath) => {
  if (!filePath) return null;

  // If it's already a full URL, return as is
  if (filePath.startsWith('http')) {
    return filePath;
  }

  // Build URL from base URL
  const baseUrl = import.meta.env.VITE_API_URL || '';
  return `${baseUrl}/${filePath}`;
};

// Helper function to download file
export const downloadFile = async (url, filename) => {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    
    // Create download link
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    
    // Cleanup
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  } catch (error) {
    console.error('Download error:', error);
    throw error;
  }
};

// Helper function to format API errors
export const formatApiError = (error) => {
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  
  if (error.message) {
    return error.message;
  }
  
  return 'Terjadi kesalahan yang tidak terduga';
};

// Helper function to check if error is network error
export const isNetworkError = (error) => {
  return !error.response && error.request;
};

// Helper function to check if error is server error (5xx)
export const isServerError = (error) => {
  return error.response && error.response.status >= 500;
};

// Helper function to check if error is client error (4xx)
export const isClientError = (error) => {
  return error.response && error.response.status >= 400 && error.response.status < 500;
};

// Date formatting helpers
export const formatApiDate = (date) => {
  if (!date) return null;
  
  if (typeof date === 'string') {
    return date;
  }
  
  return date.toISOString();
};

export const parseApiDate = (dateString) => {
  if (!dateString) return null;
  return new Date(dateString);
};

// Default export
export default api;