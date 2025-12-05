// src/router/AppRouter.tsx
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import AuthLayout from "../layout/AuthLayout";
import MainLayout from "../layout/MainLayout";
import RequireAuth from "./RequireAuth";

import LoginPage from "../auth/pages/LoginPage";
import RegisterPage from "../auth/pages/RegisterPage";

import StaffDashboard from "../dashboard/pages/StaffDashboard";
import ProfilePage from "../profile/pages/ProfilePage";
import AttendancePage from "../attendance/pages/AttendancePage";
import MyTimesheetPage from "../attendance/pages/MyTimesheetPage";
import MyLeavesPage from "../leaves/pages/MyLeavesPage";
import LeaveApprovalPage from "../leaves/pages/LeaveApprovalPage";
import PayslipPage from "../payroll/pages/PayslipPage";
import DepartmentsPage from "../departments/pages/DepartmentsPage";

import { useAuth } from "../auth/useAuth";
import AdminDashboard from "../admin/page/AdminDashboard";

// các trang cấu hình Manager mới
import PositionsPage from "../positions/pages/PositionsPage";
import ShiftsPage from "../shifts/pages/ShiftsPage";
import LeaveTypesPage from "../leaveTypes/pages/LeaveTypesPage";
import HolidaysPage from "../holidays/pages/HolidaysPage";

// ------------------------------------------------------------------
const RoleDashboard: React.FC = () => {
  const { user } = useAuth();

  if (user?.roles?.includes("Admin")) {
    return <Navigate to="/admin" replace />;
  }

  return <StaffDashboard />;
};

const AppRouter: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* AUTH */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>

        {/* ADMIN RIÊNG */}
        <Route
          path="/admin"
          element={
            <RequireAuth>
              <AdminDashboard />
            </RequireAuth>
          }
        />

        {/* PHẦN CÒN LẠI DÙNG MAINLAYOUT */}
        <Route
          element={
            <RequireAuth>
              <MainLayout />
            </RequireAuth>
          }
        >
          {/* Dashboard */}
          <Route path="/dashboard" element={<RoleDashboard />} />

          {/* Hồ sơ */}
          <Route path="/profile" element={<ProfilePage />} />

          {/* Chấm công hôm nay */}
          <Route path="/attendance" element={<AttendancePage />} />

          {/* Bảng công tháng (cá nhân) */}
          <Route path="/my-timesheet" element={<MyTimesheetPage />} />

          {/* Nghỉ phép của tôi */}
          <Route path="/my-leaves" element={<MyLeavesPage />} />

          {/* Phiếu lương của tôi */}
          <Route path="/my-payslips" element={<PayslipPage />} />

          {/* Duyệt nghỉ phép */}
          <Route path="/leave-approval" element={<LeaveApprovalPage />} />

          {/* Quản lý phòng ban */}
          <Route path="/departments" element={<DepartmentsPage />} />

          {/* Nhóm 1 – cấu hình cho Manager */}
          <Route path="/positions" element={<PositionsPage />} />
          <Route path="/shifts" element={<ShiftsPage />} />
          <Route path="/leave-types" element={<LeaveTypesPage />} />
          <Route path="/holidays" element={<HolidaysPage />} />
        </Route>

        {/* Điều hướng mặc định */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;
