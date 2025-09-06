"use client";

import React from "react";
import { Alert, AlertDescription } from "../ui/alert";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Package, CheckCircle } from "lucide-react";

interface ProductVariant {
  size: string;
  price: number;
}

interface Product {
  id: string;
  name: string;
  variants?: ProductVariant[];
}

interface ProductStockSummaryProps {
  products: Product[];
  getStockQuantity: (productId: string, variantSize: string) => number;
}

export function ProductStockSummary({
  products,
  getStockQuantity,
}: ProductStockSummaryProps) {
  const stockSummary = React.useMemo(() => {
    let outOfStock = 0;
    let lowStock = 0;
    let inStock = 0;
    let totalVariants = 0;

    products.forEach((product) => {
      product.variants?.forEach((variant) => {
        totalVariants++;
        const stockQty = getStockQuantity(product.id, variant.size);

        if (stockQty === 0) {
          outOfStock++;
        } else if (stockQty < 10) {
          lowStock++;
        } else {
          inStock++;
        }
      });
    });

    return {
      outOfStock,
      lowStock,
      inStock,
      totalVariants,
    };
  }, [products, getStockQuantity]);

  if (stockSummary.totalVariants === 0) {
    return null;
  }

  const hasStockIssues =
    stockSummary.outOfStock > 0 || stockSummary.lowStock > 0;

  return (
    <div style={{ marginBottom: "5px" }}>
      {/* Stock Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="bg-white border rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Tổng sản phẩm</p>
              <p className="text-2xl font-bold text-gray-900">
                {stockSummary.totalVariants}
              </p>
            </div>
            <Package className="h-8 w-8 text-gray-400" />
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">Còn hàng</p>
              <p className="text-2xl font-bold text-green-700">
                {stockSummary.inStock}
              </p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-400" />
          </div>
        </div>

        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-600">Sắp hết</p>
              <p className="text-2xl font-bold text-orange-700">
                {stockSummary.lowStock}
              </p>
            </div>
            <AlertTriangle className="h-8 w-8 text-orange-400" />
          </div>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-600">Hết hàng</p>
              <p className="text-2xl font-bold text-red-700">
                {stockSummary.outOfStock}
              </p>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-400" />
          </div>
        </div>
      </div>
    </div>
  );
}
