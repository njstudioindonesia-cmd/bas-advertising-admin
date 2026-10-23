import crypto from "node:crypto";
import sharp from "sharp";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const BUCKET_NAME = "assets";

export interface OptimizeOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  folder?: string;
}

export interface OptimizationResult {
  buffer: Buffer;
  contentType: string;
  ext: string;
  originalSize: number;
  optimizedSize: number;
  savingsPercent: number;
  width?: number;
  height?: number;
}

/**
 * Mengoptimalkan buffer gambar secara agresif dan aman:
 * - Mengubah orientasi otomatis berdasarkan EXIF (agar foto kamera HP tidak terbalik)
 * - Meresize resolusi ke batas proporsional maksimum (default 1400x1400)
 * - Mengonversi ke WebP modern (kompresi superior & kualitas tajam)
 * - Menghapus metadata EXIF/GPS untuk privasi dan penghematan byte ekstra
 */
export async function optimizeImageBuffer(
  inputBuffer: Buffer,
  mimeType: string,
  options: OptimizeOptions = {}
): Promise<OptimizationResult> {
  const originalSize = inputBuffer.length;
  const isSvg = mimeType.includes("svg");

  // Jika SVG, pastikan BUKAN untuk folder bukti pembayaran / pengantaran
  if (isSvg) {
    if (options.folder === "payment-proofs" || options.folder === "delivery-proofs") {
      throw new Error("Format SVG dilarang keras untuk bukti transaksi demi keamanan sistem.");
    }
    return {
      buffer: inputBuffer,
      contentType: "image/svg+xml",
      ext: ".svg",
      originalSize,
      optimizedSize: originalSize,
      savingsPercent: 0,
    };
  }

  const maxWidth = options.maxWidth || 1400;
  const maxHeight = options.maxHeight || 1400;
  const quality = options.quality || 82;

  try {
    const image = sharp(inputBuffer);
    const metadata = await image.metadata();

    // Auto rotate berdasarkan sensor orientasi kamera HP, resize tanpa membesarkan gambar kecil
    const pipeline = image
      .rotate()
      .resize(maxWidth, maxHeight, {
        fit: "inside",
        withoutEnlargement: true,
      });

    // Konversi ke WebP kualitas tinggi dengan algoritma effort 4
    const optimizedBuffer = await pipeline
      .webp({
        quality,
        effort: 4,
        smartSubsample: true,
      })
      .toBuffer();

    const optimizedMetadata = await sharp(optimizedBuffer).metadata();
    const optimizedSize = optimizedBuffer.length;
    const savingsPercent = originalSize > 0 
      ? Math.max(0, Math.round(((originalSize - optimizedSize) / originalSize) * 100))
      : 0;

    return {
      buffer: optimizedBuffer,
      contentType: "image/webp",
      ext: ".webp",
      originalSize,
      optimizedSize,
      savingsPercent,
      width: optimizedMetadata.width,
      height: optimizedMetadata.height,
    };
  } catch (err) {
    console.warn("[OPTIMIZE_FALLBACK] Sharp optimization failed, using original buffer:", err);
    let ext = ".jpg";
    if (mimeType.includes("png")) ext = ".png";
    else if (mimeType.includes("webp")) ext = ".webp";
    else if (mimeType.includes("gif")) ext = ".gif";

    return {
      buffer: inputBuffer,
      contentType: mimeType || "image/jpeg",
      ext,
      originalSize,
      optimizedSize: originalSize,
      savingsPercent: 0,
    };
  }
}

/**
 * Mengekstrak path relatif file di bucket Supabase dari Public URL
 * Contoh: https://...supabase.co/storage/v1/object/public/assets/products/123.webp -> products/123.webp
 */
export function getStoragePathFromUrl(publicUrl: string): string | null {
  if (!publicUrl || typeof publicUrl !== "string") return null;

  try {
    const url = new URL(publicUrl);
    const searchPattern = `/storage/v1/object/public/${BUCKET_NAME}/`;
    const idx = url.pathname.indexOf(searchPattern);
    if (idx !== -1) {
      return decodeURIComponent(url.pathname.slice(idx + searchPattern.length));
    }

    // Pattern format URL langsung tanpa domain penuh
    if (publicUrl.includes(`${BUCKET_NAME}/`)) {
      const parts = publicUrl.split(`${BUCKET_NAME}/`);
      if (parts[1]) return decodeURIComponent(parts[1]);
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Menghapus satu file dari Supabase Storage jika merupakan URL Supabase yang valid
 */
export async function deleteStorageFile(urlOrPath: string): Promise<boolean> {
  const path = urlOrPath.startsWith("http") ? getStoragePathFromUrl(urlOrPath) : urlOrPath;
  if (!path) return false;

  try {
    const { error } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .remove([path]);

    if (error) {
      console.warn(`[STORAGE_DELETE_WARN] Gagal menghapus file ${path}:`, error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn(`[STORAGE_DELETE_ERR] Error menghapus file ${path}:`, err);
    return false;
  }
}

/**
 * Menghapus banyak file dari Supabase Storage secara sekaligus (bulk delete)
 */
export async function deleteStorageFiles(urlsOrPaths: string[]): Promise<number> {
  const paths = urlsOrPaths
    .map((item) => (item.startsWith("http") ? getStoragePathFromUrl(item) : item))
    .filter((p): p is string => Boolean(p));

  if (paths.length === 0) return 0;

  try {
    const { data, error } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .remove(paths);

    if (error) {
      console.warn("[STORAGE_BULK_DELETE_WARN] Error bulk remove:", error.message);
      return 0;
    }
    return data ? data.length : paths.length;
  } catch (err) {
    console.warn("[STORAGE_BULK_DELETE_ERR] Gagal bulk delete:", err);
    return 0;
  }
}

/**
 * Mengunggah file gambar yang sudah dioptimasi langsung ke Supabase Storage dengan CDN cache 1 tahun
 */
export async function uploadOptimizedImage(
  fileBuffer: Buffer,
  mimeType: string,
  options: {
    folder?: string;
    customName?: string;
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
  } = {}
) {
  const folder = (options.folder || "products").replace(/[^a-zA-Z0-9_-]/g, "");
  const now = new Date();
  const yearMonth = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, "0")}`;

  // 1. Jalankan kompresi Sharp
  const result = await optimizeImageBuffer(fileBuffer, mimeType, {
    maxWidth: options.maxWidth,
    maxHeight: options.maxHeight,
    quality: options.quality,
    folder,
  });

  // 2. Generate nama file unik terstruktur (folder/tahun/bulan/timestamp-hash.webp)
  const randomHash = crypto.randomBytes(6).toString("hex");
  const fileName = options.customName
    ? `${folder}/${yearMonth}/${options.customName}${result.ext}`
    : `${folder}/${yearMonth}/${Date.now()}-${randomHash}${result.ext}`;

  // 3. Unggah ke Supabase dengan header cacheControl permanen (1 tahun)
  const { data, error } = await supabaseAdmin.storage
    .from(BUCKET_NAME)
    .upload(fileName, result.buffer, {
      contentType: result.contentType,
      cacheControl: "31536000, immutable", // 1 tahun di CDN & browser, cegah pemborosan egress bandwidth
      upsert: true,
    });

  if (error || !data) {
    throw new Error(error?.message || "Gagal mengunggah file ke Supabase Cloud Storage");
  }

  const { data: publicData } = supabaseAdmin.storage
    .from(BUCKET_NAME)
    .getPublicUrl(fileName);

  return {
    url: publicData.publicUrl,
    path: fileName,
    originalSize: result.originalSize,
    optimizedSize: result.optimizedSize,
    savingsPercent: result.savingsPercent,
    contentType: result.contentType,
    width: result.width,
    height: result.height,
  };
}
