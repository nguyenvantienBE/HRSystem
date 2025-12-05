// src/attendance/useAttendance.ts
import { useCallback, useEffect, useState } from "react";
import attendanceApi, {
  type TodayAttendance,
  type CheckInPayload,
  type CheckOutPayload,
  type FaceCheckInPayload,
} from "../api/attendanceApi";

type AttendanceState = {
  today: TodayAttendance | null;
  loadingToday: boolean;
  saving: boolean;
  error: string | null;
};

const useAttendance = () => {
  const [state, setState] = useState<AttendanceState>({
    today: null,
    loadingToday: false,
    saving: false,
    error: null,
  });

  // ---- load today ----
  const loadToday = useCallback(async () => {
    try {
      setState((s) => ({ ...s, loadingToday: true, error: null }));
      const data = await attendanceApi.getToday();
      setState((s) => ({ ...s, today: data, loadingToday: false }));
    } catch (err: any) {
      console.error("Load today attendance error", err);
      let msg = "Không tải được dữ liệu chấm công hôm nay.";
      if (err?.response?.data?.message) {
        msg = err.response.data.message;
      }
      setState((s) => ({ ...s, loadingToday: false, error: msg }));
    }
  }, []);

  useEffect(() => {
    loadToday();
  }, [loadToday]);

  // ---- normal check-in ----
  const checkIn = useCallback(
    async (payload: CheckInPayload) => {
      try {
        setState((s) => ({ ...s, saving: true, error: null }));
        const res = await attendanceApi.checkIn(payload);
        console.log("Check-in result:", res);
        await loadToday();
        return res;
      } catch (err: any) {
        console.error("Check-in error", err);
        let msg = "Check-in thất bại. Vui lòng thử lại.";
        if (err?.response?.data?.message) {
          msg = err.response.data.message;
        }
        setState((s) => ({ ...s, error: msg }));
        throw err;
      } finally {
        setState((s) => ({ ...s, saving: false }));
      }
    },
    [loadToday]
  );

  // ---- face check-in (BE route: /check-in/face) ----
  const faceCheckIn = useCallback(
    async (payload: FaceCheckInPayload) => {
      try {
        setState((s) => ({ ...s, saving: true, error: null }));
        const res = await attendanceApi.checkInWithFace(payload);
        console.log("Face check-in result:", res);
        await loadToday();
        return res;
      } catch (err: any) {
        console.error("Face check-in error", err);
        let msg = "Check-in bằng khuôn mặt thất bại.";
        if (err?.response?.data?.message) {
          msg = err.response.data.message;
        }
        setState((s) => ({ ...s, error: msg }));
        throw err;
      } finally {
        setState((s) => ({ ...s, saving: false }));
      }
    },
    [loadToday]
  );

  // ---- check-out ----
  const checkOut = useCallback(
    async (payload: CheckOutPayload) => {
      try {
        setState((s) => ({ ...s, saving: true, error: null }));
        const res = await attendanceApi.checkOut(payload);
        console.log("Check-out result:", res);
        await loadToday();
        return res;
      } catch (err: any) {
        console.error("Check-out error", err);
        let msg = "Check-out thất bại. Vui lòng thử lại.";
        if (err?.response?.data?.message) {
          msg = err.response.data.message;
        }
        setState((s) => ({ ...s, error: msg }));
        throw err;
      } finally {
        setState((s) => ({ ...s, saving: false }));
      }
    },
    [loadToday]
  );

  return {
    today: state.today,
    loadingToday: state.loadingToday,
    saving: state.saving,
    errorToday: state.error,
    reloadToday: loadToday,
    checkIn,
    faceCheckIn,
    checkOut,
  };
};

export default useAttendance;
