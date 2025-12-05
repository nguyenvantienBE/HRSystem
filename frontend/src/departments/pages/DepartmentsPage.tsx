import React, { useEffect, useMemo, useState } from "react";
import departmentsApi from "../../api/departmentsApi";
import type {
  DepartmentDto,
  DepartmentUpsertDto,
} from "../../api/departmentsApi";

import employeesApi from "../../api/employeesApi";
import type {
  EmployeeDto,
  UpdatePayrollSettingsRequest,
} from "../../api/employeesApi";

import { useAuth } from "../../auth/useAuth";

type DeptFormState = DepartmentUpsertDto & { id?: string };

const DepartmentsPage: React.FC = () => {
  const { user } = useAuth();
  const isManagerOrAdmin =
    user?.roles?.includes("Manager") || user?.roles?.includes("Admin");

  const [departments, setDepartments] = useState<DepartmentDto[]>([]);
  const [employees, setEmployees] = useState<EmployeeDto[]>([]);
  const [selectedDeptId, setSelectedDeptId] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<DeptFormState | null>(null);
  const [mode, setMode] = useState<"none" | "create" | "edit">("none");

  // ====== chọn nhân viên & lương ======
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(
    null
  );
  const [baseSalaryInput, setBaseSalaryInput] = useState<string>("");
  const [allowanceInput, setAllowanceInput] = useState<string>("");
  const [compSaving, setCompSaving] = useState(false);
  const [compError, setCompError] = useState<string | null>(null);
  const [compSuccess, setCompSuccess] = useState<string | null>(null);

  // ===== Load dữ liệu =====
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [deptRes, empRes] = await Promise.all([
          departmentsApi.getAll(),
          employeesApi.getAll(),
        ]);
        setDepartments(deptRes);
        setEmployees(empRes);

        if (!selectedDeptId && deptRes.length > 0) {
          setSelectedDeptId(deptRes[0].id);
        }
      } catch (err: any) {
        console.error("Load departments error", err);
        setError(
          err?.response?.data?.message ||
            "Không tải được danh sách phòng ban."
        );
      } finally {
        setLoading(false);
      }
    };

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const currentEmployees = useMemo(() => {
    if (!selectedDeptId) return [];
    return employees.filter((e) => e.departmentId === selectedDeptId);
  }, [employees, selectedDeptId]);

  const selectedDept = useMemo(
    () => departments.find((d) => d.id === selectedDeptId) || null,
    [departments, selectedDeptId]
  );

  const selectedEmployee = useMemo(
    () =>
      selectedEmployeeId
        ? employees.find((e) => e.id === selectedEmployeeId) || null
        : null,
    [employees, selectedEmployeeId]
  );

  // Khi chọn nhân viên khác → nạp lại form lương
  useEffect(() => {
    const loadPayroll = async () => {
      if (!selectedEmployeeId) {
        setBaseSalaryInput("");
        setAllowanceInput("");
        return;
      }

      try {
        const emp = await employeesApi.getPayrollSettings(selectedEmployeeId);
        setBaseSalaryInput(
          emp.baseSalary != null ? String(emp.baseSalary) : ""
        );
        setAllowanceInput(
          emp.allowance != null ? String(emp.allowance) : ""
        );
      } catch (err: any) {
        console.error("Load payroll settings error", err);
        setCompError(
          err?.response?.data?.message ||
            "Không tải được thông tin lương nhân viên."
        );
        setBaseSalaryInput("");
        setAllowanceInput("");
      } finally {
        setCompSuccess(null);
      }
    };

    loadPayroll();
  }, [selectedEmployeeId]);

  const handleSelectDept = (id: string) => {
    setSelectedDeptId(id);
    setMode("none");
    setForm(null);
    // đổi phòng ban thì bỏ chọn nhân viên
    setSelectedEmployeeId(null);
    setCompError(null);
    setCompSuccess(null);
  };

  const handleSelectEmployee = (id: string) => {
    setSelectedEmployeeId(id);
    setCompError(null);
    setCompSuccess(null);
  };

  const openCreate = () => {
    if (!isManagerOrAdmin) return;
    setMode("create");
    setForm({
      name: "",
      code: "",
      isActive: true,
    });
  };

  const openEdit = () => {
    if (!isManagerOrAdmin || !selectedDept) return;
    setMode("edit");
    setForm({
      id: selectedDept.id,
      name: selectedDept.name,
      // luôn ép về string
      code: selectedDept.code ?? "",
      isActive: selectedDept.isActive,
    });
  };

  const cancelForm = () => {
    setMode("none");
    setForm(null);
  };

  const handleSave = async () => {
    if (!isManagerOrAdmin || !form) return;

    setSaving(true);
    setError(null);
    try {
      let updated: DepartmentDto;

      if (mode === "create") {
        updated = await departmentsApi.create({
          name: form.name,
          code: form.code ?? "",
          isActive: form.isActive,
        });
        setDepartments((prev) => [...prev, updated]);
        setSelectedDeptId(updated.id);
      } else if (mode === "edit" && form.id) {
        updated = await departmentsApi.update(form.id, {
          name: form.name,
          code: form.code ?? "",
          isActive: form.isActive,
        });
        setDepartments((prev) =>
          prev.map((d) => (d.id === updated.id ? updated : d))
        );
      }

      setMode("none");
      setForm(null);
    } catch (err: any) {
      console.error("Save department error", err);
      setError(
        err?.response?.data?.message || "Không lưu được thông tin phòng ban."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleSaveCompensation = async () => {
    if (!isManagerOrAdmin || !selectedEmployeeId) return;

    const baseSalary = Number(baseSalaryInput || 0);
    const allowance = Number(allowanceInput || 0);

    if (Number.isNaN(baseSalary) || Number.isNaN(allowance)) {
      setCompError("Vui lòng nhập số hợp lệ cho lương và phụ cấp.");
      setCompSuccess(null);
      return;
    }

    const payload: UpdatePayrollSettingsRequest = {
      baseSalary,
      allowance,
    };

    setCompSaving(true);
    setCompError(null);
    setCompSuccess(null);

    try {
      await employeesApi.updatePayrollSettings(selectedEmployeeId, payload);

      // Có thể reload lại list employees nếu cần
      setEmployees((prev) =>
        prev.map((e) =>
          e.id === selectedEmployeeId
            ? { ...e, baseSalary, allowance }
            : e
        )
      );

      setCompSuccess("Đã lưu lương cho nhân viên.");
    } catch (err: any) {
      console.error("Update payroll settings error", err);
      setCompError(
        err?.response?.data?.message ||
          "Không lưu được thông tin lương nhân viên."
      );
    } finally {
      setCompSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            Quản lý phòng ban
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manager có thể tạo / chỉnh sửa; Staff chỉ được xem danh sách và
            nhân sự của từng phòng ban.
          </p>
        </div>

        {isManagerOrAdmin && (
          <button
            type="button"
            onClick={openCreate}
            className="px-4 py-2 rounded-full bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold shadow-sm"
          >
            + Thêm phòng ban
          </button>
        )}
      </div>

      {error && (
        <div className="rounded-2xl bg-rose-50 border border-rose-100 px-4 py-2 text-xs text-rose-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-3xl bg-white border border-slate-200 px-4 py-6 text-sm text-slate-500 shadow-sm">
          Đang tải dữ liệu phòng ban...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Cột trái: danh sách phòng ban */}
          <div className="md:col-span-1 rounded-3xl bg-white border border-slate-200 shadow-sm p-4">
            <h2 className="text-sm font-semibold text-slate-900 mb-3">
              Danh sách phòng ban
            </h2>

            {departments.length === 0 ? (
              <div className="text-xs text-slate-500">
                Chưa có phòng ban nào.
              </div>
            ) : (
              <ul className="space-y-1 text-sm">
                {departments.map((dept) => {
                  const active = dept.id === selectedDeptId;
                  const count = employees.filter(
                    (e) => e.departmentId === dept.id
                  ).length;

                  return (
                    <li key={dept.id}>
                      <button
                        type="button"
                        onClick={() => handleSelectDept(dept.id)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl border text-left ${
                          active
                            ? "bg-sky-50 border-sky-200 text-sky-800"
                            : "bg-white border-slate-200 hover:bg-slate-50 text-slate-700"
                        }`}
                      >
                        <div>
                          <div className="font-medium">{dept.name}</div>
                          <div className="text-[11px] text-slate-400">
                            Mã: {dept.code} ·{" "}
                            {dept.isActive ? "Đang hoạt động" : "Ngưng"}
                          </div>
                        </div>
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                          {count} NV
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Cột giữa: thông tin + form (nếu có quyền) */}
          <div className="md:col-span-1 rounded-3xl bg-white border border-slate-200 shadow-sm p-4">
            <h2 className="text-sm font-semibold text-slate-900 mb-3">
              Thông tin phòng ban
            </h2>

            {!selectedDept && mode === "none" && (
              <div className="text-xs text-slate-500">
                Hãy chọn một phòng ban ở bên trái để xem chi tiết.
              </div>
            )}

            {mode === "none" && selectedDept && (
              <div className="space-y-2 text-sm">
                <div>
                  <div className="text-[11px] text-slate-400">Tên phòng ban</div>
                  <div className="font-semibold text-slate-900">
                    {selectedDept.name}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-slate-400">Mã phòng ban</div>
                  <div className="text-slate-800">
                    {selectedDept.code ?? "(chưa có)"}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-slate-400">
                    Trạng thái hoạt động
                  </div>
                  <div className="text-slate-800">
                    {selectedDept.isActive ? "Hoạt động" : "Ngưng hoạt động"}
                  </div>
                </div>

                {isManagerOrAdmin && (
                  <button
                    type="button"
                    onClick={openEdit}
                    className="mt-3 px-4 py-2 rounded-full bg-slate-900 text-white text-xs font-semibold shadow-sm"
                  >
                    Chỉnh sửa phòng ban
                  </button>
                )}
              </div>
            )}

            {(mode === "create" || mode === "edit") && form && (
              <div className="space-y-3 text-sm">
                <div className="text-xs font-semibold text-slate-600">
                  {mode === "create"
                    ? "Thêm phòng ban mới"
                    : "Chỉnh sửa phòng ban"}
                </div>

                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">
                    Tên phòng ban
                  </label>
                  <input
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                    value={form.name}
                    onChange={(e) =>
                      setForm({ ...form, name: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">
                    Mã phòng ban
                  </label>
                  <input
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                    value={form.code ?? ""}
                    onChange={(e) =>
                      setForm({ ...form, code: e.target.value })
                    }
                  />
                </div>

                <label className="inline-flex items-center gap-2 text-xs text-slate-700">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-slate-300"
                    checked={!!form.isActive}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setForm({ ...form, isActive: e.target.checked })
                    }
                  />
                  <span>Phòng ban đang hoạt động</span>
                </label>

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className="px-4 py-2 rounded-full bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold disabled:opacity-60"
                  >
                    {saving ? "Đang lưu..." : "Lưu phòng ban"}
                  </button>
                  <button
                    type="button"
                    onClick={cancelForm}
                    className="px-3 py-2 rounded-full bg-slate-100 text-xs text-slate-700"
                  >
                    Hủy
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Cột phải: nhân sự + hồ sơ & lương */}
          <div className="md:col-span-1 rounded-3xl bg-white border border-slate-200 shadow-sm p-4">
            <h2 className="text-sm font-semibold text-slate-900 mb-3">
              Nhân sự trong phòng ban
            </h2>

            {!selectedDept && (
              <div className="text-xs text-slate-500">
                Chọn phòng ban để xem danh sách nhân viên.
              </div>
            )}

            {selectedDept && currentEmployees.length === 0 && (
              <div className="text-xs text-slate-500">
                Chưa có nhân viên nào thuộc phòng ban này.
              </div>
            )}

            {selectedDept && currentEmployees.length > 0 && (
              <>
                <ul className="space-y-2 text-sm mb-4">
                  {currentEmployees.map((emp) => {
                    const active = emp.id === selectedEmployeeId;
                    return (
                      <li key={emp.id}>
                        <button
                          type="button"
                          onClick={() => handleSelectEmployee(emp.id)}
                          className={`w-full rounded-xl border px-3 py-2 flex flex-col text-left ${
                            active
                              ? "border-sky-300 bg-sky-50"
                              : "border-slate-200 bg-white hover:bg-slate-50"
                          }`}
                        >
                          <span className="font-medium text-slate-900">
                            {emp.fullName}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            {emp.positionName || "Nhân viên"} ·{" "}
                            {emp.email || "Không có email"}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>

                {selectedEmployee && (
                  <div className="mt-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-xs space-y-2">
                    <div className="font-semibold text-slate-700 mb-1">
                      Hồ sơ &amp; lương nhân viên
                    </div>

                    <div>
                      <div className="text-[11px] text-slate-500">
                        Họ tên
                      </div>
                      <div className="text-slate-800">
                        {selectedEmployee.fullName}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-2">
                      <div>
                        <div className="text-[11px] text-slate-500">
                          Email
                        </div>
                        <div className="text-slate-800">
                          {selectedEmployee.email || "–"}
                        </div>
                      </div>
                      <div>
                        <div className="text-[11px] text-slate-500">
                          Chức danh
                        </div>
                        <div className="text-slate-800">
                          {selectedEmployee.positionName || "Nhân viên"}
                        </div>
                      </div>
                    </div>

                    {isManagerOrAdmin ? (
                      <>
                        <div className="grid grid-cols-1 gap-2 mt-2">
                          <div>
                            <label className="block text-[11px] text-slate-500 mb-1">
                              Lương cơ bản
                            </label>
                            <input
                              type="number"
                              min={0}
                              className="w-full rounded-lg border border-slate-300 px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
                              value={baseSalaryInput}
                              onChange={(e) =>
                                setBaseSalaryInput(e.target.value)
                              }
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] text-slate-500 mb-1">
                              Phụ cấp
                            </label>
                            <input
                              type="number"
                              min={0}
                              className="w-full rounded-lg border border-slate-300 px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
                              value={allowanceInput}
                              onChange={(e) =>
                                setAllowanceInput(e.target.value)
                              }
                            />
                          </div>
                        </div>

                        {compError && (
                          <div className="mt-2 rounded-lg bg-rose-50 border border-rose-100 px-2 py-1 text-[11px] text-rose-700">
                            {compError}
                          </div>
                        )}

                        {compSuccess && (
                          <div className="mt-2 rounded-lg bg-emerald-50 border border-emerald-100 px-2 py-1 text-[11px] text-emerald-700">
                            {compSuccess}
                          </div>
                        )}

                        <div className="mt-2 flex justify-end">
                          <button
                            type="button"
                            onClick={handleSaveCompensation}
                            disabled={compSaving}
                            className="px-3 py-1.5 rounded-full bg-sky-600 hover:bg-sky-700 text-white text-[11px] font-semibold disabled:opacity-60"
                          >
                            {compSaving ? "Đang lưu..." : "Lưu lương"}
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="mt-2 text-[11px] text-slate-500">
                        Bạn chỉ có quyền xem thông tin nhân viên.
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DepartmentsPage;
