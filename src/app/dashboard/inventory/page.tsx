"use client";

import React, { useState, useEffect } from "react";
import { Product, ProductFormData } from "@/types/Inventory";
import { Button } from "@/components/ui/button";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProductForm from "@/components/inventory/ProductForm";
import { ProductTable } from "@/components/inventory/ProductTable";
import {
  createProduct,
  updateProduct,
  updateVariantStock,
  deleteProduct,
} from "@/services/productService";
import {
  listenProductsWithRealTimeSync,
  getProductsWithLowStockFromProducts,
  updateVariantStockInProducts,
} from "@/services/productSyncService";
import {
  Plus,
  Package,
  AlertTriangle,
  TrendingUp,
  DollarSign,
} from "lucide-react";
import { toast } from "sonner";
import { NoSSR } from "@/components/ui/no-ssr";

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [lowStockItems, setLowStockItems] = useState<
    Array<{
      product: Product;
      variant: { id: string; name: string; stockQty: number };
    }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductFormData | null>(
    null
  );
  const [formMode, setFormMode] = useState<"add" | "edit">("add");
  const [resetPagination, setResetPagination] = useState(false);

  // Reset pagination flag after it's been used
  useEffect(() => {
    if (resetPagination) {
      setResetPagination(false);
    }
  }, [resetPagination]);

  // Listen to products changes from Firebase products branch (real-time)
  useEffect(() => {
    const unsubscribe = listenProductsWithRealTimeSync((data) => {
      // Ensure data is always an array with safe default
      const safeData = Array.isArray(data) ? data : [];
      setProducts(safeData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Load low stock items from products branch
  useEffect(() => {
    const loadLowStockItems = async () => {
      try {
        const lowStock = await getProductsWithLowStockFromProducts();
        // Ensure lowStock is always an array
        setLowStockItems(Array.isArray(lowStock) ? lowStock : []);
      } catch (error) {
        console.error("Error loading low stock items:", error);
        setLowStockItems([]);
      }
    };

    loadLowStockItems();
    // Refresh every 30 seconds
    const interval = setInterval(loadLowStockItems, 30000);
    return () => clearInterval(interval);
  }, [products]);

  // Calculate inventory statistics with safe checks
  const stats = {
    totalProducts: products?.length || 0,
    totalVariants:
      products?.reduce(
        (sum, product) => sum + (product?.variants?.length || 0),
        0
      ) || 0,
    totalStock:
      products?.reduce(
        (sum, product) =>
          sum +
          (product?.variants?.reduce(
            (variantSum, variant) => variantSum + (variant?.stockQty || 0),
            0
          ) || 0),
        0
      ) || 0,
    totalValue:
      products?.reduce(
        (sum, product) =>
          sum +
          (product?.variants?.reduce(
            (variantSum, variant) =>
              variantSum + (variant?.price || 0) * (variant?.stockQty || 0),
            0
          ) || 0),
        0
      ) || 0,
    lowStockCount: lowStockItems?.length || 0,
    outOfStockCount:
      products?.reduce(
        (sum, product) =>
          sum +
          (product?.variants?.filter(
            (variant) => (variant?.stockQty || 0) === 0
          )?.length || 0),
        0
      ) || 0,
  };

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat("vi-VN").format(price);
  };

  const handleAddProduct = () => {
    setFormMode("add");
    setEditingProduct(null);
    setFormOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    setFormMode("edit");
    console.log("Editing product:", product); // Debug log
    console.log("Product brandId:", product.brandId); // Debug log
    // Convert Product to ProductFormData format
    const formData: ProductFormData = {
      name: product.name,
      category: product.category,
      description: product.description,
      supplier: product.supplier,
      brandId: product.brandId, // Thêm brandId
      variants: product.variants.map((v) => ({
        name: v.name,
        price: v.price,
        importPrice: v.importPrice,
        stockQty: v.stockQty,
      })),
      mediaFiles: [],
      existingMedia:
        product.media?.map((m, index) => ({
          id: m.id,
          url: m.url,
          type: m.type,
          order: m.order || index,
        })) || [],
    };
    console.log("FormData with brandId:", formData.brandId); // Debug log
    setEditingProduct(formData);
    setFormOpen(true);
  };

  const handleDeleteProduct = async (productId: string) => {
    try {
      await deleteProduct(productId);
      toast.success("Đã xóa sản phẩm thành công!");
    } catch (error) {
      console.error("Error deleting product:", error);
      toast.error("Có lỗi xảy ra khi xóa sản phẩm!");
    }
  };

  const handleUpdateStock = async (
    productId: string,
    variantId: string,
    newStock: number
  ) => {
    try {
      // Extract variant index from variantId (format: variant_productId_index)
      const variantIndex = parseInt(variantId.split("_").pop() || "0");

      // Update in products branch (source of truth)
      await updateVariantStockInProducts(productId, variantIndex, newStock);

      // Also update in inventory branch for backward compatibility
      await updateVariantStock(productId, variantId, newStock);

      toast.success("Đã cập nhật số lượng tồn kho!");
    } catch (error) {
      console.error("Error updating stock:", error);
      toast.error("Có lỗi xảy ra khi cập nhật tồn kho!");
    }
  };

  const handleFormSubmit = async (data: ProductFormData) => {
    setFormLoading(true);
    try {
      if (formMode === "add") {
        await createProduct(data);
        toast.success("Đã thêm sản phẩm mới thành công!");
      } else if (formMode === "edit" && editingProduct) {
        // Find the original product to get the ID
        const originalProduct = products.find(
          (p) => p.name === editingProduct.name
        );
        if (originalProduct) {
          await updateProduct(originalProduct.id, data);
          toast.success("Đã cập nhật thông tin sản phẩm!");
        }
      }
      setFormOpen(false);
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error("Có lỗi xảy ra khi lưu dữ liệu!");
    } finally {
      setFormLoading(false);
    }
  };

  // Filter products for different tabs with safe checks
  const getProductsWithLowStockVariants = () => {
    return (
      products?.filter((product) =>
        product?.variants?.some(
          (variant) =>
            (variant?.stockQty || 0) > 0 && (variant?.stockQty || 0) < 10
        )
      ) || []
    );
  };

  const getProductsWithOutOfStockVariants = () => {
    return (
      products?.filter((product) =>
        product?.variants?.some((variant) => (variant?.stockQty || 0) === 0)
      ) || []
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="p-6">
          <div className="flex items-center justify-center h-screen">
            <div className="text-center">
              <div className="inline-block h-16 w-16 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
              <p className="mt-6 text-xl text-slate-700 font-semibold">
                Đang tải dữ liệu kho hàng...
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Vui lòng chờ trong giây lát
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="p-4 space-y-4">
        {/* Header với gradient và shadow */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent">
                Quản lý kho
              </h1>
              <p className="text-slate-600 mt-1 text-sm">
                Quản lý sản phẩm, biến thể và tồn kho một cách hiệu quả
              </p>
            </div>
            <Button
              onClick={handleAddProduct}
              className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md hover:shadow-lg transition-all duration-300 px-4 py-2 text-sm font-semibold rounded-lg"
            >
              <Plus className="w-4 h-4" />
              Thêm sản phẩm mới
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <NoSSR
          fallback={
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <Card
                  key={i}
                  className="bg-gradient-to-br from-slate-50 to-slate-100 border-0 shadow-lg animate-pulse"
                >
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                    <CardTitle className="text-sm font-semibold text-slate-500">
                      Đang tải...
                    </CardTitle>
                    <div className="bg-slate-300 p-2 rounded-lg w-9 h-9"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-slate-400">--</div>
                    <p className="text-sm text-slate-400 mt-1 font-medium">
                      Đang tải dữ liệu...
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          }
        >
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Tổng sản phẩm */}
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 border-0 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-102 hover:-translate-y-0.5">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-semibold text-blue-700">
                  Tổng sản phẩm
                </CardTitle>
                <div className="bg-blue-500 p-1.5 rounded-md shadow-sm">
                  <Package className="h-4 w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-900">
                  {stats.totalProducts}
                </div>
                <p className="text-xs text-blue-600 mt-1 font-medium">
                  {stats.totalVariants} biến thể
                </p>
              </CardContent>
            </Card>

            {/* Tổng tồn kho */}
            <Card className="bg-gradient-to-br from-green-50 to-emerald-100 border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 hover:-translate-y-1">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-semibold text-green-700">
                  Tổng tồn kho
                </CardTitle>
                <div className="bg-green-500 p-2 rounded-lg shadow-md">
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-900">
                  {stats.totalStock.toLocaleString()}
                </div>
                <p className="text-sm text-green-600 mt-1 font-medium">
                  Đơn vị sản phẩm
                </p>
              </CardContent>
            </Card>

            {/* Giá trị kho */}
            <Card className="bg-gradient-to-br from-purple-50 to-violet-100 border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 hover:-translate-y-1">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-semibold text-purple-700">
                  Giá trị kho
                </CardTitle>
                <div className="bg-purple-500 p-2 rounded-lg shadow-md">
                  <DollarSign className="h-5 w-5 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-900">
                  {formatPrice(stats.totalValue)}
                </div>
                <p className="text-sm text-purple-600 mt-1 font-medium">
                  VNĐ tổng giá trị
                </p>
              </CardContent>
            </Card>

            {/* Cảnh báo */}
            <Card className="bg-gradient-to-br from-orange-50 to-red-100 border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 hover:-translate-y-1">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-semibold text-orange-700">
                  Cảnh báo
                </CardTitle>
                <div className="bg-orange-500 p-2 rounded-lg shadow-md">
                  <AlertTriangle className="h-5 w-5 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-900">
                  {stats.lowStockCount + stats.outOfStockCount}
                </div>
                <p className="text-sm text-orange-600 mt-1 font-medium">
                  Cần chú ý tồn kho
                </p>
              </CardContent>
            </Card>
          </div>
        </NoSSR>

        {/* Content Tabs */}
        <NoSSR
          fallback={
            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 p-4">
              <div className="flex items-center justify-center h-48">
                <div className="text-center">
                  <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
                  <p className="mt-4 text-lg text-slate-600 font-medium">
                    Đang tải danh sách sản phẩm...
                  </p>
                </div>
              </div>
            </div>
          }
        >
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 p-4">
            <Tabs
              defaultValue="all"
              className="space-y-4"
              onValueChange={() => setResetPagination(true)}
            >
              <div className="flex items-center justify-between">
                <TabsList className="bg-slate-100/80 p-1 rounded-lg shadow-inner">
                  <TabsTrigger
                    value="all"
                    className="data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-slate-900 rounded-md px-4 py-1.5 text-sm font-medium transition-all duration-200"
                  >
                    Tất cả ({products?.length || 0})
                  </TabsTrigger>
                  <TabsTrigger
                    value="low-stock"
                    className="data-[state=active]:bg-orange-500 data-[state=active]:text-white data-[state=active]:shadow-md rounded-md px-4 py-1.5 text-sm font-medium transition-all duration-200"
                  >
                    Sắp hết hàng ({getProductsWithLowStockVariants().length})
                  </TabsTrigger>
                  <TabsTrigger
                    value="out-of-stock"
                    className="data-[state=active]:bg-red-500 data-[state=active]:text-white data-[state=active]:shadow-md rounded-md px-4 py-1.5 text-sm font-medium transition-all duration-200"
                  >
                    Hết hàng ({getProductsWithOutOfStockVariants().length})
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="all">
                <ProductTable
                  products={products || []}
                  onEdit={handleEditProduct}
                  onDelete={handleDeleteProduct}
                  onUpdateStock={handleUpdateStock}
                  loading={loading}
                  resetPagination={resetPagination}
                />
              </TabsContent>

              <TabsContent value="low-stock">
                <ProductTable
                  products={getProductsWithLowStockVariants()}
                  onEdit={handleEditProduct}
                  onDelete={handleDeleteProduct}
                  onUpdateStock={handleUpdateStock}
                  loading={loading}
                  resetPagination={resetPagination}
                />
              </TabsContent>

              <TabsContent value="out-of-stock">
                <ProductTable
                  products={getProductsWithOutOfStockVariants()}
                  onEdit={handleEditProduct}
                  onDelete={handleDeleteProduct}
                  onUpdateStock={handleUpdateStock}
                  loading={loading}
                  resetPagination={resetPagination}
                />
              </TabsContent>
            </Tabs>
          </div>
        </NoSSR>

        {/* Form Dialog */}
        <ProductForm
          open={formOpen}
          onOpenChange={setFormOpen}
          onSubmit={handleFormSubmit}
          initialData={editingProduct}
          loading={formLoading}
          mode={formMode}
        />
      </div>
    </div>
  );
}
