// src/auth/pages/LoginPage.tsx
import React, { useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "../useAuth";

const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation() as any;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setError(null);
    setLoading(true);
    try {
      await login(email.trim(), password);

      const redirectTo = location.state?.from?.pathname || "/dashboard";
      navigate(redirectTo, { replace: true });
    } catch (err: any) {
      console.error(err);

      let msg =
        err?._isAuthError && typeof err.message === "string"
          ? err.message
          : "Đăng nhập thất bại. Vui lòng kiểm tra lại email/mật khẩu.";

      if (err?.response?.data) {
        const data = err.response.data as any;
        if (typeof data.message === "string") msg = data.message;
        else if (typeof data.error === "string") msg = data.error;
      }

      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
      <h1 className="text-2xl font-bold text-slate-800 text-center mb-2">
        HR Attendance & Payroll
      </h1>
      <p className="text-sm text-slate-500 text-center mb-6">
        Đăng nhập để sử dụng hệ thống
      </p>

      {error && (
        <div className="mb-4 rounded-xl bg-red-50 text-red-600 px-3 py-2 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Email
          </label>
          <input
            type="email"
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
            placeholder="you@gmail.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Mật khẩu
          </label>
          <input
            type="password"
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-sky-600 text-white py-2.5 text-sm font-semibold hover:bg-sky-700 transition disabled:opacity-60 disabled:cursor-not-allowed mt-2"
        >
          {loading ? "Đang đăng nhập..." : "Đăng nhập"}
        </button>
      </form>

      <div className="mt-4 text-sm text-center text-slate-500">
        Chưa có tài khoản?{" "}
        <Link
          to="/register"
          className="text-sky-600 font-semibold hover:underline"
        >
          Đăng ký Staff
        </Link>
      </div>
    </div>
  );
};

export default LoginPage;
