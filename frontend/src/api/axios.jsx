import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_BACKEND || "https://resona-production-bab3.up.railway.app",
  withCredentials: true
});

export default api;
