// src/api/apiClient.ts
import axios from "axios";

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5166/api",
  timeout: 10000,
});

// Gắn Bearer token cho các request cần bảo vệ,
// nhưng BỎ QUA các endpoint auth: /auth/login, /auth/register, /auth/request-otp
apiClient.interceptors.request.use((config) => {
  const url = config.url || "";

  const isAuthEndpoint =
    url.startsWith("/auth/login") ||
    url.startsWith("/auth/register") ||
    url.startsWith("/auth/request-otp");

  if (!isAuthEndpoint) {
    const token = localStorage.getItem("hr_token");
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
  }

  return config;
});

export default apiClient;
