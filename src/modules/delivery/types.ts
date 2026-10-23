export type DeliveryTaskStatus =
  | "ASSIGNED"
  | "PICKING_UP"
  | "IN_TRANSIT"
  | "ARRIVED"
  | "DELIVERED"
  | "FAILED"
  | "CANCELLED";

export interface Driver {
  id: string;
  fullName: string;
  phone: string;
  vehicleType: string;
  plate: string;
  isOnline: boolean;
  hubId?: string | null;
}

export interface DeliveryTask {
  id: string;
  orderId: string;
  driverId: string | null;
  provider: "internal" | "gosend" | "maxim" | "pickup";
  status: DeliveryTaskStatus;
  pickupProofUrl?: string | null;
  dropoffProofUrl?: string | null;
  etaMin?: number | null;
  startedAt?: string | null;
  finishedAt?: string | null;
  driver?: Driver | null;
}

export interface DriverLocation {
  driverId: string;
  lat: number;
  lng: number;
  heading?: number | null;
  speed?: number | null;
  updatedAt: string;
}

export interface ShippingTariff {
  id: string;
  hubId: string;
  baseFee: number;
  perKm: number;
  minFee: number;
  maxKm: number;
  freeOver?: number | null;
  isActive: boolean;
}
