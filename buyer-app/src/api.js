import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

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

// Items endpoints
export const itemsAPI = {
  getAll: (filters) => api.get('/items', { params: filters }),
  getById: (id) => api.get(`/items/${id}`),
};

// Categories endpoints
export const categoriesAPI = {
  getAll: () => api.get('/categories'),
};

// Cart endpoints
export const cartAPI = {
  getCart: () => api.get('/cart'),
  addToCart: (productId, quantity) => api.post('/cart/add', { productId, quantity }),
  removeFromCart: (productId) => api.post('/cart/remove', { productId }),
  updateCartItem: (productId, quantity) => api.post('/cart/update', { productId, quantity }),
  clearCart: () => api.delete('/cart/clear'),
};

// Orders endpoints
export const ordersAPI = {
  create: (data) => api.post('/orders', data),
  getBuyerOrders: () => api.get('/orders/buyer/my-orders'),
  getOrder: (id) => api.get(`/orders/${id}`),
  addComment: (id, text) => api.post(`/orders/${id}/comments`, { text }),
};

// Payments endpoints (mock)
export const paymentsAPI = {
  pay: (data) => api.post('/payments/pay', data),
};

// Ratings endpoints
export const ratingsAPI = {
  create: (data) => api.post('/ratings', data),
  getByItem: (itemId) => api.get(`/ratings/item/${itemId}`),
};

// Comments endpoints
export const commentsAPI = {
  create: (data) => api.post('/comments', data),
  getByItem: (itemId) => api.get(`/comments/item/${itemId}`),
  getSummary: (itemId) => api.get(`/comments/item/${itemId}/summary`),
};

// Flags endpoints
export const flagsAPI = {
  create: (data) => api.post('/flags', data),
  getMyFlags: () => api.get('/flags/my-flags'),
};

// Buyers endpoints
export const buyersAPI = {
  getProfile: () => api.get('/buyers/profile'),
  updateProfile: (data) => api.put('/buyers/profile', data),
};

// Serviceability endpoints
export const serviceabilityAPI = {
  updateLocation: (data) => api.post('/serviceability/location', data),
  getLocation: () => api.get('/serviceability/location'),
  checkServiceability: (sellerId) => api.get(`/serviceability/check/${sellerId}`),
  checkCartServiceability: (cartItems) => api.post('/serviceability/check-cart', { cartItems }),
};

export { api };
export default api;
