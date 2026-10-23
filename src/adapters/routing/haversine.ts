import { LatLng } from "@/modules/geo/types";
import { estimateRoadDistance } from "@/modules/geo/distance";
import { RouteResult, RoutingProvider } from "./types";

export class HaversineRoutingProvider implements RoutingProvider {
  id = "haversine";
  name = "Haversine Offline Fallback";

  async calculateRoute(from: LatLng, to: LatLng): Promise<RouteResult> {
    const est = estimateRoadDistance(from, to);
    return {
      distanceKm: est.distanceKm,
      durationMin: est.durationMin,
      geometry: [
        [from.lat, from.lng],
        [to.lat, to.lng],
      ],
      isFallback: true,
      provider: "haversine",
    };
  }
}
