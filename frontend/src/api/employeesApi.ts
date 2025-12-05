// src/api/employeesApi.ts
import apiClient from "./apiClient";

export interface EmployeeDto {
  id: string;
  code?: string | null;
  fullName: string;
  email?: string | null;
  phone?: string | null;
  departmentId?: string | null;
  departmentName?: string | null;
  positionName?: string | null;
  isActive: boolean;

  // Các field lương (nếu BE có trả thẳng từ /employees)
  baseSalary?: number | null;
  allowance?: number | null;
}

// DTO chuyên cho màn hình cấu hình lương
export interface PayrollSettingsDto {
  id: string;
  code?: string | null;
  fullName: string;
  email?: string | null;
  baseSalary?: number | null;
  allowance?: number | null;
  departmentName?: string | null;
  positionName?: string | null;
}

// Payload gửi lên khi Manager/Admin lưu lương
export interface UpdatePayrollSettingsRequest {
  baseSalary: number;
  allowance: number;
}

// Lấy toàn bộ nhân viên
async function getAll(): Promise<EmployeeDto[]> {
  const res = await apiClient.get("/employees");
  return res.data as EmployeeDto[];
}

// Lấy chi tiết 1 nhân viên
async function getById(id: string): Promise<EmployeeDto> {
  const res = await apiClient.get(`/employees/${id}`);
  return res.data as EmployeeDto;
}

// (Tuỳ chọn) Lấy nhân viên theo phòng ban – nếu BE chưa có endpoint này
// có thể không dùng; trong FE ta vẫn có thể filter từ getAll().
async function getByDepartment(departmentId: string): Promise<EmployeeDto[]> {
  const res = await apiClient.get(`/employees/by-department/${departmentId}`);
  return res.data as EmployeeDto[];
}

// Lấy cấu hình lương cho 1 nhân viên
async function getPayrollSettings(
  id: string
): Promise<PayrollSettingsDto> {
  const res = await apiClient.get(`/employees/${id}/payroll-settings`);
  return res.data as PayrollSettingsDto;
}

// Cập nhật lương (baseSalary + allowance)
async function updatePayrollSettings(
  id: string,
  payload: UpdatePayrollSettingsRequest
): Promise<void> {
  await apiClient.put(`/employees/${id}/payroll-settings`, payload);
}

const employeesApi = {
  getAll,
  getById,
  getByDepartment,
  getPayrollSettings,
  updatePayrollSettings,
};

export default employeesApi;
