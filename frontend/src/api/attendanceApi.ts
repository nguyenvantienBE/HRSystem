// src/api/attendanceApi.ts
import apiClient from "./apiClient";

// ===== Types =====

export type TodayAttendance = {
  hasRecord: boolean;
  shiftId?: string | null;
  shiftName?: string | null;

  // thời gian ISO từ BE
  firstCheckInAt?: string | null;
  lastCheckOutAt?: string | null;

  // optional: BE có thể trả thêm
  status?: string | null;
};

export type CheckInPayload = {
  shiftId?: string;
  latitude?: number;
  longitude?: number;
  locationName?: string;
};

export type CheckOutPayload = {
  shiftId?: string;
  latitude?: number;
  longitude?: number;
  locationName?: string;
};

export type FaceCheckInPayload = {
  embedding: number[];
  latitude?: number;
  longitude?: number;
  locationName?: string;
};

// ===== Helpers =====

function normalizeToday(data: any): TodayAttendance {
  if (!data) {
    return {
      hasRecord: false,
      shiftId: null,
      shiftName: null,
      firstCheckInAt: null,
      lastCheckOutAt: null,
      status: null,
    };
  }

  return {
    hasRecord: !!data.hasRecord,
    shiftId: data.shiftId ?? null,
    shiftName: data.shiftName ?? null,
    firstCheckInAt: data.firstCheckInAt ?? null,
    lastCheckOutAt: data.lastCheckOutAt ?? null,
    status: data.status ?? null,
  };
}

// ===== API calls =====

async function getToday(): Promise<TodayAttendance> {
  const res = await apiClient.get("/attendance/today");
  return normalizeToday(res.data);
}

async function checkIn(payload: CheckInPayload) {
  const res = await apiClient.post("/attendance/check-in", payload);
  return res.data as { message: string; id?: string };
}

async function checkInWithFace(payload: FaceCheckInPayload) {
  const res = await apiClient.post("/attendance/check-in/face", payload);
  return res.data as { message: string; id?: string };
}

async function checkOut(payload: CheckOutPayload) {
  const res = await apiClient.post("/attendance/check-out", payload);
  return res.data as { message: string };
}

// ===== Export object =====

const attendanceApi = {
  getToday,
  checkIn,
  checkInWithFace,
  checkOut,
};

export default attendanceApi;
