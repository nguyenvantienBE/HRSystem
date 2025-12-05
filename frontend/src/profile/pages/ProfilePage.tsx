import React, { useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";
import type { EmployeeProfileResponse } from "../../api/profileApi";
import profileApi from "../../api/profileApi";
import api from "../../api/apiClient";

const ProfilePage: React.FC = () => {
  const [profile, setProfile] = useState<EmployeeProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [hasFaceEmbedding, setHasFaceEmbedding] = useState(false);

  // Camera / face scan state
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [scanMessage, setScanMessage] = useState<string | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);

  // Helper: convert avatar url sang absolute url
  const toAbsoluteUrl = (url?: string | null) => {
    if (!url) return "";
    if (url.startsWith("http")) return url;
    const base = api.defaults.baseURL ?? "";
    const root = base.replace(/\/api\/?$/i, "");
    return `${root}${url}`;
  };

  // FE load model từ thư mục public/models
  const getModelsBaseUrl = () => "/models";

  // Load profile
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await profileApi.getMyProfile();
        setProfile(data);
        //setHasFaceEmbedding(!!data.hasFaceEmbedding);
        setHasFaceEmbedding(false);
      } catch (err) {
        console.error(err);
        setError("Không tải được hồ sơ cá nhân.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  // Load model nhận diện
  useEffect(() => {
    if (hasFaceEmbedding) return;

    const loadModels = async () => {
      try {
        const base = getModelsBaseUrl();
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(base),
          faceapi.nets.faceLandmark68Net.loadFromUri(base),
          faceapi.nets.faceRecognitionNet.loadFromUri(base),
        ]);
        setModelsLoaded(true);
      } catch (err) {
        console.error("Load face models error:", err);
        setScanError("Không tải được model nhận diện khuôn mặt.");
      }
    };

    loadModels();
  }, [hasFaceEmbedding]);

  // Stop camera
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraOn(false);
  };

  // Tắt camera khi rời trang
  useEffect(() => {
    return () => stopCamera();
  }, []);

  // Start camera
  const startCamera = async () => {
    try {
      setScanError(null);
      setScanMessage(null);

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setIsCameraOn(true);
    } catch (err) {
      console.error(err);
      setScanError("Không bật được camera. Vui lòng kiểm tra quyền truy cập.");
    }
  };

  // Capture + save
  const captureAndSaveFaceEmbedding = async () => {
    if (hasFaceEmbedding) return;

    if (!modelsLoaded) {
      setScanError("Model nhận diện chưa sẵn sàng.");
      return;
    }

    if (!videoRef.current) {
      setScanError("Camera chưa bật.");
      return;
    }

    try {
      setIsSaving(true);
      setScanError(null);
      setScanMessage(null);

      const result = await faceapi
        .detectSingleFace(
          videoRef.current,
          new faceapi.TinyFaceDetectorOptions()
        )
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!result) {
        setScanError(
          "Không nhận diện được khuôn mặt. Vui lòng nhìn thẳng và đủ sáng."
        );
        return;
      }

      const embeddingArray = Array.from(result.descriptor);
      await profileApi.saveFaceEmbedding(embeddingArray);

      setHasFaceEmbedding(true);
      setScanMessage("Bạn đã lấy dữ liệu khuôn mặt thành công.");
      stopCamera();
    } catch (err) {
      console.error(err);
      setScanError("Lưu dữ liệu khuôn mặt thất bại.");
    } finally {
      setIsSaving(false);
    }
  };

  // UI =============================
  if (loading) {
    return <div className="p-8">Đang tải hồ sơ cá nhân...</div>;
  }

  if (error || !profile) {
    return <div className="p-8 text-red-600">{error}</div>;
  }

  const avatarUrl = toAbsoluteUrl(profile.faceProfileUrl);

  return (
    <div className="px-8 py-6 space-y-6">
      <h1 className="text-2xl font-semibold mb-2">Hồ sơ cá nhân</h1>
      <p className="text-sm text-gray-500 mb-4">
        Xem và cập nhật thông tin dùng cho chấm công.
      </p>

      {/* Row 1: Info + Avatar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Info box */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border p-6 space-y-4">
          <h2 className="font-semibold mb-2">Thông tin nhân viên</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500">Họ và tên</label>
              <input
                value={profile.fullName}
                readOnly
                className="w-full rounded-xl border bg-gray-50 px-3 py-2"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500">Email</label>
              <input
                value={profile.email}
                readOnly
                className="w-full rounded-xl border bg-gray-50 px-3 py-2"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500">Phòng ban</label>
              <input
                value={profile.departmentName ?? "—"}
                readOnly
                className="w-full rounded-xl border bg-gray-50 px-3 py-2"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500">Chức vụ</label>
              <input
                value={profile.positionName ?? "—"}
                readOnly
                className="w-full rounded-xl border bg-gray-50 px-3 py-2"
              />
            </div>
          </div>
        </div>

        {/* Avatar box */}
        <div className="bg-white rounded-2xl shadow-sm border p-6 flex flex-col items-center">
          <div className="w-24 h-24 rounded-full overflow-hidden mb-3 bg-gray-100">
            {avatarUrl ? (
              <img src={avatarUrl} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-500 text-3xl">
                {profile.fullName?.[0] ?? "?"}
              </div>
            )}
          </div>

          <p className="font-semibold">{profile.fullName}</p>
          <p className="text-xs text-gray-500">Nhân viên</p>
        </div>
      </div>

      {/* Face embedding box */}
      <div className="bg-white rounded-2xl shadow-sm border p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-semibold">Khuôn mặt dùng cho Check-in</h2>
            <p className="text-xs text-gray-500">
              Dữ liệu này được dùng để xác thực khi check-in / check-out bằng camera.
            </p>
          </div>
          <span className="px-3 py-1 text-xs bg-blue-50 text-blue-600 rounded-full">
            Đang phát triển
          </span>
        </div>

        {hasFaceEmbedding ? (
          <div className="border bg-green-50 border-green-200 rounded-xl p-4 flex gap-3">
            <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center">
              ✓
            </div>
            <div>
              <p className="text-sm font-medium text-green-800">
                Bạn đã lấy dữ liệu khuôn mặt thành công.
              </p>
              <p className="text-xs text-green-700">
                Nếu muốn lấy lại dữ liệu khác, hãy liên hệ Admin để xoá dữ liệu cũ.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Camera */}
            <div className="md:col-span-2">
              <div className="border-2 border-dashed h-64 rounded-xl flex items-center justify-center bg-gray-50 overflow-hidden relative">
                <video ref={videoRef} className="w-full h-full object-cover" muted autoPlay />
                {!isCameraOn && (
                  <div className="absolute text-gray-400">Camera chưa bật</div>
                )}
              </div>

              <div className="flex gap-3 mt-4">
                {!isCameraOn ? (
                  <button
                    onClick={startCamera}
                    className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm"
                  >
                    Bật camera & bắt đầu quét
                  </button>
                ) : (
                  <button
                    onClick={stopCamera}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-xl text-sm"
                  >
                    Tắt camera
                  </button>
                )}

                <button
                  onClick={captureAndSaveFaceEmbedding}
                  disabled={!isCameraOn || !modelsLoaded || isSaving}
                  className="px-4 py-2 border border-blue-600 text-blue-600 rounded-xl text-sm disabled:opacity-50"
                >
                  {isSaving ? "Đang lưu..." : "Lưu dữ liệu khuôn mặt"}
                </button>
              </div>

              {scanError && <p className="mt-2 text-xs text-red-600">{scanError}</p>}
              {scanMessage && (
                <p className="mt-2 text-xs text-green-600">{scanMessage}</p>
              )}
            </div>

            {/* Hướng dẫn */}
            <div className="text-xs text-gray-600 space-y-2">
              <h3 className="font-semibold text-sm">Hướng dẫn:</h3>
              <ul className="list-disc list-inside space-y-1">
                <li>Ngồi đối diện camera, ánh sáng đầy đủ.</li>
                <li>Giữ mặt trong khung hình vài giây.</li>
                <li>
                  Sau khi lưu thành công bạn chỉ cần đứng trước camera để check-in.
                </li>
                <li>Nếu nhận sai, hãy liên hệ Admin để xoá dữ liệu cũ.</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
