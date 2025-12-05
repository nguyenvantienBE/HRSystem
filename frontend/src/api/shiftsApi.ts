import apiClient from "./apiClient";

export interface ShiftDto {
  id: string;
  name: string;
  startTime: string;   // "HH:mm" hoặc "HH:mm:ss"
  endTime: string;     // "HH:mm" hoặc "HH:mm:ss"
  isOvernight: boolean;
  graceMinutes: number;
  isActive: boolean;
}

export interface ShiftUpsertDto {
  name: string;
  startTime: string;
  endTime: string;
  isOvernight: boolean;
  graceMinutes: number;
  isActive: boolean;
}

const shiftsApi = {
  async getAll(): Promise<ShiftDto[]> {
    const res = await apiClient.get("/shifts");
    return res.data as ShiftDto[];
  },

  async create(payload: ShiftUpsertDto): Promise<ShiftDto> {
    const res = await apiClient.post("/shifts", payload);
    return res.data as ShiftDto;
  },

  async update(id: string, payload: ShiftUpsertDto): Promise<void> {
    await apiClient.put(`/shifts/${id}`, payload);
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete(`/shifts/${id}`);
  },
};

export default shiftsApi;
