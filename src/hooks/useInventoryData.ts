import { useState, useEffect } from "react";
import { listenInventory } from "@/services/inventoryService";
import { InventoryItem } from "@/types/Inventory";

export function useInventoryData() {
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = listenInventory((items) => {
      setInventoryItems(items);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Helper function to get stock quantity for a specific product variant
  const getStockQuantity = (productId: string, variantSize: string): number => {
    const inventoryItem = inventoryItems.find(
      (item) => item.productId === productId && item.variantName === variantSize
    );
    return inventoryItem?.stockQty || 0;
  };

  // Helper function to get all inventory items for a product
  const getProductInventory = (productId: string): InventoryItem[] => {
    return inventoryItems.filter((item) => item.productId === productId);
  };

  return {
    inventoryItems,
    loading,
    getStockQuantity,
    getProductInventory,
  };
}
