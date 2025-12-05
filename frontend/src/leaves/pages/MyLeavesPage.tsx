// src/leaves/pages/MyLeavesPage.tsx
import React, { useEffect, useMemo, useState } from "react";
import leavesApi from "../../api/leavesApi";
import type {
  CreateLeaveDto,
  LeaveRequestDto,
  LeaveStatus,
  LeaveTypeDto,
} from "../../api/leavesApi";

const statusColorMap: Record<LeaveStatus, string> = {
  Pending: "bg-amber-50 text-amber-700 border border-amber-200",
  Approved: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  Rejected: "bg-rose-50 text-rose-700 border border-rose-200",
};

const statusLabelMap: Record<LeaveStatus, string> = {
  Pending: "Đang chờ duyệt",
  Approved: "Đã duyệt",
  Rejected: "Đã từ chối",
};

const formatDate = (value?: string | null) => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("vi-VN");
};

const MyLeavesPage: React.FC = () => {
  const [leaveTypes, setLeaveTypes] = useState<LeaveTypeDto[]>([]);
  const [leaves, setLeaves] = useState<LeaveRequestDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<CreateLeaveDto>({
    leaveTypeId: "",
    fromDate: "",
    toDate: "",
    reason: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Map id -> LeaveType để tra cứu nhanh
  const leaveTypeMap = useMemo(() => {
    const map: Record<string, LeaveTypeDto> = {};
    leaveTypes.forEach((t) => {
      map[t.id] = t;
    });
    return map;
  }, [leaveTypes]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [types, myLeaves] = await Promise.all([
          leavesApi.getLeaveTypes(),
          leavesApi.getMyLeaves(),
        ]);
        setLeaveTypes(types.filter((t) => t.isActive));
        setLeaves(myLeaves);
      } catch (err) {
        console.error(err);
        setError("Không tải được dữ liệu nghỉ phép. Vui lòng thử lại.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!form.leaveTypeId || !form.fromDate || !form.toDate) {
      setError("Vui lòng chọn loại phép và khoảng thời gian.");
      return;
    }

    if (form.fromDate > form.toDate) {
      setError("Ngày bắt đầu không được lớn hơn ngày kết thúc.");
      return;
    }

    try {
      setSubmitting(true);
      const created = await leavesApi.createLeave(form);
      setLeaves((prev) => [created, ...prev]);
      setSuccess("Gửi yêu cầu nghỉ phép thành công. Đang chờ Manager duyệt.");
      setForm((prev) => ({
        ...prev,
        fromDate: "",
        toDate: "",
        reason: "",
      }));
    } catch (err: any) {
      console.error(err);
      const msg =
        err?.response?.data?.message ||
        "Gửi yêu cầu nghỉ phép thất bại. Vui lòng thử lại.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="bg-white rounded-2xl border border-slate-200 px-6 py-4 shadow-sm flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-wide text-slate-400 font-semibold">
            Nghỉ phép của tôi
          </div>
          <div className="text-lg font-bold text-slate-800">
            Đăng ký & theo dõi lịch nghỉ
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Tạo yêu cầu nghỉ phép và xem trạng thái phê duyệt.
          </div>
        </div>
        <div className="hidden md:flex items-center gap-2 text-[11px] text-slate-500">
          <span className="px-2 py-1 rounded-full bg-emerald-50 text-emerald-600">
            Pending = Đang chờ duyệt
          </span>
          <span className="px-2 py-1 rounded-full bg-sky-50 text-sky-600">
            Approved = Đã duyệt
          </span>
          <span className="px-2 py-1 rounded-full bg-rose-50 text-rose-600">
            Rejected = Đã từ chối
          </span>
        </div>
      </div>

      {/* FORM + DANH SÁCH */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* FORM ĐĂNG KÝ */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-800">
              Đăng ký nghỉ phép
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Chọn loại phép, thời gian và ghi rõ lý do nếu cần.
            </p>

            {error && (
              <div className="mt-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">
                {error}
              </div>
            )}

            {success && (
              <div className="mt-3 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
                {success}
              </div>
            )}

            <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
              {/* Loại phép */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Loại phép <span className="text-rose-500">*</span>
                </label>
                <select
                  name="leaveTypeId"
                  value={form.leaveTypeId}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500/80 focus:border-sky-500 bg-white"
                >
                  <option value="">-- Chọn loại phép --</option>
                  {leaveTypes.map((lt) => (
                    <option key={lt.id} value={lt.id}>
                      {lt.name} {lt.paid ? "(Có lương)" : "(Không lương)"}
                    </option>
                  ))}
                </select>
              </div>

              {/* Từ ngày / Đến ngày */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Từ ngày <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="fromDate"
                    value={form.fromDate}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500/80 focus:border-sky-500 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Đến ngày <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="toDate"
                    value={form.toDate}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500/80 focus:border-sky-500 bg-white"
                  />
                </div>
              </div>

              {/* Lý do */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Lý do nghỉ (tuỳ chọn)
                </label>
                <textarea
                  name="reason"
                  value={form.reason}
                  onChange={handleChange}
                  rows={3}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500/80 focus:border-sky-500 bg-white resize-none"
                  placeholder="Ví dụ: Nghỉ phép năm, về quê, khám bệnh..."
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="mt-2 w-full inline-flex items-center justify-center rounded-xl bg-sky-600 text-white text-xs font-semibold px-3 py-2 shadow-sm hover:bg-sky-700 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting ? "Đang gửi yêu cầu..." : "Gửi yêu cầu nghỉ phép"}
              </button>
            </form>
          </div>
        </div>

        {/* DANH SÁCH ĐƠN NGHỈ */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-semibold text-slate-800">
                  Lịch sử nghỉ phép
                </h3>
                <p className="text-xs text-slate-500">
                  Danh sách các yêu cầu nghỉ phép bạn đã gửi.
                </p>
              </div>
              <span className="text-[11px] text-slate-400">
                Tổng cộng: {leaves.length} đơn
              </span>
            </div>

            {loading ? (
              <div className="text-xs text-slate-500 py-6 text-center">
                Đang tải dữ liệu...
              </div>
            ) : leaves.length === 0 ? (
              <div className="text-xs text-slate-500 py-6 text-center">
                Chưa có yêu cầu nghỉ phép nào. Hãy tạo đơn đầu tiên của bạn.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500">
                      <th className="text-left py-2 pr-2 font-medium">Thời gian</th>
                      <th className="text-left py-2 px-2 font-medium">Loại phép</th>
                      <th className="text-left py-2 px-2 font-medium">Số ngày</th>
                      <th className="text-left py-2 px-2 font-medium">Lý do</th>
                      <th className="text-left py-2 pl-2 font-medium">Trạng thái</th>
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
                            <div className="text-slate-800 font-medium">
                              {formatDate(lv.fromDate)}{" "}
                              {lv.fromDate !== lv.toDate &&
                                `→ ${formatDate(lv.toDate)}`}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              Tạo lúc: {formatDate(lv.decisionAt || lv.fromDate)}
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
                            {lv.status === "Rejected" && lv.note && (
                              <div className="mt-1 text-[11px] text-rose-600">
                                Ghi chú Manager: {lv.note}
                              </div>
                            )}
                          </td>
                          <td className="py-2 pl-2 align-top">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] ${statusColorMap[lv.status]}`}
                            >
                              {statusLabelMap[lv.status]}
                            </span>
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
      </div>
    </div>
  );
};

export default MyLeavesPage;
