import { ref, onValue, get } from "firebase/database";
import { database } from "@/lib/firebase";
import { Product, ProductVariant } from "@/types/Inventory";

/**
 * Interface for Firebase products structure
 */
interface FirebaseProduct {
  name: string;
  category: string;
  description: string;
  image?: string;
  brandId?: string;
  brand?: string;
  originalProductId?: string;
  createdAt?: number;
  updatedAt?: number;
  variants: Array<{
    price: number;
    size: string;
    stockQty: number;
    sku?: string;
  }>;
}

interface FirebaseProductsDatabase {
  [productId: string]: FirebaseProduct;
}

/**
 * Listen to products from Firebase products branch with real-time updates
 * This combines data from 'products' and 'inventory' branches, prioritizing 'products' for stock quantities
 */
export const listenProductsWithRealTimeSync = (
  callback: (products: Product[]) => void
) => {
  const productsRef = ref(database, "products");

  return onValue(productsRef, async (snapshot) => {
    try {
      const productsData = snapshot.val() as FirebaseProductsDatabase;

      if (!productsData) {
        callback([]);
        return;
      }

      // Also get inventory data for fallback information
      const inventoryRef = ref(database, "inventory");
      const inventorySnapshot = await get(inventoryRef);
      const inventoryData = inventorySnapshot.exists()
        ? inventorySnapshot.val()
        : {};

      const productsArray: Product[] = [];

      // Process each product from Firebase products
      Object.entries(productsData).forEach(([productId, productData]) => {
        try {
          if (!productData.variants || !Array.isArray(productData.variants)) {
            return; // Skip products without variants
          }

          // Get corresponding inventory data for additional info
          const inventoryProduct = inventoryData[productId];

          // Create variants using products data as source of truth for stock
          const variants: ProductVariant[] = productData.variants.map(
            (variant, index) => {
              // Try to get additional info from inventory if available
              const inventoryVariant = inventoryProduct?.variants?.[index];

              return {
                id: `variant_${productId}_${index}`,
                name: variant.size || `Variant ${index + 1}`,
                price: variant.price || 0,
                importPrice:
                  inventoryVariant?.importPrice ||
                  (variant.price ? Math.round(variant.price * 0.7) : 0),
                stockQty: variant.stockQty || 0, // Use products data as source of truth
                createdAt:
                  inventoryVariant?.createdAt || new Date().toISOString(),
              };
            }
          );

          // Create product using products data with inventory fallback
          const product: Product = {
            id: productId,
            name:
              productData.name || inventoryProduct?.name || "Unknown Product",
            category:
              productData.category ||
              inventoryProduct?.category ||
              "uncategorized",
            description:
              productData.description || inventoryProduct?.description || "",
            media: productData.image
              ? [
                  {
                    id: `media_${productId}_0`,
                    url: productData.image,
                    type: "image" as const,
                    order: 0,
                  },
                ]
              : inventoryProduct?.media || [],
            variants,
            supplier: inventoryProduct?.supplier || "From Products",
            brandId: productData.brandId || inventoryProduct?.brandId,
            createdAt: productData.createdAt
              ? new Date(productData.createdAt).toISOString()
              : inventoryProduct?.createdAt || new Date().toISOString(),
            updatedAt: productData.updatedAt
              ? new Date(productData.updatedAt).toISOString()
              : inventoryProduct?.updatedAt || new Date().toISOString(),
          };

          productsArray.push(product);
        } catch (error) {
          console.error(`Error processing product ${productId}:`, error);
        }
      });

      // Sort by creation date (newest first)
      productsArray.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      callback(productsArray);
    } catch (error) {
      console.error("Error in listenProductsWithRealTimeSync:", error);
      callback([]);
    }
  });
};

/**
 * Get products with low stock (less than 10 items) from products branch
 */
export const getProductsWithLowStockFromProducts = async (): Promise<
  Array<{
    product: Product;
    variant: ProductVariant;
  }>
> => {
  try {
    const productsRef = ref(database, "products");
    const snapshot = await get(productsRef);

    if (!snapshot.exists()) {
      return [];
    }

    const lowStockItems: Array<{
      product: Product;
      variant: ProductVariant;
    }> = [];

    const productsData = snapshot.val() as FirebaseProductsDatabase;

    Object.entries(productsData).forEach(([productId, productData]) => {
      if (!productData.variants || !Array.isArray(productData.variants)) {
        return;
      }

      productData.variants.forEach((variant, index) => {
        if (variant.stockQty > 0 && variant.stockQty < 10) {
          const productVariant: ProductVariant = {
            id: `variant_${productId}_${index}`,
            name: variant.size || `Variant ${index + 1}`,
            price: variant.price || 0,
            importPrice: variant.price ? Math.round(variant.price * 0.7) : 0,
            stockQty: variant.stockQty || 0,
            createdAt: new Date().toISOString(),
          };

          const product: Product = {
            id: productId,
            name: productData.name || "Unknown Product",
            category: productData.category || "uncategorized",
            description: productData.description || "",
            media: productData.image
              ? [
                  {
                    id: `media_${productId}_0`,
                    url: productData.image,
                    type: "image" as const,
                    order: 0,
                  },
                ]
              : [],
            variants: [productVariant],
            supplier: "From Products",
            brandId: productData.brandId,
            createdAt: productData.createdAt
              ? new Date(productData.createdAt).toISOString()
              : new Date().toISOString(),
            updatedAt: productData.updatedAt
              ? new Date(productData.updatedAt).toISOString()
              : new Date().toISOString(),
          };

          lowStockItems.push({ product, variant: productVariant });
        }
      });
    });

    return lowStockItems;
  } catch (error) {
    console.error(
      "Error getting low stock products from products branch:",
      error
    );
    return [];
  }
};

/**
 * Update stock in products branch (this is the new source of truth)
 */
export const updateVariantStockInProducts = async (
  productId: string,
  variantIndex: number,
  newStock: number
): Promise<void> => {
  try {
    const { update } = await import("firebase/database");

    const updatePath = `products/${productId}/variants/${variantIndex}/stockQty`;
    const updates = {
      [updatePath]: newStock,
      [`products/${productId}/updatedAt`]: Date.now(),
    };

    await update(ref(database), updates);
  } catch (error) {
    console.error("Error updating variant stock in products:", error);
    throw error;
  }
};

/**
 * Search products by name or category from products branch
 */
export const searchProductsFromProducts = async (
  query: string
): Promise<Product[]> => {
  try {
    const productsRef = ref(database, "products");
    const snapshot = await get(productsRef);

    if (!snapshot.exists()) {
      return [];
    }

    const productsData = snapshot.val() as FirebaseProductsDatabase;
    const searchResults: Product[] = [];
    const lowerQuery = query.toLowerCase();

    Object.entries(productsData).forEach(([productId, productData]) => {
      if (
        productData.name?.toLowerCase().includes(lowerQuery) ||
        productData.category?.toLowerCase().includes(lowerQuery) ||
        productData.description?.toLowerCase().includes(lowerQuery)
      ) {
        const variants: ProductVariant[] = (productData.variants || []).map(
          (variant, index) => ({
            id: `variant_${productId}_${index}`,
            name: variant.size || `Variant ${index + 1}`,
            price: variant.price || 0,
            importPrice: variant.price ? Math.round(variant.price * 0.7) : 0,
            stockQty: variant.stockQty || 0,
            createdAt: new Date().toISOString(),
          })
        );

        const product: Product = {
          id: productId,
          name: productData.name || "Unknown Product",
          category: productData.category || "uncategorized",
          description: productData.description || "",
          media: productData.image
            ? [
                {
                  id: `media_${productId}_0`,
                  url: productData.image,
                  type: "image" as const,
                  order: 0,
                },
              ]
            : [],
          variants,
          supplier: "From Products",
          brandId: productData.brandId,
          createdAt: productData.createdAt
            ? new Date(productData.createdAt).toISOString()
            : new Date().toISOString(),
          updatedAt: productData.updatedAt
            ? new Date(productData.updatedAt).toISOString()
            : new Date().toISOString(),
        };

        searchResults.push(product);
      }
    });

    return searchResults;
  } catch (error) {
    console.error("Error searching products from products branch:", error);
    return [];
  }
};
