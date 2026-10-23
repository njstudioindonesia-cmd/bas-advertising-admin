"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Lock, User, ArrowRight, ShieldCheck, Bike, ArrowLeft } from "lucide-react";

export default function DriverLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("driver-budi");
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

      router.push("/driver");
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
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20">
            <Bike className="w-3.5 h-3.5" /> Portal Driver
          </span>
        </div>

        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-gradient-to-br from-sky-500 to-blue-700 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-sky-500/20">
            <Bike className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">Driver Cetak.inc</h1>
          <p className="text-xs text-white/60 mt-1">
            Masuk untuk menerima penugasan antar pesanan pelanggan
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
              ID Driver / Nomor HP
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="driver-budi"
                className="w-full bg-[#071322] border border-white/10 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-sky-500 transition"
              />
            </div>
            <p className="text-[11px] text-white/40 mt-1">
              Akun demo: <code className="text-sky-400">driver-budi</code>
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
                className="w-full bg-[#071322] border border-white/10 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-sky-500 transition"
              />
            </div>
            <p className="text-[11px] text-white/40 mt-1">
              Password demo: <code className="text-sky-400">driver123</code>
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-semibold py-3 px-4 rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-sky-500/25 active:scale-[0.98] transition disabled:opacity-60"
          >
            {loading ? "Menghubungkan..." : "Mulai Shift Antar"}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-white/10 text-center">
          <p className="text-[11px] text-white/50 flex items-center justify-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-sky-400" /> Khusus Kurir Resmi Workshop Cetak.inc Padang
          </p>
        </div>
      </div>
    </div>
  );
}
