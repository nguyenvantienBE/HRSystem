// src/dashboard/pages/StaffDashboard.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../auth/useAuth";

import profileApi from "../../api/profileApi";
import reportsApi from "../../api/reportsApi";
import type { TimesheetResult } from "../../api/reportsApi";

const StaffDashboard: React.FC = () => {
  const { user } = useAuth();

  const today = new Date().toLocaleDateString("vi-VN", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  // ==== STATE TIMESHEET DÙNG CHO DASHBOARD ====
  const [timesheet, setTimesheet] = useState<TimesheetResult | null>(null);
  const [tsLoading, setTsLoading] = useState(false);
  const [tsError, setTsError] = useState<string | null>(null);

  // Tháng hiện tại dạng YYYY-MM để gửi lên API
  const currentMonthParam = useMemo(() => {
    const now = new Date();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    return `${now.getFullYear()}-${m}`;
  }, []);

  const currentMonthLabel = useMemo(() => {
    try {
      const now = new Date();
      return now.toLocaleDateString("vi-VN", {
        month: "long",
        year: "numeric",
      });
    } catch {
      return currentMonthParam;
    }
  }, [currentMonthParam]);

  // Gọi API lấy timesheet tháng hiện tại cho Dashboard
  useEffect(() => {
    const fetchTimesheetForDashboard = async () => {
      setTsLoading(true);
      setTsError(null);
      try {
        const emp = await profileApi.getMyProfile();
        const result = await reportsApi.getTimesheet(
          emp.id,
          currentMonthParam
        );
        setTimesheet(result);
      } catch (err: any) {
        console.error("Load dashboard timesheet error", err);
        let msg = "Không tải được dữ liệu chấm công tháng này.";
        if (err?.response?.data?.message) {
          msg = err.response.data.message;
        }
        setTsError(msg);
      } finally {
        setTsLoading(false);
      }
    };

    fetchTimesheetForDashboard();
  }, [currentMonthParam]);

  const summary = timesheet?.summary;

  // ====== CHỈ CÒN NỘI DUNG CHÍNH, KHÔNG CÒN SIDEBAR BÊN TRONG ======
  return (
    <div className="space-y-6">
      {/* Thanh welcome */}
      <div className="bg-white rounded-3xl border border-slate-200 px-8 py-5 flex items-center justify-between shadow-md">
        <div>
          <div className="text-[11px] uppercase tracking-[0.16em] text-slate-400 font-semibold">
            Chào mừng trở lại
          </div>
          <div className="mt-1 text-2xl font-bold text-slate-900">
            {user?.fullName || user?.email || "Nhân viên"}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            Hôm nay là <span className="font-medium">{today}</span>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2 text-xs">
          <div className="inline-flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 px-3 py-1 font-semibold">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Đang hoạt động
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 text-sky-700 px-3 py-1">
              Ca làm: Sáng (08:00 - 12:00)
            </span>
          </div>
          <div className="text-[11px] text-slate-400">
            HR Attendance & Payroll · Phiên bản demo đồ án
          </div>
        </div>
      </div>

      {/* 4 ô tổng quan demo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <SummaryCard
          color="sky"
          title="Nhân viên"
          value="24"
          pill="Hoạt động"
          pillColor="emerald"
        />
        <SummaryCard
          color="emerald"
          title="Giấy phép"
          value="6"
          pill="Đang chờ duyệt"
          pillColor="amber"
        />
        <SummaryCard
          color="violet"
          title="Nghỉ phép"
          value="3"
          pill="Yêu cầu mới"
          pillColor="sky"
          icon=""
        />
        <SummaryCard
          color="rose"
          title="Cài đặt nhân sự"
          value="HR"
          pill="Cấu hình"
          pillColor="slate"
          icon=""
        />
      </div>

      {/* 3 ô nhỏ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SmallCard
          color="amber"
          title="Ngày lễ"
          description="Xem lịch nghỉ lễ & lịch làm việc điều chỉnh."
        />
        <SmallCard
          color="sky"
          title="Dự án"
          description="2 dự án đang hoạt động · 1 dự án đã hoàn tất."
        />
        <SmallCard
          color="emerald"
          title="Công việc"
          description="Bạn có 4 task hôm nay · 2 task sắp đến hạn."
        />
      </div>

      {/* Biểu đồ + tình trạng chấm công tháng này */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Donut demo phân bố phòng ban */}
        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Nhân viên theo phòng ban
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Phân bố nhân sự hiện tại trong công ty
              </p>
            </div>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-50 text-slate-500 border border-slate-200">
              Demo
            </span>
          </div>

          <div className="flex items-center gap-6 mt-2">
            <div className="relative h-32 w-32 mx-auto">
              <div className="absolute inset-0 rounded-full bg-emerald-400" />
              <div className="absolute inset-3 rounded-full bg-sky-400" />
              <div className="absolute inset-7 rounded-full bg-rose-400" />
              <div className="absolute inset-11 rounded-full bg-white" />
            </div>

            <div className="flex-1 space-y-2 text-xs">
              <Legend
                color="bg-emerald-400"
                label="Phòng kỹ thuật"
                value="10 nhân viên"
              />
              <Legend
                color="bg-sky-400"
                label="Phòng kinh doanh"
                value="7 nhân viên"
              />
              <Legend
                color="bg-rose-400"
                label="Phòng nhân sự"
                value="4 nhân viên"
              />
              <Legend color="bg-slate-300" label="Khác" value="3 nhân viên" />
            </div>
          </div>
        </div>

        {/* Tình trạng chấm công tháng này (dữ liệu thật) */}
        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Tình trạng chấm công tháng này
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Tổng hợp Work · Late · Early · OT · Nghỉ phép
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Kỳ: {currentMonthLabel}
              </p>
            </div>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-50 text-slate-500 border border-slate-200">
              Dữ liệu thật
            </span>
          </div>

          {tsLoading && (
            <div className="mb-3 rounded-2xl bg-slate-50 border border-slate-100 px-3 py-2 text-[11px] text-slate-500">
              Đang tải dữ liệu chấm công tháng này...
            </div>
          )}

          {tsError && !tsLoading && (
            <div className="mb-3 rounded-2xl bg-rose-50 border border-rose-100 px-3 py-2 text-[11px] text-rose-700">
              {tsError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 text-xs mt-3">
            <AttendanceStat
              label="Giờ làm (Work)"
              value={minutesToHourText(summary?.totalWorkMinutes)}
              color="text-emerald-600"
            />
            <AttendanceStat
              label="OT có hưởng lương"
              value={minutesToHourText(summary?.totalOtMinutes)}
              color="text-indigo-600"
            />
            <AttendanceStat
              label="Đi trễ (Late)"
              value={minutesToHourText(summary?.totalLateMinutes)}
              color="text-amber-600"
            />
            <AttendanceStat
              label="Về sớm (Early)"
              value={minutesToHourText(summary?.totalEarlyMinutes)}
              color="text-rose-600"
            />
            <AttendanceStat
              label="Nghỉ phép có lương"
              value={`${summary?.totalLeavePaidDays ?? 0} ngày`}
              color="text-slate-700"
            />
            <AttendanceStat
              label="Nghỉ không lương"
              value={`${summary?.totalLeaveUnpaidDays ?? 0} ngày`}
              color="text-slate-700"
            />
          </div>

          <div className="mt-4 h-20 rounded-2xl bg-slate-50 flex items-end overflow-hidden">
            <div className="flex-1 flex items-end justify-around px-3 pb-2">
              <Bar
                height={barHeight(summary?.totalWorkMinutes)}
                color="bg-emerald-400"
              />
              <Bar
                height={barHeight(summary?.totalOtMinutes)}
                color="bg-indigo-400"
              />
              <Bar
                height={barHeight(summary?.totalLateMinutes)}
                color="bg-amber-400"
              />
              <Bar
                height={barHeight(summary?.totalEarlyMinutes)}
                color="bg-rose-400"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ================== COMPONENT PHỤ ================== */

interface SummaryCardProps {
  color: "sky" | "emerald" | "violet" | "rose";
  title: string;
  value: string;
  pill: string;
  pillColor: "emerald" | "amber" | "sky" | "slate";
  icon?: string;
}

const colorMap: Record<SummaryCardProps["color"], string> = {
  sky: "from-sky-400 via-sky-500 to-sky-600",
  emerald: "from-emerald-400 via-emerald-500 to-emerald-600",
  violet: "from-violet-400 via-violet-500 to-violet-600",
  rose: "from-rose-400 via-rose-500 to-rose-600",
};

const pillColorClassMap: Record<SummaryCardProps["pillColor"], string> = {
  emerald: "bg-emerald-50 text-emerald-700",
  amber: "bg-amber-50 text-amber-700",
  sky: "bg-sky-50 text-sky-700",
  slate: "bg-slate-100 text-slate-700",
};

const SummaryCard: React.FC<SummaryCardProps> = ({
  color,
  title,
  value,
  pill,
  pillColor,
  icon,
}) => {
  return (
    <div className="relative rounded-3xl overflow-hidden shadow-md border border-slate-200 bg-gradient-to-tr text-white">
      <div className={`absolute inset-0 ${colorMap[color]} opacity-95`} />
      <div className="relative px-5 py-4 flex items-center justify-between">
        <div>
          <div className="text-[11px] uppercase tracking-[0.18em] opacity-90">
            {title}
          </div>
          <div className="text-2xl font-bold mt-1 drop-shadow-sm">{value}</div>
          <div
            className={`inline-flex mt-2 text-[11px] px-2.5 py-0.5 rounded-full bg-white/95 text-slate-700 ${pillColorClassMap[pillColor]} shadow-sm`}
          >
            {pill}
          </div>
        </div>
        <div className="h-10 w-10 rounded-2xl bg-white/20 flex items-center justify-center text-lg shadow-inner">
          {icon || ""}
        </div>
      </div>
    </div>
  );
};

interface SmallCardProps {
  color: "amber" | "sky" | "emerald";
  title: string;
  description: string;
}

const smallColorMap: Record<SmallCardProps["color"], string> = {
  amber: "bg-amber-400",
  sky: "bg-sky-400",
  emerald: "bg-emerald-400",
};

const SmallCard: React.FC<SmallCardProps> = ({ color, title, description }) => {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white shadow-sm p-4 flex items-start gap-3">
      <div
        className={`${smallColorMap[color]} h-10 w-10 rounded-2xl flex items-center justify-center text-white text-lg shadow-md`}
      >
        ✦
      </div>
      <div>
        <div className="text-sm font-semibold text-slate-900">{title}</div>
        <p className="text-xs text-slate-500 mt-1 leading-snug">
          {description}
        </p>
      </div>
    </div>
  );
};

interface LegendProps {
  color: string;
  label: string;
  value: string;
}

const Legend: React.FC<LegendProps> = ({ color, label, value }) => {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
        <span className="text-slate-600">{label}</span>
      </div>
      <span className="text-slate-500">{value}</span>
    </div>
  );
};

interface AttendanceStatProps {
  label: string;
  value: string;
  color?: string;
}

const AttendanceStat: React.FC<AttendanceStatProps> = ({
  label,
  value,
  color,
}) => {
  return (
    <div className="rounded-2xl bg-slate-50 px-3 py-2">
      <div className="text-[11px] text-slate-500">{label}</div>
      <div className={`text-sm font-semibold ${color ?? "text-slate-800"}`}>
        {value}
      </div>
    </div>
  );
};

interface BarProps {
  height: string;
  color: string;
}

const Bar: React.FC<BarProps> = ({ height, color }) => {
  return <div className={`w-4 rounded-t-full ${height} ${color} shadow-sm`} />;
};

// ===== Helpers dùng cho minutes → text & bar height =====
function minutesToHourText(value?: number | null): string {
  if (!value || value <= 0) return "0h";
  const hours = Math.floor(value / 60);
  const minutes = value % 60;
  if (!minutes) return `${hours}h`;
  return `${hours}h ${minutes}p`;
}

function barHeight(value?: number | null): string {
  if (!value || value <= 0) return "h-1";
  const hours = value / 60;
  if (hours >= 10) return "h-16";
  if (hours >= 8) return "h-14";
  if (hours >= 6) return "h-12";
  if (hours >= 4) return "h-10";
  if (hours >= 2) return "h-8";
  return "h-6";
}

export default StaffDashboard;
