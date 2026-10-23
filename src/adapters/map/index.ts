import { LEAFLET_OSM_CONFIG } from "./leaflet-osm";
import { GOOGLE_MAPS_CONFIG, isGoogleMapsEnabled } from "./google-maps";
import { MapConfig } from "./types";

export * from "./types";
export * from "./leaflet-osm";
export * from "./google-maps";

export function getActiveMapConfig(): MapConfig {
  if (isGoogleMapsEnabled()) {
    return GOOGLE_MAPS_CONFIG;
  }
  return LEAFLET_OSM_CONFIG;
}
