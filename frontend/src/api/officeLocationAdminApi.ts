// src/api/officeLocationAdminApi.ts
import apiClient from "./apiClient";

export interface OfficeLocationDto {
  id: string; // Guid -> FE xử lý string cho an toàn
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  isActive: boolean;
}

export interface UpsertOfficeLocationRequest {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
}

async function getActive(): Promise<OfficeLocationDto | null> {
  const res = await apiClient.get("/admin/office-location");
  // BE trả null hoặc object
  return res.data ?? null;
}

async function upsert(
  payload: UpsertOfficeLocationRequest
): Promise<OfficeLocationDto> {
  const res = await apiClient.put("/admin/office-location", payload);
  return res.data as OfficeLocationDto;
}

const officeLocationAdminApi = {
  getActive,
  upsert,
};

export default officeLocationAdminApi;
