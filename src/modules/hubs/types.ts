export interface Hub {
  id: string;
  name: string;
  slug: string;
  address: string | null;
  lat: number;
  lng: number;
  phone?: string | null;
  whatsapp?: string | null;
  maxRadiusKm: number;
  dailyCapacity: number;
  openingHours?: Record<string, string[]> | null;
  isActive: boolean;
  isOpen: boolean;
  notes?: string | null;
  createdAt?: string;
}

export interface HubServiceArea {
  id: string;
  hubId: string;
  areaName: string;
  centerLat?: number | null;
  centerLng?: number | null;
  radiusKm?: number | null;
  priority: number;
}

export interface HubProduct {
  hubId: string;
  productId: string;
  priceOverride?: number | null;
  isAvailable: boolean;
}

export interface HubAssignmentResult {
  hubId: string;
  hubName: string;
  distanceKm: number;
  matchedBy: "priority_area" | "nearest_distance" | "manual_admin" | "default_hub";
  isFallback: boolean;
}
