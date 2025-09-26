/**
 * Test script for real-time sync functionality
 * Run this in browser console to test the new real-time sync
 */

import { listenProductsWithRealTimeSync } from "@/services/productSyncService";

export const testRealTimeSync = () => {
  console.log("🚀 Testing real-time sync from products branch...");

  const unsubscribe = listenProductsWithRealTimeSync((products) => {
    console.log("📦 Real-time update received:");
    console.log(`- Total products: ${products.length}`);

    if (products.length > 0) {
      const sampleProduct = products[0];
      console.log("- Sample product:", {
        id: sampleProduct.id,
        name: sampleProduct.name,
        variants: sampleProduct.variants.map((v) => ({
          name: v.name,
          stockQty: v.stockQty,
          price: v.price,
        })),
      });

      const totalStock = products.reduce(
        (sum, product) =>
          sum +
          product.variants.reduce(
            (variantSum, variant) => variantSum + variant.stockQty,
            0
          ),
        0
      );

      console.log(`- Total stock across all products: ${totalStock}`);

      const outOfStock = products.filter((product) =>
        product.variants.some((variant) => variant.stockQty === 0)
      );

      console.log(
        `- Products with out-of-stock variants: ${outOfStock.length}`
      );
    }
  });

  console.log(
    "✅ Real-time listener started. Check Firebase Console for changes."
  );
  console.log("💡 To stop listening, call the returned unsubscribe function.");

  return unsubscribe;
};

export const logProductsStructure = () => {
  console.log("📋 Testing products structure...");

  const unsubscribe = listenProductsWithRealTimeSync((products) => {
    if (products.length > 0) {
      console.log("Products structure sample:");
      products.slice(0, 2).forEach((product, index) => {
        console.log(`Product ${index + 1}:`, {
          id: product.id,
          name: product.name,
          category: product.category,
          variants: product.variants.map((v) => ({
            id: v.id,
            name: v.name,
            stockQty: v.stockQty,
            price: v.price,
            importPrice: v.importPrice,
          })),
          media: product.media.map((m) => ({
            url: m.url,
            type: m.type,
          })),
        });
      });

      // Stop after first load
      unsubscribe();
    }
  });
};
