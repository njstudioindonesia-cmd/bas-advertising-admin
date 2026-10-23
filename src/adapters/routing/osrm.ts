import { LatLng } from "@/modules/geo/types";
import { RouteResult, RoutingProvider } from "./types";
import { HaversineRoutingProvider } from "./haversine";

const fallback = new HaversineRoutingProvider();

export class OSRMRoutingProvider implements RoutingProvider {
  id = "osrm";
  name = "OSRM Public Router";

  private baseUrl = process.env.OSRM_BASE_URL || "https://router.project-osrm.org";

  async calculateRoute(from: LatLng, to: LatLng): Promise<RouteResult> {
    try {
      // OSRM format koordinat adalah: {lng},{lat}
      const coordinates = `${from.lng},${from.lat};${to.lng},${to.lat}`;
      const url = `${this.baseUrl}/route/v1/driving/${coordinates}?overview=full&geometries=geojson`;

      // Timeout 4 detik agar tidak menggantung UI
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!res.ok) throw new Error(`OSRM status: ${res.status}`);

      const data = await res.json();
      if (!data.routes || data.routes.length === 0) {
        throw new Error("Tidak ada rute ditemukan");
      }

      const route = data.routes[0];
      const distanceKm = Math.round((route.distance / 1000) * 10) / 10;
      const durationMin = Math.max(10, Math.round(route.duration / 60));

      // GeoJSON coordinates dalam format [lng, lat] -> konversi ke [lat, lng] untuk Leaflet
      const geometry: [number, number][] = (route.geometry?.coordinates || []).map(
        (c: [number, number]) => [c[1], c[0]]
      );

      return {
        distanceKm,
        durationMin,
        geometry: geometry.length > 0 ? geometry : [[from.lat, from.lng], [to.lat, to.lng]],
        isFallback: false,
        provider: "osrm",
      };
    } catch (err) {
      console.warn("[OSRM] Gagal mengambil rute jalan, mengalihkan ke fallback Haversine:", err);
      return fallback.calculateRoute(from, to);
    }
  }
}
