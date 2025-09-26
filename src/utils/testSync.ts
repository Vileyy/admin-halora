/**
 * Test script for sync functionality
 * This file can be used for testing the sync service in development
 */

import {
  syncProductsToInventory,
  compareInventoryWithProducts,
  getProductsFromFirebase,
} from "@/services/syncService";

export const testSyncFunctionality = async () => {
  console.log("🚀 Testing sync functionality...");

  try {
    // 1. Test getting products from Firebase
    console.log("📥 Testing getProductsFromFirebase...");
    const productsResult = await getProductsFromFirebase();
    console.log("Products result:", {
      success: productsResult.success,
      productsCount: Object.keys(productsResult.products).length,
      error: productsResult.error,
    });

    if (!productsResult.success) {
      console.error("❌ Failed to get products from Firebase");
      return;
    }

    // 2. Test comparison before sync
    console.log("📊 Testing compareInventoryWithProducts (before sync)...");
    const beforeComparison = await compareInventoryWithProducts();
    console.log("Before sync comparison:", {
      totalDifferences: beforeComparison.totalDifferences,
      sampleDifferences: beforeComparison.differences.slice(0, 3),
    });

    // 3. Test sync
    console.log("🔄 Testing syncProductsToInventory...");
    const syncResult = await syncProductsToInventory();
    console.log("Sync result:", {
      success: syncResult.success,
      syncedCount: syncResult.syncedCount,
      errorsCount: syncResult.errors.length,
      sampleErrors: syncResult.errors.slice(0, 3),
    });

    // 4. Test comparison after sync
    console.log("📊 Testing compareInventoryWithProducts (after sync)...");
    const afterComparison = await compareInventoryWithProducts();
    console.log("After sync comparison:", {
      totalDifferences: afterComparison.totalDifferences,
      sampleDifferences: afterComparison.differences.slice(0, 3),
    });

    console.log("✅ Sync functionality test completed!");

    return {
      productsCount: Object.keys(productsResult.products).length,
      syncedCount: syncResult.syncedCount,
      beforeDifferences: beforeComparison.totalDifferences,
      afterDifferences: afterComparison.totalDifferences,
      errors: syncResult.errors,
    };
  } catch (error) {
    console.error("❌ Test failed:", error);
    throw error;
  }
};

export const logSampleData = async () => {
  console.log("📋 Logging sample data structure...");

  try {
    const productsResult = await getProductsFromFirebase();

    if (productsResult.success) {
      const firstProduct = Object.entries(productsResult.products)[0];
      if (firstProduct) {
        const [productId, productData] = firstProduct;
        console.log("Sample product structure:", {
          productId,
          name: productData.name,
          category: productData.category,
          variantsCount: productData.variants?.length || 0,
          sampleVariant: productData.variants?.[0] || null,
        });
      }
    }
  } catch (error) {
    console.error("❌ Failed to log sample data:", error);
  }
};
