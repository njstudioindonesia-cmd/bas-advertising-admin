import { MapConfig } from "./types";

export const GOOGLE_MAPS_CONFIG: MapConfig = {
  tileUrl: "",
  attribution: "&copy; Google Maps",
  maxZoom: 20,
  provider: "google",
};

export function isGoogleMapsEnabled(): boolean {
  return (
    process.env.NEXT_PUBLIC_MAP_PROVIDER === "google" &&
    Boolean(process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY)
  );
}
