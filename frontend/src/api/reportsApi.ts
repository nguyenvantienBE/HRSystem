// src/api/reportsApi.ts
import apiClient from "./apiClient";

// ==== Kiểu DTO Timesheet chuẩn hóa cho FE ====

// Tổng hợp theo tháng
export interface TimesheetSummary {
  totalWorkMinutes: number;
  totalLateMinutes: number;
  totalEarlyMinutes: number;
  totalOtMinutes: number;
  totalHolidayShifts: number;
  totalLeavePaidDays: number;
  totalLeaveUnpaidDays: number;
}

// Dòng chi tiết từng ngày
export interface TimesheetDay {
  date: string; // ISO hoặc yyyy-MM-dd
  checkIn?: string | null;
  checkOut?: string | null;
  workMinutes: number;
  lateMinutes: number;
  earlyMinutes: number;
  otMinutes: number;
  isHoliday: boolean;
}

// Kết quả tổng thể 1 timesheet
export interface TimesheetResult {
  employeeId: string;
  month: string;
  from: string;
  to: string;
  summary: TimesheetSummary;
  daily: TimesheetDay[];
}

// Chuẩn hóa dữ liệu trả về từ BE (PascalCase / camelCase)
function normalizeTimesheet(raw: any): TimesheetResult {
  const summaryRaw = raw.summary ?? raw.Summary ?? {};
  const dailyRaw: any[] = raw.daily ?? raw.Daily ?? [];

  const summary: TimesheetSummary = {
    totalWorkMinutes:
      summaryRaw.totalWorkMinutes ?? summaryRaw.TotalWorkMinutes ?? 0,
    totalLateMinutes:
      summaryRaw.totalLateMinutes ?? summaryRaw.TotalLateMinutes ?? 0,
    totalEarlyMinutes:
      summaryRaw.totalEarlyMinutes ?? summaryRaw.TotalEarlyMinutes ?? 0,
    totalOtMinutes:
      summaryRaw.totalOtMinutes ?? summaryRaw.TotalOtMinutes ?? 0,
    totalHolidayShifts:
      summaryRaw.totalHolidayShifts ?? summaryRaw.TotalHolidayShifts ?? 0,
    totalLeavePaidDays:
      summaryRaw.totalLeavePaidDays ?? summaryRaw.TotalLeavePaidDays ?? 0,
    totalLeaveUnpaidDays:
      summaryRaw.totalLeaveUnpaidDays ?? summaryRaw.TotalLeaveUnpaidDays ?? 0,
  };

  const daily: TimesheetDay[] = dailyRaw.map((x) => ({
    date: x.date ?? x.Date,
    checkIn: x.checkIn ?? x.CheckIn ?? null,
    checkOut: x.checkOut ?? x.CheckOut ?? null,
    workMinutes: x.workMinutes ?? x.WorkMinutes ?? 0,
    lateMinutes: x.lateMinutes ?? x.LateMinutes ?? 0,
    earlyMinutes: x.earlyMinutes ?? x.EarlyMinutes ?? 0,
    otMinutes: x.otMinutes ?? x.OtMinutes ?? 0,
    isHoliday: x.isHoliday ?? x.IsHoliday ?? false,
  }));

  return {
    employeeId: raw.employeeId ?? raw.EmployeeId ?? "",
    month: raw.month ?? raw.Month ?? "",
    from: raw.from ?? raw.From ?? "",
    to: raw.to ?? raw.To ?? "",
    summary,
    daily,
  };
}

async function getTimesheet(
  employeeId: string,
  month: string
): Promise<TimesheetResult> {
  const res = await apiClient.get("/reports/timesheet", {
    params: { employeeId, month },
  });

  return normalizeTimesheet(res.data);
}

const reportsApi = {
  getTimesheet,
};

export default reportsApi;
