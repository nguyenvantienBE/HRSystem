// src/router/RequireAuth.tsx
import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../auth/useAuth";

export interface RequireAuthProps {
  children: React.ReactNode;
  /**
   * Danh sách role được phép truy cập route này.
   * Nếu không truyền -> chỉ cần đăng nhập là được.
   */
  roles?: string[];
}

const RequireAuth: React.FC<RequireAuthProps> = ({ children, roles }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  // Khi đang khôi phục session từ localStorage (/auth/me) -> chưa quyết định được
  if (isLoading) {
    // Có thể return spinner; tạm thời return null để giao diện không giật
    return null;
  }

  // Đã load xong mà không có user -> đá về login
  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname + location.search }}
      />
    );
  }

  const userRoles = user.roles || [];

  // Nếu route yêu cầu roles cụ thể
  if (roles && roles.length > 0) {
    const hasRole = roles.some((r) => userRoles.includes(r));

    if (!hasRole) {
      // Nếu là Admin nhưng vào nhầm trang staff/manager -> đưa về Admin Dashboard
      if (userRoles.includes("Admin")) {
        return <Navigate to="/admin" replace />;
      }

      // Còn lại đưa về dashboard nhân viên
      return <Navigate to="/dashboard" replace />;
    }
  }

  // Hợp lệ -> render children
  return <>{children}</>;
};

export default RequireAuth;
