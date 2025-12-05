// src/api/adminUserApi.ts
import apiClient from "./apiClient";

export interface RoleDto {
  name: string;
  description?: string;
}

export interface UserWithRolesDto {
  id: string;
  email: string | null;
  fullName: string | null;
  isActive: boolean;
  roles: string[];
}

export interface UpdateUserRolesRequest {
  roles: string[];
}

async function getRoles(): Promise<RoleDto[]> {
  const res = await apiClient.get("/admin/user-management/roles");
  return res.data as RoleDto[];
}

async function getUsers(): Promise<UserWithRolesDto[]> {
  const res = await apiClient.get("/admin/user-management/users");
  return res.data as UserWithRolesDto[];
}

async function updateUserRoles(
  userId: string,
  payload: UpdateUserRolesRequest
): Promise<void> {
  await apiClient.put(`/admin/user-management/users/${userId}/roles`, payload);
}

const adminUserApi = {
  getRoles,
  getUsers,
  updateUserRoles,
};

export default adminUserApi;
