import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance with auth token
const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth endpoints
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
};

// Seller endpoints
export const sellerAPI = {
  getProfile: () => api.get('/sellers/profile'),
  updateProfile: (data) => api.put('/sellers/profile', data),
  getItems: () => api.get('/sellers/items'),
};

// Items endpoints
export const itemsAPI = {
  getAll: (filters) => api.get('/items', { params: filters }),
  getById: (id) => api.get(`/items/${id}`),
  create: (data) => api.post('/items', data),
  update: (id, data) => api.put(`/items/${id}`, data),
  delete: (id) => api.delete(`/items/${id}`),
};

// Categories endpoints
export const categoriesAPI = {
  getAll: () => api.get('/categories'),
};

// Orders endpoints
export const ordersAPI = {
  getSellerOrders: () => api.get('/orders/seller/my-orders'),
  getOrder: (id) => api.get(`/orders/${id}`),
  updateStatus: (id, status) => api.put(`/orders/${id}`, { status }),
};

// Flags endpoints
export const flagsAPI = {
  create: (data) => api.post('/flags', data),
  flagOrderBuyer: (orderId, data) => api.post(`/flags/orders/${orderId}`, data),
  getMyFlags: () => api.get('/flags/my-flags'),
};

export default api;
