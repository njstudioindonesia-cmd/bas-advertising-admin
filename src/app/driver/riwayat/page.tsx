"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, History, CheckCircle2, RefreshCw, Bike, Calendar, MapPin } from "lucide-react";

export default function DriverHistoryPage() {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadHistory() {
      try {
        const res = await fetch("/api/driver/history", { cache: "no-store" });
        const data = await res.json();
        if (data.success) {
          setHistory(data.data || []);
        }
      } catch {
      } finally {
        setLoading(false);
      }
    }
    loadHistory();
  }, []);

  return (
    <div className="min-h-screen bg-[#071322] text-white flex flex-col max-w-lg mx-auto border-x border-white/5 pb-20 font-sans">
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
            <h1 className="text-sm font-bold tracking-tight">Riwayat Pengantaran</h1>
            <p className="text-[11px] text-white/50">Daftar tugas kurir yang telah selesai</p>
          </div>
        </div>

        <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <CheckCircle2 size={12} /> {history.length} Terkirim
        </span>
      </header>

      <main className="p-4 flex-1 space-y-3">
        {loading ? (
          <div className="p-12 text-center text-xs text-white/50 flex items-center justify-center gap-2">
            <RefreshCw size={14} className="animate-spin text-sky-400" />
            <span>Memuat arsip riwayat...</span>
          </div>
        ) : history.length === 0 ? (
          <div className="bg-[#0B1E36] border border-white/10 rounded-2xl p-8 text-center space-y-2">
            <History className="w-10 h-10 text-white/30 mx-auto" />
            <p className="text-xs font-bold text-white/80">Belum Ada Pengantaran Selesai</p>
            <p className="text-[11px] text-white/40">
              Pengantaran yang Anda selesaikan akan otomatis tercatat sebagai riwayat kerja.
            </p>
          </div>
        ) : (
          history.map((it, idx) => (
            <div
              key={idx}
              className="bg-[#0B1E36] border border-white/10 rounded-2xl p-4 space-y-2 shadow-md hover:border-white/20 transition"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-mono text-xs font-bold text-sky-400">#{it.code}</span>
                  <h3 className="text-sm font-bold text-white mt-0.5">{it.customerName}</h3>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  SELESAI ✓
                </span>
              </div>

              <p className="text-xs text-white/70 flex items-start gap-1.5">
                <MapPin size={13} className="text-white/40 shrink-0 mt-0.5" />
                <span>{it.address}</span>
              </p>

              <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-white/50 font-mono">
                <span className="flex items-center gap-1">
                  <Calendar size={12} />
                  {new Date(it.completedAt).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
                <span className="text-emerald-400 font-bold">
                  Ongkir: Rp {Math.round(it.deliveryFee || 12000).toLocaleString("id-ID")}
                </span>
              </div>
            </div>
          ))
        )}
      </main>
    </div>
  );
}
