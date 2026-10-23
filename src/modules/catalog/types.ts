export interface ProductCategory {
  id: string;
  slug: string;
  name: string;
  icon?: string;
  sortOrder?: number;
  isActive?: boolean;
}

export interface Product {
  id: string;
  slug: string;
  categoryId: string;
  name: string;
  description?: string;
  price: number;
  compareAtPrice?: number | null;
  unit: string;
  imageUrl: string;
  gallery?: string[];
  specs?: { label: string; value: string }[];
  isBestSeller?: boolean;
  isActive?: boolean;
  rating?: string;
  sold?: string;
}
