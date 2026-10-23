export interface MapConfig {
  tileUrl: string;
  attribution: string;
  maxZoom: number;
  provider: "osm" | "google";
}
