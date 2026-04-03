import axios from 'axios';

// Dynamic API URL
const getApiUrl = () => {
    // If we have an environment variable for the API URL (e.g. from Vercel), use it
    if (import.meta.env.VITE_API_URL) {
        return import.meta.env.VITE_API_URL;
    }
    // Otherwise, fall back to localhost for local development
    const hostname = window.location.hostname;
    return `http://${hostname}:5000/api`;
};

const API_URL = getApiUrl();

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add token to requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Handle auth errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// Auth API
export const authAPI = {
    signup: (data) => api.post('/auth/signup', data),
    login: (data) => api.post('/auth/login', data),
    getMe: () => api.get('/auth/me'),
};

// Income API
export const incomeAPI = {
    getAll: () => api.get('/incomes'),
    create: (data) => api.post('/incomes', data),
    update: (id, data) => api.put(`/incomes/${id}`, data),
    delete: (id) => api.delete(`/incomes/${id}`),
};

// Expense API
export const expenseAPI = {
    getAll: () => api.get('/expenses'),
    create: (data) => api.post('/expenses', data),
    update: (id, data) => api.put(`/expenses/${id}`, data),
    delete: (id) => api.delete(`/expenses/${id}`),
};

// Dashboard API
export const dashboardAPI = {
    getData: () => api.get('/dashboard'),
    getOverview: () => api.get('/dashboard'),
};

// Budget API
export const budgetAPI = {
    getAll: (month, year) => api.get(`/budgets?month=${month}&year=${year}`),
    getStatus: (month, year) => api.get(`/budgets/status?month=${month}&year=${year}`),
    create: (data) => api.post('/budgets', data),
    update: (id, data) => api.put(`/budgets/${id}`, data),
    delete: (id) => api.delete(`/budgets/${id}`),
};

// Savings API
export const savingsAPI = {
    getAll: () => api.get('/savings'),
    create: (data) => api.post('/savings', data),
    update: (id, data) => api.put(`/savings/${id}`, data),
    delete: (id) => api.delete(`/savings/${id}`),
    contribute: (id, data) => api.post(`/savings/${id}/contribute`, data),
    getContributions: (id) => api.get(`/savings/${id}/contributions`),
};

// Reminders API
export const reminderAPI = {
    getAll: () => api.get('/reminders'),
    getUpcoming: () => api.get('/reminders/upcoming'),
    create: (data) => api.post('/reminders', data),
    update: (id, data) => api.put(`/reminders/${id}`, data),
    delete: (id) => api.delete(`/reminders/${id}`),
    markPaid: (id) => api.post(`/reminders/${id}/mark-paid`),
};

// Recurring Transactions API
export const recurringAPI = {
    getAll: () => api.get('/recurring'),
    create: (data) => api.post('/recurring', data),
    update: (id, data) => api.put(`/recurring/${id}`, data),
    delete: (id) => api.delete(`/recurring/${id}`),
    toggle: (id) => api.patch(`/recurring/${id}/toggle`),
};

// Analytics API
export const analyticsAPI = {
    getMonthlySummary: () => api.get('/analytics/monthly-summary'),
    getCategoryTrends: (period) => api.get(`/analytics/category-trends?period=${period || 6}`),
    getTopCategories: (period) => api.get(`/analytics/top-categories?period=${period || 6}`),
    getStats: () => api.get('/analytics/stats'),
};

// Profile API
export const profileAPI = {
    get: () => api.get('/profile'),
    update: (data) => api.put('/profile', data),
    changePassword: (data) => api.put('/profile/password', data),
};

export default api;
