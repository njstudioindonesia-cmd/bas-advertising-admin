import { LatLng, GeocodingResult } from "@/modules/geo/types";

export interface GeocoderProvider {
  id: string;
  name: string;
  reverse(coords: LatLng): Promise<GeocodingResult>;
  search(query: string): Promise<GeocodingResult[]>;
}
