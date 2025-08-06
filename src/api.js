import axios from "axios";

const api = axios.create({
 baseURL: import.meta.env.VITE_API_BASE_URL || "https://r48hnsfc-8000.inc1.devtunnels.ms/api/",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Token ${token}`;
  return config;
});

export default api;
