import { z } from "zod";

export const ProductInputSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, "Nama produk minimal 2 karakter"),
  slug: z.string().optional(),
  categoryId: z.string().min(1, "Kategori wajib dipilih"),
  description: z.string().default(""),
  price: z.coerce.number().min(0, "Harga tidak boleh negatif"),
  compareAtPrice: z.coerce.number().optional().nullable(),
  unit: z.string().default("/ pcs"),
  imageUrl: z.string().min(1, "URL gambar wajib diisi"),
  gallery: z.array(z.string()).default([]),
  specs: z.array(z.string()).default([]),
  isBestSeller: z.coerce.boolean().default(false),
  isActive: z.coerce.boolean().default(true),
  rating: z.string().default("5.0"),
  sold: z.string().default("0"),
  sortOrder: z.coerce.number().default(0),
});

export const CategoryInputSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, "Nama kategori minimal 2 karakter"),
  slug: z.string().optional(),
  icon: z.string().optional().nullable(),
  sortOrder: z.coerce.number().default(0),
  isActive: z.coerce.boolean().default(true),
});

export const BannerInputSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, "Judul banner wajib diisi"),
  subtitle: z.string().optional().nullable(),
  imageUrl: z.string().min(1, "URL gambar banner wajib diisi"),
  ctaLabel: z.string().optional().nullable(),
  ctaHref: z.string().optional().nullable(),
  sortOrder: z.coerce.number().default(0),
  isActive: z.coerce.boolean().default(true),
});

export const PortfolioInputSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(2, "Judul portofolio minimal 2 karakter"),
  client: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  imageUrl: z.string().min(1, "URL gambar portofolio wajib diisi"),
  description: z.string().optional().nullable(),
  sortOrder: z.coerce.number().default(0),
  isActive: z.coerce.boolean().default(true),
});

export const PageInputSchema = z.object({
  title: z.string().min(1, "Judul halaman wajib diisi"),
  content: z.union([z.string(), z.record(z.string(), z.any())]),
});

export const OrderInputSchema = z.object({
  customerName: z.string().min(2, "Nama pemesan minimal 2 karakter"),
  customerPhone: z.string().min(8, "Nomor WhatsApp tidak valid"),
  deliveryMethod: z.enum(["kirim", "pickup"]),
  address: z.string().optional().nullable(),
  destLat: z.coerce.number().optional().nullable(),
  destLng: z.coerce.number().optional().nullable(),
  destAddress: z.string().optional().nullable(),
  destNote: z.string().optional().nullable(),
  hubId: z.string().optional().nullable(),
  deliveryFee: z.coerce.number().optional().default(0),
  paymentMethod: z.string().min(1, "Metode pembayaran wajib dipilih"),
  note: z.string().optional().nullable(),
  items: z.array(
    z.object({
      productId: z.string().min(1),
      qty: z.coerce.number().min(1, "Jumlah minimal 1"),
      designNote: z.string().optional().nullable(),
    })
  ).min(1, "Keranjang tidak boleh kosong"),
});

export const LoginInputSchema = z.object({
  username: z.string().min(1, "Username wajib diisi"),
  password: z.string().min(1, "Password wajib diisi"),
});

export type ProductInput = z.infer<typeof ProductInputSchema>;
export type CategoryInput = z.infer<typeof CategoryInputSchema>;
export type BannerInput = z.infer<typeof BannerInputSchema>;
export type PortfolioInput = z.infer<typeof PortfolioInputSchema>;
export type PageInput = z.infer<typeof PageInputSchema>;
export type OrderInput = z.infer<typeof OrderInputSchema>;
export type LoginInput = z.infer<typeof LoginInputSchema>;
