// src/admin/page/OfficeLocationSettingsPage.tsx
import React, { useEffect, useState } from "react";
import officeLocationAdminApi from "../../api/officeLocationAdminApi";
import type {
  OfficeLocationDto,
  UpsertOfficeLocationRequest,
} from "../../api/officeLocationAdminApi";

interface FormState {
  name: string;
  address: string;
  latitude: string;
  longitude: string;
  radiusMeters: string;
}

const OfficeLocationSettingsPage: React.FC = () => {
  const [form, setForm] = useState<FormState>({
    name: "",
    address: "",
    latitude: "",
    longitude: "",
    radiusMeters: "",
  });

  const [currentLocation, setCurrentLocation] =
    useState<OfficeLocationDto | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleChange =
    (field: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = e.target.value;
      setForm((prev) => ({ ...prev, [field]: value }));
    };

  const bindFromDto = (dto: OfficeLocationDto | null) => {
    if (!dto) {
      setForm({
        name: "",
        address: "",
        latitude: "",
        longitude: "",
        radiusMeters: "",
      });
      setCurrentLocation(null);
      return;
    }

    setCurrentLocation(dto);
    setForm({
      name: dto.name ?? "",
      address: dto.address ?? "",
      latitude: dto.latitude.toString(),
      longitude: dto.longitude.toString(),
      radiusMeters: dto.radiusMeters.toString(),
    });
  };

  const loadCurrent = async () => {
    try {
      setLoading(true);
      setError(null);
      setMessage(null);

      const loc = await officeLocationAdminApi.getActive();
      bindFromDto(loc);
    } catch (err) {
      console.error("Failed to load office location", err);
      setError("Không tải được cấu hình định vị công ty.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadCurrent();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    const lat = parseFloat(form.latitude);
    const lon = parseFloat(form.longitude);
    const radius = parseInt(form.radiusMeters, 10);

    if (Number.isNaN(lat) || Number.isNaN(lon)) {
      setError("Latitude và Longitude phải là số hợp lệ.");
      return;
    }
    if (Number.isNaN(radius) || radius <= 0) {
      setError("Bán kính phải là số nguyên dương (tính bằng mét).");
      return;
    }

    const payload: UpsertOfficeLocationRequest = {
      name: form.name.trim(),
      address: form.address.trim(),
      latitude: lat,
      longitude: lon,
      radiusMeters: radius,
    };

    try {
      setSaving(true);
      const updated = await officeLocationAdminApi.upsert(payload);
      bindFromDto(updated);
      setMessage("Lưu cấu hình định vị thành công.");
    } catch (err: any) {
      console.error("Failed to save office location", err);
      const msg =
        err?.response?.data?.message ??
        "Không lưu được cấu hình. Vui lòng thử lại.";
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            Cài đặt định vị công ty
          </h1>
          <p className="text-sm text-slate-500">
            Thiết lập toạ độ văn phòng và bán kính cho phép check-in bằng GPS.
            Nhân viên chỉ check-in được khi ở trong phạm vi này.
          </p>
          {currentLocation && (
            <p className="mt-1 text-xs text-slate-400">
              Đang có cấu hình hiện tại:{" "}
              <span className="font-medium text-slate-600">
                {currentLocation.name}
              </span>{" "}
              · Bán kính{" "}
              <span className="font-medium">
                {currentLocation.radiusMeters} m
              </span>
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => void loadCurrent()}
          className="px-4 py-2 rounded-full text-sm font-medium bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors"
        >
          Làm mới
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
        <div className="border-b border-slate-100 px-6 py-3 flex items-center justify-between">
          <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            Cấu hình toạ độ &amp; bán kính
          </div>
          {loading && (
            <div className="text-xs text-slate-400">Đang tải dữ liệu...</div>
          )}
        </div>

        {(error || message) && (
          <div className="px-6 pt-3 space-y-2">
            {error && (
              <div className="text-xs text-rose-600 bg-rose-50 border border-rose-100 rounded-lg px-3 py-2">
                {error}
              </div>
            )}
            {message && (
              <div className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">
                {message}
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Tên địa điểm
              </label>
              <input
                type="text"
                value={form.name}
                onChange={handleChange("name")}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/70 focus:border-indigo-500"
                placeholder="Ví dụ: Văn phòng chính"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Địa chỉ mô tả
              </label>
              <input
                type="text"
                value={form.address}
                onChange={handleChange("address")}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/70 focus:border-indigo-500"
                placeholder="Ví dụ: 123 Nguyễn Trãi, Q.1, TP.HCM"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Latitude
              </label>
              <input
                type="number"
                step="0.000001"
                value={form.latitude}
                onChange={handleChange("latitude")}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/70 focus:border-indigo-500"
                placeholder="10.123456"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Longitude
              </label>
              <input
                type="number"
                step="0.000001"
                value={form.longitude}
                onChange={handleChange("longitude")}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/70 focus:border-indigo-500"
                placeholder="106.123456"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Bán kính cho phép (mét)
              </label>
              <input
                type="number"
                min={1}
                value={form.radiusMeters}
                onChange={handleChange("radiusMeters")}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/70 focus:border-indigo-500"
                placeholder="Ví dụ: 100"
              />
              <p className="mt-1 text-[11px] text-slate-400">
                Nhân viên đứng trong bán kính này (từ toạ độ trên) mới được
                check-in bằng GPS.
              </p>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className={`px-5 py-2 rounded-full text-sm font-medium shadow-sm transition-colors ${
                saving
                  ? "bg-slate-200 text-slate-500 cursor-not-allowed"
                  : "bg-indigo-600 hover:bg-indigo-700 text-white"
              }`}
            >
              {saving ? "Đang lưu..." : "Lưu cấu hình"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OfficeLocationSettingsPage;
