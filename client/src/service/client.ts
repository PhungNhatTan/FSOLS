// src/service/client.ts
import axios, {
  type AxiosInstance,
  type AxiosResponse,
  isAxiosError,
  AxiosHeaders,
} from "axios";

function getFullUrl(config?: { baseURL?: string; url?: string }) {
  if (!config) return "";
  return `${config.baseURL ?? ""}${config.url ?? ""}`;
}

const client: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true,
  // IMPORTANT: do NOT set Content-Type globally.
});

/* ===============================
   Request interceptor
================================ */
client.interceptors.request.use((config) => {
  const headers =
    config.headers instanceof AxiosHeaders
      ? config.headers
      : new AxiosHeaders(config.headers);

  const token = localStorage.getItem("token");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const isFormData =
    typeof FormData !== "undefined" && config.data instanceof FormData;

  // If we're sending FormData, let axios/browser set the multipart boundary
  if (isFormData) {
    headers.delete("Content-Type");
  } else {
    // Only set JSON content-type when we actually have a body and no explicit header is set
    const hasBody = config.data !== undefined && config.data !== null;
    if (hasBody && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }
  }

  config.headers = headers;

  console.log("[HTTP]", config.method?.toUpperCase(), getFullUrl(config), config.data);
  return config;
});

/* ===============================
   Response interceptor
================================ */
client.interceptors.response.use(
  (response: AxiosResponse) => {
    console.log("[HTTP]", response.status, getFullUrl(response.config));
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
