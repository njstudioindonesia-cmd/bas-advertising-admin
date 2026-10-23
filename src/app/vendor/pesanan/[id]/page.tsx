"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Printer,
  Clock,
  CheckCircle2,
  Package,
  MapPin,
  Phone,
  FileText,
  RefreshCw,
  AlertCircle,
  ExternalLink,
  MessageSquare,
  Wrench,
  Check,
  ShieldCheck,
  Calendar,
} from "lucide-react";

interface OrderDetail {
  id: string;
  code: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  status: string;
  paymentStatus?: string;
  deliveryMethod?: string;
  address?: string;
  destNote?: string;
  hubId?: string;
  createdAt: string;
  items: Array<{
    id?: string;
    name: string;
    qty: number;
    price?: number;
    specs?: string;
    fileUrl?: string;
    notes?: string;
  }>;
  invoiceNo?: string;
  invoiceToken?: string;
}

export default function VendorOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params?.id as string;

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchOrderDetail = useCallback(async () => {
    if (!orderId) return;
    try {
      const res = await fetch(`/api/vendor/orders/${orderId}`, { cache: "no-store" });
      const data = await res.json();
      if (data.success && data.data) {
        setOrder(data.data);
      } else {
        showToast(data.error || "Gagal memuat rincian pesanan", "error");
      }
    } catch {
      showToast("Terjadi gangguan jaringan saat memuat pesanan", "error");
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchOrderDetail();
  }, [fetchOrderDetail]);

  const handleUpdateStatus = async (targetStatus: string) => {
    if (!order) return;
    setUpdating(true);
    try {
      const res = await fetch(`/api/vendor/orders/${order.id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetStatus }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(
          targetStatus === "DIPRODUKSI"
            ? "Pesanan mulai dicetak di mesin workshop!"
            : targetStatus === "SIAP_ANTAR"
            ? "Pesanan ditandai selesai & siap dikirim kurir!"
            : data.message,
          "success"
        );
        fetchOrderDetail();
      } else {
        showToast(data.error || "Gagal memperbarui status", "error");
      }
    } catch {
      showToast("Terjadi gangguan jaringan", "error");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#071322] flex items-center justify-center text-white">
        <div className="flex items-center gap-3">
          <RefreshCw className="w-5 h-5 animate-spin text-emerald-400" />
          <span className="text-sm font-medium">Memuat Rincian Spesifikasi Cetak...</span>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-[#071322] flex items-center justify-center text-white p-4">
        <div className="bg-[#0B1E36] border border-white/10 rounded-3xl p-8 max-w-md w-full text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-amber-400 mx-auto" />
          <h2 className="text-base font-bold">Pesanan Tidak Ditemukan</h2>
          <p className="text-xs text-white/50">
            Pesanan ini tidak tersedia atau telah dialokasikan ke workshop cabang lain.
          </p>
          <Link
            href="/vendor"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition"
          >
            <ArrowLeft size={14} /> Kembali ke Antrean
          </Link>
        </div>
      </div>
    );
  }

  // Stepper logic
  const steps = [
    { key: "ANTREAN", label: "Antrean Masuk", done: true },
    {
      key: "DIPRODUKSI",
      label: "Sedang Dicetak",
      done: ["DIPRODUKSI", "DIPROSES", "SIAP_ANTAR", "SIAP", "DIANTAR", "SELESAI"].includes(order.status),
      current: ["DIPRODUKSI", "DIPROSES"].includes(order.status),
    },
    {
      key: "SIAP_ANTAR",
      label: "Siap Antar / Ambil",
      done: ["SIAP_ANTAR", "SIAP", "DIANTAR", "SELESAI"].includes(order.status),
      current: ["SIAP_ANTAR", "SIAP"].includes(order.status),
    },
    {
      key: "SELESAI",
      label: "Selesai / Terkirim",
      done: ["SELESAI"].includes(order.status),
      current: ["SELESAI", "DIANTAR"].includes(order.status),
    },
  ];

  const waNumber = order.customerPhone
    ? order.customerPhone.replace(/[^0-9]/g, "").replace(/^0/, "62")
    : null;

  return (
    <div className="min-h-screen bg-[#071322] text-white flex flex-col font-sans pb-16">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-2xl shadow-xl text-xs font-bold flex items-center gap-2 border animate-in slide-in-from-top ${
            toast.type === "success"
              ? "bg-emerald-950/90 text-emerald-300 border-emerald-500/30"
              : "bg-red-950/90 text-red-300 border-red-500/30"
          }`}
        >
          {toast.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-[#0B1E36]/90 backdrop-blur-md border-b border-white/10 px-4 py-3 sm:px-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/vendor"
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 border border-white/10 transition active:scale-95"
              title="Kembali ke Antrean"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md">
                  #{order.code}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                    order.status === "DIPRODUKSI"
                      ? "bg-sky-500/20 text-sky-400 border-sky-500/30"
                      : order.status === "SIAP_ANTAR"
                      ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                      : "bg-amber-500/20 text-amber-400 border-amber-500/30"
                  }`}
                >
                  {order.status}
                </span>
              </div>
              <p className="text-[11px] text-white/50 flex items-center gap-1.5 mt-0.5">
                <Calendar className="w-3 h-3 text-white/40" />
                {new Date(order.createdAt).toLocaleDateString("id-ID", {
                  weekday: "short",
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}{" "}
                WIB
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={`/invoice/${order.code}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 transition active:scale-95 shadow-sm"
              title="Cetak SPK Workshop (A4)"
            >
              <FileText className="w-4 h-4" />
              <span>Cetak SPK</span>
            </a>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 space-y-5">
        {/* Production Stepper Bar */}
        <div className="bg-[#0B1E36] border border-white/10 rounded-2xl p-4 sm:p-5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-white/40 mb-3">
            Tahapan Produksi Workshop
          </p>
          <div className="grid grid-cols-4 gap-2">
            {steps.map((st, i) => (
              <div key={i} className="flex flex-col items-center text-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-mono text-xs font-bold transition-all ${
                    st.current
                      ? "bg-amber-400 text-black ring-4 ring-amber-400/20"
                      : st.done
                      ? "bg-emerald-500 text-white"
                      : "bg-white/10 text-white/40"
                  }`}
                >
                  {st.done ? <Check size={14} /> : i + 1}
                </div>
                <span
                  className={`text-[10px] sm:text-[11px] font-semibold mt-1.5 line-clamp-1 ${
                    st.current
                      ? "text-amber-300 font-bold"
                      : st.done
                      ? "text-emerald-400"
                      : "text-white/40"
                  }`}
                >
                  {st.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Customer Information Card */}
        <div className="bg-[#0B1E36] border border-white/10 rounded-2xl p-4 sm:p-5 space-y-3">
          <h2 className="text-xs font-bold text-white/40 uppercase tracking-wider flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-emerald-400" /> Kontak Pelanggan
          </h2>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#071322] border border-white/5 rounded-xl p-3.5">
            <div>
              <h3 className="text-base font-extrabold text-white">{order.customerName}</h3>
              <p className="text-xs text-white/60 font-mono mt-0.5">{order.customerPhone || "-"}</p>
              {order.customerEmail && (
                <p className="text-[11px] text-white/40">{order.customerEmail}</p>
              )}
            </div>

            {waNumber && (
              <div className="flex items-center gap-2">
                <a
                  href={`https://wa.me/${waNumber}?text=Halo%20kak%20${encodeURIComponent(
                    order.customerName
                  )},%20kami%20dari%20Workshop%20Cetak.inc%20konfirmasi%20terkait%20pesanan%20%23${
                    order.code
                  }`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-white transition active:scale-95 shadow-md shadow-emerald-500/20"
                >
                  <MessageSquare size={14} /> Hubungi via WhatsApp
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Print Specifications List */}
        <div className="bg-[#0B1E36] border border-white/10 rounded-2xl p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-white/40 uppercase tracking-wider flex items-center gap-1.5">
              <Printer size={14} className="text-amber-400" /> Spesifikasi Produksi & Bahan
            </h2>
            <span className="text-[11px] font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
              {order.items?.length || 0} Produk
            </span>
          </div>

          <div className="space-y-3">
            {order.items?.map((item, idx) => (
              <div
                key={idx}
                className="bg-[#071322] border border-white/5 rounded-xl p-4 space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-extrabold text-sm sm:text-base text-white">
                      {idx + 1}. {item.name}
                    </h3>
                    <p className="text-xs text-emerald-400 font-mono mt-0.5">
                      Jumlah Cetak: <span className="font-bold text-sm">{item.qty}</span> pcs
                    </p>
                  </div>
                  {item.fileUrl && (
                    <a
                      href={item.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-sky-500/20 text-sky-400 border border-sky-500/30 text-[11px] font-bold hover:bg-sky-500/30 transition shrink-0"
                    >
                      <ExternalLink size={12} /> Unduh File Desain
                    </a>
                  )}
                </div>

                {/* Technical Specs Box */}
                {item.specs ? (
                  <div className="bg-[#0B1E36] border border-amber-400/20 rounded-lg p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-amber-400/80 mb-1 flex items-center gap-1">
                      <Wrench size={11} /> Parameter Mesin / Finishing:
                    </p>
                    <p className="text-xs text-white/90 font-mono whitespace-pre-line leading-relaxed">
                      {item.specs}
                    </p>
                  </div>
                ) : (
                  <p className="text-[11px] text-white/40 italic">
                    Tidak ada catatan spesifikasi khusus — ikuti standar produk.
                  </p>
                )}

                {item.notes && (
                  <div className="text-[11px] text-amber-300/80 bg-amber-500/5 border border-amber-500/10 rounded-lg p-2.5">
                    <strong>Catatan Pemesan:</strong> {item.notes}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Delivery / Pickup Method */}
        <div className="bg-[#0B1E36] border border-white/10 rounded-2xl p-4 sm:p-5 space-y-3">
          <h2 className="text-xs font-bold text-white/40 uppercase tracking-wider flex items-center gap-1.5">
            <MapPin size={14} className="text-sky-400" /> Logistik & Pengiriman
          </h2>
          <div className="bg-[#071322] border border-white/5 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white">
                Metode: {order.deliveryMethod === "kirim" ? "Pengantaran Kurir Cetak.inc" : "Ambil Sendiri di Workshop"}
              </span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                  order.deliveryMethod === "kirim"
                    ? "bg-sky-500/10 text-sky-400 border-sky-500/20"
                    : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                }`}
              >
                {order.deliveryMethod === "kirim" ? "Delivery" : "Self-Pickup"}
              </span>
            </div>

            <p className="text-xs text-white/80 leading-relaxed font-medium">
              Alamat: {order.address || "Workshop Percetakan Cabang"}
            </p>

            {order.destNote && (
              <p className="text-[11px] text-amber-400/90 font-mono">
                Patokan / Catatan Kurir: {order.destNote}
              </p>
            )}
          </div>
        </div>

        {/* Action Panel Footer */}
        <div className="bg-[#0B1E36] border border-white/10 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xl">
          <div>
            <p className="text-xs text-white/50">Status Operasional Saat Ini:</p>
            <p className="text-sm font-extrabold text-amber-400">{order.status}</p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {["DIBAYAR", "DITERIMA_VENDOR", "BARU"].includes(order.status) && (
              <button
                type="button"
                onClick={() => handleUpdateStatus("DIPRODUKSI")}
                disabled={updating}
                className="flex-1 sm:flex-initial bg-amber-500 hover:bg-amber-600 text-white font-bold py-2.5 px-6 rounded-xl text-xs shadow-md shadow-amber-500/25 active:scale-95 transition inline-flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {updating ? <RefreshCw size={14} className="animate-spin" /> : <Printer size={15} />}
                Mulai Cetak di Mesin
              </button>
            )}

            {["DIPRODUKSI", "DIPROSES"].includes(order.status) && (
              <button
                type="button"
                onClick={() => handleUpdateStatus("SIAP_ANTAR")}
                disabled={updating}
                className="flex-1 sm:flex-initial bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2.5 px-6 rounded-xl text-xs shadow-md shadow-emerald-500/25 active:scale-95 transition inline-flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {updating ? <RefreshCw size={14} className="animate-spin" /> : <CheckCircle2 size={15} />}
                Tandai Selesai & Siap Antar
              </button>
            )}

            {["SIAP_ANTAR", "SIAP"].includes(order.status) && (
              <div className="py-2.5 px-5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs font-bold text-emerald-400 inline-flex items-center gap-2">
                <CheckCircle2 size={16} /> Menunggu Pickup Kurir / Diambil Pelanggan
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
