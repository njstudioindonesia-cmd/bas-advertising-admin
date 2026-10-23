import { LatLng, GeocodingResult } from "@/modules/geo/types";
import { GeocoderProvider } from "./types";

export class FallbackGeocoder implements GeocoderProvider {
  id = "fallback-manual";
  name = "Manual / Local Padang Area Detector";

  async reverse(coords: LatLng): Promise<GeocodingResult> {
    // Deteksi sederhana apakah di area Padang
    const isLubukBuaya = coords.lat > -0.87 && coords.lat < -0.80 && coords.lng > 100.28 && coords.lng < 100.35;
    const subdistrict = isLubukBuaya ? "Lubuk Buaya" : "Padang Barat";

    return {
      formattedAddress: `Titik Peta (${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}), ${subdistrict}, Kota Padang`,
      lat: coords.lat,
      lng: coords.lng,
      subdistrict,
      city: "Padang",
      province: "Sumatera Barat",
      source: "manual",
    };
  }

  async search(query: string): Promise<GeocodingResult[]> {
    return [
      {
        formattedAddress: `${query}, Kota Padang, Sumatera Barat`,
        lat: -0.9025,
        lng: 100.3542,
        city: "Padang",
        province: "Sumatera Barat",
        source: "manual",
      },
    ];
  }
}
