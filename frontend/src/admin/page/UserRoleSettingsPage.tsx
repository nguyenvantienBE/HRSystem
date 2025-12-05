// src/admin/pages/UserRoleSettingsPage.tsx
import React, { useEffect, useState } from "react";
import adminUserApi from "../../api/adminUserApi";
import type { RoleDto } from "../../api/adminUserApi";

type RoleMap = Record<string, boolean>;

interface UserRow {
  id: string;
  email: string | null;
  fullName: string | null;
  isActive: boolean;
  roleMap: RoleMap;
  dirty: boolean;
  saving: boolean;
}

const UserRoleSettingsPage: React.FC = () => {
  const [roles, setRoles] = useState<RoleDto[]>([]);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [roleList, userList] = await Promise.all([
        adminUserApi.getRoles(),
        adminUserApi.getUsers(),
      ]);

      setRoles(roleList);

      const mappedUsers: UserRow[] = userList.map((u) => {
        const map: RoleMap = {};
        roleList.forEach((r) => {
          map[r.name] = u.roles.includes(r.name);
        });

        return {
          id: u.id,
          email: u.email,
          fullName: u.fullName,
          isActive: u.isActive,
          roleMap: map,
          dirty: false,
          saving: false,
        };
      });

      setUsers(mappedUsers);
    } catch (err) {
      console.error("Failed to load admin role data", err);
      setError("Không tải được danh sách tài khoản / vai trò.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const toggleRole = (userId: string, roleName: string) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId
          ? {
              ...u,
              roleMap: {
                ...u.roleMap,
                [roleName]: !u.roleMap[roleName],
              },
              dirty: true,
            }
          : u
      )
    );
  };

  const saveUserRoles = async (userId: string) => {
    const target = users.find((u) => u.id === userId);
    if (!target) return;

    const rolesToSend = Object.entries(target.roleMap)
      .filter(([, v]) => v)
      .map(([name]) => name);

    try {
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, saving: true } : u
        )
      );

      await adminUserApi.updateUserRoles(userId, { roles: rolesToSend });

      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, dirty: false, saving: false } : u
        )
      );
    } catch (err) {
      console.error("Failed to update user roles", err);
      setError("Không lưu được phân quyền. Vui lòng thử lại.");
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, saving: false } : u
        )
      );
    }
  };

  return (
    <div className="w-full">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            Cài đặt phân quyền tài khoản
          </h1>
          <p className="text-sm text-slate-500">
            Quản lý vai trò Admin, Manager, Staff cho từng tài khoản người dùng.
          </p>
        </div>
        <button
          type="button"
          onClick={loadData}
          className="px-4 py-2 rounded-full text-sm font-medium bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors"
        >
          Làm mới
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
        <div className="border-b border-slate-100 px-6 py-3 flex items-center justify-between">
          <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            Danh sách tài khoản &amp; vai trò
          </div>
          {loading && (
            <div className="text-xs text-slate-400">Đang tải dữ liệu...</div>
          )}
        </div>

        {error && (
          <div className="px-6 pt-3 text-xs text-rose-600">
            {error}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-xs text-slate-500 uppercase">
                <th className="px-6 py-3 text-left font-semibold">Người dùng</th>
                <th className="px-6 py-3 text-left font-semibold">Email</th>
                <th className="px-6 py-3 text-center font-semibold">Trạng thái</th>
                {roles.map((role) => (
                  <th
                    key={role.name}
                    className="px-4 py-3 text-center font-semibold"
                  >
                    {role.name}
                  </th>
                ))}
                <th className="px-6 py-3 text-right font-semibold">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 && !loading && (
                <tr>
                  <td
                    className="px-6 py-6 text-center text-sm text-slate-500"
                    colSpan={4 + roles.length}
                  >
                    Chưa có tài khoản nào.
                  </td>
                </tr>
              )}

              {users.map((u, idx) => (
                <tr
                  key={u.id}
                  className={
                    idx % 2 === 0 ? "bg-white" : "bg-slate-50/40"
                  }
                >
                  <td className="px-6 py-3">
                    <div className="font-medium text-slate-900">
                      {u.fullName || u.email || "Không rõ"}
                    </div>
                    <div className="text-xs text-slate-500">
                      ID: {u.id}
                    </div>
                  </td>
                  <td className="px-6 py-3 text-slate-700">
                    {u.email || "-"}
                  </td>
                  <td className="px-6 py-3 text-center">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium ${
                        u.isActive
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full mr-1.5 ${
                          u.isActive ? "bg-emerald-500" : "bg-slate-400"
                        }`}
                      />
                      {u.isActive ? "Hoạt động" : "Tạm khoá"}
                    </span>
                  </td>

                  {roles.map((role) => (
                    <td
                      key={role.name}
                      className="px-4 py-3 text-center align-middle"
                    >
                      <label className="inline-flex items-center justify-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                          checked={u.roleMap[role.name] || false}
                          onChange={() => toggleRole(u.id, role.name)}
                        />
                      </label>
                    </td>
                  ))}

                  <td className="px-6 py-3 text-right">
                    <button
                      type="button"
                      disabled={!u.dirty || u.saving}
                      onClick={() => saveUserRoles(u.id)}
                      className={`px-4 py-1.5 rounded-full text-xs font-medium shadow-sm transition-colors ${
                        !u.dirty || u.saving
                          ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                          : "bg-indigo-500 hover:bg-indigo-600 text-white"
                      }`}
                    >
                      {u.saving ? "Đang lưu..." : u.dirty ? "Lưu" : "Đã lưu"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UserRoleSettingsPage;
