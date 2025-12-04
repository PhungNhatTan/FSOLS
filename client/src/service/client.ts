import axios, {type  AxiosInstance, type AxiosResponse } from "axios";

const client: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  console.log("[HTTP] Request:", config.method?.toUpperCase(), config.url, config.data);
  return config;
});

client.interceptors.response.use(
  (response: AxiosResponse) => {
    console.log("[HTTP] Response:", response.status, response.config.url, response.data);
    return response;
  },
  (error) => {
    console.error("[HTTP] Error:", error.response?.status, error.response?.data, error.message);
    return Promise.reject(error);
  }
);

export default client;
