"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Navigation,
  Phone,
  MessageCircle,
  MapPin,
  CheckCircle2,
  Clock,
  ShieldCheck,
  RefreshCw,
  Camera,
  ExternalLink,
  AlertCircle,
  X,
  Package,
  Wrench,
} from "lucide-react";

interface OrderDetail {
  id: string;
  code: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  address?: string;
  destLat?: number;
  destLng?: number;
  destNote?: string;
  subtotal: number;
  status: string;
  hubId?: string;
  items?: any[];
  createdAt: string;
}

export default function DriverTaskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const taskId = params?.id as string;

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Dropoff proof modal state
  const [showProofModal, setShowProofModal] = useState(false);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [uploadingProof, setUploadingProof] = useState(false);

  // GPS beacon reference
  const lastSentPosRef = useRef<{ lat: number; lng: number; time: number } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchTaskDetail = useCallback(async () => {
    if (!taskId) return;
    try {
      const res = await fetch(`/api/orders/track?code=${encodeURIComponent(taskId)}`, {
        cache: "no-store",
      });
      const data = await res.json();
      if (data.success && data.data && data.data.length > 0) {
        setOrder(data.data[0]);
      } else {
        // Fallback jika via API vendor/driver task
        const taskRes = await fetch("/api/driver/tasks", { cache: "no-store" });
        const taskData = await taskRes.json();
        if (taskData.success) {
          const match =
            taskData.data.activeTask?.id === taskId || taskData.data.activeTask?.code === taskId
              ? taskData.data.activeTask
              : taskData.data.availableTasks?.find(
                  (t: any) => t.id === taskId || t.code === taskId
                );
          if (match) setOrder(match);
        }
      }
    } catch {
      showToast("Gagal memuat rincian tugas antar", "error");
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    fetchTaskDetail();
  }, [fetchTaskDetail]);

  // GPS Tracking beacon saat status DALAM_PERJALANAN
  useEffect(() => {
    if (!order || order.status !== "DALAM_PERJALANAN") return;
    if (typeof window === "undefined" || !("geolocation" in navigator)) return;

    const watchId = navigator.geolocation.watchPosition(
      async (pos) => {
        const { latitude, longitude, heading, speed } = pos.coords;
        const now = Date.now();

        if (lastSentPosRef.current) {
          const timeDiff = now - lastSentPosRef.current.time;
          const latDiff = Math.abs(latitude - lastSentPosRef.current.lat);
          const lngDiff = Math.abs(longitude - lastSentPosRef.current.lng);
          const approxDistM = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff) * 111000;

          if (timeDiff < 10000 && approxDistM < 15) return;
        }

        lastSentPosRef.current = { lat: latitude, lng: longitude, time: now };

        try {
          await fetch("/api/driver/location", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              lat: latitude,
              lng: longitude,
              heading: heading || 0,
              speed: speed || 0,
              orderId: order.id,
            }),
          });
        } catch {}
      },
      undefined,
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [order]);

  const handleUpdateStatus = async (targetStatus: string, proofUrl?: string) => {
    if (!order) return;
    setUpdating(true);
    try {
      const res = await fetch(`/api/driver/tasks/${order.id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetStatus,
          proofPhotoUrl: proofUrl,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(
          targetStatus === "DALAM_PERJALANAN"
            ? "Mulai pengantaran! Live tracking GPS kurir aktif."
            : targetStatus === "TIBA"
            ? "Tiba di lokasi pemesan!"
            : targetStatus === "SELESAI"
            ? "Pesanan berhasil diserahterimakan! Selesai."
            : data.message,
          "success"
        );
        setShowProofModal(false);
        fetchTaskDetail();
      } else {
        showToast(data.error || "Gagal memperbarui status", "error");
      }
    } catch {
      showToast("Terjadi kesalahan jaringan", "error");
    } finally {
      setUpdating(false);
    }
  };

  const handleProofSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proofFile) {
      showToast("Pilih atau potret foto bukti serah terima", "error");
      return;
    }

    setUploadingProof(true);
    try {
      const fd = new FormData();
      fd.append("file", proofFile);
      fd.append("folder", "delivery-proofs");

      const uploadRes = await fetch("/api/upload", { method: "POST", body: fd });
      const uploadData = await uploadRes.json();

      if (!uploadRes.ok || !uploadData.success) {
        showToast(uploadData.error || "Gagal mengunggah foto", "error");
        setUploadingProof(false);
        return;
      }

      await handleUpdateStatus("SELESAI", uploadData.url);
    } catch {
      showToast("Terjadi gangguan jaringan saat unggah bukti", "error");
    } finally {
      setUploadingProof(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#071322] flex items-center justify-center text-white">
        <div className="flex items-center gap-3">
          <RefreshCw className="w-5 h-5 animate-spin text-sky-400" />
          <span className="text-sm font-medium">Memuat Rute & Detail Pengantaran...</span>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-[#071322] text-white flex flex-col justify-center items-center p-4">
        <div className="bg-[#0B1E36] border border-white/10 rounded-3xl p-8 max-w-sm w-full text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-amber-400 mx-auto" />
          <h2 className="text-sm font-bold">Tugas Pengantaran Tidak Ditemukan</h2>
          <p className="text-xs text-white/50">
            Tugas ini telah selesai atau belum dialokasikan ke armada kurir.
          </p>
          <Link
            href="/driver"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition"
          >
            <ArrowLeft size={14} /> Kembali ke Dashboard Kurir
          </Link>
        </div>
      </div>
    );
  }

  const destCoords = `${order.destLat || -0.9242},${order.destLng || 100.3626}`;
  const gmapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${destCoords}`;
  const wazeUrl = `https://waze.com/ul?ll=${destCoords}&navigate=yes`;
  const waNumber = order.customerPhone
    ? order.customerPhone.replace(/[^0-9]/g, "").replace(/^0/, "62")
    : null;

  return (
    <div className="min-h-screen bg-[#071322] text-white flex flex-col max-w-lg mx-auto border-x border-white/5 pb-20 font-sans">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-4 left-4 right-4 max-w-md mx-auto z-50 px-4 py-3 rounded-2xl shadow-xl text-xs font-bold flex items-center gap-2 border animate-in slide-in-from-top ${
            toast.type === "success"
              ? "bg-emerald-950/90 text-emerald-300 border-emerald-500/30"
              : "bg-red-950/90 text-red-300 border-red-500/30"
          }`}
        >
          {toast.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#0B1E36]/95 backdrop-blur-md border-b border-white/10 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/driver"
            className="p-2 rounded-xl bg-white/5 text-white/70 hover:text-white border border-white/10 transition active:scale-95"
            title="Kembali"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-sky-400 bg-sky-500/10 border border-sky-500/20 px-2 py-0.5 rounded-md">
                #{order.code}
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                {order.status}
              </span>
            </div>
            <p className="text-[11px] text-white/50 mt-0.5">Tugas Antar Kurir Cetak.inc</p>
          </div>
        </div>

        <button
          onClick={fetchTaskDetail}
          className="p-2 rounded-xl bg-white/5 text-white/70 hover:text-white border border-white/10 text-xs active:scale-95"
          title="Refresh"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </header>

      {/* Main Content */}
      <main className="p-4 flex-1 space-y-4">
        {/* Customer & Address Card */}
        <div className="bg-[#0B1E36] border border-white/10 rounded-2xl p-4 space-y-3 shadow-lg">
          <h2 className="text-xs font-bold text-white/40 uppercase tracking-wider flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-emerald-400" /> Informasi Penerima
          </h2>

          <div className="bg-[#071322] border border-white/5 rounded-xl p-3.5 space-y-2 text-xs">
            <div>
              <p className="text-base font-extrabold text-white">{order.customerName}</p>
              <p className="text-white/60 font-mono mt-0.5">{order.customerPhone || "-"}</p>
            </div>

            <div className="pt-2 border-t border-white/5">
              <p className="text-[10px] font-bold text-white/40 uppercase">Alamat Antar:</p>
              <p className="text-white font-medium leading-relaxed mt-0.5">
                {order.address || "Area Kota Padang"}
              </p>
              {order.destNote && (
                <p className="text-[11px] text-amber-300 font-mono mt-1">
                  Patokan: {order.destNote}
                </p>
              )}
            </div>
          </div>

          {/* Quick Action Navigation & WhatsApp */}
          <div className="grid grid-cols-2 gap-2">
            <a
              href={gmapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="py-3 px-3 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/30 text-sky-300 font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition"
            >
              <Navigation className="w-4 h-4 text-sky-400" /> Navigasi Maps
            </a>
            <a
              href={wazeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="py-3 px-3 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/20 text-sky-400 font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition"
            >
              <ExternalLink className="w-4 h-4" /> Buka Waze
            </a>
          </div>

          {waNumber && (
            <a
              href={`https://wa.me/${waNumber}?text=Halo%20kak%20${encodeURIComponent(
                order.customerName
              )},%20saya%20kurir%20Cetak.inc%20sedang%20mengantar%20pesanan%20%23${order.code}.`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 px-4 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 font-bold text-xs flex items-center justify-center gap-2 active:scale-95 transition"
            >
              <MessageCircle className="w-4 h-4 text-emerald-400" /> Hubungi WhatsApp Pelanggan
            </a>
          )}
        </div>

        {/* Items Summary */}
        <div className="bg-[#0B1E36] border border-white/10 rounded-2xl p-4 space-y-3 shadow-lg">
          <h2 className="text-xs font-bold text-white/40 uppercase tracking-wider flex items-center gap-1.5">
            <Package size={14} className="text-amber-400" /> Barang Cetak yang Diantar
          </h2>

          <div className="bg-[#071322] border border-white/5 rounded-xl p-3.5 space-y-2 text-xs">
            {order.items && order.items.length > 0 ? (
              order.items.map((it: any, idx: number) => (
                <div key={idx} className="flex items-start justify-between gap-2 py-1 first:pt-0 last:pb-0">
                  <div>
                    <span className="font-bold text-white">
                      {it.qty}x {it.name}
                    </span>
                    {it.specs && (
                      <p className="text-[11px] text-white/50 font-mono mt-0.5 whitespace-pre-line">
                        {it.specs}
                      </p>
                    )}
                  </div>
                  <span className="text-[11px] font-mono text-emerald-400 font-bold shrink-0">
                    Qty: {it.qty}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-[11px] text-white/40 italic">Paket Cetakan Percetakan BAS Padang</p>
            )}
          </div>
        </div>

        {/* Action Panel Stepper */}
        <div className="bg-[#0B1E36] border border-white/10 rounded-2xl p-4 space-y-3 shadow-xl">
          <p className="text-[10px] font-bold uppercase tracking-wider text-white/40">
            Aksi Progres Pengantaran:
          </p>

          {order.status === "KURIR_MENJEMPUT" && (
            <button
              onClick={() => handleUpdateStatus("DALAM_PERJALANAN")}
              disabled={updating}
              className="w-full py-4 px-4 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-sky-500/25 active:scale-95 transition disabled:opacity-50"
            >
              {updating ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Navigation className="w-5 h-5" />}
              Barang Sudah Diambil • Mulai Jalan Antar
            </button>
          )}

          {order.status === "DALAM_PERJALANAN" && (
            <button
              onClick={() => handleUpdateStatus("TIBA")}
              disabled={updating}
              className="w-full py-4 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 active:scale-95 transition disabled:opacity-50"
            >
              {updating ? <RefreshCw className="w-5 h-5 animate-spin" /> : <MapPin className="w-5 h-5" />}
              Sudah Tiba di Lokasi Alamat Pemesan
            </button>
          )}

          {order.status === "TIBA" && (
            <button
              onClick={() => setShowProofModal(true)}
              disabled={updating}
              className="w-full py-4 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 active:scale-95 transition disabled:opacity-50"
            >
              <Camera className="w-5 h-5" />
              Serah Terima Selesai (Foto Bukti)
            </button>
          )}

          {order.status === "SELESAI" && (
            <div className="w-full py-3 px-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold text-xs flex items-center justify-center gap-2">
              <CheckCircle2 size={16} /> Pesanan Telah Diserahterimakan & Selesai
            </div>
          )}
        </div>
      </main>

      {/* MODAL FOTO BUKTI SERAH TERIMA */}
      {showProofModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0B1E36] border border-white/15 rounded-3xl max-w-sm w-full p-5 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <Camera size={16} className="text-emerald-400" /> Foto Bukti Serah Terima
              </h3>
              <button
                onClick={() => setShowProofModal(false)}
                className="p-1 rounded-lg text-white/50 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-xs text-white/60">
              Ambil atau pilih foto barang pesanan yang diterima oleh pelanggan sebagai arsip resmi.
            </p>

            <form onSubmit={handleProofSubmit} className="space-y-4">
              <div className="relative border-2 border-dashed border-white/20 rounded-2xl p-4 text-center hover:border-emerald-400 transition cursor-pointer">
                {proofPreview ? (
                  <div className="space-y-2">
                    <img
                      src={proofPreview}
                      alt="Bukti Antar"
                      className="w-full h-40 object-cover rounded-xl"
                    />
                    <p className="text-[10px] text-emerald-400 font-bold">Foto siap diunggah</p>
                  </div>
                ) : (
                  <label className="flex flex-col items-center gap-2 cursor-pointer py-4">
                    <Camera className="w-8 h-8 text-white/40" />
                    <span className="text-xs font-bold text-white">Ambil Foto / Galeri</span>
                    <span className="text-[10px] text-white/40">Maks. 15 MB</span>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setProofFile(file);
                          setProofPreview(URL.createObjectURL(file));
                        }
                      }}
                    />
                  </label>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowProofModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={uploadingProof || !proofFile}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/25"
                >
                  {uploadingProof ? <RefreshCw size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
                  Selesaikan Tugas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
