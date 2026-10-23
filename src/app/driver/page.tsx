"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Bike,
  Navigation,
  Phone,
  MessageCircle,
  MapPin,
  CheckCircle2,
  Clock,
  ShieldCheck,
  LogOut,
  Power,
  RefreshCw,
  Camera,
  ExternalLink,
  Upload,
  History,
  AlertCircle,
  ChevronRight,
  X,
  Package,
} from "lucide-react";

interface DriverUser {
  id: string;
  username: string;
  role: string;
  fullName: string;
  hubId: string | null;
}

interface DeliveryTaskItem {
  id: string;
  code: string;
  customerName: string;
  customerPhone?: string;
  address: string;
  destLat?: number;
  destLng?: number;
  destNote?: string;
  subtotal: number;
  status: string;
  hubId?: string;
  items?: any[];
  createdAt: string;
}

export default function DriverDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<DriverUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [wakeLockActive, setWakeLockActive] = useState(false);
  const [activeTab, setActiveTab] = useState<"tasks" | "history">("tasks");

  const [activeTask, setActiveTask] = useState<DeliveryTaskItem | null>(null);
  const [availableTasks, setAvailableTasks] = useState<DeliveryTaskItem[]>([]);
  const [historyList, setHistoryList] = useState<any[]>([]);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Modal Bukti Pengantaran (Dropoff Proof)
  const [showProofModal, setShowProofModal] = useState(false);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [uploadingProof, setUploadingProof] = useState(false);

  // GPS Tracking Watcher
  const lastSentPosRef = useRef<{ lat: number; lng: number; time: number } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchTasks = useCallback(async (showIndicator = false) => {
    if (showIndicator) setRefreshing(true);
    try {
      const res = await fetch("/api/driver/tasks", { cache: "no-store" });
      const data = await res.json();
      if (data.success) {
        setActiveTask(data.data.activeTask || null);
        setAvailableTasks(data.data.availableTasks || []);
        setIsOnline(data.data.isOnline ?? true);
      }
    } catch {
      console.warn("Gagal memuat tugas driver");
    } finally {
      if (showIndicator) setRefreshing(false);
    }
  }, []);

  const fetchHistory = useCallback(async () => {
    try {
      const res = await fetch("/api/driver/history", { cache: "no-store" });
      const data = await res.json();
      if (data.success) {
        setHistoryList(data.data || []);
      }
    } catch {}
  }, []);

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        if (!res.ok || !data.authenticated) {
          router.push("/driver/login");
          return;
        }
        setUser(data.user);
        await fetchTasks();
      } catch {
        router.push("/driver/login");
      } finally {
        setLoading(false);
      }
    }
    checkAuth();

    // Auto-polling antrean tugas setiap 15 detik
    const pollInterval = setInterval(() => {
      fetchTasks();
    }, 15000);

    return () => clearInterval(pollInterval);
  }, [router, fetchTasks]);

  // Screen Wake Lock API agar layar smartphone kurir tetap menyala di stang motor
  useEffect(() => {
    let wakeLock: any = null;
    async function requestWakeLock() {
      if (typeof window !== "undefined" && "wakeLock" in navigator && isOnline) {
        try {
          wakeLock = await (navigator as any).wakeLock.request("screen");
          setWakeLockActive(true);
        } catch {
          setWakeLockActive(false);
        }
      }
    }
    requestWakeLock();

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && isOnline) {
        requestWakeLock();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (wakeLock) {
        wakeLock.release().catch(() => {});
      }
    };
  }, [isOnline]);

  // Live GPS PUSH Beacons (Kirim koordinat tiap 10 detik saat mengantar)
  useEffect(() => {
    if (!isOnline || !activeTask || activeTask.status !== "DALAM_PERJALANAN") {
      return;
    }

    if (typeof window === "undefined" || !("geolocation" in navigator)) {
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      async (pos) => {
        const { latitude, longitude, heading, speed } = pos.coords;
        const now = Date.now();

        // Throttle: abaikan jika kurang dari 10 detik dan perpindahan kurang dari ~15 meter
        if (lastSentPosRef.current) {
          const timeDiff = now - lastSentPosRef.current.time;
          const latDiff = Math.abs(latitude - lastSentPosRef.current.lat);
          const lngDiff = Math.abs(longitude - lastSentPosRef.current.lng);
          const approxDistM = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff) * 111000;

          if (timeDiff < 10000 && approxDistM < 15) {
            return;
          }
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
              orderId: activeTask.id,
            }),
          });
        } catch {}
      },
      (err) => {
        console.warn("GPS tracking warning:", err.message);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000,
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [isOnline, activeTask]);

  const handleToggleOnline = async () => {
    const nextState = !isOnline;
    setIsOnline(nextState);
    try {
      await fetch("/api/driver/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isOnline: nextState }),
      });
      showToast(nextState ? "Status: Online & Siap Antar" : "Status: Istirahat (Offline)", "success");
    } catch {
      showToast("Gagal memperbarui status shift", "error");
    }
  };

  const handleClaimTask = async (orderId: string) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/driver/tasks/${orderId}/claim`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (data.success) {
        showToast("Tugas berhasil diambil! Silakan jemput cetakan di workshop.", "success");
        fetchTasks(true);
      } else {
        showToast(data.error || "Gagal mengambil tugas", "error");
      }
    } catch {
      showToast("Terjadi kesalahan jaringan", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateStatus = async (targetStatus: string, proofUrl?: string) => {
    if (!activeTask) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/driver/tasks/${activeTask.id}/status`, {
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
            ? "Mulai pengantaran! Live tracking GPS aktif."
            : targetStatus === "TIBA"
            ? "Tiba di lokasi pelanggan!"
            : targetStatus === "SELESAI"
            ? "Pesanan berhasil diserahterimakan! Selesai."
            : data.message,
          "success"
        );
        setShowProofModal(false);
        setProofFile(null);
        setProofPreview(null);
        fetchTasks(true);
      } else {
        showToast(data.error || "Gagal memperbarui status", "error");
      }
    } catch {
      showToast("Terjadi gangguan jaringan", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleProofSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proofFile) {
      showToast("Harap pilih atau ambil foto bukti serah terima", "error");
      return;
    }

    setUploadingProof(true);
    try {
      const fd = new FormData();
      fd.append("file", proofFile);
      fd.append("folder", "delivery-proofs");

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: fd,
      });
      const uploadData = await uploadRes.json();

      if (!uploadRes.ok || !uploadData.success) {
        showToast(uploadData.error || "Gagal mengunggah foto bukti", "error");
        setUploadingProof(false);
        return;
      }

      await handleUpdateStatus("SELESAI", uploadData.url);
    } catch {
      showToast("Terjadi gangguan saat mengunggah foto", "error");
    } finally {
      setUploadingProof(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/driver/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#071322] flex items-center justify-center text-white">
        <div className="flex items-center gap-3">
          <RefreshCw className="w-5 h-5 animate-spin text-sky-400" />
          <span className="text-sm font-medium">Memuat Portal Driver PWA...</span>
        </div>
      </div>
    );
  }

  const destCoords = `${activeTask?.destLat || -0.9242},${activeTask?.destLng || 100.3626}`;
  const gmapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${destCoords}`;
  const wazeUrl = `https://waze.com/ul?ll=${destCoords}&navigate=yes`;
  const waNumber = activeTask?.customerPhone
    ? activeTask.customerPhone.replace(/[^0-9]/g, "").replace(/^0/, "62")
    : null;

  return (
    <div className="min-h-screen bg-[#071322] text-white flex flex-col max-w-lg mx-auto border-x border-white/5 pb-24 font-sans">
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

      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-[#0B1E36]/95 backdrop-blur-md border-b border-white/10 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-blue-700 flex items-center justify-center shadow-md shadow-sky-500/20">
            <Bike className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight">{user?.fullName || "Kurir Cetak.inc"}</h1>
            <p className="text-[11px] text-white/60">Kurir Motor Padang • BA 4821 QA</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchTasks(true)}
            title="Refresh Antrean"
            className="p-2 rounded-xl bg-white/5 text-white/70 hover:text-white border border-white/10 text-xs active:scale-95 transition"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin text-sky-400" : ""}`} />
          </button>
          <button
            onClick={handleLogout}
            className="p-2 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 text-xs active:scale-95 transition"
            title="Keluar"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Online / Offline Shift Status Toggle */}
      <div className="p-4">
        <div
          className={`rounded-2xl p-4 border transition flex items-center justify-between shadow-lg ${
            isOnline
              ? "bg-gradient-to-r from-emerald-950/40 to-[#0B1E36] border-emerald-500/30 text-white"
              : "bg-[#0B1E36] border-white/10 text-white/60"
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-3.5 h-3.5 rounded-full ${
                isOnline ? "bg-emerald-400 animate-pulse ring-4 ring-emerald-500/20" : "bg-white/30"
              }`}
            />
            <div>
              <p className="text-xs font-bold">
                {isOnline ? "STATUS: AKTIF & SIAP ANTAR" : "STATUS: ISTIRAHAT / OFFLINE"}
              </p>
              <p className="text-[11px] text-white/50">
                {isOnline
                  ? wakeLockActive
                    ? "Layar menyala otomatis (Wake Lock ON)"
                    : "Menerima pesanan pengantaran"
                  : "Nyalakan tombol untuk menerima pesanan"}
              </p>
            </div>
          </div>

          <button
            onClick={handleToggleOnline}
            className={`w-12 h-12 rounded-xl flex items-center justify-center active:scale-90 transition ${
              isOnline
                ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30"
                : "bg-white/10 text-white/40"
            }`}
          >
            <Power className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Tab Switcher: Tugas Aktif vs Riwayat */}
      <div className="px-4 mb-3">
        <div className="flex bg-[#0B1E36] p-1 rounded-xl border border-white/10 gap-1">
          <button
            onClick={() => setActiveTab("tasks")}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
              activeTab === "tasks" ? "bg-sky-500 text-white shadow-md" : "text-white/60 hover:text-white"
            }`}
          >
            Tugas Pengantaran {activeTask ? "(1)" : ""}
          </button>
          <button
            onClick={() => {
              setActiveTab("history");
              fetchHistory();
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
              activeTab === "history" ? "bg-sky-500 text-white shadow-md" : "text-white/60 hover:text-white"
            }`}
          >
            Riwayat Selesai
          </button>
        </div>
      </div>

      {/* Main Tab Content */}
      <main className="px-4 flex-1 flex flex-col gap-4">
        {activeTab === "tasks" ? (
          <>
            {/* 1. TUGAS AKTIF DRIVER */}
            {activeTask ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" /> Tugas Sedang Berjalan
                  </h2>
                  <span className="text-[11px] font-mono text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20">
                    Status: {activeTask.status}
                  </span>
                </div>

                <div className="bg-[#0B1E36] border border-sky-500/30 rounded-2xl p-4 flex flex-col gap-3.5 shadow-xl">
                  {/* Task Header */}
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-sky-400 bg-sky-500/10 border border-sky-500/20 px-2 py-0.5 rounded-md">
                          #{activeTask.code}
                        </span>
                        <span className="text-[11px] text-white/50">Kurir Instan Padang</span>
                      </div>
                      <h3 className="text-sm font-extrabold text-white mt-1">
                        Pemesan: {activeTask.customerName}
                      </h3>
                      {activeTask.customerPhone && (
                        <p className="text-xs text-white/60 font-mono">{activeTask.customerPhone}</p>
                      )}
                    </div>
                  </div>

                  {/* Rute Jemput Hub -> Antar Pelanggan */}
                  <div className="bg-[#071322] border border-white/5 rounded-xl p-3 space-y-2.5 text-xs">
                    <div className="flex items-start gap-2.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 mt-1 shrink-0" />
                      <div>
                        <p className="text-[10px] text-white/40 uppercase font-bold">1. Titik Workshop Hub</p>
                        <p className="font-bold text-white">Workshop BAS Advertising Padang</p>
                        <p className="text-[11px] text-white/50">Ambil barang cetakan di meja dispatch</p>
                      </div>
                    </div>

                    <div className="w-px h-3 bg-white/20 ml-1.5" />

                    <div className="flex items-start gap-2.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-400 mt-1 shrink-0" />
                      <div>
                        <p className="text-[10px] text-white/40 uppercase font-bold">2. Alamat Antar Pelanggan</p>
                        <p className="font-bold text-white leading-tight">{activeTask.address}</p>
                        {activeTask.destNote && (
                          <p className="text-[11px] text-amber-300 font-mono mt-0.5">
                            Patokan: {activeTask.destNote}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Navigation Deep Links */}
                  <div className="grid grid-cols-2 gap-2">
                    <a
                      href={gmapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-2.5 px-3 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/30 text-sky-300 font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition"
                    >
                      <Navigation className="w-4 h-4 text-sky-400" /> Google Maps
                    </a>
                    <a
                      href={wazeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-2.5 px-3 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/20 text-sky-400 font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition"
                    >
                      <ExternalLink className="w-4 h-4" /> Buka Waze
                    </a>
                  </div>

                  {/* Customer Quick WhatsApp */}
                  {waNumber && (
                    <a
                      href={`https://wa.me/${waNumber}?text=Halo%20kak%20${encodeURIComponent(
                        activeTask.customerName
                      )},%20saya%20kurir%20Cetak.inc%20sedang%20mengantar%20pesanan%20%23${activeTask.code}.`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-2.5 px-3 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition"
                    >
                      <MessageCircle className="w-4 h-4 text-emerald-400" /> Hubungi WhatsApp Pelanggan
                    </a>
                  )}

                  {/* STEPPER ACTION BUTTON */}
                  <div className="pt-1">
                    {activeTask.status === "KURIR_MENJEMPUT" && (
                      <button
                        onClick={() => handleUpdateStatus("DALAM_PERJALANAN")}
                        disabled={actionLoading}
                        className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-sky-500/25 active:scale-95 transition disabled:opacity-50"
                      >
                        {actionLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4" />}
                        Mulai Jalan Mengantar (Aktifkan GPS)
                      </button>
                    )}

                    {activeTask.status === "DALAM_PERJALANAN" && (
                      <button
                        onClick={() => handleUpdateStatus("TIBA")}
                        disabled={actionLoading}
                        className="w-full py-3.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 active:scale-95 transition disabled:opacity-50"
                      >
                        {actionLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
                        Sudah Tiba di Alamat Pelanggan
                      </button>
                    )}

                    {activeTask.status === "TIBA" && (
                      <button
                        onClick={() => setShowProofModal(true)}
                        disabled={actionLoading}
                        className="w-full py-3.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 active:scale-95 transition disabled:opacity-50"
                      >
                        <Camera className="w-4 h-4" />
                        Serah Terima Selesai (Foto Bukti)
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ) : null}

            {/* 2. DAFTAR PESANAN SIAP ANTAR DI WORKSHOP */}
            <div className="space-y-2 mt-2">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-bold text-white/70 uppercase tracking-wider">
                  Pesanan Siap Diantar ({availableTasks.length})
                </h2>
                <span className="text-[11px] text-white/40">Menunggu Kurir</span>
              </div>

              {availableTasks.length === 0 ? (
                <div className="bg-[#0B1E36] border border-white/10 rounded-2xl p-8 text-center space-y-2">
                  <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center mx-auto text-white/40">
                    <Bike size={20} />
                  </div>
                  <p className="text-xs font-bold text-white/80">Belum Ada Antrean Pengantaran</p>
                  <p className="text-[11px] text-white/40">
                    Semua pesanan cetak telah diantar atau masih dalam tahap mesin workshop.
                  </p>
                </div>
              ) : (
                availableTasks.map((task) => (
                  <div
                    key={task.id}
                    className="bg-[#0B1E36] border border-white/10 rounded-2xl p-4 flex flex-col gap-3 shadow-md hover:border-white/20 transition"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="font-mono text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">
                          #{task.code}
                        </span>
                        <h4 className="text-sm font-extrabold text-white mt-1">
                          {task.customerName}
                        </h4>
                        <p className="text-xs text-white/60 leading-relaxed mt-0.5">{task.address}</p>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        SIAP ANTAR
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-white/5">
                      <span className="text-xs font-mono font-bold text-white">
                        Rp {Math.round(task.subtotal).toLocaleString("id-ID")}
                      </span>

                      <button
                        onClick={() => handleClaimTask(task.id)}
                        disabled={actionLoading || !!activeTask}
                        className="py-2 px-4 rounded-xl bg-sky-500 hover:bg-sky-600 disabled:opacity-40 text-white font-bold text-xs active:scale-95 transition inline-flex items-center gap-1.5 shadow-md shadow-sky-500/20"
                      >
                        <Bike size={13} /> Ambil Tugas Antar
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        ) : (
          /* TAB RIWAYAT PENGANTARAN */
          <div className="space-y-2">
            <h2 className="text-xs font-bold text-white/70 uppercase tracking-wider">
              Riwayat Pengantaran Selesai
            </h2>

            {historyList.length === 0 ? (
              <div className="bg-[#0B1E36] border border-white/10 rounded-2xl p-8 text-center space-y-2">
                <History className="w-10 h-10 text-white/30 mx-auto" />
                <p className="text-xs font-bold text-white/80">Belum Ada Riwayat Selesai</p>
                <p className="text-[11px] text-white/40">
                  Daftar pengantaran yang telah Anda selesaikan akan tercatat di sini.
                </p>
              </div>
            ) : (
              historyList.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-[#0B1E36] border border-white/10 rounded-2xl p-3.5 flex items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-emerald-400">#{item.code}</span>
                      <span className="text-[10px] text-white/40">
                        {new Date(item.completedAt).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                    </div>
                    <p className="font-bold text-white mt-0.5">{item.customerName}</p>
                    <p className="text-[11px] text-white/50 truncate max-w-[200px]">{item.address}</p>
                  </div>

                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                    Terkirim ✓
                  </span>
                </div>
              ))
            )}
          </div>
        )}
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
