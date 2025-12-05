// src/admin/page/AdminDashboard.tsx
import React, { useEffect, useState } from "react";
import { useAuth } from "../../auth/useAuth";
import {
  UserRoleSettingsPage,
  OfficeLocationSettingsPage,
} from ".";

type AdminViewKey = "overview" | "userRoles" | "officeLocation";

const ACTIVE_VIEW_STORAGE_KEY = "hr-admin-active-view";

const AdminDashboard: React.FC = () => {
  const { user, logout } = useAuth();

  // Đọc tab đang mở từ localStorage để khi F5 vẫn giữ đúng tab
  const [activeView, setActiveView] = useState<AdminViewKey>(() => {
    if (typeof window === "undefined") {
      return "userRoles";
    }
    const saved = window.localStorage.getItem(ACTIVE_VIEW_STORAGE_KEY);
    if (
      saved === "overview" ||
      saved === "userRoles" ||
      saved === "officeLocation"
    ) {
      return saved;
    }
    return "userRoles";
  });

  // Mỗi khi đổi tab thì lưu vào localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(ACTIVE_VIEW_STORAGE_KEY, activeView);
    }
  }, [activeView]);

  const today = new Date().toLocaleDateString("vi-VN", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const renderContent = () => {
    switch (activeView) {
      case "overview":
        return (
          <div className="w-full">
            <h1 className="text-xl font-bold text-slate-900 mb-2">
              Bảng điều khiển hệ thống
            </h1>
            <p className="text-sm text-slate-500 mb-4">
              Đây là khu vực cấu hình hệ thống cho HR Attendance &amp; Payroll.
              Bạn có thể quản lý phân quyền tài khoản, cấu hình ca làm việc,
              phòng ban, chính sách nghỉ phép...
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-2xl border border-indigo-100 bg-indigo-50/60 px-4 py-4">
                <div className="text-xs font-semibold text-indigo-700 mb-1">
                  Người dùng
                </div>
                <div className="text-2xl font-bold text-indigo-900">
                  Admin area
                </div>
                <div className="text-xs text-indigo-700 mt-1">
                  Quản lý tài khoản &amp; phân quyền.
                </div>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4">
                <div className="text-xs font-semibold text-slate-600 mb-1">
                  Cài đặt hệ thống
                </div>
                <div className="text-sm text-slate-500">
                  Các module cấu hình khác (ca làm việc, phòng ban, chính
                  sách...) sẽ được bổ sung sau.
                </div>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4">
                <div className="text-xs font-semibold text-slate-600 mb-1">
                  Hôm nay
                </div>
                <div className="text-sm text-slate-700">{today}</div>
              </div>
            </div>
          </div>
        );
      case "officeLocation":
        return <OfficeLocationSettingsPage />;
      case "userRoles":
      default:
        return <UserRoleSettingsPage />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-gradient-to-b from-indigo-700 to-indigo-900 text-white flex flex-col">
        <div className="px-6 py-5 border-b border-indigo-500/40">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center text-lg font-semibold">
              {user?.fullName?.charAt(0).toUpperCase() ?? "A"}
            </div>
            <div>
              <div className="text-xs uppercase tracking-[0.16em] text-indigo-200">
                Admin Panel
              </div>
              <div className="text-sm font-semibold">
                {user?.fullName ?? "System Admin"}
              </div>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 text-sm">
          <button
            type="button"
            onClick={() => setActiveView("overview")}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl transition-colors ${
              activeView === "overview"
                ? "bg-white text-indigo-900 shadow-sm"
                : "text-indigo-100 hover:bg-indigo-600/60"
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-indigo-200" />
            <span>Tổng quan hệ thống</span>
          </button>

          <div className="pt-3 pb-1 text-[11px] uppercase tracking-[0.18em] text-indigo-300">
            Cấu hình
          </div>

          <button
            type="button"
            onClick={() => setActiveView("userRoles")}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl transition-colors ${
              activeView === "userRoles"
                ? "bg-white text-indigo-900 shadow-sm"
                : "text-indigo-100 hover:bg-indigo-600/60"
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-emerald-300" />
            <span>Phân quyền tài khoản</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveView("officeLocation")}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl transition-colors ${
              activeView === "officeLocation"
                ? "bg-white text-indigo-900 shadow-sm"
                : "text-indigo-100 hover:bg-indigo-600/60"
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-sky-300" />
            <span>Định vị công ty</span>
          </button>
        </nav>

        <div className="px-6 py-4 border-t border-indigo-600/60 text-[11px] text-indigo-200">
          HR Attendance &amp; Payroll · Admin Settings
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 flex flex-col">
        {/* Top bar */}
        <header className="h-16 px-8 border-b border-slate-200 bg-white flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500">
              Xin chào, {user?.fullName ?? "Admin"}
            </div>
            <div className="text-sm font-semibold text-slate-900">
              Bảng điều khiển quản trị hệ thống
            </div>
          </div>

          {/* Góc phải: ngày + nút đăng xuất */}
          <div className="flex items-center gap-3">
            <div className="text-xs text-slate-500 hidden sm:block">
              {today}
            </div>
            <button
              type="button"
              onClick={logout}
              className="px-3 py-1.5 rounded-full text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors"
            >
              Đăng xuất
            </button>
          </div>
        </header>

        {/* Main content */}
        <section className="flex-1 px-8 py-6 bg-slate-50">
          {renderContent()}
        </section>
      </main>
    </div>
  );
};

export default AdminDashboard;
