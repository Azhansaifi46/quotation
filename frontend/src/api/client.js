import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

const retryTransientRequest = (request, retries = 3) =>
  request().catch((error) => {
    const isTransient = !error.response || error.response.status >= 500;
    if (!isTransient || retries === 0) {
      throw error;
    }

    const delay = (4 - retries) * 500;
    return new Promise((resolve) => setTimeout(resolve, delay)).then(() =>
      retryTransientRequest(request, retries - 1),
    );
  });

// Automatically attach JWT Bearer Token to all outgoing requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const requestUrl = error.config?.url || '';
    const hasSession = Boolean(localStorage.getItem('token'));
    const isAuthRequest = requestUrl.includes('/auth/');

    if (error.response?.status === 401 && hasSession && !isAuthRequest) {
      localStorage.removeItem('token');
      window.dispatchEvent(new Event('qoutpro:session-expired'));
    }

    return Promise.reject(error);
  },
);

// Authentication & OTP API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  verifyLoginOTP: (data) => api.post('/auth/verify-login-otp', data),
  register: (userData) => api.post('/auth/register', userData),
  verifySignupOTP: (data) => api.post('/auth/verify-signup-otp', data),
  resendOTP: (data) => api.post('/auth/resend-otp', data),
  demoLogin: () => retryTransientRequest(() => api.post('/auth/demo-login')),
  getMe: () => api.get('/auth/me'),
  updateProfile: (profileData) => api.put('/auth/profile', profileData),
  changePassword: (passwordData) => api.put('/auth/change-password', passwordData),
};

// Business Profile & Settings API
export const settingsAPI = {
  get: () => api.get('/settings'),
  update: (data) => api.put('/settings', data),
  getNextNumber: (type = 'Quotation') => api.get('/settings/next-number', { params: { type } }),
  getNextQuotationNumber: () => api.get('/settings/next-number', { params: { type: 'Quotation' } }),
};

// Customer API
export const customersAPI = {
  getAll: (search = '') => api.get('/customers', { params: { search } }),
  getById: (id) => api.get(`/customers/${id}`),
  create: (data) => api.post('/customers', data),
  update: (id, data) => api.put(`/customers/${id}`, data),
  delete: (id) => api.delete(`/customers/${id}`),
};

// Products & Services Catalog API
export const productsAPI = {
  getAll: (search = '', category = '', type = '') =>
    api.get('/products', { params: { search, category, type } }),
  getById: (id) => api.get(`/products/${id}`),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),
};

// Universal Documents & Billing API (Quotations, Invoices, Estimates, PO, Receipt)
export const quotationsAPI = {
  getAll: (params = {}) => api.get('/quotations', { params }),
  getInvoices: (params = {}) => api.get('/quotations', { params: { ...params, documentType: 'Invoice' } }),
  getQuotations: (params = {}) => api.get('/quotations', { params: { ...params, documentType: 'Quotation' } }),
  getById: (id) => api.get(`/quotations/${id}`),
  create: (data) => api.post('/quotations', data),
  update: (id, data) => api.put(`/quotations/${id}`, data),
  updateStatus: (id, status) => api.patch(`/quotations/${id}/status`, { status }),
  recordPayment: (id, paymentData) => api.post(`/quotations/${id}/payments`, paymentData),
  deletePayment: (id, paymentId) => api.delete(`/quotations/${id}/payments/${paymentId}`),
  getBillingLedger: () => api.get('/quotations/billing/ledger'),
  convertToInvoice: (id) => api.post(`/quotations/${id}/convert-to-invoice`),
  duplicate: (id) => api.post(`/quotations/${id}/duplicate`),
  delete: (id) => api.delete(`/quotations/${id}`),
};

export const invoicesAPI = quotationsAPI;

// Dashboard Stats API
export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
};

export default api;
