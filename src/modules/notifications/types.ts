export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: {
    orderId?: string;
    orderCode?: string;
    url?: string;
  };
}

export interface WhatsAppMessageInput {
  phone: string;
  customerName?: string;
  orderCode?: string;
  total?: number;
  status?: string;
  customMessage?: string;
  invoiceNo?: string;
  invoiceUrl?: string;
  trackingUrl?: string;
  courierName?: string;
  courierPhone?: string;
  estimatedTime?: string;
  bankName?: string;
  accountNumber?: string;
  accountName?: string;
}

export interface WhatsAppNotificationResult {
  success: boolean;
  messageId?: string;
  provider: "fonnte" | "wablas" | "webhook" | "mock";
  simulated?: boolean;
  error?: string;
}
