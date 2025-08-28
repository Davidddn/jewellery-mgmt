import axios from 'axios';
import { API_BASE_URL } from './config';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const categoriesAPI = {
  getCategories: () => api.get('/categories').then(res => res.data),
  getCategory: (id) => api.get(`/categories/${id}`).then(res => res.data),
  createCategory: (data) => api.post('/categories', data).then(res => res.data),
  updateCategory: (id, data) => api.put(`/categories/${id}`, data).then(res => res.data),
  deleteCategory: (id) => api.delete(`/categories/${id}`).then(res => res.data),
};
