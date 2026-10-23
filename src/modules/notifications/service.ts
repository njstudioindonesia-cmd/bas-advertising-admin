import { WhatsAppMessageInput, WhatsAppNotificationResult } from "./types";
import { logAudit } from "@/lib/db/queries/audit";

/**
 * Normalisasi nomor HP Indonesia ke format internasional (62xxx)
 */
export function formatIndonesianPhone(phone: string): string {
  let cleaned = phone.replace(/[^0-9]/g, "");
  if (cleaned.startsWith("0")) {
    cleaned = "62" + cleaned.slice(1);
  } else if (!cleaned.startsWith("62")) {
    cleaned = "62" + cleaned;
  }
  return cleaned;
}

/**
 * Membuat link WhatsApp manual (wa.me) sebagai fallback UI
 */
export function createWhatsAppLink(input: WhatsAppMessageInput): string {
  const phone = formatIndonesianPhone(input.phone);
  let text = input.customMessage || "";

  if (!text) {
    text = `Halo ${input.customerName || "Kak"}, konfirmasi pesanan Cetak.inc dengan kode *${input.orderCode || "-"}*.`;
    if (input.status) {
      text += ` Status saat ini: *${input.status}*.`;
    }
    if (input.total) {
      text += ` Total: *Rp ${input.total.toLocaleString("id-ID")}*.`;
    }
    if (input.trackingUrl) {
      text += ` Pantau di: ${input.trackingUrl}`;
    }
  }

  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}

/**
 * Mengirim pesan WhatsApp langsung via provider API otomatis (Fonnte, Wablas, atau Generic Webhook)
 * Jika tidak ada API key yang disetel, beralih ke mode mock terproteksi (simulasi).
 */
export async function sendWhatsAppDirect(
  phone: string,
  message: string,
  metadata?: Record<string, any>
): Promise<WhatsAppNotificationResult> {
  const targetPhone = formatIndonesianPhone(phone);

  // 1. Integrasi Provider: Fonnte (https://fonnte.com)
  const fonnteToken = process.env.FONNTE_TOKEN;
  if (fonnteToken) {
    try {
      const response = await fetch("https://api.fonnte.com/send", {
        method: "POST",
        headers: {
          Authorization: fonnteToken,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          target: targetPhone,
          message,
          countryCode: "62",
        }),
      });

      const data = await response.json();
      if (data.status) {
        logAudit({
          actor: "system_wa",
          action: "WA_SENT",
          entity: "notification",
          diff: { provider: "fonnte", phone: targetPhone, ...metadata },
        });

        return {
          success: true,
          provider: "fonnte",
          messageId: data.id?.[0] || String(Date.now()),
        };
      }
    } catch (err: any) {
      console.warn("[WA_FONNTE_ERR] Gagal mengirim pesan via Fonnte:", err.message);
    }
  }

  // 2. Integrasi Provider: Wablas (https://wablas.com)
  const wablasToken = process.env.WABLAS_TOKEN;
  const wablasDomain = process.env.WABLAS_DOMAIN || "https://kudus.wablas.com";
  if (wablasToken) {
    try {
      const response = await fetch(`${wablasDomain}/api/send-message`, {
        method: "POST",
        headers: {
          Authorization: wablasToken,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone: targetPhone,
          message,
        }),
      });

      const data = await response.json();
      if (data.status) {
        return {
          success: true,
          provider: "wablas",
          messageId: data.data?.messages?.[0]?.id || String(Date.now()),
        };
      }
    } catch (err: any) {
      console.warn("[WA_WABLAS_ERR] Gagal mengirim pesan via Wablas:", err.message);
    }
  }

  // 3. Integrasi Provider: Generic Webhook URL
  const webhookUrl = process.env.WHATSAPP_WEBHOOK_URL;
  if (webhookUrl) {
    try {
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: targetPhone,
          message,
          timestamp: new Date().toISOString(),
          ...metadata,
        }),
      });

      if (response.ok) {
        return {
          success: true,
          provider: "webhook",
          messageId: String(Date.now()),
        };
      }
    } catch (err: any) {
      console.warn("[WA_WEBHOOK_ERR] Gagal mengirim pesan via Generic Webhook:", err.message);
    }
  }

  // 4. Fallback Simulasi (Mock Safe Mode) saat belum ada API key
  console.log(`[WA_NOTIFICATION_MOCK] Kepada: ${targetPhone}\nIsi Pesan:\n${message}\n---`);
  return {
    success: true,
    provider: "mock",
    simulated: true,
    messageId: `mock-wa-${Date.now()}`,
  };
}

/**
 * Notifikasi 1: Pesanan Baru Dibuat (Menunggu Pembayaran)
 */
export async function notifyOrderCreated(input: WhatsAppMessageInput): Promise<WhatsAppNotificationResult> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "https://cetakinc.vercel.app";
  const trackingLink = input.trackingUrl || `${baseUrl}/lacak?code=${encodeURIComponent(input.orderCode || "")}`;
  const totalRupiah = (input.total || 0).toLocaleString("id-ID");

  const message = [
    `Halo Kak *${input.customerName || "Pelanggan"}*, terima kasih telah memesan di *Cetak.inc Padang*! ✨`,
    "",
    "📋 *RINCIAN PESANAN:*",
    `• No. Pesanan: *${input.orderCode || "-"}*`,
    `• Total Tagihan: *Rp ${totalRupiah}* _(termasuk kode unik verifikasi)_`,
    "",
    "💳 *INSTRUKSI PEMBAYARAN TRANSFER BANK:*",
    "• *Bank Nagari Sumbar:* `2100.0210.08888-1` (a/n BAS Advertising)",
    "• *Bank BCA:* `0321.888.999` (a/n BAS Advertising)",
    "• *Bank Mandiri:* `111.00.9988776-6` (a/n BAS Advertising)",
    "• *QRIS Instant:* Tersedia di halaman pelacakan pesanan",
    "",
    "📸 Setelah transfer, mohon unggah bukti pembayaran melalui tautan berikut:",
    `🔗 ${trackingLink}`,
    "",
    "_Pesanan Anda akan langsung dialokasikan ke workshop percetakan terdekat begitu bukti pembayaran diverifikasi._",
    "",
    "Terima kasih atas kepercayaannya!",
    "*Cetak.inc — BAS Advertising Padang*",
  ].join("\n");

  return sendWhatsAppDirect(input.phone, message, {
    orderCode: input.orderCode,
    event: "ORDER_CREATED",
  });
}

/**
 * Notifikasi 2: Pembayaran Berhasil Diverifikasi Lunas
 */
export async function notifyPaymentVerified(input: WhatsAppMessageInput): Promise<WhatsAppNotificationResult> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "https://cetakinc.vercel.app";
  const trackingLink = input.trackingUrl || `${baseUrl}/lacak?code=${encodeURIComponent(input.orderCode || "")}`;
  const invoiceLink = input.invoiceUrl || (input.invoiceNo ? `${baseUrl}/invoice/${encodeURIComponent(input.invoiceNo)}` : "");

  const message = [
    "✅ *PEMBAYARAN DIVERIFIKASI LUNAS — CETAK.INC*",
    "",
    `Halo Kak *${input.customerName || "Pelanggan"}*, pembayaran untuk pesanan *${input.orderCode}* telah kami terima dan diverifikasi LUNAS.`,
    "",
    invoiceLink ? `📄 *Invoice & Kwitansi Resmi:*\n🔗 ${invoiceLink}\n` : "",
    "🏭 *STATUS PRODUKSI:*",
    "File desain Anda telah diteruskan ke antrean mesin cetak workshop kami. Anda dapat memantau progres cetak hingga kurir meluncur secara real-time di:",
    `🔗 ${trackingLink}`,
    "",
    "Terima kasih telah mempercayakan cetakan bisnis Anda kepada kami!",
    "*Cetak.inc — BAS Advertising Padang*",
  ].filter(Boolean).join("\n");

  return sendWhatsAppDirect(input.phone, message, {
    orderCode: input.orderCode,
    event: "PAYMENT_VERIFIED",
  });
}

/**
 * Notifikasi 3: Kurir Sedang Meluncur Mengantar Pesanan (Live Tracking)
 */
export async function notifyOrderEnRoute(input: WhatsAppMessageInput): Promise<WhatsAppNotificationResult> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "https://cetakinc.vercel.app";
  const trackingLink = input.trackingUrl || `${baseUrl}/lacak?code=${encodeURIComponent(input.orderCode || "")}`;

  const message = [
    "🛵 *PESANAN ANDA SEDANG DIANTAR OLEH KURIR CETAK.INC*",
    "",
    `Halo Kak *${input.customerName || "Pelanggan"}*, paket hasil cetakan Anda untuk pesanan *${input.orderCode}* sudah selesai dan sedang dalam perjalanan!`,
    "",
    "👤 *INFO KURIR PENGANTAR:*",
    `• Nama Kurir: *${input.courierName || "Kurir Resmi Cetak.inc"}*`,
    input.courierPhone ? `• WhatsApp Kurir: *${input.courierPhone}*` : "",
    input.estimatedTime ? `• Estimasi Waktu Tiba: *${input.estimatedTime}*` : "",
    "",
    "🗺️ *PANTAU POSISI KURIR SECARA LANGSUNG PADA PETA:*",
    `🔗 ${trackingLink}`,
    "",
    "Mohon pastikan nomor telepon Anda dapat dihubungi saat kurir tiba di lokasi. Terima kasih!",
  ].filter(Boolean).join("\n");

  return sendWhatsAppDirect(input.phone, message, {
    orderCode: input.orderCode,
    event: "ORDER_EN_ROUTE",
  });
}

/**
 * Notifikasi 4: Pesanan Selesai / Diterima dengan Baik
 */
export async function notifyOrderCompleted(input: WhatsAppMessageInput): Promise<WhatsAppNotificationResult> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "https://cetakinc.vercel.app";
  const invoiceLink = input.invoiceUrl || (input.invoiceNo ? `${baseUrl}/invoice/${encodeURIComponent(input.invoiceNo)}` : "");

  const message = [
    "🎉 *PESANAN SELESAI — TERIMA KASIH TELAH MENCETAK DI CETAK.INC!*",
    "",
    `Halo Kak *${input.customerName || "Pelanggan"}*, pesanan *${input.orderCode}* telah diserahkan dan diterima dengan baik.`,
    "",
    invoiceLink ? `📄 Unduh arsip invoice & kwitansi lunas Anda kapan saja di:\n🔗 ${invoiceLink}\n` : "",
    "Kami sangat bangga dapat menjadi mitra percetakan & advertising bisnis Anda di Kota Padang.",
    "Sampai jumpa di pesanan berikutnya!",
    "",
    "Salam hangat,",
    "*Tim Cetak.inc — BAS Advertising Padang*",
  ].filter(Boolean).join("\n");

  return sendWhatsAppDirect(input.phone, message, {
    orderCode: input.orderCode,
    event: "ORDER_COMPLETED",
  });
}
