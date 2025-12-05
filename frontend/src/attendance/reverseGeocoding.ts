// src/attendance/reverseGeocoding.ts

/**
 * Dùng Nominatim (OpenStreetMap) để đổi lat/lng thành địa chỉ tiếng Việt.
 * Hoàn toàn free, không cần key.
 */
export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  const url = new URL("https://nominatim.openstreetmap.org/reverse");

  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("lat", lat.toString());
  url.searchParams.set("lon", lng.toString());
  url.searchParams.set("zoom", "18");
  url.searchParams.set("addressdetails", "1");
  // Đổi sang 'en' nếu muốn địa chỉ tiếng Anh
  url.searchParams.set("accept-language", "vi");

  const res = await fetch(url.toString(), {
    headers: {
      Accept: "application/json",
      // Nominatim khuyến nghị có Referer rõ ràng
      Referer: window.location.origin,
    },
  });

  if (!res.ok) {
    throw new Error(`Reverse geocoding failed: HTTP ${res.status}`);
  }

  const data = await res.json();
  // Nominatim trả về display_name là chuỗi địa chỉ đầy đủ
  return (data.display_name as string) ?? "Không xác định được địa chỉ";
}
