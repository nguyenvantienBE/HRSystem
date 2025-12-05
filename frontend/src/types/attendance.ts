// src/types/attendance.ts

// DTO bản ghi chấm công của 1 nhân viên trong 1 ngày
export interface AttendanceRecordDto {
  id?: string;
  date?: string; // yyyy-MM-dd hoặc ISO

  // Các mốc thời gian có thể BE trả về (để an toàn mình để optional hết)
  checkInAt?: string | null;
  checkOutAt?: string | null;

  checkInTime?: string | null;
  checkOutTime?: string | null;

  firstCheckInAt?: string | null;
  lastCheckOutAt?: string | null;

  startTime?: string | null;
  endTime?: string | null;

  status?: string | null;   // VD: "Present", "Late", "Absent"...
  note?: string | null;
}
