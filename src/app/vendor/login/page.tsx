"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Lock, User, ArrowRight, ShieldCheck, Printer, ArrowLeft } from "lucide-react";

export default function VendorLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("vendor-pusat");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || "Login gagal. Periksa username dan password Anda.");
        setLoading(false);
        return;
      }

      router.push("/vendor");
      router.refresh();
    } catch {
      setError("Terjadi kesalahan jaringan.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#071322] text-white flex flex-col justify-center items-center px-4 py-8">
      <div className="w-full max-w-md bg-[#0B1E36] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs text-white/60 hover:text-white transition"
          >
            <ArrowLeft className="w-4 h-4" /> Ke Beranda
          </Link>
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Printer className="w-3.5 h-3.5" /> Portal Vendor
          </span>
        </div>

        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-700 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-emerald-500/20">
            <Printer className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">Workshop Percetakan</h1>
          <p className="text-xs text-white/60 mt-1">
            Masuk untuk menerima pesanan produksi cabang workshop Anda
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs text-center font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-white/70 mb-1.5">
              ID / Akun Vendor
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="vendor-pusat / vendor-lubukbuaya"
                className="w-full bg-[#071322] border border-white/10 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-emerald-500 transition"
              />
            </div>
            <p className="text-[11px] text-white/40 mt-1">
              Contoh akun demo: <code className="text-emerald-400">vendor-pusat</code> atau{" "}
              <code className="text-emerald-400">vendor-lubukbuaya</code>
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-white/70 mb-1.5">
              Kata Sandi
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan password"
                className="w-full bg-[#071322] border border-white/10 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-emerald-500 transition"
              />
            </div>
            <p className="text-[11px] text-white/40 mt-1">
              Password demo: <code className="text-emerald-400">vendor123</code>
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold py-3 px-4 rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 active:scale-[0.98] transition disabled:opacity-60"
          >
            {loading ? "Memverifikasi..." : "Masuk ke Antrean Cetak"}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-white/10 text-center">
          <p className="text-[11px] text-white/50 flex items-center justify-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Akses Khusus Mitra Workshop Cetak.inc Padang
          </p>
        </div>
      </div>
    </div>
  );
}
