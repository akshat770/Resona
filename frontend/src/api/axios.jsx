import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_BACKEND || "http://localhost:5000",
  withCredentials: true
});

export default api;
