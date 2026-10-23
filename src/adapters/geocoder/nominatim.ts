import { LatLng, GeocodingResult } from "@/modules/geo/types";
import { GeocoderProvider } from "./types";
import { FallbackGeocoder } from "./haversine-fallback";

const fallback = new FallbackGeocoder();
// In-memory cache untuk mematuhi batas 1 request/detik dan menghemat kuota
const geocodeCache = new Map<string, GeocodingResult>();

export class NominatimGeocoder implements GeocoderProvider {
  id = "nominatim";
  name = "OpenStreetMap Nominatim";

  private baseUrl = process.env.NOMINATIM_BASE_URL || "https://nominatim.openstreetmap.org";
  private userAgent =
    process.env.NOMINATIM_USER_AGENT || "cetakinc-padang-platform/1.0 (kontak@bas-advertising.com)";

  async reverse(coords: LatLng): Promise<GeocodingResult> {
    const cacheKey = `rev_${coords.lat.toFixed(4)}_${coords.lng.toFixed(4)}`;
    if (geocodeCache.has(cacheKey)) {
      const cached = geocodeCache.get(cacheKey)!;
      return { ...cached, source: "cache" };
    }

    try {
      const url = `${this.baseUrl}/reverse?format=json&lat=${coords.lat}&lon=${coords.lng}&addressdetails=1`;
      const res = await fetch(url, {
        headers: { "User-Agent": this.userAgent },
        next: { revalidate: 86400 }, // Cache 24 jam di Next.js fetch cache
      });

      if (!res.ok) {
        throw new Error(`Nominatim error: ${res.statusText}`);
      }

      const data = await res.json();
      const addr = data.address || {};

      const result: GeocodingResult = {
        formattedAddress: data.display_name || `Titik Peta (${coords.lat}, ${coords.lng})`,
        lat: coords.lat,
        lng: coords.lng,
        subdistrict: addr.suburb || addr.village || addr.neighbourhood,
        district: addr.city_district || addr.county,
        city: addr.city || addr.town || "Padang",
        province: addr.state || "Sumatera Barat",
        postalCode: addr.postcode,
        source: "nominatim",
      };

      geocodeCache.set(cacheKey, result);
      return result;
    } catch (err) {
      console.warn("[NOMINATIM] Reverse geocoding gagal, memakai fallback manual:", err);
      return fallback.reverse(coords);
    }
  }

  async search(query: string): Promise<GeocodingResult[]> {
    const cleanQuery = query.trim();
    if (!cleanQuery) return [];

    try {
      // Prioritaskan pencarian di area Kota Padang
      const url = `${this.baseUrl}/search?format=json&q=${encodeURIComponent(
        cleanQuery + ", Padang"
      )}&addressdetails=1&limit=5`;

      const res = await fetch(url, {
        headers: { "User-Agent": this.userAgent },
      });

      if (!res.ok) throw new Error("Search gagal");

      const list = await res.json();
      return list.map((item: any) => ({
        formattedAddress: item.display_name,
        lat: Number(item.lat),
        lng: Number(item.lon),
        subdistrict: item.address?.suburb || item.address?.village,
        city: item.address?.city || "Padang",
        province: item.address?.state || "Sumatera Barat",
        source: "nominatim" as const,
      }));
    } catch {
      return fallback.search(cleanQuery);
    }
  }
}
