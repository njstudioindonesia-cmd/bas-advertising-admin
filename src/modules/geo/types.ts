export interface LatLng {
  lat: number;
  lng: number;
}

export interface GeocodingResult {
  formattedAddress: string;
  lat: number;
  lng: number;
  subdistrict?: string; // Kelurahan
  district?: string; // Kecamatan
  city?: string; // Kota (Padang)
  province?: string; // Sumatera Barat
  postalCode?: string;
  source: "nominatim" | "photon" | "manual" | "cache";
}

export interface DistanceResult {
  distanceKm: number;
  durationMin: number;
  isFallback: boolean;
  source: "osrm" | "haversine";
}
