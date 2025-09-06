"use client";

import React, { useState, useEffect } from "react";
import { InventoryItem, InventoryFormData, Product } from "@/types/Inventory";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { listenProducts } from "@/services/productService";
import { Brand } from "@/types/Brand";
import { database } from "@/lib/firebase";
import { ref, onValue } from "firebase/database";
import Image from "next/image";

interface InventoryFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: InventoryFormData) => Promise<void>;
  initialData?: InventoryItem | null;
  loading?: boolean;
  mode: "add" | "edit";
}

export function InventoryForm({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  loading = false,
  mode,
}: InventoryFormProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [formData, setFormData] = useState<InventoryFormData>({
    productId: "",
    variantId: "",
    variantName: "",
    stockQty: 0,
    importPrice: 0,
    price: 0,
    supplier: "",
    brandId: undefined,
  });
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Load products
  useEffect(() => {
    const unsubscribe = listenProducts((productsData) => {
      setProducts(productsData);
    });
    return () => unsubscribe();
  }, []);

  // Load brands
  useEffect(() => {
    const brandsRef = ref(database, "brands");
    const unsubscribe = onValue(brandsRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) return setBrands([]);
      const brandsArray = Object.entries(data)
        .map(([id, value]: [string, unknown]) => {
          if (typeof value === "object" && value !== null) {
            const v = value as {
              name?: string;
              description?: string;
              logoUrl?: string;
              image?: string;
            };
            return {
              id,
              name: v.name || `Brand ${id.slice(-4)}`,
              description: v.description,
              logoUrl: v.logoUrl || v.image,
              image: v.image,
            } as Brand;
          }
          return null;
        })
        .filter((item): item is Brand => item !== null);
      setBrands(brandsArray);
    });
    return () => unsubscribe();
  }, []);

  // Initialize form data when initialData changes
  useEffect(() => {
    if (initialData && mode === "edit") {
      setFormData({
        productId: initialData.productId,
        variantId: initialData.variantId,
        variantName: initialData.variantName,
        stockQty: initialData.stockQty,
        importPrice: initialData.importPrice,
        price: initialData.price,
        supplier: initialData.supplier,
        brandId: initialData.brandId,
      });

      // Find and set selected product
      const product = products.find((p) => p.id === initialData.productId);
      if (product) {
        setSelectedProduct(product);
      }
    } else {
      // Reset form for add mode
      setFormData({
        productId: "",
        variantId: "",
        variantName: "",
        stockQty: 0,
        importPrice: 0,
        price: 0,
        supplier: "",
        brandId: undefined,
      });
      setSelectedProduct(null);
    }
  }, [initialData, mode, products]);

  const handleProductChange = (productId: string) => {
    const product = products.find((p) => p.id === productId);
    setSelectedProduct(product || null);
    setFormData((prev) => ({
      ...prev,
      productId,
      variantId: "",
      variantName: "",
      price: 0, // Reset price when product changes
    }));
  };

  const handleVariantChange = (variantSize: string) => {
    if (!selectedProduct) return;

    const variant = selectedProduct.variants?.find(
      (v) => v.name === variantSize
    );
    setFormData((prev) => ({
      ...prev,
      variantId: `variant_${Date.now()}`,
      variantName: variantSize,
      price: variant?.price || 0,
    }));
  };

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat("vi-VN").format(price);
  };

  const handlePriceChange = (field: "importPrice" | "price", value: string) => {
    const numericValue = value.replace(/[^\d]/g, "");
    setFormData((prev) => ({
      ...prev,
      [field]: numericValue ? parseInt(numericValue) : 0,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.productId || !formData.variantName) {
      alert("Vui lòng chọn sản phẩm và biến thể!");
      return;
    }

    if (formData.stockQty < 0) {
      alert("Số lượng tồn kho không được âm!");
      return;
    }

    if (formData.importPrice <= 0 || formData.price <= 0) {
      alert("Giá nhập và giá bán phải lớn hơn 0!");
      return;
    }

    try {
      await onSubmit(formData);
      // Reset form after successful submission
      if (mode === "add") {
        setFormData({
          productId: "",
          variantId: "",
          variantName: "",
          stockQty: 0,
          importPrice: 0,
          price: 0,
          supplier: "",
          brandId: undefined,
        });
        setSelectedProduct(null);
      }
    } catch (error) {
      console.error("Error submitting form:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "add" ? "Nhập kho mới" : "Chỉnh sửa tồn kho"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 p-2">
          {/* Product Selection */}
          <div>
            <Label className="mb-2">Sản phẩm</Label>
            <Select
              value={formData.productId}
              onValueChange={handleProductChange}
              disabled={mode === "edit"}
            >
              <SelectTrigger>
                <SelectValue placeholder="Chọn sản phẩm" />
              </SelectTrigger>
              <SelectContent>
                {products.map((product) => (
                  <SelectItem key={product.id} value={product.id}>
                    <div className="flex items-center gap-2">
                      <span>{product.name}</span>
                      <span className="text-xs text-muted-foreground">
                        ({product.category})
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Variant Selection */}
          {selectedProduct && selectedProduct.variants && (
            <div>
              <Label>Biến thể</Label>
              <Select
                value={formData.variantName}
                onValueChange={handleVariantChange}
                disabled={mode === "edit"}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn biến thể" />
                </SelectTrigger>
                <SelectContent>
                  {selectedProduct.variants.map((variant, index) => (
                    <SelectItem key={index} value={variant.name}>
                      <div className="flex items-center gap-2">
                        <span>{variant.name}</span>
                        <span className="text-xs text-muted-foreground">
                          - {formatPrice(variant.price)} VNĐ
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Manual Variant Name (if no variants in product) */}
          {selectedProduct &&
            (!selectedProduct.variants ||
              selectedProduct.variants.length === 0) && (
              <div>
                <Label>Tên biến thể</Label>
                <Input
                  value={formData.variantName}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      variantName: e.target.value,
                    }))
                  }
                  placeholder="Ví dụ: 50ml, 100ml, etc."
                  disabled={mode === "edit"}
                  required
                />
              </div>
            )}

          {/* Stock Quantity */}
          <div>
            <Label className="mb-2">Số lượng tồn kho</Label>
            <Input
              type="number"
              value={formData.stockQty}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  stockQty: parseInt(e.target.value) || 0,
                }))
              }
              placeholder="Nhập số lượng"
              min="0"
              required
            />
          </div>

          {/* Import Price */}
          <div>
            <Label className="mb-2">Giá nhập (VNĐ)</Label>
            <Input
              type="text"
              value={
                formData.importPrice > 0
                  ? formatPrice(formData.importPrice)
                  : ""
              }
              onChange={(e) => handlePriceChange("importPrice", e.target.value)}
              placeholder="Nhập giá nhập"
              required
            />
          </div>

          {/* Selling Price */}
          <div>
            <Label className="mb-2">Giá bán (VNĐ)</Label>
            <Input
              type="text"
              value={formData.price > 0 ? formatPrice(formData.price) : ""}
              onChange={(e) => handlePriceChange("price", e.target.value)}
              placeholder="Nhập giá bán"
              required
            />
          </div>

          {/* Supplier */}
          <div>
            <Label className="mb-2">Nhà cung cấp</Label>
            <Input
              value={formData.supplier}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, supplier: e.target.value }))
              }
              placeholder="Nhập tên nhà cung cấp"
              required
            />
          </div>

          {/* Brand Selection */}
          <div>
            <Label className="mb-2">Thương hiệu (tùy chọn)</Label>
            <Select
              value={formData.brandId || "none"}
              onValueChange={(value) =>
                setFormData((prev) => ({
                  ...prev,
                  brandId: value === "none" ? undefined : value,
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Chọn thương hiệu (tùy chọn)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Không chọn thương hiệu</SelectItem>
                {brands.map((brand) => (
                  <SelectItem key={brand.id} value={brand.id}>
                    <div className="flex items-center gap-2">
                      {brand.logoUrl && (
                        <Image
                          src={brand.logoUrl}
                          alt={brand.name}
                          width={20}
                          height={20}
                          className="w-5 h-5 object-cover rounded"
                        />
                      )}
                      <div className="flex flex-col">
                        <span className="font-medium">{brand.name}</span>
                        {brand.description && (
                          <span className="text-xs text-gray-500 truncate max-w-[150px]">
                            {brand.description}
                          </span>
                        )}
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Profit Margin Display */}
          {formData.importPrice > 0 && formData.price > 0 && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span>Giá nhập:</span>
                  <span className="font-medium">
                    {formatPrice(formData.importPrice)} VNĐ
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Giá bán:</span>
                  <span className="font-medium">
                    {formatPrice(formData.price)} VNĐ
                  </span>
                </div>
                <div className="flex justify-between border-t pt-1">
                  <span>Lợi nhuận:</span>
                  <span
                    className={`font-medium ${
                      formData.price > formData.importPrice
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {formatPrice(formData.price - formData.importPrice)} VNĐ (
                    {(
                      ((formData.price - formData.importPrice) /
                        formData.importPrice) *
                      100
                    ).toFixed(1)}
                    %)
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={loading}>
              {loading
                ? "Đang lưu..."
                : mode === "add"
                ? "Thêm vào kho"
                : "Cập nhật"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
