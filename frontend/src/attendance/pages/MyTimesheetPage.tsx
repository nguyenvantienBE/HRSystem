// src/attendance/pages/MyTimesheetPage.tsx
import React, { useEffect, useMemo, useState } from "react";
import profileApi, { type EmployeeProfileResponse } from "../../api/profileApi";
import reportsApi, {
  type TimesheetResult,
  type TimesheetDay,
} from "../../api/reportsApi";

const MyTimesheetPage: React.FC = () => {
  const [employee, setEmployee] = useState<EmployeeProfileResponse | null>(null);
  const [timesheet, setTimesheet] = useState<TimesheetResult | null>(null);
  const [month, setMonth] = useState<string>(() => {
    const now = new Date();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    return `${now.getFullYear()}-${m}`;
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Tải hồ sơ + bảng công
  useEffect(() => {
    const fetchData = async () => {
      setError(null);
      setLoading(true);
      try {
        // 1. Lấy Employee hiện tại để có Id
        const emp = await profileApi.getMyProfile();
        setEmployee(emp);

        // 2. Gọi API timesheet theo employee.Id + month (YYYY-MM)
        const result = await reportsApi.getTimesheet(emp.id, month);
        setTimesheet(result);
      } catch (err: any) {
        console.error("Load timesheet error", err);
        let message = "Không tải được bảng chấm công. Vui lòng thử lại.";
        if (err?.response?.data?.message) {
          message = err.response.data.message;
        }
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [month]);

  const summary = timesheet?.summary;

  const dailyRows = useMemo<TimesheetDay[]>(() => {
    return timesheet?.daily ?? [];
  }, [timesheet]);

  const titleMonth = useMemo(() => {
    if (!timesheet) return "";
    try {
      const d = new Date(timesheet.from);
      return d.toLocaleDateString("vi-VN", {
        month: "long",
        year: "numeric",
      });
    } catch {
      return month;
    }
  }, [timesheet, month]);

  return (
    <div className="w-full">
      {/* Tiêu đề + mô tả */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800">
            Bảng chấm công tháng
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Xem chi tiết giờ làm, đi trễ, về sớm, OT và ngày nghỉ trong tháng
            của bạn.
          </p>
          {employee && (
            <p className="mt-1 text-xs text-slate-400">
              Nhân viên:{" "}
              <span className="font-medium text-slate-600">
                {employee.fullName}
              </span>{" "}
              · Phòng ban: {employee.departmentName ?? "—"}
            </p>
          )}
        </div>

        {/* Chọn tháng */}
        <div className="flex flex-col items-end gap-2">
          <label className="text-[11px] uppercase tracking-[0.16em] text-slate-400">
            Tháng
          </label>
          <input
            type="month"
            className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
          />
          <span className="text-[11px] text-slate-400">
            Kỳ: {titleMonth || month}
          </span>
        </div>
      </div>

      {/* Khối tổng quan */}
      <div className="mb-4 grid grid-cols-2 md:grid-cols-4 gap-3">
        <SummaryBox
          label="Giờ làm (Work)"
          value={minutesToHourText(summary?.totalWorkMinutes)}
          badge="Chuẩn theo chấm công"
          tone="emerald"
        />
        <SummaryBox
          label="Đi trễ (Late)"
          value={minutesToHourText(summary?.totalLateMinutes)}
          badge="Tổng phút đi trễ"
          tone="amber"
        />
        <SummaryBox
          label="Về sớm (Early)"
          value={minutesToHourText(summary?.totalEarlyMinutes)}
          badge="Tổng phút về sớm"
          tone="rose"
        />
        <SummaryBox
          label="OT có lương"
          value={minutesToHourText(summary?.totalOtMinutes)}
          badge="Tổng phút OT"
          tone="indigo"
        />
      </div>

      <div className="mb-6 grid grid-cols-2 md:grid-cols-3 gap-3">
        <SmallSummaryPill
          label="Ca làm ngày lễ"
          value={`${summary?.totalHolidayShifts ?? 0} ca`}
        />
        <SmallSummaryPill
          label="Nghỉ phép có lương"
          value={`${summary?.totalLeavePaidDays ?? 0} ngày`}
        />
        <SmallSummaryPill
          label="Nghỉ không lương"
          value={`${summary?.totalLeaveUnpaidDays ?? 0} ngày`}
        />
      </div>

      {/* Thông báo lỗi / loading */}
      {error && (
        <div className="mb-4 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-2 text-xs text-rose-700">
          {error}
        </div>
      )}

      {loading && (
        <div className="mb-4 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-2 text-xs text-slate-500">
          Đang tải bảng chấm công...
        </div>
      )}

      {/* Bảng chi tiết theo ngày */}
      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-800">
              Chi tiết chấm công theo ngày
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Dữ liệu từ {formatDate(timesheet?.from)} đến{" "}
              {formatDate(timesheet?.to)}.
            </p>
          </div>
          <div className="text-[11px] text-slate-400">
            Tổng số ngày có chấm công:{" "}
            <span className="font-medium text-slate-600">
              {dailyRows.length}
            </span>
          </div>
        </div>

        <div className="max-h-[520px] overflow-auto">
          <table className="min-w-full text-xs">
            <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-2 text-left">Ngày</th>
                <th className="px-4 py-2 text-left">Thứ</th>
                <th className="px-4 py-2 text-left">Check-in</th>
                <th className="px-4 py-2 text-left">Check-out</th>
                <th className="px-4 py-2 text-right">Giờ làm</th>
                <th className="px-4 py-2 text-right">Đi trễ</th>
                <th className="px-4 py-2 text-right">Về sớm</th>
                <th className="px-4 py-2 text-right">OT</th>
                <th className="px-4 py-2 text-left">Ghi chú</th>
              </tr>
            </thead>
            <tbody>
              {dailyRows.length === 0 && !loading && (
                <tr>
                  <td
                    colSpan={9}
                    className="px-4 py-6 text-center text-xs text-slate-400"
                  >
                    Không có dữ liệu chấm công trong tháng này.
                  </td>
                </tr>
              )}

              {dailyRows.map((d) => {
                const isHoliday = d.isHoliday;
                const baseDate = safeDate(d.date);
                const weekday = baseDate.toLocaleDateString("vi-VN", {
                  weekday: "short",
                });

                return (
                  <tr
                    key={d.date}
                    className={`border-t border-slate-50 ${
                      isHoliday
                        ? "bg-amber-50/70"
                        : "hover:bg-slate-50 transition-colors"
                    }`}
                  >
                    <td className="px-4 py-2 text-slate-700">
                      {baseDate.toLocaleDateString("vi-VN", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-2 text-slate-500">{weekday}</td>
                    <td className="px-4 py-2 text-slate-700">
                      {formatTime(d.checkIn)}
                    </td>
                    <td className="px-4 py-2 text-slate-700">
                      {formatTime(d.checkOut)}
                    </td>
                    <td className="px-4 py-2 text-right text-slate-700">
                      {minutesToHourText(d.workMinutes)}
                    </td>
                    <td className="px-4 py-2 text-right text-amber-600">
                      {minutesToHourText(d.lateMinutes)}
                    </td>
                    <td className="px-4 py-2 text-right text-rose-600">
                      {minutesToHourText(d.earlyMinutes)}
                    </td>
                    <td className="px-4 py-2 text-right text-indigo-600">
                      {minutesToHourText(d.otMinutes)}
                    </td>
                    <td className="px-4 py-2 text-slate-500">
                      {isHoliday ? "Ngày nghỉ lễ" : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

interface SummaryBoxProps {
  label: string;
  value: string;
  badge: string;
  tone: "emerald" | "amber" | "rose" | "indigo";
}

const toneMap: Record<SummaryBoxProps["tone"], string> = {
  emerald: "bg-emerald-50 text-emerald-700 border-emerald-100",
  amber: "bg-amber-50 text-amber-700 border-amber-100",
  rose: "bg-rose-50 text-rose-700 border-rose-100",
  indigo: "bg-indigo-50 text-indigo-700 border-indigo-100",
};

const SummaryBox: React.FC<SummaryBoxProps> = ({
  label,
  value,
  badge,
  tone,
}) => (
  <div
    className={`rounded-2xl border px-4 py-3 text-xs flex flex-col justify-between ${toneMap[tone]}`}
  >
    <div className="flex items-center justify-between">
      <span className="font-medium">{label}</span>
      <span className="text-[11px] bg-white/70 rounded-full px-2 py-0.5">
        {badge}
      </span>
    </div>
    <div className="mt-2 text-lg font-bold">{value}</div>
  </div>
);

const SmallSummaryPill: React.FC<{ label: string; value: string }> = ({
  label,
  value,
}) => (
  <div className="rounded-2xl bg-slate-50 border border-slate-100 px-4 py-3 text-xs flex items-center justify-between">
    <span className="text-slate-500">{label}</span>
    <span className="font-semibold text-slate-800">{value}</span>
  </div>
);

// Helpers
function minutesToHourText(value?: number | null): string {
  if (!value || value <= 0) return "0h";
  const hours = Math.floor(value / 60);
  const minutes = value % 60;
  if (!minutes) return `${hours}h`;
  return `${hours}h ${minutes}p`;
}

function formatDate(value: string | undefined | null): string {
  if (!value) return "--/--/----";
  const d = safeDate(value);
  return d.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatTime(value?: string | null): string {
  if (!value) return "--:--";
  const d = safeDate(value);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

function safeDate(value: string | Date): Date {
  if (value instanceof Date) return value;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return new Date();
  return d;
}

export default MyTimesheetPage;
