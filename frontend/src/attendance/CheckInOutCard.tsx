// src/attendance/CheckInOutCard.tsx
import React, { useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";
import attendanceApi, {
  type CheckInPayload,
  type FaceCheckInPayload,
} from "../api/attendanceApi";
import { reverseGeocode } from "./reverseGeocoding";

type Props = {
  todayStatus: {
    checkInAt: string | null;
    checkOutAt: string | null;
    canCheckIn: boolean;
    canCheckOut: boolean;
  } | null;
  reloadToday: () => Promise<void>;
};

const CheckInOutCard: React.FC<Props> = ({ todayStatus, reloadToday }) => {
  // Camera
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isCheckingIn, setIsCheckingIn] = useState(false);

  // GPS
  const [gpsLat, setGpsLat] = useState<number | null>(null);
  const [gpsLng, setGpsLng] = useState<number | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [gpsAddress, setGpsAddress] = useState<string | null>(null);
  const [isResolvingAddress, setIsResolvingAddress] = useState(false);

  // UI message
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // ---- helper: base URL models nằm ở FE (public/models) ----
  const getModelsBaseUrl = () =>
    `${window.location.origin.replace(/\/$/, "")}/models`;

  // ====== Load face-api models ======
  useEffect(() => {
    const loadModels = async () => {
      try {
        const url = getModelsBaseUrl();
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(url),
          faceapi.nets.faceLandmark68Net.loadFromUri(url),
          faceapi.nets.faceRecognitionNet.loadFromUri(url),
        ]);
        setModelsLoaded(true);
      } catch (err) {
        console.error("Load face models error", err);
        setLoadError("Không tải được model nhận diện khuôn mặt.");
      }
    };

    loadModels();
  }, []);

  // ====== Camera helpers ======
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

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    setError(null);
    setMessage(null);

    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Trình duyệt không hỗ trợ camera.");
      return;
    }

    try {
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
      setError("Không bật được camera. Vui lòng kiểm tra quyền truy cập.");
    }
  };

  // ====== GPS + Reverse Geocoding ======
  const getLocation = () => {
    setGpsError(null);
    setMessage(null);
    setGpsAddress(null);
    setIsResolvingAddress(false);

    if (!navigator.geolocation) {
      setGpsError("Trình duyệt không hỗ trợ GPS.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        setGpsLat(lat);
        setGpsLng(lng);

        // Đổi tọa độ thành địa chỉ bằng Nominatim
        try {
          setIsResolvingAddress(true);
          const addr = await reverseGeocode(lat, lng);
          setGpsAddress(addr);
        } catch (err) {
          console.error("Reverse geocoding error", err);
          setGpsError("Không lấy được địa chỉ từ GPS.");
        } finally {
          setIsResolvingAddress(false);
        }
      },
      (err) => {
        console.error(err);
        setGpsError("Không lấy được vị trí. Vui lòng cấp quyền GPS.");
      },
      { enableHighAccuracy: true }
    );
  };

  // ====== Check-in Face + GPS ======
  const handleCheckInFaceGps = async () => {
    if (todayStatus && !todayStatus.canCheckIn) return;

    setError(null);
    setMessage(null);

    if (!modelsLoaded) {
      setError("Model nhận diện chưa sẵn sàng, vui lòng đợi một chút.");
      return;
    }
    if (!isCameraOn || !videoRef.current) {
      setError("Camera chưa bật.");
      return;
    }
    if (gpsLat == null || gpsLng == null) {
      setError("Chưa có vị trí GPS. Hãy bấm 'Lấy lại vị trí'.");
      return;
    }
    if (!gpsAddress) {
      setError(
        "Đang lấy địa chỉ từ GPS. Vui lòng đợi vài giây rồi thử lại."
      );
      return;
    }

    try {
      setIsCheckingIn(true);

      const result = await faceapi
        .detectSingleFace(
          videoRef.current,
          new faceapi.TinyFaceDetectorOptions()
        )
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!result) {
        setError("Không nhận diện được khuôn mặt. Hãy thử lại.");
        return;
      }

      const embedding = Array.from(result.descriptor);

      const payload: FaceCheckInPayload = {
        embedding,
        latitude: gpsLat,
        longitude: gpsLng,
        // Nếu sau này BE nhận thêm address thì thêm field ở đây.
      };

      const res = await attendanceApi.checkInWithFace(payload);

      setMessage(res.message ?? "Check-in thành công.");
      await reloadToday();
      stopCamera();
    } catch (err: any) {
      console.error(err);
      const msg =
        err?.response?.data?.message ??
        "Check-in bằng Face + GPS thất bại. Vui lòng thử lại.";
      setError(msg);
    } finally {
      setIsCheckingIn(false);
    }
  };

  // ====== Check-out thường ======
  const handleCheckOut = async () => {
    if (!todayStatus?.canCheckOut) return;

    setError(null);
    setMessage(null);

    try {
      const payload: CheckInPayload = {}; // hiện tại BE không cần thêm gì
      const res = await attendanceApi.checkOut(payload);
      setMessage(res.message ?? "Check-out thành công.");
      await reloadToday();
    } catch (err: any) {
      console.error(err);
      const msg =
        err?.response?.data?.message ??
        "Check-out thất bại. Vui lòng thử lại.";
      setError(msg);
    }
  };

  const canCheckInNow =
    modelsLoaded &&
    isCameraOn &&
    !isCheckingIn &&
    (todayStatus ? todayStatus.canCheckIn : true);

  // ====== RENDER ======
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
      <h2 className="font-semibold text-lg mb-1">Camera · Face Check-in</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Camera */}
        <div className="md:col-span-2">
          <div className="border-2 border-dashed border-gray-200 rounded-2xl h-64 flex items-center justify-center bg-gray-50 overflow-hidden relative">
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              autoPlay
              muted
            />
            {!isCameraOn && (
              <div className="absolute text-sm text-gray-400">
                Camera chưa bật
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 mt-4">
            {!isCameraOn ? (
              <button
                onClick={startCamera}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
              >
                Bật camera
              </button>
            ) : (
              <button
                onClick={stopCamera}
                className="px-4 py-2 rounded-xl bg-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-300"
              >
                Tắt camera
              </button>
            )}
            <span className="text-xs text-gray-500">
              {modelsLoaded
                ? "Đã tải model nhận diện khuôn mặt."
                : loadError ?? "Model nhận diện chưa sẵn sàng."}
            </span>
          </div>
        </div>

        {/* GPS + nút check-in/out */}
        <div className="space-y-4 text-sm">
          <div>
            <h3 className="font-semibold mb-1">Vị trí · GPS</h3>
            <p className="text-xs text-gray-500 mb-1">
              Hệ thống lưu lại vị trí (địa chỉ) khi bạn check-in.
            </p>

            <div className="px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs space-y-1">
              <div className="font-medium">
                {gpsAddress
                  ? gpsAddress
                  : gpsLat != null && gpsLng != null
                  ? "Đang lấy địa chỉ từ GPS..."
                  : "Chưa có vị trí. Hãy bấm 'Lấy lại vị trí'."}
              </div>

              {gpsLat != null && gpsLng != null && (
                <div className="text-[11px] text-gray-500">
                  (Lat: {gpsLat.toFixed(6)} · Lng: {gpsLng.toFixed(6)})
                </div>
              )}
            </div>

            <button
              onClick={getLocation}
              className="mt-2 text-xs text-blue-600 hover:underline"
            >
              Lấy lại vị trí
            </button>

            {isResolvingAddress && (
              <p className="mt-1 text-[11px] text-gray-500">
                Đang chuyển đổi tọa độ sang địa chỉ...
              </p>
            )}

            {gpsError && (
              <p className="mt-1 text-xs text-red-600">{gpsError}</p>
            )}
          </div>

          <div className="space-y-3">
            <button
              onClick={handleCheckInFaceGps}
              disabled={!canCheckInNow}
              className="w-full px-4 py-2 rounded-xl bg-green-600 text-white text-sm font-semibold hover:bg-green-700 disabled:opacity-60"
            >
              {isCheckingIn ? "Đang check-in..." : "Check-in (Face + GPS)"}
            </button>

            <button
              onClick={handleCheckOut}
              disabled={!todayStatus?.canCheckOut}
              className="w-full px-4 py-2 rounded-xl bg-gray-100 text-gray-800 text-sm font-semibold hover:bg-gray-200 disabled:opacity-60"
            >
              Đã check-out
            </button>
          </div>

          {error && <p className="text-xs text-red-600">{error}</p>}
          {message && <p className="text-xs text-green-600">{message}</p>}
        </div>
      </div>
    </div>
  );
};

export default CheckInOutCard;
