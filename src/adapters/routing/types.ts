import { LatLng } from "@/modules/geo/types";

export interface RouteResult {
  distanceKm: number;
  durationMin: number;
  geometry?: [number, number][]; // Array of [lat, lng]
  isFallback: boolean;
  provider: "osrm" | "haversine";
}

export interface RoutingProvider {
  id: string;
  name: string;
  calculateRoute(from: LatLng, to: LatLng): Promise<RouteResult>;
}
