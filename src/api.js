import axios from "axios";

const api = axios.create({
 baseURL: import.meta.env.VITE_API_BASE_URL || "https://mychatapp-1-ooe6.onrender.com/api/",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Token ${token}`;
  return config;
});

export default api;
