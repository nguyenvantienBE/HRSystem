// src/auth/AuthContext.tsx
import React, {
  createContext,
  useCallback,
  useEffect,
  useState,
} from "react";
import apiClient from "../api/apiClient";
import * as authApi from "./api";
import type { MeResponse, LoginRequest } from "../types/auth";

type AuthUser = MeResponse;

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue>({
  user: null,
  isLoading: true,
  login: async () => {
    /* noop */
  },
  logout: () => {
    /* noop */
  },
});

const TOKEN_KEY = "hr_token";
const USER_KEY = "hr_user";

function setTokenHeader(token: string | null) {
  if (!token) {
    delete apiClient.defaults.headers.common.Authorization;
    localStorage.removeItem(TOKEN_KEY);
  } else {
    apiClient.defaults.headers.common.Authorization = `Bearer ${token}`;
    localStorage.setItem(TOKEN_KEY, token);
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Khôi phục session khi F5
  const restoreSession = useCallback(async () => {
    try {
      const storedToken = localStorage.getItem(TOKEN_KEY);
      if (!storedToken) {
        setUser(null);
        return;
      }

      setTokenHeader(storedToken);

      // Xác thực token bằng /auth/me
      const me = await authApi.fetchMe();
      setUser(me);
      localStorage.setItem(USER_KEY, JSON.stringify(me));
    } catch (err) {
      console.error("Failed to restore auth session", err);
      setUser(null);
      setTokenHeader(null);
      localStorage.removeItem(USER_KEY);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void restoreSession();
  }, [restoreSession]);

  // Đăng nhập
  const login = useCallback(async (email: string, password: string) => {
    const request: LoginRequest = {
      // tuỳ LoginRequest định nghĩa nhưng chắc chắn có 2 field này
      email,
      password,
    } as LoginRequest;

    let token = "";

    try {
      const res = await authApi.login(request);
      const data: any = res;

      token =
        data.token ??
        data.accessToken ??
        data.jwt ??
        data.access_token ??
        "";

      if (!token) {
        throw new Error("Token not found in login response.");
      }
    } catch (err: any) {
      console.error("Login failed", err);

      const apiMessage =
        err?.response?.data?.message ?? err?.response?.data?.error;

      const error = new Error(
        apiMessage ||
          "Đăng nhập thất bại. Vui lòng kiểm tra lại email/mật khẩu."
      );
      (error as any)._isAuthError = true;
      throw error;
    }

    // Lưu token & header
    setTokenHeader(token);

    // Lấy thông tin user
    const me = await authApi.fetchMe();
    setUser(me);
    localStorage.setItem(USER_KEY, JSON.stringify(me));
  }, []);

  // Đăng xuất
  const logout = useCallback(() => {
    setUser(null);
    setTokenHeader(null);
    localStorage.removeItem(USER_KEY);
  }, []);

  const value: AuthContextValue = {
    user,
    isLoading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
