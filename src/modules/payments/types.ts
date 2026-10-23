export type PaymentStatus = "PENDING" | "VERIFIED" | "REJECTED";

export interface PaymentRecord {
  id: string;
  orderId: string;
  orderCode?: string;
  customerName?: string;
  customerPhone?: string;
  amount: number;
  proofUrl: string | null;
  status: PaymentStatus;
  senderBank?: string | null;
  senderName?: string | null;
  notes?: string | null;
  verifiedBy?: string | null;
  verifiedAt?: string | null;
  rejectReason?: string | null;
  createdAt: string;
}

export interface ManualPaymentAccount {
  id: string;
  bank: string;
  accountNumber: string;
  accountName: string;
  badge?: string;
  qrisUrl?: string;
  instructions: string[];
}
