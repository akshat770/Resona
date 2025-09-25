import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_BACKEND || "http://localhost:5000",
  withCredentials: true, // needed if you ever use cookies
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("jwt");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
