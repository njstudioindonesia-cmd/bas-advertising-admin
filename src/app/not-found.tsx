import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0B1E36] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-[#112846] border border-white/10 rounded-2xl p-8 text-center shadow-xl">
        <h1 className="text-4xl font-extrabold text-white mb-2">404</h1>
        <p className="text-gray-300 text-sm mb-6">Halaman panel admin yang Anda tuju tidak ditemukan.</p>
        <Link
          href="/"
          className="inline-block px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl transition-all shadow-md"
        >
          Kembali ke Dashboard Admin
        </Link>
      </div>
    </div>
  );
}
