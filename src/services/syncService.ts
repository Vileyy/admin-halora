import { ref, get, update, onValue } from "firebase/database";
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
 * Sync stock quantities from 'products' branch to 'inventory' branch
 */
export const syncProductsToInventory = async (): Promise<{
  success: boolean;
  syncedCount: number;
  errors: string[];
}> => {
  try {
    console.log("Starting sync from products to inventory...");

    // Get data from products branch
    const productsRef = ref(database, "products");
    const productsSnapshot = await get(productsRef);

    if (!productsSnapshot.exists()) {
      throw new Error("No products data found in Firebase");
    }

    const productsData = productsSnapshot.val() as FirebaseProductsDatabase;

    // Get current inventory data
    const inventoryRef = ref(database, "inventory");
    const inventorySnapshot = await get(inventoryRef);
    const inventoryData = inventorySnapshot.exists()
      ? inventorySnapshot.val()
      : {};

    let syncedCount = 0;
    const errors: string[] = [];
    const updates: { [path: string]: Product | ProductVariant[] | string } = {};

    // Process each product from Firebase products
    Object.entries(productsData).forEach(([productId, productData]) => {
      try {
        if (!productData.variants || !Array.isArray(productData.variants)) {
          errors.push(`Product ${productId}: No variants found`);
          return;
        }

        // Check if product exists in inventory
        const existingProduct = inventoryData[productId];

        if (existingProduct) {
          // Update existing product
          const updatedVariants = productData.variants.map((variant, index) => {
            const variantId = `variant_${productId}_${index}`;
            return {
              id: variantId,
              name: variant.size || `Variant ${index + 1}`,
              price: variant.price || 0,
              importPrice: variant.price ? Math.round(variant.price * 0.7) : 0, // Estimate import price as 70% of selling price
              stockQty: variant.stockQty || 0,
              createdAt:
                existingProduct.variants?.[index]?.createdAt ||
                new Date().toISOString(),
            };
          });

          updates[`inventory/${productId}/variants`] = updatedVariants;
          updates[`inventory/${productId}/updatedAt`] =
            new Date().toISOString();
        } else {
          // Create new product in inventory
          const newVariants: ProductVariant[] = productData.variants.map(
            (variant, index) => ({
              id: `variant_${productId}_${index}`,
              name: variant.size || `Variant ${index + 1}`,
              price: variant.price || 0,
              importPrice: variant.price ? Math.round(variant.price * 0.7) : 0,
              stockQty: variant.stockQty || 0,
              createdAt: new Date().toISOString(),
            })
          );

          const newProduct: Product = {
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
            variants: newVariants,
            supplier: "Imported from products",
            brandId: productData.brandId || undefined,
            createdAt: productData.createdAt
              ? new Date(productData.createdAt).toISOString()
              : new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          updates[`inventory/${productId}`] = newProduct;
        }

        syncedCount++;
      } catch (error) {
        console.error(`Error processing product ${productId}:`, error);
        errors.push(
          `Product ${productId}: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
    });

    // Apply all updates in batch
    if (Object.keys(updates).length > 0) {
      await update(ref(database), updates);
      console.log(`Successfully synced ${syncedCount} products`);
    }

    return {
      success: true,
      syncedCount,
      errors,
    };
  } catch (error) {
    console.error("Error syncing products to inventory:", error);
    return {
      success: false,
      syncedCount: 0,
      errors: [
        error instanceof Error ? error.message : "Unknown error occurred",
      ],
    };
  }
};

/**
 * Listen to products branch and auto-sync stock changes
 */
export const listenToProductsForAutoSync = (
  callback?: (syncResult: {
    success: boolean;
    syncedCount: number;
    errors: string[];
  }) => void
) => {
  const productsRef = ref(database, "products");

  return onValue(productsRef, async (snapshot) => {
    if (snapshot.exists()) {
      console.log("Products data changed, triggering auto-sync...");
      const result = await syncProductsToInventory();
      if (callback) {
        callback(result);
      }
    }
  });
};

/**
 * Get products data from Firebase products branch for comparison
 */
export const getProductsFromFirebase = async (): Promise<{
  success: boolean;
  products: { [productId: string]: FirebaseProduct };
  error?: string;
}> => {
  try {
    const productsRef = ref(database, "products");
    const snapshot = await get(productsRef);

    if (!snapshot.exists()) {
      return {
        success: false,
        products: {},
        error: "No products found in Firebase",
      };
    }

    return {
      success: true,
      products: snapshot.val() as FirebaseProductsDatabase,
    };
  } catch (error) {
    return {
      success: false,
      products: {},
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

/**
 * Compare inventory stock with products stock
 */
export const compareInventoryWithProducts = async (): Promise<{
  differences: Array<{
    productId: string;
    productName: string;
    variantName: string;
    inventoryStock: number;
    productsStock: number;
    difference: number;
  }>;
  totalDifferences: number;
}> => {
  try {
    // Get both datasets
    const [inventorySnapshot, productsSnapshot] = await Promise.all([
      get(ref(database, "inventory")),
      get(ref(database, "products")),
    ]);

    const inventoryData = inventorySnapshot.exists()
      ? inventorySnapshot.val()
      : {};
    const productsData = productsSnapshot.exists()
      ? (productsSnapshot.val() as FirebaseProductsDatabase)
      : {};

    const differences: Array<{
      productId: string;
      productName: string;
      variantName: string;
      inventoryStock: number;
      productsStock: number;
      difference: number;
    }> = [];

    // Compare each product
    Object.entries(productsData).forEach(([productId, productData]) => {
      const inventoryProduct = inventoryData[productId];

      if (inventoryProduct && productData.variants) {
        productData.variants.forEach((productVariant, index) => {
          const inventoryVariant = inventoryProduct.variants?.[index];
          if (inventoryVariant) {
            const inventoryStock = inventoryVariant.stockQty || 0;
            const productsStock = productVariant.stockQty || 0;

            if (inventoryStock !== productsStock) {
              differences.push({
                productId,
                productName: productData.name || "Unknown Product",
                variantName:
                  productVariant.size ||
                  inventoryVariant.name ||
                  `Variant ${index + 1}`,
                inventoryStock,
                productsStock,
                difference: productsStock - inventoryStock,
              });
            }
          }
        });
      }
    });

    return {
      differences,
      totalDifferences: differences.length,
    };
  } catch (error) {
    console.error("Error comparing inventory with products:", error);
    return {
      differences: [],
      totalDifferences: 0,
    };
  }
};
