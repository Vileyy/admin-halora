// Media types for products
export interface ProductMedia {
  id: string;
  url: string;
  type: "image" | "video";
  order: number;
}

// Product variant with individual pricing
export interface ProductVariant {
  id: string;
  name: string; // e.g., "Size S", "50ml", "Màu đỏ"
  price: number;
  importPrice: number;
  stockQty: number;
  createdAt: string;
}

// Main product definition
export interface Product {
  id: string;
  name: string;
  category: string;
  description: string;
  media: ProductMedia[]; // 2-5 images/videos
  variants: ProductVariant[];
  supplier: string;
  brandId?: string;
  createdAt: string;
  updatedAt: string;
}

// For form input when creating/editing products
export interface ProductFormData {
  name: string;
  category: string;
  description: string;
  supplier: string;
  brandId?: string;
  variants: Omit<ProductVariant, "id" | "createdAt">[];
  mediaFiles: File[]; // For uploading new media
  existingMedia?: ProductMedia[]; // For editing existing products
}

// Legacy interfaces for backward compatibility
export interface InventoryItem {
  productId: string;
  variantId: string;
  variantName: string;
  stockQty: number;
  importPrice: number;
  price: number;
  supplier: string;
  brandId?: string;
  updatedAt: string;
  // Additional fields for display
  productName?: string;
  productImage?: string;
  productCategory?: string;
}

export interface InventoryFormData {
  productId: string;
  variantId: string;
  variantName: string;
  stockQty: number;
  importPrice: number;
  price: number;
  supplier: string;
  brandId?: string;
}

// Firebase data structures
export interface InventoryItemData {
  productId: string;
  variantId: string;
  variantName: string;
  stockQty: number;
  importPrice: number;
  price: number;
  supplier: string;
  brandId?: string;
  updatedAt: string;
}

export interface ProductData {
  name: string;
  image: string;
  category: string;
  description: string;
  variants: ProductVariant[];
}

export interface InventoryVariants {
  [variantId: string]: InventoryItemData;
}

export interface InventoryDatabase {
  [productId: string]: InventoryVariants;
}

export interface ProductsDatabase {
  [productId: string]: ProductData;
}
