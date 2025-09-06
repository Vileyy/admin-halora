import { ref, set, update, onValue, get } from "firebase/database";
import { database } from "@/lib/firebase";
import {
  InventoryItem,
  InventoryFormData,
  InventoryDatabase,
  ProductsDatabase,
  InventoryVariants,
  InventoryItemData,
  ProductData,
} from "@/types/Inventory";

/**
 * Listen to inventory changes in real-time
 * @param callback Function to handle inventory data updates
 * @returns Unsubscribe function
 */
export const listenInventory = (callback: (data: InventoryItem[]) => void) => {
  const inventoryRef = ref(database, "inventory");

  return onValue(inventoryRef, async (snapshot) => {
    const inventoryData = snapshot.val();
    if (!inventoryData) {
      callback([]);
      return;
    }

    // Get products data to enrich inventory items
    const productsRef = ref(database, "products");
    const productsSnapshot = await get(productsRef);
    const productsData = productsSnapshot.val() || {};

    const inventoryItems: InventoryItem[] = [];

    // Iterate through productId -> variantId structure
    Object.entries(inventoryData as InventoryDatabase).forEach(
      ([productId, variants]: [string, InventoryVariants]) => {
        if (variants && typeof variants === "object") {
          Object.entries(variants).forEach(
            ([variantId, itemData]: [string, InventoryItemData]) => {
              if (itemData && typeof itemData === "object") {
                const product = productsData[productId];
                const inventoryItem: InventoryItem = {
                  productId,
                  variantId,
                  variantName: itemData.variantName || "Unknown",
                  stockQty: itemData.stockQty || 0,
                  importPrice: itemData.importPrice || 0,
                  price: itemData.price || 0,
                  supplier: itemData.supplier || "",
                  brandId: itemData.brandId,
                  updatedAt: itemData.updatedAt || new Date().toISOString(),
                  productName: product?.name || "Unknown Product",
                  productImage: product?.image || "",
                  productCategory: product?.category || "",
                };
                inventoryItems.push(inventoryItem);
              }
            }
          );
        }
      }
    );

    callback(inventoryItems);
  });
};

/**
 * Add or update inventory item
 * @param productId Product ID
 * @param variantId Variant ID
 * @param data Inventory data
 */
export const addInventory = async (
  productId: string,
  variantId: string,
  data: Omit<InventoryFormData, "productId" | "variantId">
): Promise<void> => {
  const inventoryRef = ref(database, `inventory/${productId}/${variantId}`);

  const inventoryData = {
    productId,
    variantId,
    ...data,
    updatedAt: new Date().toISOString(),
  };

  await set(inventoryRef, inventoryData);
};

/**
 * Update existing inventory item
 * @param productId Product ID
 * @param variantId Variant ID
 * @param data Updated inventory data
 */
export const updateInventory = async (
  productId: string,
  variantId: string,
  data: Partial<Omit<InventoryFormData, "productId" | "variantId">>
): Promise<void> => {
  const inventoryRef = ref(database, `inventory/${productId}/${variantId}`);

  const updateData = {
    ...data,
    updatedAt: new Date().toISOString(),
  };

  await update(inventoryRef, updateData);
};

/**
 * Get single inventory item
 * @param productId Product ID
 * @param variantId Variant ID
 * @returns Promise<InventoryItem | null>
 */
export const getInventoryItem = async (
  productId: string,
  variantId: string
): Promise<InventoryItem | null> => {
  const inventoryRef = ref(database, `inventory/${productId}/${variantId}`);
  const snapshot = await get(inventoryRef);

  if (!snapshot.exists()) {
    return null;
  }

  const data = snapshot.val();
  return {
    productId,
    variantId,
    variantName: data.variantName || "",
    stockQty: data.stockQty || 0,
    importPrice: data.importPrice || 0,
    price: data.price || 0,
    supplier: data.supplier || "",
    brandId: data.brandId,
    updatedAt: data.updatedAt || new Date().toISOString(),
  };
};

/**
 * Listen to products for dropdown selection
 * @param callback Function to handle products data
 * @returns Unsubscribe function
 */
export const listenProducts = (
  callback: (products: (ProductData & { id: string })[]) => void
) => {
  const productsRef = ref(database, "products");

  return onValue(productsRef, (snapshot) => {
    const data = snapshot.val();
    if (!data) {
      callback([]);
      return;
    }

    const productsArray = Object.entries(data as ProductsDatabase).map(
      ([id, value]: [string, ProductData]) => ({
        id,
        ...value,
      })
    );

    callback(productsArray);
  });
};
