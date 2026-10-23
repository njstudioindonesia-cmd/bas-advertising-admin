import { MapConfig } from "./types";

export const LEAFLET_OSM_CONFIG: MapConfig = {
  // Carto Voyager: bersih, modern, kontras bagus untuk tracking motor
  tileUrl: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
  maxZoom: 19,
  provider: "osm",
};
