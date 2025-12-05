// src/api/leavesApi.ts
import apiClient from "./apiClient";

export type LeaveStatus = "Pending" | "Approved" | "Rejected";

export interface LeaveRequestDto {
  id: string;
  employeeId: string;
  leaveTypeId: string;
  fromDate: string;
  toDate: string;
  days: number;
  reason?: string | null;
  status: LeaveStatus;
  approverId?: string | null;
  decisionAt?: string | null;
  note?: string | null;
}

export interface LeaveTypeDto {
  id: string;
  name: string;
  description?: string | null;
  paid: boolean;
  isActive: boolean;
}

export interface CreateLeaveDto {
  leaveTypeId: string;
  fromDate: string; // "YYYY-MM-DD"
  toDate: string;   // "YYYY-MM-DD"
  reason?: string;
}

export interface RejectLeaveDto {
  note?: string;
}

const leavesApi = {
  // Staff: đơn nghỉ của mình
  async getMyLeaves(): Promise<LeaveRequestDto[]> {
    const res = await apiClient.get<LeaveRequestDto[]>("/Leaves/my");
    return res.data;
  },

  // Staff: tạo đơn nghỉ
  async createLeave(payload: CreateLeaveDto): Promise<LeaveRequestDto> {
    const res = await apiClient.post<LeaveRequestDto>("/Leaves", payload);
    return res.data;
  },

  // Danh sách loại phép
  async getLeaveTypes(): Promise<LeaveTypeDto[]> {
    const res = await apiClient.get<LeaveTypeDto[]>("/LeaveTypes");
    return res.data;
  },

  // Manager: danh sách đơn (mặc định dùng status=Pending cho duyệt)
  async getPendingLeaves(): Promise<LeaveRequestDto[]> {
    const res = await apiClient.get<LeaveRequestDto[]>("/Leaves", {
      params: { status: "Pending" },
    });
    return res.data;
  },

  // Manager: duyệt
  async approveLeave(id: string): Promise<void> {
    await apiClient.post(`/Leaves/${id}/approve`);
  },

  // Manager: từ chối
  async rejectLeave(id: string, body: RejectLeaveDto): Promise<void> {
    await apiClient.post(`/Leaves/${id}/reject`, body);
  },
};

export default leavesApi;
