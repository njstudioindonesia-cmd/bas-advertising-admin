import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/guard";
import { uploadOptimizedImage } from "@/lib/storage-helper";

// Format raster bitmap murni untuk folder publik (Anti-XSS: SVG dilarang keras bagi publik)
const RASTER_SAFE_MIMES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
];

// Admin diizinkan mengunggah SVG untuk logo atau banner
const ADMIN_ALLOWED_MIMES = [
  ...RASTER_SAFE_MIMES,
  "image/gif",
  "image/svg+xml",
];

// Izinkan hingga 15 MB foto mentah dari kamera HP modern karena Sharp akan langsung memampatkannya
const MAX_FILE_SIZE = 15 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    const url = new URL(request.url);
    const queryFolder = url.searchParams.get("folder");

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const formFolder = formData.get("folder") as string | null;

    const targetFolder = formFolder || queryFolder || "products";
    const isPublicUpload = targetFolder === "payment-proofs" || targetFolder === "delivery-proofs";

    // 1. Verifikasi hak akses admin jika bukan folder publik transaksi
    if (!isPublicUpload) {
      const auth = await requireAdmin(request);
      if (!auth.authorized) return auth.response!;
    }

    if (!file) {
      return NextResponse.json({ success: false, error: "File gambar tidak ditemukan" }, { status: 400 });
    }

    // 2. Proteksi Stored XSS: Cegah unggahan SVG pada bukti pembayaran / pengantaran
    const allowedList = isPublicUpload ? RASTER_SAFE_MIMES : ADMIN_ALLOWED_MIMES;
    if (!allowedList.includes(file.type.toLowerCase())) {
      return NextResponse.json(
        {
          success: false,
          error: isPublicUpload
            ? "Format file tidak diizinkan. Bukti transaksi wajib berupa foto (JPG, PNG, WEBP)."
            : "Format gambar tidak didukung. Harap gunakan JPEG, PNG, WEBP, atau GIF.",
        },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: "Ukuran file terlalu besar. Maksimal ukuran gambar mentah adalah 15 MB." },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Konfigurasi batas dimensi berdasarkan jenis folder
    let maxWidth = 1400;
    let maxHeight = 1400;
    let quality = 82;

    if (targetFolder === "banners") {
      maxWidth = 1920;
      maxHeight = 1080;
      quality = 85;
    } else if (targetFolder === "categories" || targetFolder === "icons") {
      maxWidth = 600;
      maxHeight = 600;
      quality = 85;
    }

    // Jalankan optimasi Sharp & upload ke Supabase Storage (Cache 1 Tahun)
    try {
      const uploadResult = await uploadOptimizedImage(buffer, file.type, {
        folder: targetFolder,
        maxWidth,
        maxHeight,
        quality,
      });

      return NextResponse.json({
        success: true,
        message: `Gambar berhasil dioptimasi & diunggah (Hemat ${uploadResult.savingsPercent}%)`,
        url: uploadResult.url,
        path: uploadResult.path,
        originalSize: uploadResult.originalSize,
        optimizedSize: uploadResult.optimizedSize,
        savingsPercent: uploadResult.savingsPercent,
        format: uploadResult.contentType,
        dimensions: {
          width: uploadResult.width,
          height: uploadResult.height,
        },
      });
    } catch (storageErr: any) {
      console.error("[STORAGE_UPLOAD_ERR] Gagal upload ke Supabase Storage:", storageErr);

      // Fallback darurat jika koneksi bucket bermasalah
      return NextResponse.json(
        {
          success: false,
          error: `Gagal mengunggah ke Cloud Storage: ${storageErr.message || "Koneksi terputus"}`,
        },
        { status: 502 }
      );
    }
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Gagal memproses gambar" },
      { status: 500 }
    );
  }
}
