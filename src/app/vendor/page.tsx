"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Printer,
  Clock,
  CheckCircle2,
  Package,
  Layers,
  LogOut,
  MapPin,
  RefreshCw,
  ExternalLink,
  AlertCircle,
  FileText,
  ChevronRight,
  Settings,
  Phone,
  Power,
  Sparkles,
} from "lucide-react";

interface VendorUser {
  id: string;
  username: string;
  role: string;
  fullName: string;
  hubId: string | null;
}

export default function VendorDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<VendorUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"incoming" | "production" | "ready">("incoming");

  const [orders, setOrders] = useState<any[]>([]);
  const [counts, setCounts] = useState({ incoming: 0, production: 0, ready: 0, completed: 0 });
  const [hubInfo, setHubInfo] = useState<{ id: string | null; name: string; isOpen?: boolean }>({
    id: null,
    name: "Hub Workshop Cetak.inc",
    isOpen: true,
  });
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchOrders = useCallback(async (showIndicator = false) => {
    if (showIndicator) setRefreshing(true);
    try {
      const res = await fetch("/api/vendor/orders", { cache: "no-store" });
      const data = await res.json();
      if (data.success) {
        setOrders(data.data || []);
        if (data.counts) setCounts(data.counts);
        if (data.hub) setHubInfo(data.hub);
      }
    } catch (err) {
      console.warn("Gagal mengambil data antrean vendor:", err);
    } finally {
      if (showIndicator) setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    async function init() {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        if (!res.ok || !data.authenticated) {
          router.push("/vendor/login");
          return;
        }
        setUser(data.user);
        await fetchOrders();
      } catch {
        router.push("/vendor/login");
      } finally {
        setLoading(false);
      }
    }
    init();

    // Auto-poll antrean tiap 20 detik
    const interval = setInterval(() => {
      fetchOrders();
    }, 20000);

    return () => clearInterval(interval);
  }, [router, fetchOrders]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/vendor/login");
  };

  const handleUpdateStatus = async (orderId: string, targetStatus: string) => {
    setUpdatingOrderId(orderId);
    try {
      const res = await fetch(`/api/vendor/orders/${orderId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetStatus }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(
          targetStatus === "DIPRODUKSI"
            ? "Pesanan diterima & mulai dicetak di mesin!"
            : targetStatus === "SIAP_ANTAR"
            ? "Pesanan selesai diproduksi & siap diantar kurir!"
            : data.message,
          "success"
        );
        fetchOrders();
      } else {
        showToast(data.error || "Gagal memperbarui status pesanan", "error");
      }
    } catch {
      showToast("Terjadi kesalahan jaringan", "error");
    } finally {
      setUpdatingOrderId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#071322] flex items-center justify-center text-white">
        <div className="flex items-center gap-3">
          <RefreshCw className="w-5 h-5 animate-spin text-emerald-400" />
          <span className="text-sm font-medium">Memuat Antrean Cetak Workshop...</span>
        </div>
      </div>
    );
  }

  // Filter pesanan sesuai tab aktif
  const filteredOrders = orders.filter((o) => {
    if (activeTab === "incoming") return ["DIBAYAR", "DITERIMA_VENDOR", "BARU"].includes(o.status);
    if (activeTab === "production") return ["DIPRODUKSI", "DIPROSES"].includes(o.status);
    if (activeTab === "ready") return ["SIAP_ANTAR", "SIAP"].includes(o.status);
    return true;
  });

  return (
    <div className="min-h-screen bg-[#071322] text-white flex flex-col font-sans">
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
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Printer className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-bold tracking-tight">
                  {user?.fullName || "Operator Workshop Cetak.inc"}
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  WORKSHOP BUKA
                </span>
              </div>
              <p className="text-[11px] text-white/60 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-emerald-400 shrink-0" />
                <span className="truncate max-w-[220px] sm:max-w-none">{hubInfo.name}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchOrders(true)}
              title="Refresh Antrean"
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 border border-white/10 transition active:scale-95"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin text-emerald-400" : ""}`} />
            </button>
            <Link
              href="/vendor/profil"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-white/80 border border-white/10 transition active:scale-95"
            >
              <Settings className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Kapasitas Hub</span>
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition active:scale-95"
            >
              <LogOut className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Keluar</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 flex flex-col gap-5">
        {/* Hub Capacity & Kitchen Stats */}
        <div className="grid grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => setActiveTab("incoming")}
            className={`bg-[#0B1E36] border rounded-2xl p-3.5 text-center sm:text-left transition-all ${
              activeTab === "incoming" ? "border-amber-400 ring-2 ring-amber-400/20" : "border-white/10 hover:border-white/20"
            }`}
          >
            <p className="text-[11px] text-white/50 font-medium">Antrean Masuk</p>
            <p className="text-xl sm:text-2xl font-black text-amber-400 mt-1">{counts.incoming}</p>
            <p className="text-[10px] text-white/40 mt-0.5 hidden sm:block">Perlu Diterima & Cetak</p>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("production")}
            className={`bg-[#0B1E36] border rounded-2xl p-3.5 text-center sm:text-left transition-all ${
              activeTab === "production" ? "border-sky-400 ring-2 ring-sky-400/20" : "border-white/10 hover:border-white/20"
            }`}
          >
            <p className="text-[11px] text-white/50 font-medium">Sedang Cetak</p>
            <p className="text-xl sm:text-2xl font-black text-sky-400 mt-1">{counts.production}</p>
            <p className="text-[10px] text-white/40 mt-0.5 hidden sm:block">Operator Mesin Aktif</p>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("ready")}
            className={`bg-[#0B1E36] border rounded-2xl p-3.5 text-center sm:text-left transition-all ${
              activeTab === "ready" ? "border-emerald-400 ring-2 ring-emerald-400/20" : "border-white/10 hover:border-white/20"
            }`}
          >
            <p className="text-[11px] text-white/50 font-medium">Siap Antar</p>
            <p className="text-xl sm:text-2xl font-black text-emerald-400 mt-1">{counts.ready}</p>
            <p className="text-[10px] text-white/40 mt-0.5 hidden sm:block">Menunggu Kurir / Diambil</p>
          </button>
        </div>

        {/* Tab Switcher (Astro / GoFood Kitchen Style) */}
        <div className="flex bg-[#0B1E36] p-1.5 rounded-2xl border border-white/10 gap-1.5">
          <button
            onClick={() => setActiveTab("incoming")}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === "incoming"
                ? "bg-amber-500 text-white shadow-lg shadow-amber-500/25"
                : "text-white/60 hover:text-white"
            }`}
          >
            <Clock className="w-4 h-4" /> Masuk ({counts.incoming})
          </button>
          <button
            onClick={() => setActiveTab("production")}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === "production"
                ? "bg-sky-500 text-white shadow-lg shadow-sky-500/25"
                : "text-white/60 hover:text-white"
            }`}
          >
            <Printer className="w-4 h-4" /> Diproduksi ({counts.production})
          </button>
          <button
            onClick={() => setActiveTab("ready")}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === "ready"
                ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/25"
                : "text-white/60 hover:text-white"
            }`}
          >
            <CheckCircle2 className="w-4 h-4" /> Siap Antar ({counts.ready})
          </button>
        </div>

        {/* Orders Queue Cards List */}
        <div className="space-y-3.5">
          {filteredOrders.length === 0 ? (
            <div className="bg-[#0B1E36] border border-white/10 rounded-3xl p-10 text-center space-y-3">
              <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center mx-auto text-white/40">
                <Printer size={24} />
              </div>
              <h3 className="font-extrabold text-sm text-white/80">Antrean Kosong</h3>
              <p className="text-xs text-white/40 max-w-sm mx-auto">
                {activeTab === "incoming"
                  ? "Tidak ada pesanan baru yang menunggu diproduksi saat ini."
                  : activeTab === "production"
                  ? "Tidak ada pesanan yang sedang dalam proses pencetakan."
                  : "Belum ada pesanan yang siap diantar."}
              </p>
            </div>
          ) : (
            filteredOrders.map((order) => {
              const isUpdating = updatingOrderId === order.id;

              return (
                <div
                  key={order.id}
                  className="bg-[#0B1E36] border border-white/10 rounded-2xl p-4 sm:p-5 flex flex-col gap-3.5 shadow-lg hover:border-white/20 transition"
                >
                  {/* Order Header Meta */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md">
                          #{order.code}
                        </span>
                        <span className="text-[11px] text-white/50">
                          {new Date(order.createdAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB
                        </span>
                      </div>
                      <h3 className="text-sm sm:text-base font-extrabold mt-1 text-white">
                        Pemesan: {order.customerName}
                      </h3>
                      {order.customerPhone && (
                        <p className="text-xs text-white/60 font-mono mt-0.5">{order.customerPhone}</p>
                      )}
                    </div>

                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold border whitespace-nowrap ${
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

                  {/* Items List for Production */}
                  <div className="bg-[#071322] border border-white/5 rounded-xl p-3 space-y-2">
                    <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider block">
                      Spesifikasi Cetak ({order.items?.length || 0} Item):
                    </span>
                    <div className="divide-y divide-white/5">
                      {order.items?.map((it: any, idx: number) => (
                        <div key={idx} className="py-2 first:pt-0 last:pb-0 text-xs">
                          <div className="flex items-baseline justify-between gap-2">
                            <span className="font-bold text-white">
                              {it.qty}x {it.name}
                            </span>
                            <span className="font-mono text-[11px] text-white/50 shrink-0">
                              Qty: {it.qty} pcs
                            </span>
                          </div>
                          {it.specs && (
                            <p className="text-[11px] text-amber-300/80 mt-0.5 font-medium whitespace-pre-line">
                              🔧 {it.specs}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Delivery Info */}
                  <div className="bg-[#071322] border border-white/5 rounded-xl p-3 text-xs text-white/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <p className="text-[10px] text-white/40 uppercase font-bold">
                        {order.deliveryMethod === "kirim" ? "Pengantaran Kurir" : "Ambil Sendiri di Workshop"}
                      </p>
                      <p className="font-medium text-white truncate max-w-sm mt-0.5">
                        {order.address || "Workshop Percetakan"}
                      </p>
                      {order.destNote && (
                        <p className="text-[10px] text-white/50 italic mt-0.5">Patokan: {order.destNote}</p>
                      )}
                    </div>
                    <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20 self-start sm:self-auto">
                      {order.deliveryMethod === "kirim" ? "Siapkan Packaging Kurir" : "Packing Standar Toko"}
                    </span>
                  </div>

                  {/* Fast Action Buttons */}
                  <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-white/5">
                    {/* Primary Status Transitions */}
                    {["DIBAYAR", "DITERIMA_VENDOR", "BARU"].includes(order.status) && (
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(order.id, "DIPRODUKSI")}
                        disabled={isUpdating}
                        className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-bold py-2.5 px-4 rounded-xl text-xs shadow-md shadow-amber-500/20 active:scale-95 transition inline-flex items-center justify-center gap-1.5 disabled:opacity-50"
                      >
                        {isUpdating ? <RefreshCw size={13} className="animate-spin" /> : <Printer size={14} />}
                        Terima & Mulai Cetak
                      </button>
                    )}

                    {["DIPRODUKSI", "DIPROSES"].includes(order.status) && (
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(order.id, "SIAP_ANTAR")}
                        disabled={isUpdating}
                        className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2.5 px-4 rounded-xl text-xs shadow-md shadow-emerald-500/20 active:scale-95 transition inline-flex items-center justify-center gap-1.5 disabled:opacity-50"
                      >
                        {isUpdating ? <RefreshCw size={13} className="animate-spin" /> : <CheckCircle2 size={14} />}
                        Selesai Cetak & Siap Antar
                      </button>
                    )}

                    {["SIAP_ANTAR", "SIAP"].includes(order.status) && (
                      <div className="flex-1 py-2 px-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs font-bold text-emerald-400 flex items-center justify-center gap-1.5">
                        <CheckCircle2 size={14} /> Siap Dipickup Kurir / Diambil Pelanggan
                      </div>
                    )}

                    {/* Secondary Actions */}
                    <a
                      href={`/invoice/${order.code}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 border border-white/10 text-xs font-bold inline-flex items-center gap-1.5 transition active:scale-95"
                      title="Cetak Surat Perintah Kerja (SPK)"
                    >
                      <FileText size={13} /> Cetak SPK
                    </a>

                    <Link
                      href={`/vendor/pesanan/${order.id}`}
                      className="px-3 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 border border-white/10 text-xs font-bold inline-flex items-center gap-1 transition active:scale-95"
                    >
                      Rincian <ChevronRight size={13} />
                    </Link>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
}
