export interface InvoiceItem {
  name: string;
  specs?: string;
  qty: number;
  unitPrice: number;
  subtotal: number;
}

export interface InvoiceSnapshot {
  invoiceNo: string;
  orderCode: string;
  customerName: string;
  customerPhone: string;
  deliveryMethod: string;
  deliveryAddress?: string | null;
  hubName?: string;
  items: InvoiceItem[];
  subtotal: number;
  deliveryFee: number;
  uniqueCode: number;
  total: number;
  paymentStatus: "BELUM_DIBAYAR" | "LUNAS";
  paidAt?: string | null;
  issuedAt: string;
}

export interface InvoiceRecord {
  id: string;
  invoiceNo: string;
  publicToken: string;
  orderId: string;
  issuedAt: string;
  paidAt?: string | null;
  snapshot: InvoiceSnapshot;
}
