import { LatLng } from "@/modules/geo/types";

export interface ShippingQuoteInput {
  from: LatLng;
  to: LatLng;
  hubId: string;
  weightKg?: number;
  subtotal?: number;
}

export interface ShippingQuoteResult {
  providerId: string;
  price: number;
  etaMin: number;
  label: string;
  distanceKm: number;
  isFreeShipping?: boolean;
}

export interface ShippingProvider {
  id: string;
  name: string;
  quote(input: ShippingQuoteInput): Promise<ShippingQuoteResult | null>;
}
