// src/auth/pages/RegisterPage.tsx
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { requestOtp, registerAccount } from "../api";

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");

  const [otpSent, setOtpSent] = useState(false);
  const [loadingOtp, setLoadingOtp] = useState(false);
  const [loadingRegister, setLoadingRegister] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const validateGmail = (value: string) => {
    return value.toLowerCase().endsWith("@gmail.com");
  };

  const handleSendOtp = async () => {
    setError(null);
    setMessage(null);

    if (!validateGmail(email)) {
      setError("Email đăng ký phải là Gmail (@gmail.com).");
      return;
    }

    if (!fullName.trim()) {
      setError("Vui lòng nhập họ tên.");
      return;
    }

    if (password.length < 6) {
      setError("Mật khẩu phải từ 6 ký tự trở lên.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Xác nhận mật khẩu không khớp.");
      return;
    }

    try {
      setLoadingOtp(true);
      await requestOtp(email);
      setOtpSent(true);
      setMessage("Đã gửi mã OTP đến email của bạn. Vui lòng kiểm tra hộp thư.");
    } catch (err: any) {
      console.error(err);
      setError(
        err?.response?.data?.message ||
          "Gửi OTP thất bại. Vui lòng kiểm tra lại email."
      );
    } finally {
      setLoadingOtp(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (!otpSent) {
      setError("Bạn cần gửi OTP trước khi đăng ký.");
      return;
    }

    if (!otp.trim()) {
      setError("Vui lòng nhập mã OTP.");
      return;
    }

    try {
      setLoadingRegister(true);
      await registerAccount({
        email,
        fullName,
        password,
        otp,
      });

      setMessage("Đăng ký thành công! Bạn có thể đăng nhập ngay bây giờ.");
      // Sau 1 chút redirect về trang login
      setTimeout(() => {
        navigate("/", { replace: true });
      }, 1200);
    } catch (err: any) {
      console.error(err);
      setError(
        err?.response?.data?.message ||
          "Đăng ký thất bại. Vui lòng kiểm tra lại OTP hoặc thông tin."
      );
    } finally {
      setLoadingRegister(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
      <h1 className="text-2xl font-bold text-slate-800 text-center mb-2">
        Đăng ký Staff
      </h1>
      <p className="text-sm text-slate-500 text-center mb-6">
        Dùng Gmail + OTP để tạo tài khoản nhân viên.
      </p>

      {error && (
        <div className="mb-4 rounded-xl bg-red-50 text-red-600 px-3 py-2 text-sm">
          {error}
        </div>
      )}

      {message && (
        <div className="mb-4 rounded-xl bg-emerald-50 text-emerald-700 px-3 py-2 text-sm">
          {message}
        </div>
      )}

      <form onSubmit={handleRegister} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Gmail
          </label>
          <input
            type="email"
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
            placeholder="you@gmail.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={otpSent}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Họ tên
          </label>
          <input
            type="text"
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
            placeholder="Nguyễn Văn A"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            disabled={otpSent}
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Mật khẩu
            </label>
            <input
              type="password"
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={otpSent}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Nhập lại mật khẩu
            </label>
            <input
              type="password"
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={otpSent}
              required
            />
          </div>
        </div>

        <button
          type="button"
          onClick={handleSendOtp}
          disabled={loadingOtp || otpSent}
          className="w-full rounded-xl bg-sky-600 text-white py-2.5 text-sm font-semibold hover:bg-sky-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {otpSent ? "Đã gửi OTP" : loadingOtp ? "Đang gửi OTP..." : "Gửi mã OTP"}
        </button>

        {otpSent && (
          <div className="space-y-3 pt-2">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Mã OTP
              </label>
              <input
                type="text"
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                placeholder="Nhập mã OTP gửi về email"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loadingRegister}
              className="w-full rounded-xl bg-emerald-600 text-white py-2.5 text-sm font-semibold hover:bg-emerald-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loadingRegister ? "Đang đăng ký..." : "Hoàn tất đăng ký"}
            </button>
          </div>
        )}
      </form>

      <div className="mt-4 text-sm text-center text-slate-500">
        Đã có tài khoản?{" "}
        <Link to="/" className="text-sky-600 font-semibold hover:underline">
          Đăng nhập
        </Link>
      </div>
    </div>
  );
};

export default RegisterPage;
