// src/service/client.ts
import axios, {
  type AxiosInstance,
  type AxiosResponse,
  isAxiosError,
} from "axios";

function getFullUrl(config?: {
  baseURL?: string;
  url?: string;
}) {
  if (!config) return "";
  return `${config.baseURL ?? ""}${config.url ?? ""}`;
}

const client: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

/* ===============================
   Request interceptor
================================ */
client.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  console.log(
    "[HTTP]",
    config.method?.toUpperCase(),
    getFullUrl(config),
    config.data
  );

  return config;
});

/* ===============================
   Response interceptor
================================ */
client.interceptors.response.use(
  (response: AxiosResponse) => {
    console.log(
      "[HTTP]",
      response.status,
      getFullUrl(response.config)
    );
    return response;
  },
  (error) => {
    console.error(
      "[HTTP ERROR]",
      getFullUrl(error.config),
      error.response?.status,
      error.response?.data || error.message
    );
    return Promise.reject(error);
  }
);

export { isAxiosError };
export default client;
