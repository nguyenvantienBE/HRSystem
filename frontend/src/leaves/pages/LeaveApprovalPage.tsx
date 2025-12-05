// src/leaves/pages/LeaveApprovalPage.tsx
import React, { useEffect, useMemo, useState } from "react";
import leavesApi from "../../api/leavesApi";
import type {
  LeaveRequestDto,
  LeaveStatus,
  LeaveTypeDto,
} from "../../api/leavesApi";

const statusColorMap: Record<LeaveStatus, string> = {
  Pending: "bg-amber-50 text-amber-700 border border-amber-200",
  Approved: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  Rejected: "bg-rose-50 text-rose-700 border border-rose-200",
};

const formatDate = (value?: string | null) => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("vi-VN");
};

const LeaveApprovalPage: React.FC = () => {
  const [leaves, setLeaves] = useState<LeaveRequestDto[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveTypeDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const leaveTypeMap = useMemo(() => {
    const map: Record<string, LeaveTypeDto> = {};
    leaveTypes.forEach((t) => {
      map[t.id] = t;
    });
    return map;
  }, [leaveTypes]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [pending, types] = await Promise.all([
        leavesApi.getPendingLeaves(),
        leavesApi.getLeaveTypes(),
      ]);
      setLeaves(pending);
      setLeaveTypes(types);
    } catch (err) {
      console.error(err);
      setError("Không tải được danh sách đơn nghỉ chờ duyệt.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApprove = async (id: string) => {
    try {
      setActionLoadingId(id);
      setError(null);
      setInfo(null);
      await leavesApi.approveLeave(id);
      setLeaves((prev) => prev.filter((x) => x.id !== id));
      setInfo("Đã duyệt đơn nghỉ phép.");
    } catch (err: any) {
      console.error(err);
      const msg =
        err?.response?.data?.message ||
        "Duyệt đơn nghỉ phép thất bại. Vui lòng thử lại.";
      setError(msg);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReject = async (id: string) => {
    const note = window.prompt("Nhập lý do từ chối (tuỳ chọn):") || undefined;
    try {
      setActionLoadingId(id);
      setError(null);
      setInfo(null);
      await leavesApi.rejectLeave(id, { note });
      setLeaves((prev) => prev.filter((x) => x.id !== id));
      setInfo("Đã từ chối đơn nghỉ phép.");
    } catch (err: any) {
      console.error(err);
      const msg =
        err?.response?.data?.message ||
        "Từ chối đơn nghỉ phép thất bại. Vui lòng thử lại.";
      setError(msg);
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="bg-white rounded-2xl border border-slate-200 px-6 py-4 shadow-sm flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-wide text-slate-400 font-semibold">
            Duyệt nghỉ phép
          </div>
          <div className="text-lg font-bold text-slate-800">
            Danh sách đơn nghỉ chờ duyệt
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Manager xem và xử lý các yêu cầu nghỉ phép trong đơn vị.
          </div>
        </div>
        <button
          type="button"
          onClick={loadData}
          className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-[11px] text-slate-600 hover:bg-slate-50"
        >
          ⟳ Làm mới
        </button>
      </div>

      {/* DANH SÁCH ĐƠN */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        {error && (
          <div className="mb-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">
            {error}
          </div>
        )}

        {info && (
          <div className="mb-3 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
            {info}
          </div>
        )}

        {loading ? (
          <div className="text-xs text-slate-500 py-6 text-center">
            Đang tải danh sách đơn nghỉ chờ duyệt...
          </div>
        ) : leaves.length === 0 ? (
          <div className="text-xs text-slate-500 py-6 text-center">
            Hiện không có đơn nghỉ phép nào đang chờ duyệt.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="text-left py-2 pr-2 font-medium">Nhân viên</th>
                  <th className="text-left py-2 px-2 font-medium">Thời gian</th>
                  <th className="text-left py-2 px-2 font-medium">Loại phép</th>
                  <th className="text-left py-2 px-2 font-medium">Số ngày</th>
                  <th className="text-left py-2 px-2 font-medium">Lý do</th>
                  <th className="text-left py-2 pl-2 font-medium">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {leaves.map((lv) => {
                  const type = leaveTypeMap[lv.leaveTypeId];
                  const typeLabel = type
                    ? `${type.name} ${type.paid ? "(Có lương)" : "(Không lương)"}`
                    : lv.leaveTypeId;

                  return (
                    <tr
                      key={lv.id}
                      className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60"
                    >
                      <td className="py-2 pr-2 align-top">
                        <div className="text-sm font-semibold text-slate-800">
                          {lv.employeeId}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          ID nhân viên (sau này có DTO sẽ hiển thị tên)
                        </div>
                      </td>
                      <td className="py-2 px-2 align-top">
                        <div className="text-slate-800 font-medium">
                          {formatDate(lv.fromDate)}{" "}
                          {lv.fromDate !== lv.toDate &&
                            `→ ${formatDate(lv.toDate)}`}
                        </div>
                      </td>
                      <td className="py-2 px-2 align-top">
                        <div className="text-slate-700">{typeLabel}</div>
                      </td>
                      <td className="py-2 px-2 align-top">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-50 border border-slate-200 text-[11px] text-slate-700">
                          {lv.days} ngày
                        </span>
                      </td>
                      <td className="py-2 px-2 align-top max-w-xs">
                        <div className="text-slate-700 line-clamp-2">
                          {lv.reason || "—"}
                        </div>
                      </td>
                      <td className="py-2 pl-2 align-top">
                        <div className="flex flex-col gap-1 min-w-[120px]">
                          <button
                            type="button"
                            onClick={() => handleApprove(lv.id)}
                            disabled={actionLoadingId === lv.id}
                            className="inline-flex items-center justify-center rounded-lg bg-emerald-600 text-white text-[11px] font-semibold px-2 py-1.5 hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed"
                          >
                            {actionLoadingId === lv.id
                              ? "Đang xử lý..."
                              : "Duyệt"}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleReject(lv.id)}
                            disabled={actionLoadingId === lv.id}
                            className="inline-flex items-center justify-center rounded-lg bg-rose-50 text-rose-600 text-[11px] font-semibold px-2 py-1.5 hover:bg-rose-100 disabled:opacity-60 disabled:cursor-not-allowed border border-rose-200"
                          >
                            Từ chối
                          </button>
                          <span
                            className={`mt-0.5 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] ${statusColorMap["Pending"]}`}
                          >
                            Pending
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default LeaveApprovalPage;
