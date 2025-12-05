// src/types/auth.ts

// Request khi đăng nhập
export interface LoginRequest {
  email: string;
  password: string;
}

// Response khi login trả về token JWT
export interface LoginResponse {
  token: string;
}

// Thông tin user hiện tại (dùng cho /auth/me, /Employees/me)
export interface MeResponse {
  email: string;
  fullName: string;
  roles: string[];

  // Các field phụ có thể BE trả về (optional để không lỗi)
  departmentName?: string | null;
  positionName?: string | null;
  avatarUrl?: string | null;

  // thêm field dùng cho khuôn mặt check-in
  faceProfileUrl?: string | null;
}
