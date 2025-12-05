// src/attendance/pages/AttendancePage.tsx
import React from "react";
import CheckInOutCard from "../CheckInOutCard";
import useAttendance from "../useAttendance";

type TodayStatus = {
  checkInAt: string | null;
  checkOutAt: string | null;
  canCheckIn: boolean;
  canCheckOut: boolean;
};

const AttendancePage: React.FC = () => {
  const { today, loadingToday, errorToday, reloadToday } = useAttendance();

  // map dữ liệu BE -> status cho FE
  const todayStatus: TodayStatus | null = (() => {
    if (!today) {
      // Không có bản ghi nào -> cho phép check-in lần đầu
      return {
        checkInAt: null,
        checkOutAt: null,
        canCheckIn: true,
        canCheckOut: false,
      };
    }

    // BE có thể trả về checkInAt / checkOutAt; dùng any để tránh lỗi kiểu
    const t: any = today;

    const checkInAt: string | null = t.checkInAt ?? null;
    const checkOutAt: string | null = t.checkOutAt ?? null;

    return {
      checkInAt,
      checkOutAt,
      canCheckIn: !checkInAt, // chưa check-in -> được phép
      canCheckOut: !!checkInAt && !checkOutAt, // đã check-in nhưng chưa out
    };
  })();

  const formatTime = (value: string | null) => {
    if (!value) return "--:--";
    const dt = new Date(value);
    return dt.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="px-8 py-6 space-y-6">
      <h1 className="text-2xl font-semibold mb-2">Chấm công hôm nay</h1>
      <p className="text-sm text-gray-500 mb-4">
        Thực hiện check-in / check-out bằng camera &amp; GPS để hệ thống ghi
        nhận thời gian làm việc của bạn.
      </p>

      {/* Khối trạng thái hôm nay */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="font-semibold text-base mb-3">Trạng thái hôm nay</h2>

        {loadingToday && (
          <p className="text-sm text-gray-500">Đang tải dữ liệu chấm công...</p>
        )}

        {!loadingToday && errorToday && (
          <p className="text-sm text-red-600">{errorToday}</p>
        )}

        {!loadingToday && !errorToday && todayStatus && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
            <div className="rounded-xl border border-gray-200 px-4 py-3 bg-gray-50">
              <h3 className="text-xs uppercase tracking-wide text-gray-500 mb-1">
                Giờ check-in
              </h3>
              <div className="text-lg font-semibold">
                {formatTime(todayStatus.checkInAt)}
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 px-4 py-3 bg-gray-50">
              <h3 className="text-xs uppercase tracking-wide text-gray-500 mb-1">
                Giờ check-out
              </h3>
              <div className="text-lg font-semibold">
                {formatTime(todayStatus.checkOutAt)}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Card camera + face + GPS */}
      <CheckInOutCard todayStatus={todayStatus} reloadToday={reloadToday} />
    </div>
  );
};

export default AttendancePage;
