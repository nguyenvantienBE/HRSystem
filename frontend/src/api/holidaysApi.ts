import apiClient from "./apiClient";

export interface HolidayDto {
  id: string;
  name: string;
  date: string;         // ISO: "2025-01-01"
  isPaid: boolean;
  notes?: string | null;
}

export interface HolidayUpsertDto {
  name: string;
  date: string;
  isPaid: boolean;
  notes?: string | null;
}

const holidaysApi = {
  async getAll(): Promise<HolidayDto[]> {
    const res = await apiClient.get("/holidays");
    return res.data as HolidayDto[];
  },

  async create(payload: HolidayUpsertDto): Promise<HolidayDto> {
    const res = await apiClient.post("/holidays", payload);
    return res.data as HolidayDto;
  },

  async update(id: string, payload: HolidayUpsertDto): Promise<void> {
    await apiClient.put(`/holidays/${id}`, payload);
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete(`/holidays/${id}`);
  },
};

export default holidaysApi;
