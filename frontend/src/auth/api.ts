// src/auth/api.ts
import apiClient from "../api/apiClient";
import type {
  LoginRequest,
  LoginResponse,
  MeResponse,
  RegisterRequest,
} from "../types/auth";

// LOGIN
export async function login(request: LoginRequest): Promise<LoginResponse> {
  const res = await apiClient.post<LoginResponse>("/auth/login", request);
  return res.data;
}

// LẤY THÔNG TIN ME
export async function fetchMe(): Promise<MeResponse> {
  const res = await apiClient.get("/auth/me");
  const data = res.data as any;

  return {
    email: data.email,
    fullName: data.fullName,
    roles: data.roles ?? data.Roles ?? [],
  };
}

// GỬI OTP ĐĂNG KÝ
export async function requestOtp(email: string): Promise<void> {
  await apiClient.post("/auth/request-otp", { email });
}

// ĐĂNG KÝ TÀI KHOẢN STAFF
export async function registerAccount(
  payload: RegisterRequest
): Promise<void> {
  await apiClient.post("/auth/register", payload);
}
