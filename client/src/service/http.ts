import axios, {
  type AxiosInstance,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios";

const http: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10000,
});

http.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem("token");
    if (token) {
      // Type-safe header setting
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

http.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error) => {
    console.error("API Error:", error);
    return Promise.reject(error);
  }
);

export default http;
