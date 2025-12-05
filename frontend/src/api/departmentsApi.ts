// src/api/departmentsApi.ts
import apiClient from "./apiClient";

export interface DepartmentDto {
  id: string;
  name: string;
  code?: string | null;
  description?: string | null;
  isActive?: boolean;
}

export interface DepartmentUpsertDto {
  name: string;
  code?: string | null;
  description?: string | null;
  isActive?: boolean;
}

async function getAll(): Promise<DepartmentDto[]> {
  const res = await apiClient.get("/departments");
  return res.data as DepartmentDto[];
}

async function create(payload: DepartmentUpsertDto): Promise<DepartmentDto> {
  const res = await apiClient.post("/departments", payload);
  return res.data as DepartmentDto;
}

async function update(
  id: string,
  payload: DepartmentUpsertDto
): Promise<DepartmentDto> {
  const res = await apiClient.put(`/departments/${id}`, payload);
  return res.data as DepartmentDto;
}

async function remove(id: string): Promise<void> {
  await apiClient.delete(`/departments/${id}`);
}

const departmentsApi = {
  getAll,
  create,
  update,
  remove,
};

export default departmentsApi;
