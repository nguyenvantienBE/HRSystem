// src/payroll/pages/PayslipPage.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../auth/useAuth";
import payrollApi from "../../api/payrollApi";
import type { PayrollResultDto } from "../../api/payrollApi";

const formatCurrency = (value: number) =>
  value.toLocaleString("vi-VN", { style: "currency", currency: "VND" });

const formatHours = (value: number) =>
  `${value.toLocaleString("vi-VN", { maximumFractionDigits: 1 })} giờ`;

const getCurrentMonthKey = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  return `${y}-${m.toString().padStart(2, "0")}`; // YYYY-MM
};

const PayslipPage: React.FC = () => {
  const { user } = useAuth();
  const currentMonthKey = useMemo(getCurrentMonthKey, []);
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthKey);
  const [payslip, setPayslip] = useState<PayrollResultDto | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Danh sách 6 tháng gần nhất để chọn
  const monthOptions = useMemo(() => {
    const arr: { key: string; label: string }[] = [];
    const now = new Date();

    for (let i = 0; i < 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${(d.getMonth() + 1)
        .toString()
        .padStart(2, "0")}`;
      const label = `Tháng ${(d.getMonth() + 1)
        .toString()
        .padStart(2, "0")}/${d.getFullYear()}`;
      arr.push({ key, label });
    }

    return arr;
  }, []);

  const periodLabel = useMemo(() => {
    const monthStr = payslip?.month || selectedMonth;
    if (!monthStr) return "";
    const [year, m] = monthStr.split("-");
    return `Tháng ${m}/${year}`;
  }, [payslip, selectedMonth]);

  const totalDeduction = useMemo(() => {
    if (!payslip) return 0;
    return (
      payslip.deductionLate +
      payslip.deductionUnpaid +
      payslip.otherDeduction +
      payslip.tax
    );
  }, [payslip]);

  const fetchPayslip = async (monthKey: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await payrollApi.getMyPayslip(monthKey);
      setPayslip(data);
    } catch (err: any) {
      console.error(err);
      const msg =
        err?.response?.data?.message ||
        "Không tải được phiếu lương. Vui lòng thử lại.";
      setError(msg);
      setPayslip(null);
    } finally {
      setLoading(false);
    }
  };

  // Load phiếu lương tháng hiện tại khi mở trang
  useEffect(() => {
    fetchPayslip(currentMonthKey);
  }, [currentMonthKey]);

  const handleView = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetchPayslip(selectedMonth);
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="bg-white rounded-2xl border border-slate-200 px-6 py-4 shadow-sm flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-wide text-slate-400 font-semibold">
            Phiếu lương
          </div>
          <div className="text-lg font-bold text-slate-800">
            Lương & phiếu lương của bạn
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Xem tổng hợp lương, OT, phụ cấp và khấu trừ theo từng tháng.
          </div>
        </div>
        <div className="hidden md:flex flex-col items-end text-[11px] text-slate-500">
          <span>Tên nhân viên: {user?.fullName || user?.email}</span>
          <span>Mã nhân viên: {payslip?.employeeCode || "E0001 (demo)"}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* BỘ LỌC THÁNG */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-800">
              Chọn kỳ lương
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Chọn tháng lương bạn muốn xem. Dữ liệu lấy trực tiếp từ API
              Payroll.
            </p>

            <form className="mt-4 space-y-3" onSubmit={handleView}>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Tháng lương
                </label>
                <select
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500/80 focus:border-sky-500 bg-white"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                >
                  {monthOptions.map((m) => (
                    <option key={m.key} value={m.key}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="mt-2 w-full inline-flex items-center justify-center rounded-xl bg-sky-600 text-white text-xs font-semibold px-3 py-2 shadow-sm hover:bg-sky-700 disabled:opacity-60"
                disabled={loading}
              >
                {loading ? "Đang tải..." : "Xem phiếu lương"}
              </button>

              {error && (
                <div className="mt-2 text-[11px] text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">
                  {error}
                </div>
              )}

              {!error && !payslip && !loading && (
                <div className="mt-2 text-[11px] text-slate-500 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                  Chưa có dữ liệu phiếu lương cho tháng này.
                </div>
              )}
            </form>
          </div>
        </div>

        {/* PHIẾU LƯƠNG */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            {loading && (
              <div className="text-xs text-slate-500 py-6 text-center">
                Đang tải phiếu lương...
              </div>
            )}

            {!loading && payslip && (
              <>
                {/* Thông tin chung */}
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-xs uppercase tracking-wide text-slate-400 font-semibold">
                      Phiếu lương nhân viên
                    </div>
                    <div className="text-base font-bold text-slate-800">
                      {periodLabel}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1">
                      Công ty: Demo IT Services Co., Ltd. (Môi trường văn
                      phòng)
                    </div>
                  </div>
                  <div className="text-[11px] text-right text-slate-500">
                    <div>Mã NV: {payslip.employeeCode}</div>
                    <div>Họ tên: {payslip.fullName}</div>
                    <div>Phòng ban: IT (Demo)</div>
                    <div>Chức danh: Software Engineer (Demo)</div>
                  </div>
                </div>

                {/* TỔNG KẾT SỐ NGÀY/GIỜ */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <div className="rounded-xl bg-slate-50 px-3 py-2">
                    <div className="text-[11px] text-slate-500">
                      Giờ làm thực tế
                    </div>
                    <div className="text-sm font-semibold text-emerald-600">
                      {formatHours(payslip.workHours)}
                    </div>
                  </div>
                  <div className="rounded-xl bg-slate-50 px-3 py-2">
                    <div className="text-[11px] text-slate-500">Giờ OT</div>
                    <div className="text-sm font-semibold text-sky-600">
                      {formatHours(payslip.otHours)}
                    </div>
                  </div>
                  <div className="rounded-xl bg-slate-50 px-3 py-2">
                    <div className="text-[11px] text-slate-500">
                      Nghỉ phép có lương
                    </div>
                    <div className="text-sm font-semibold text-indigo-600">
                      {payslip.paidLeaveDays} ngày
                    </div>
                  </div>
                  <div className="rounded-xl bg-slate-50 px-3 py-2">
                    <div className="text-[11px] text-slate-500">
                      Nghỉ không lương
                    </div>
                    <div className="text-sm font-semibold text-rose-600">
                      {payslip.unpaidLeaveDays} ngày
                    </div>
                  </div>
                </div>

                {/* BẢNG THU NHẬP / KHẤU TRỪ */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* THU NHẬP */}
                  <div>
                    <h3 className="text-xs font-semibold text-slate-700 mb-2">
                      I. THU NHẬP (Earnings)
                    </h3>
                    <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                      <table className="w-full">
                        <tbody>
                          <tr className="border-b border-slate-200">
                            <td className="px-3 py-2 text-slate-600">
                              Lương cơ bản
                            </td>
                            <td className="px-3 py-2 text-right font-semibold text-slate-800">
                              {formatCurrency(payslip.baseSalary)}
                            </td>
                          </tr>
                          <tr className="border-b border-slate-200">
                            <td className="px-3 py-2 text-slate-600">
                              Phụ cấp / Allowance
                            </td>
                            <td className="px-3 py-2 text-right font-semibold text-slate-800">
                              {formatCurrency(payslip.allowance)}
                            </td>
                          </tr>
                          <tr className="border-b border-slate-200">
                            <td className="px-3 py-2 text-slate-600">
                              Tiền OT (làm thêm giờ)
                            </td>
                            <td className="px-3 py-2 text-right font-semibold text-slate-800">
                              {formatCurrency(payslip.otPay)}
                            </td>
                          </tr>
                          <tr>
                            <td className="px-3 py-2 text-slate-600">
                              Tiền làm ngày lễ
                            </td>
                            <td className="px-3 py-2 text-right font-semibold text-slate-800">
                              {formatCurrency(payslip.holidayPay)}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* KHẤU TRỪ */}
                  <div>
                    <h3 className="text-xs font-semibold text-slate-700 mb-2">
                      II. KHẤU TRỪ (Deductions)
                    </h3>
                    <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                      <table className="w-full">
                        <tbody>
                          <tr className="border-b border-slate-200">
                            <td className="px-3 py-2 text-slate-600">
                              Phạt đi trễ / về sớm
                            </td>
                            <td className="px-3 py-2 text-right font-semibold text-rose-600">
                              {formatCurrency(payslip.deductionLate)}
                            </td>
                          </tr>
                          <tr className="border-b border-slate-200">
                            <td className="px-3 py-2 text-slate-600">
                              Nghỉ không lương
                            </td>
                            <td className="px-3 py-2 text-right font-semibold text-rose-600">
                              {formatCurrency(payslip.deductionUnpaid)}
                            </td>
                          </tr>
                          <tr>
                            <td className="px-3 py-2 text-slate-600">
                              Khấu trừ khác (BHXH/Thuế, nếu có)
                            </td>
                            <td className="px-3 py-2 text-right font-semibold text-rose-600">
                              {formatCurrency(
                                payslip.otherDeduction + payslip.tax
                              )}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* TỔNG KẾT LƯƠNG */}
                <div className="border border-slate-200 rounded-xl p-4 text-xs bg-slate-50">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div>
                      <div className="text-[11px] text-slate-500">
                        Tổng thu nhập
                      </div>
                      <div className="text-sm font-semibold text-slate-800">
                        {formatCurrency(payslip.grossPay)}
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] text-slate-500">
                        Tổng khấu trừ
                      </div>
                      <div className="text-sm font-semibold text-rose-600">
                        {formatCurrency(totalDeduction)}
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] text-slate-500">
                        Lương thực nhận (Net pay)
                      </div>
                      <div className="text-base font-bold text-emerald-600">
                        {formatCurrency(payslip.netPay)}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 text-[11px] text-slate-500">
                    * Phiếu lương này được tính tự động từ module Payroll
                    (Attendance + Nghỉ phép + cấu hình lương). Số liệu dùng cho
                    mục đích minh họa đồ án.
                  </div>
                </div>
              </>
            )}

            {!loading && !payslip && !error && (
              <div className="text-xs text-slate-500 py-6 text-center">
                Chưa có dữ liệu phiếu lương cho tháng được chọn.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PayslipPage;
