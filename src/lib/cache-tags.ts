import { revalidateTag, revalidatePath } from "next/cache";

export const CACHE_TAGS = {
  products: "products",
  categories: "categories",
  banners: "banners",
  settings: "settings",
  portfolio: "portfolio",
  pages: "pages",
  orders: "orders",
} as const;

export function revalidateEntity(tag: keyof typeof CACHE_TAGS, paths: string[] = ["/", "/produk", "/portofolio", "/about", "/hubungi"]) {
  try {
    (revalidateTag as any)(CACHE_TAGS[tag]);
  } catch (err) {
    // revalidateTag might fail in some client/isolated contexts, ignore gracefully
  }
  for (const p of paths) {
    try {
      revalidatePath(p);
    } catch (err) {
      // ignore
    }
  }
}
