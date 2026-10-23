"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  MapPin,
  Phone,
  Power,
  Sliders,
  Save,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Clock,
  MessageSquare,
  ShieldCheck,
  Layers,
} from "lucide-react";

interface HubProfile {
  id: string;
  name: string;
  address: string;
  phone?: string;
  whatsapp?: string;
  latitude?: number;
  longitude?: number;
  dailyCapacity?: number;
  isOpen: boolean;
  isActive: boolean;
  notes?: string;
}

export default function VendorProfilePage() {
  const router = useRouter();
  const [hub, setHub] = useState<HubProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Form states
  const [isOpen, setIsOpen] = useState(true);
  const [dailyCapacity, setDailyCapacity] = useState<number>(50);
  const [notes, setNotes] = useState("");

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch("/api/vendor/profile", { cache: "no-store" });
      const data = await res.json();
      if (data.success && data.data) {
        setHub(data.data);
        setIsOpen(data.data.isOpen ?? true);
        setDailyCapacity(data.data.dailyCapacity ?? 50);
        setNotes(data.data.notes ?? "");
      } else {
        showToast(data.error || "Gagal memuat profil hub workshop", "error");
      }
    } catch {
      showToast("Terjadi gangguan jaringan saat memuat data", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/vendor/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isOpen,
          dailyCapacity: Number(dailyCapacity),
          notes,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || "Profil operasional berhasil disimpan!", "success");
        if (data.data) {
          setHub(data.data);
        }
      } else {
        showToast(data.error || "Gagal menyimpan perubahan", "error");
      }
    } catch {
      showToast("Terjadi kesalahan jaringan saat menyimpan", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#071322] flex items-center justify-center text-white">
        <div className="flex items-center gap-3">
          <RefreshCw className="w-5 h-5 animate-spin text-emerald-400" />
          <span className="text-sm font-medium">Memuat Pengaturan Workshop...</span>
        </div>
      </div>
    );
  }

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

      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#0B1E36]/90 backdrop-blur-md border-b border-white/10 px-4 py-3 sm:px-6">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/vendor"
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 border border-white/10 transition active:scale-95"
              title="Kembali ke Dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="text-sm sm:text-base font-bold tracking-tight">
                Pengaturan Workshop Cabang
              </h1>
              <p className="text-[11px] text-white/50">{hub?.name || "Titik Hub Cetak.inc"}</p>
            </div>
          </div>

          <span
            className={`px-3 py-1 rounded-full text-xs font-bold border ${
              isOpen
                ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                : "bg-red-500/20 text-red-400 border-red-500/30"
            }`}
          >
            {isOpen ? "CABANG BUKA" : "CABANG TUTUP"}
          </span>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 max-w-3xl w-full mx-auto p-4 sm:p-6 space-y-5">
        {/* Hub Static Identity Card */}
        <div className="bg-[#0B1E36] border border-white/10 rounded-2xl p-4 sm:p-5 space-y-3">
          <h2 className="text-xs font-bold text-white/40 uppercase tracking-wider flex items-center gap-1.5">
            <Building2 size={14} className="text-emerald-400" /> Identitas Titik Workshop
          </h2>

          <div className="bg-[#071322] border border-white/5 rounded-xl p-4 space-y-2">
            <h3 className="text-base font-extrabold text-white">{hub?.name}</h3>
            <p className="text-xs text-white/70 flex items-start gap-1.5">
              <MapPin size={13} className="text-emerald-400 shrink-0 mt-0.5" />
              <span>{hub?.address}</span>
            </p>
            {hub?.phone && (
              <p className="text-xs text-white/60 flex items-center gap-1.5 font-mono">
                <Phone size={13} className="text-white/40" />
                <span>{hub.phone}</span>
                {hub.whatsapp && (
                  <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                    WA Aktif
                  </span>
                )}
              </p>
            )}
            {hub?.latitude && hub?.longitude && (
              <p className="text-[11px] font-mono text-white/40">
                Koordinat GPS: {hub.latitude.toFixed(6)}, {hub.longitude.toFixed(6)}
              </p>
            )}
          </div>
        </div>

        {/* Operational Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="bg-[#0B1E36] border border-white/10 rounded-2xl p-4 sm:p-5 space-y-4">
            <h2 className="text-xs font-bold text-white/40 uppercase tracking-wider flex items-center gap-1.5">
              <Sliders size={14} className="text-amber-400" /> Kontrol Operasional & Kapasitas
            </h2>

            {/* Toggle Status Buka / Tutup */}
            <div className="bg-[#071322] border border-white/5 rounded-xl p-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-white">Status Workshop Cabang</p>
                <p className="text-xs text-white/50 mt-0.5">
                  Jika ditutup, pesanan otomatis dialihkan ke Hub Pusat atau antrean dihentikan.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`px-4 py-2 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 active:scale-95 ${
                  isOpen
                    ? "bg-emerald-500 text-white border-emerald-400 shadow-lg shadow-emerald-500/20"
                    : "bg-red-500/20 text-red-400 border-red-500/30"
                }`}
              >
                <Power size={13} />
                {isOpen ? "Cabang Buka" : "Cabang Tutup"}
              </button>
            </div>

            {/* Daily Capacity */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-white/80 block">
                Kapasitas Pesanan Harian (Slot Mesin):
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="5"
                  max="500"
                  value={dailyCapacity}
                  onChange={(e) => setDailyCapacity(Number(e.target.value))}
                  className="w-full bg-[#071322] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-400 transition"
                  placeholder="Contoh: 50"
                  required
                />
                <span className="absolute right-4 top-2.5 text-xs text-white/40 font-semibold pointer-events-none">
                  antrean / hari
                </span>
              </div>
              <p className="text-[11px] text-white/40">
                Sistem auto-routing akan mengecek kapasitas ini sebelum mengalokasikan pesanan ke hub Anda.
              </p>
            </div>

            {/* Operational Notes / Memo */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-white/80 block">
                Catatan Operasional / Pengumuman Mesin:
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-[#071322] border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-emerald-400 transition resize-none"
                placeholder="Contoh: Mesin Outdoor Banner Roland beroperasi penuh. Mesin Laser A3+ sedang maintenance s.d jam 13:00."
              />
              <p className="text-[11px] text-white/40">
                Catatan ini terlihat oleh tim Dispatch / Admin Urang Dalam BAS untuk koordinasi cetak.
              </p>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-lg shadow-emerald-500/25 transition active:scale-95 inline-flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {saving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
              Simpan Pengaturan Workshop
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
