import apiClient from "./apiClient";

export interface LeaveTypeDto {
  id: string;
  name: string;
  description?: string | null;
  isPaid: boolean;
  maxDaysPerYear?: number | null;
  isActive: boolean;
}

export interface LeaveTypeUpsertDto {
  name: string;
  description?: string | null;
  isPaid: boolean;
  maxDaysPerYear?: number | null;
  isActive: boolean;
}

const leaveTypesApi = {
  async getAll(): Promise<LeaveTypeDto[]> {
    const res = await apiClient.get("/leavetypes");
    return res.data as LeaveTypeDto[];
  },

  async create(payload: LeaveTypeUpsertDto): Promise<LeaveTypeDto> {
    const res = await apiClient.post("/leavetypes", payload);
    return res.data as LeaveTypeDto;
  },

  async update(id: string, payload: LeaveTypeUpsertDto): Promise<void> {
    await apiClient.put(`/leavetypes/${id}`, payload);
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete(`/leavetypes/${id}`);
  },
};

export default leaveTypesApi;
