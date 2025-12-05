import React, { useEffect, useState } from "react";
import holidaysApi, {
  type HolidayDto,
  type HolidayUpsertDto,
} from "../../api/holidaysApi";

const emptyForm: HolidayUpsertDto = {
  name: "",
  date: "",
  isPaid: true,
  notes: "",
};

const HolidaysPage: React.FC = () => {
  const [items, setItems] = useState<HolidayDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<HolidayUpsertDto>(emptyForm);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await holidaysApi.getAll();
      setItems(data);
    } catch (err) {
      console.error(err);
      setError("Không tải được danh sách ngày nghỉ lễ.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleEdit = (item: HolidayDto) => {
    setEditingId(item.id);
    setForm({
      name: item.name,
      date: item.date.substring(0, 10), // YYYY-MM-DD
      isPaid: item.isPaid,
      notes: item.notes ?? "",
    });
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Xoá ngày nghỉ này?")) return;
    try {
      await holidaysApi.remove(id);
      await loadData();
    } catch (err) {
      console.error(err);
      alert("Xoá thất bại.");
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type, checked } = e.target as any;
    setForm((f) => ({
      ...f,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      if (editingId) {
        await holidaysApi.update(editingId, form);
      } else {
        await holidaysApi.create(form);
      }
      setForm(emptyForm);
      setEditingId(null);
      await loadData();
    } catch (err) {
      console.error(err);
      setError("Lưu ngày nghỉ thất bại.");
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  return (
    <div className="page-container">
      <h1 className="page-title">Quản lý ngày nghỉ lễ</h1>

      {error && <div className="text-red-500 mb-3">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Danh sách */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h2 className="font-semibold mb-3">Danh sách ngày nghỉ</h2>
          {loading ? (
            <div>Đang tải...</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Ngày</th>
                  <th className="text-left py-2">Tên ngày nghỉ</th>
                  <th className="text-left py-2">Trả lương</th>
                  <th className="py-2" />
                </tr>
              </thead>
              <tbody>
                {items.map((x) => (
                  <tr key={x.id} className="border-b last:border-0">
                    <td className="py-1">
                      {x.date.substring(0, 10).split("-").reverse().join("/")}
                    </td>
                    <td className="py-1">{x.name}</td>
                    <td className="py-1">{x.isPaid ? "Có" : "Không"}</td>
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
                    <td colSpan={4} className="py-3 text-gray-500">
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
            {editingId ? "Cập nhật ngày nghỉ" : "Thêm ngày nghỉ mới"}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-sm mb-1">Ngày*</label>
              <input
                type="date"
                name="date"
                value={form.date}
                onChange={handleChange}
                required
                className="border rounded-lg px-3 py-2 w-full"
              />
            </div>

            <div>
              <label className="block text-sm mb-1">Tên ngày nghỉ*</label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                className="border rounded-lg px-3 py-2 w-full"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="holiday-isPaid"
                name="isPaid"
                checked={form.isPaid}
                onChange={handleChange}
              />
              <label htmlFor="holiday-isPaid" className="text-sm">
                Được trả lương
              </label>
            </div>

            <div>
              <label className="block text-sm mb-1">Ghi chú</label>
              <textarea
                name="notes"
                value={form.notes ?? ""}
                onChange={handleChange}
                rows={3}
                className="border rounded-lg px-3 py-2 w-full"
              />
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

export default HolidaysPage;
