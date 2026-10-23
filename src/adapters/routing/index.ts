import { RoutingProvider } from "./types";
import { OSRMRoutingProvider } from "./osrm";
import { HaversineRoutingProvider } from "./haversine";

export * from "./types";
export * from "./osrm";
export * from "./haversine";

let defaultRoutingProvider: RoutingProvider | null = null;

export function getActiveRoutingProvider(): RoutingProvider {
  if (!defaultRoutingProvider) {
    defaultRoutingProvider = new OSRMRoutingProvider();
  }
  return defaultRoutingProvider;
}
