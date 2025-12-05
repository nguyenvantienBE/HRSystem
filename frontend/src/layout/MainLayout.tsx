// src/layout/MainLayout.tsx
import React from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../auth/useAuth";

const MainLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const roles = user?.roles ?? [];
  const isAdmin = roles.includes("Admin");
  const isManager = roles.includes("Manager");
  const isOnlyAdmin = isAdmin && !isManager;

  const today = new Date().toLocaleDateString("vi-VN", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const displayName = user?.fullName || user?.email || "User";

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col">
        {/* Logo + user mini */}
        <div className="px-4 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold tracking-[0.16em] uppercase text-sky-500">
              HR System
            </div>
            <div className="text-sm font-bold text-slate-900">
              Attendance &amp; Payroll
            </div>
          </div>
          <div className="h-9 w-9 rounded-full bg-sky-100 flex items-center justify-center text-sm font-semibold text-sky-700">
            {displayName.charAt(0).toUpperCase()}
          </div>
        </div>

        {/* Nav */}
        <div className="flex-1 overflow-y-auto px-3 py-3 text-sm">
          {isOnlyAdmin ? (
            <div className="space-y-3">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-[0.18em] px-1">
                Admin settings
              </div>
              <NavItem to="/admin" label="Bảng điều khiển Admin" />
            </div>
          ) : (
            <>
              {/* Cá nhân */}
              <div className="space-y-3">
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-[0.18em] px-1">
                  Cá nhân
                </div>
                <NavItem to="/dashboard" label="Tổng quan" />
                <NavItem to="/attendance" label="Chấm công hôm nay" />
                <NavItem to="/my-timesheet" label="Bảng công tháng" />
                <NavItem to="/my-leaves" label="Đơn nghỉ phép" />
                <NavItem to="/my-payslips" label="Phiếu lương" />
              </div>

              {/* Quản lý – Manager */}
              {isManager && (
                <div className="mt-6 space-y-3">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-[0.18em] px-1">
                    Quản lý
                  </div>
                  <NavItem to="/leave-approval" label="Duyệt nghỉ phép" />
                  <NavItem to="/departments" label="Quản lý phòng ban" />
                  <NavItem to="/positions" label="Quản lý chức danh" />
                  <NavItem to="/shifts" label="Quản lý ca làm việc" />
                  <NavItem to="/leave-types" label="Loại nghỉ phép" />
                  <NavItem to="/holidays" label="Ngày nghỉ lễ" />
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 px-4 py-3 flex items-center justify-between text-[11px] text-slate-400">
          <span>© 2025 HR Attendance &amp; Payroll</span>
          <button
            type="button"
            onClick={logout}
            className="px-3 py-1 rounded-full bg-slate-900 text-white text-[11px] font-semibold hover:bg-slate-800"
          >
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col">
        {/* Top bar */}
        <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500">
              Xin chào,{" "}
              <span className="font-semibold text-slate-700">
                {displayName}
              </span>
            </div>
            <div className="text-xs text-slate-400">
              Vai trò:{" "}
              {isOnlyAdmin
                ? "Admin (cấu hình hệ thống)"
                : isManager
                ? "Manager"
                : "Staff"}
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs text-slate-500">
            <span className="hidden md:inline">{today}</span>
            <span className="px-2 py-1 rounded-full bg-slate-100 text-[11px]">
              {location.pathname}
            </span>
          </div>
        </header>

        {/* Page content */}
        <section className="flex-1 overflow-y-auto px-6 py-5">
          <Outlet />
        </section>
      </main>
    </div>
  );
};

type NavItemProps = {
  to: string;
  label: string;
};

const NavItem: React.FC<NavItemProps> = ({ to, label }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      isActive
        ? "flex items-center justify-between px-4 py-2 rounded-xl bg-sky-50 text-sky-800 text-sm font-medium"
        : "flex items-center justify-between px-4 py-2 rounded-xl text-sm text-slate-700 hover:bg-slate-50"
    }
  >
    <span>{label}</span>
  </NavLink>
);

export default MainLayout;
