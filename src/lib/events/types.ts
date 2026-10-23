export type EventType =
  | "ORDER_CREATED"
  | "ORDER_PAID"
  | "ORDER_PAYMENT_REJECTED"
  | "ORDER_ASSIGNED_HUB"
  | "ORDER_ACCEPTED_VENDOR"
  | "ORDER_IN_PRODUCTION"
  | "ORDER_READY_FOR_DELIVERY"
  | "DRIVER_ASSIGNED"
  | "DRIVER_PICKED_UP"
  | "DRIVER_IN_TRANSIT"
  | "DRIVER_ARRIVED"
  | "DRIVER_LOCATION_UPDATED"
  | "ORDER_COMPLETED"
  | "ORDER_CANCELLED"
  | "ORDER_EXPIRED";

export type EventStatus = "PENDING" | "PROCESSING" | "DONE" | "FAILED";

export interface AppEvent<T = Record<string, any>> {
  id?: number | string;
  type: EventType;
  payload: T;
  status?: EventStatus;
  attempts?: number;
  errorMessage?: string | null;
  createdAt?: string;
  processedAt?: string | null;
}

export type EventHandler<T = any> = (event: AppEvent<T>) => Promise<void> | void;
