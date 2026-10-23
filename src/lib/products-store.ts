import fs from "fs";
import path from "path";
import { products as defaultProducts, Product } from "@/data/products";

const DATA_FILE = path.join(process.cwd(), "src", "data", "products.json");

export function getStoredProducts(): Product[] {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, "utf-8");
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
    // If file doesn't exist or is empty, initialize with defaultProducts
    saveProducts(defaultProducts);
    return defaultProducts;
  } catch (err) {
    console.error("Error reading products.json:", err);
    return defaultProducts;
  }
}

export function saveProducts(products: Product[]) {
  try {
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(products, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing products.json:", err);
  }
}

export function addProduct(newProduct: Omit<Product, "id"> & { id?: string }): Product {
  const current = getStoredProducts();
  const id = newProduct.id || newProduct.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") + "-" + Date.now().toString().slice(-4);
  
  const created: Product = {
    ...newProduct,
    id,
    rating: newProduct.rating || "5.0",
    sold: newProduct.sold || "0",
    isBestSeller: Boolean(newProduct.isBestSeller),
    specs: newProduct.specs || []
  };

  const updated = [created, ...current];
  saveProducts(updated);
  return created;
}

export function updateProduct(id: string, updates: Partial<Product>): Product | null {
  const current = getStoredProducts();
  const index = current.findIndex(p => p.id === id);
  if (index === -1) return null;

  const updatedProduct = {
    ...current[index],
    ...updates,
    id: current[index].id // preserve id
  };

  current[index] = updatedProduct;
  saveProducts(current);
  return updatedProduct;
}

export function deleteProduct(id: string): boolean {
  const current = getStoredProducts();
  const filtered = current.filter(p => p.id !== id);
  if (filtered.length === current.length) return false;

  saveProducts(filtered);
  return true;
}

export function resetToDefault(): Product[] {
  saveProducts(defaultProducts);
  return defaultProducts;
}
