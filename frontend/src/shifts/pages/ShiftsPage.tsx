import React, { useEffect, useState } from "react";
import shiftsApi, {
  type ShiftDto,
  type ShiftUpsertDto,
} from "../../api/shiftsApi";

const emptyForm: ShiftUpsertDto = {
  name: "",
  startTime: "08:00",
  endTime: "17:00",
  isOvernight: false,
  graceMinutes: 0,
  isActive: true,
};

function toDisplayTime(value: string) {
  if (!value) return "";
  return value.substring(0, 5);
}

function toApiTime(value: string) {
  if (!value) return "";
  return value.length === 5 ? `${value}:00` : value;
}

const ShiftsPage: React.FC = () => {
  const [items, setItems] = useState<ShiftDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ShiftUpsertDto>(emptyForm);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await shiftsApi.getAll();
      setItems(data);
    } catch (err) {
      console.error(err);
      setError("Không tải được danh sách ca làm.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleEdit = (item: ShiftDto) => {
    setEditingId(item.id);
    setForm({
      name: item.name,
      startTime: toDisplayTime(item.startTime),
      endTime: toDisplayTime(item.endTime),
      isOvernight: item.isOvernight,
      graceMinutes: item.graceMinutes,
      isActive: item.isActive,
    });
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Xoá ca làm này?")) return;
    try {
      await shiftsApi.remove(id);
      await loadData();
    } catch (err) {
      console.error(err);
      alert("Xoá thất bại.");
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type, checked } = e.target as any;
    setForm((f) => ({
      ...f,
      [name]:
        type === "checkbox"
          ? checked
          : name === "graceMinutes"
          ? Number(value)
          : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const payload: ShiftUpsertDto = {
      ...form,
      startTime: toApiTime(form.startTime),
      endTime: toApiTime(form.endTime),
    };

    try {
      if (editingId) {
        await shiftsApi.update(editingId, payload);
      } else {
        await shiftsApi.create(payload);
      }
      setForm(emptyForm);
      setEditingId(null);
      await loadData();
    } catch (err) {
      console.error(err);
      setError("Lưu ca làm thất bại.");
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  return (
    <div className="page-container">
      <h1 className="page-title">Quản lý ca làm việc</h1>

      {error && <div className="text-red-500 mb-3">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Danh sách */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h2 className="font-semibold mb-3">Danh sách ca làm</h2>
          {loading ? (
            <div>Đang tải...</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Tên ca</th>
                  <th className="text-left py-2">Giờ làm</th>
                  <th className="text-left py-2">OT / trễ</th>
                  <th className="text-left py-2">Trạng thái</th>
                  <th className="py-2" />
                </tr>
              </thead>
              <tbody>
                {items.map((x) => (
                  <tr key={x.id} className="border-b last:border-0">
                    <td className="py-1">{x.name}</td>
                    <td className="py-1">
                      {toDisplayTime(x.startTime)} - {toDisplayTime(x.endTime)}
                      {x.isOvernight && " (qua đêm)"}
                    </td>
                    <td className="py-1">
                      Cho phép trễ: {x.graceMinutes} phút
                    </td>
                    <td className="py-1">
                      {x.isActive ? "Đang hoạt động" : "Ngừng"}
                    </td>
                    <td className="py-1 text-right space-x-2">
                      <button
                        className="text-blue-600 text-xs"
                        onClick={() => handleEdit(x)}
                      >
                        Sửa
                      </button>
                      <button
                        className="text-red-600 text-xs"
                        onClick={() => handleDelete(x.id)}
                      >
                        Xoá
                      </button>
                    </td>
                  </tr>
                ))}
                {items.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-3 text-gray-500">
                      Chưa có dữ liệu.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Form */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h2 className="font-semibold mb-3">
            {editingId ? "Cập nhật ca làm" : "Thêm ca làm mới"}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-sm mb-1">Tên ca*</label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                className="border rounded-lg px-3 py-2 w-full"
              />
            </div>

            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-sm mb-1">Giờ bắt đầu*</label>
                <input
                  type="time"
                  name="startTime"
                  value={form.startTime}
                  onChange={handleChange}
                  required
                  className="border rounded-lg px-3 py-2 w-full"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm mb-1">Giờ kết thúc*</label>
                <input
                  type="time"
                  name="endTime"
                  value={form.endTime}
                  onChange={handleChange}
                  required
                  className="border rounded-lg px-3 py-2 w-full"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm mb-1">
                Số phút cho phép đi trễ
              </label>
              <input
                type="number"
                name="graceMinutes"
                value={form.graceMinutes}
                onChange={handleChange}
                className="border rounded-lg px-3 py-2 w-full"
              />
            </div>

            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="isOvernight"
                  checked={form.isOvernight}
                  onChange={handleChange}
                />
                Ca qua đêm
              </label>

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={form.isActive}
                  onChange={handleChange}
                />
                Đang hoạt động
              </label>
            </div>

            <div className="flex gap-2 mt-4">
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm"
              >
                {editingId ? "Lưu thay đổi" : "Thêm mới"}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="px-3 py-2 rounded-lg text-sm border"
                >
                  Huỷ
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ShiftsPage;
