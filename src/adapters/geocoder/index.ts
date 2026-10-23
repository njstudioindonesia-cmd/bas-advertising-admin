import { GeocoderProvider } from "./types";
import { NominatimGeocoder } from "./nominatim";
import { FallbackGeocoder } from "./haversine-fallback";

export * from "./types";
export * from "./nominatim";
export * from "./haversine-fallback";

let defaultGeocoder: GeocoderProvider | null = null;

export function getActiveGeocoder(): GeocoderProvider {
  if (!defaultGeocoder) {
    defaultGeocoder = new NominatimGeocoder();
  }
  return defaultGeocoder;
}
