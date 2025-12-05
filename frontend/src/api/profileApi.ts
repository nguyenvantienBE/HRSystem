// src/api/profileApi.ts
import api from "./apiClient";

export interface EmployeeProfileResponse {
  id: string;
  fullName: string;
  email: string;
  phone?: string | null;
  departmentName?: string | null;
  positionName?: string | null;
  faceProfileUrl?: string | null;

  /** BE có thể không trả về -> FE tự convert thành boolean */
  hasFaceEmbedding: boolean;
}

export interface UpdateProfileRequest {
  fullName: string;
  phone?: string | null;
}

const profileApi = {
  async getMyProfile(): Promise<EmployeeProfileResponse> {
    const res = await api.get<EmployeeProfileResponse>("/Employees/me");

    // Chuẩn hoá: đảm bảo FE luôn có boolean
    const data = res.data as any;

    return {
      ...res.data,
      hasFaceEmbedding: !!data.hasFaceEmbedding,
    };
  },

  async updateMyProfile(payload: UpdateProfileRequest): Promise<void> {
    await api.put("/Employees/me", payload);
  },

  /** Lưu vector embedding khuôn mặt */
  async saveFaceEmbedding(embedding: number[]): Promise<void> {
    await api.post("/Employees/me/face-embedding", {
      embedding,
    });
  },
};

export default profileApi;
