// src/api/payrollApi.ts
import apiClient from "./apiClient";

// DTO trả về từ BE: PayrollResultDto
export interface PayrollResultDto {
  employeeId: string;
  employeeCode: string;
  fullName: string;

  month: string; // "YYYY-MM"

  baseSalary: number;
  allowance: number;

  baseRate: number;
  otRate: number;
  holidayRate: number;

  workHours: number;
  otHours: number;
  holidayHours: number;

  lateMinutes: number;
  earlyMinutes: number;

  paidLeaveDays: number;
  unpaidLeaveDays: number;

  normalPay: number;
  otPay: number;
  holidayPay: number;

  deductionLate: number;
  deductionUnpaid: number;
  otherDeduction: number;

  grossPay: number;
  tax: number;
  netPay: number;

  // Field cũ BE giữ lại
  penalty: number; // tổng khấu trừ
  totalPay: number; // NetPay
}

// Staff / Manager xem phiếu lương của chính mình
async function getMyPayslip(month: string) {
  const res = await apiClient.get<PayrollResultDto>("/payroll/my", {
    params: { month },
  });
  return res.data;
}

// (Sau này nếu cần) Manager tính lương cho nhân viên cụ thể
async function calcPayrollForEmployee(params: {
  employeeId: string;
  month: string;
  baseRate: number;
  otRate?: number;
  holidayRate?: number;
}) {
  const res = await apiClient.get<PayrollResultDto>("/payroll/calc", {
    params,
  });
  return res.data;
}

const payrollApi = {
  getMyPayslip,
  calcPayrollForEmployee,
};

export default payrollApi;
