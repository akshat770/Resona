import axios from 'axios';

const token = localStorage.getItem('jwt');

const api = axios.create({
  baseURL: import.meta.env.VITE_BACKEND || 'http://localhost:5000',
  headers: token ? { Authorization: `Bearer ${token}` } : {},
});

export default api;
