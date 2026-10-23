import { LatLng, DistanceResult } from "./types";

/**
 * Menghitung jarak garis lurus bola bumi menggunakan formula Haversine (km)
 */
export function calculateHaversineKm(from: LatLng, to: LatLng): number {
  const R = 6371; // Radius bumi dalam kilometer
  const dLat = ((to.lat - from.lat) * Math.PI) / 180;
  const dLng = ((to.lng - from.lng) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((from.lat * Math.PI) / 180) *
      Math.cos((to.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const rawDistance = R * c;

  // Bulatkan ke 2 desimal
  return Math.round(rawDistance * 100) / 100;
}

/**
 * Estimasi jarak jalan darat dengan faktor kelokan rute (1.3x) dan durasi motor rata-rata 25 km/jam
 */
export function estimateRoadDistance(from: LatLng, to: LatLng): DistanceResult {
  const directKm = calculateHaversineKm(from, to);
  // Faktor kelokan jalan raya Padang rata-rata 1.3
  const roadKm = Math.round(directKm * 1.3 * 10) / 10;
  // Kecepatan motor kurir rata-rata 25 km/jam + 5 menit waktu lampu merah/persimpangan
  const durationMin = Math.max(10, Math.round((roadKm / 25) * 60) + 5);

  return {
    distanceKm: roadKm,
    durationMin,
    isFallback: true,
    source: "haversine",
  };
}
