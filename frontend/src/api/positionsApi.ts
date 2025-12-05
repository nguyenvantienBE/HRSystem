import apiClient from "./apiClient";

export interface PositionDto {
  id: string;
  name: string;
  description?: string | null;
  isActive: boolean;
}

export interface PositionUpsertDto {
  name: string;
  description?: string | null;
  isActive: boolean;
}

const positionsApi = {
  async getAll(): Promise<PositionDto[]> {
    const res = await apiClient.get("/positions");
    return res.data as PositionDto[];
  },

  async create(payload: PositionUpsertDto): Promise<PositionDto> {
    const res = await apiClient.post("/positions", payload);
    return res.data as PositionDto;
  },

  async update(id: string, payload: PositionUpsertDto): Promise<void> {
    await apiClient.put(`/positions/${id}`, payload);
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete(`/positions/${id}`);
  },
};

export default positionsApi;
