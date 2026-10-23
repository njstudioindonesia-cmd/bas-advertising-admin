export * from "./types";
export {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} from "@/lib/db/queries/products";
export { getCategories } from "@/lib/db/queries/categories";
