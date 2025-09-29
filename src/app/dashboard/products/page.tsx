"use client";
import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { database } from "@/lib/firebase";
import { ref, onValue, push, set, remove } from "firebase/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Brand } from "@/types/Brand";
import Image from "next/image";
import { useInventoryData } from "@/hooks/useInventoryData";
import { StockStatus } from "@/components/products/StockStatus";
import { ProductStockSummary } from "@/components/products/ProductStockSummary";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  IconSearch,
  IconFilter,
  IconLayoutGrid,
  IconList,
} from "@tabler/icons-react";

interface ProductVariant {
  size: string;
  price: number;
  stockQty?: number; // Số lượng tồn kho
}

interface Product {
  id: string;
  name: string;
  category: string;
  description: string;
  image: string;
  variants: ProductVariant[];
  brandId?: string;
  originalProductId?: string;
}

// Inventory product interface
interface InventoryProduct {
  id: string;
  name: string;
  category: string;
  description: string;
  supplier?: string;
  brandId?: string;
  media?: Array<{
    id: string;
    url: string;
    type: string;
  }>;
  variants: Array<{
    id: string;
    name: string;
    price: number;
    importPrice: number;
    stockQty: number;
  }>;
}

// Helper function to filter available products to avoid duplication
function filterAvailableProducts(
  allInventoryProducts: InventoryProduct[],
  existingProducts: Product[],
  mode: "flashDeal" | "newProduct"
): InventoryProduct[] {
  // Get all product names and originalProductIds that already exist in ANY category
  const existingProductNames = new Set(
    existingProducts.map((p) => p.name.toLowerCase())
  );

  const existingOriginalProductIds = new Set(
    existingProducts
      .filter((p) => p.originalProductId)
      .map((p) => p.originalProductId!)
  );

  // Filter out products that already exist as products (regardless of category)
  // Check both by name and by originalProductId to prevent duplicates
  const filtered = allInventoryProducts.filter((inventoryProduct) => {
    const nameExists = existingProductNames.has(
      inventoryProduct.name.toLowerCase()
    );
    const idExists = existingOriginalProductIds.has(inventoryProduct.id);
    return !nameExists && !idExists;
  });

  console.log(
    `[${mode} Filter] Total inventory: ${allInventoryProducts.length}, Already exists by name: ${existingProductNames.size}, Already exists by ID: ${existingOriginalProductIds.size}, Available: ${filtered.length}`
  );
  return filtered;
}

function ProductForm({
  onSubmit,
  loading,
  initialData,
  category: fixedCategory,
}: {
  onSubmit: (data: Omit<Product, "id">) => void;
  loading?: boolean;
  initialData?: Partial<Omit<Product, "id">>;
  category?: string;
}) {
  const [name, setName] = useState(initialData?.name || "");
  const [category, setCategory] = useState(
    initialData?.category || fixedCategory || ""
  );
  const [description, setDescription] = useState(
    initialData?.description || ""
  );
  const [image, setImage] = useState(initialData?.image || "");
  const [variants, setVariants] = useState<ProductVariant[]>(
    initialData?.variants || [{ size: "", price: 0, stockQty: 0 }]
  );
  const [brandId, setBrandId] = useState(
    initialData?.brandId ? initialData.brandId : "none"
  );
  const [uploading, setUploading] = useState(false);
  const [categories] = useState<string[]>(["FlashDeals", "new_product"]);
  const [brands, setBrands] = useState<Brand[]>([]);

  // Load brands realtime
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

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error(`Upload failed: ${res.status}`);
      }

      const data = await res.json();

      if (data.error) {
        throw new Error(data.error);
      }

      setImage(data.secure_url || data.url || "");
    } catch (error) {
      console.error("Upload error:", error);
      alert(
        "Lỗi upload ảnh: " +
          (error instanceof Error ? error.message : "Unknown error")
      );
    } finally {
      setUploading(false);
    }
  };

  const handleVariantChange = (
    index: number,
    field: keyof ProductVariant,
    value: string | number
  ) => {
    const updatedVariants = [...variants];
    if (field === "price" || field === "stockQty") {
      updatedVariants[index] = {
        ...updatedVariants[index],
        [field]: Number(value),
      };
    } else if (field === "size") {
      updatedVariants[index] = {
        ...updatedVariants[index],
        [field]: String(value),
      };
    }
    setVariants(updatedVariants);
  };

  const addVariant = () => {
    setVariants([...variants, { size: "", price: 0, stockQty: 0 }]);
  };

  const removeVariant = (index: number) => {
    if (variants.length > 1) {
      setVariants(variants.filter((_, i) => i !== index));
    }
  };

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat("vi-VN").format(price);
  };

  const handleVariantPriceChange = (index: number, value: string) => {
    const numericValue = value.replace(/[^\d]/g, "");
    handleVariantChange(
      index,
      "price",
      numericValue ? parseInt(numericValue) : 0
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate variants
    const validVariants = variants.filter(
      (variant) =>
        variant.size.trim() !== "" &&
        variant.price > 0 &&
        (variant.stockQty || 0) >= 0
    );

    if (validVariants.length === 0) {
      alert("Vui lòng thêm ít nhất một biến thể hợp lệ!");
      return;
    }

    const finalCategory = fixedCategory || category;
    onSubmit({
      name,
      category: finalCategory,
      description,
      image,
      variants: validVariants,
      brandId: brandId && brandId !== "none" ? brandId : undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label style={{ marginBottom: 10 }}>Tên sản phẩm</Label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>
      <div>
        <div className="flex items-center justify-between mb-3">
          <Label>Biến thể sản phẩm (Dung tích & Giá)</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addVariant}
            className="text-xs"
          >
            + Thêm biến thể
          </Button>
        </div>
        <div className="space-y-3 max-h-60 overflow-y-auto">
          {variants.map((variant, index) => (
            <div key={index} className="border rounded-lg p-3 bg-gray-50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">
                  Biến thể {index + 1}
                </span>
                {variants.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeVariant(index)}
                    className="text-xs text-red-600 hover:text-red-700"
                  >
                    Xóa
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label className="text-xs">Dung tích</Label>
                  <Input
                    type="text"
                    value={variant.size}
                    onChange={(e) =>
                      handleVariantChange(index, "size", e.target.value)
                    }
                    placeholder="50ml"
                    className="text-xs"
                    required
                  />
                </div>
                <div>
                  <Label className="text-xs">Giá (VNĐ)</Label>
                  <Input
                    type="text"
                    value={variant.price > 0 ? formatPrice(variant.price) : ""}
                    onChange={(e) =>
                      handleVariantPriceChange(index, e.target.value)
                    }
                    placeholder="99,000"
                    className="text-xs"
                    required
                  />
                </div>
                <div>
                  <Label className="text-xs">Tồn kho</Label>
                  <Input
                    type="number"
                    value={variant.stockQty || ""}
                    onChange={(e) =>
                      handleVariantChange(
                        index,
                        "stockQty",
                        parseInt(e.target.value) || 0
                      )
                    }
                    placeholder="0"
                    className="text-xs"
                    min="0"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Brand Selection */}
      <div>
        <Label style={{ marginBottom: 10 }}>Thương hiệu</Label>
        <Select value={brandId} onValueChange={setBrandId}>
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
                  <span>{brand.name}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {!fixedCategory && (
        <div>
          <Label style={{ marginBottom: 10 }}>Danh mục</Label>
          <Select value={category} onValueChange={setCategory} required>
            <SelectTrigger>
              <SelectValue placeholder="Chọn danh mục" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat, idx) => (
                <SelectItem key={idx} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      {fixedCategory && (
        <div>
          <Label style={{ marginBottom: 10 }}>Danh mục</Label>
          <div className="px-3 py-2 bg-gray-100 border rounded-md text-sm">
            {fixedCategory === "new_product" ? "Sản phẩm mới" : fixedCategory}
          </div>
        </div>
      )}
      <div>
        <Label style={{ marginBottom: 5 }}>Mô tả</Label>
        <textarea
          className="shadcn-textarea w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          rows={4}
          placeholder="Nhập mô tả sản phẩm"
        />
      </div>
      <div>
        <Label style={{ marginBottom: 10 }}>Hình ảnh</Label>
        {image && (
          <Image
            src={image}
            alt="preview"
            width={96}
            height={96}
            className="w-24 h-24 object-cover mb-2 rounded"
          />
        )}
        <Input type="file" accept="image/*" onChange={handleImageChange} />
        {uploading && <div>Đang upload ảnh...</div>}
      </div>
      <Button type="submit" disabled={loading || uploading} className="w-full">
        {loading ? "Đang lưu..." : "Lưu sản phẩm"}
      </Button>
    </form>
  );
}

// NewProduct form component (tương tự FlashDeals)
function NewProductForm({
  onSubmit,
  loading,
}: {
  onSubmit: (data: Omit<Product, "id">) => void;
  loading?: boolean;
}) {
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [selectedProduct, setSelectedProduct] =
    useState<InventoryProduct | null>(null);
  const [selectedVariants, setSelectedVariants] = useState<string[]>([]);
  const [customDescription, setCustomDescription] = useState<string>("");
  const [customImages, setCustomImages] = useState<string[]>([]);
  const [inventoryProducts, setInventoryProducts] = useState<
    InventoryProduct[]
  >([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [existingProducts, setExistingProducts] = useState<Product[]>([]);
  const [filteredInventoryProducts, setFilteredInventoryProducts] = useState<
    InventoryProduct[]
  >([]);

  // Load inventory products
  useEffect(() => {
    const inventoryRef = ref(database, "inventory");
    const unsubscribe = onValue(inventoryRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) return setInventoryProducts([]);

      const productsArray = Object.entries(data)
        .map(([id, value]: [string, unknown]) => {
          if (value && typeof value === "object") {
            return {
              id,
              ...value,
            } as InventoryProduct;
          }
          return null;
        })
        .filter((item): item is InventoryProduct => item !== null);

      setInventoryProducts(productsArray);
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

  // Load existing products (all products from both categories)
  useEffect(() => {
    const productsRef = ref(database, "products");
    const unsubscribe = onValue(productsRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        setExistingProducts([]);
        return;
      }

      const allProducts = Object.entries(data)
        .map(([id, value]: [string, unknown]) => {
          if (
            typeof value === "object" &&
            value !== null &&
            "name" in value &&
            "category" in value &&
            "description" in value &&
            "image" in value &&
            "variants" in value
          ) {
            return {
              id,
              ...value,
            } as Product;
          }
          return null;
        })
        .filter((item): item is Product => item !== null);

      setExistingProducts(allProducts);
    });
    return () => unsubscribe();
  }, []);

  // Filter inventory products to avoid duplication
  useEffect(() => {
    const filtered = filterAvailableProducts(
      inventoryProducts,
      existingProducts,
      "newProduct"
    );
    setFilteredInventoryProducts(filtered);
  }, [inventoryProducts, existingProducts]);

  // Handle product selection
  const handleProductChange = (productId: string) => {
    setSelectedProductId(productId);
    const product = filteredInventoryProducts.find((p) => p.id === productId);
    if (product) {
      setSelectedProduct(product);

      // Reset selections
      setSelectedVariants([]);
      setCustomDescription(product.description || "");
      setCustomImages(product.media?.map((m) => m.url) || []);
    }
  };

  // Handle variant selection
  const handleVariantSelection = (variantId: string, checked: boolean) => {
    if (checked) {
      setSelectedVariants((prev) => [...prev, variantId]);
    } else {
      setSelectedVariants((prev) => prev.filter((id) => id !== variantId));
    }
  };

  // Format price
  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat("vi-VN").format(price);
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedProductId) {
      toast.error("Vui lòng chọn sản phẩm!");
      return;
    }

    if (selectedVariants.length === 0) {
      toast.error("Vui lòng chọn ít nhất một biến thể!");
      return;
    }

    if (!selectedProduct) {
      toast.error("Vui lòng chọn sản phẩm!");
      return;
    }

    // Tạo sản phẩm mới từ sản phẩm kho - lưu vào nhánh products
    const productData = {
      name: selectedProduct.name,
      category: "new_product",
      description: customDescription,
      image:
        customImages.length > 0
          ? customImages[0]
          : selectedProduct.media?.[0]?.url || "",
      variants: selectedVariants.map((variantId) => {
        const variant = selectedProduct.variants.find(
          (v) => v.id === variantId
        );
        if (!variant) {
          throw new Error(`Không tìm thấy biến thể ${variantId}`);
        }
        return {
          size: variant.name,
          price: variant.price, // Giữ nguyên giá gốc
          stockQty: variant.stockQty || 0, // Lấy số lượng tồn kho từ inventory
        };
      }),
      brandId: selectedProduct.brandId,
      // Lưu ID sản phẩm gốc để có thể tra cứu tồn kho
      originalProductId: selectedProductId,
    };

    // Gọi onSubmit với productData để lưu vào products
    onSubmit(productData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Product Selection */}
      <div className="space-y-3">
        <Label className="text-base font-medium">Chọn sản phẩm từ kho</Label>
        <Select
          value={selectedProductId}
          onValueChange={handleProductChange}
          required
        >
          <SelectTrigger className="h-12">
            <SelectValue placeholder="Chọn sản phẩm từ kho hàng..." />
          </SelectTrigger>
          <SelectContent className="max-h-60">
            {filteredInventoryProducts.map((product) => (
              <SelectItem key={product.id} value={product.id}>
                <div className="flex items-center gap-3">
                  {product.media && product.media[0] && (
                    <Image
                      src={product.media[0].url}
                      alt={product.name}
                      width={32}
                      height={32}
                      className="w-8 h-8 object-cover rounded"
                    />
                  )}
                  <div>
                    <div className="font-medium">{product.name}</div>
                    <div className="text-xs text-gray-500 flex items-center gap-1">
                      {product.brandId &&
                        brands.find((b) => b.id === product.brandId) && (
                          <span>
                            {brands.find((b) => b.id === product.brandId)?.name}
                          </span>
                        )}
                      <span>• {product.variants?.length || 0} biến thể</span>
                    </div>
                  </div>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Product Information */}
      {selectedProduct && (
        <div className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-lg mb-3">Thông tin sản phẩm</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Tên:</span>
                <div className="font-medium">{selectedProduct.name}</div>
              </div>
              <div>
                <span className="text-gray-600">Thương hiệu:</span>
                <div className="font-medium">
                  {selectedProduct.brandId &&
                  brands.find((b) => b.id === selectedProduct.brandId)
                    ? brands.find((b) => b.id === selectedProduct.brandId)?.name
                    : "Không có"}
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label>Mô tả sản phẩm</Label>
            <Textarea
              value={customDescription}
              onChange={(e) => setCustomDescription(e.target.value)}
              placeholder="Nhập mô tả cho sản phẩm mới..."
              rows={3}
              className="resize-none"
            />
          </div>

          {/* Images */}
          {selectedProduct.media && selectedProduct.media.length > 0 && (
            <div className="space-y-2">
              <Label>Hình ảnh sản phẩm</Label>
              <div className="grid grid-cols-4 gap-2">
                {selectedProduct.media.map((media, index) => (
                  <div key={index} className="relative">
                    <Image
                      src={media.url}
                      alt={`Image ${index + 1}`}
                      width={80}
                      height={80}
                      className="w-20 h-20 object-cover rounded border"
                    />
                    <Checkbox
                      checked={customImages.includes(media.url)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setCustomImages((prev) => [...prev, media.url]);
                        } else {
                          setCustomImages((prev) =>
                            prev.filter((url) => url !== media.url)
                          );
                        }
                      }}
                      className="absolute top-1 right-1"
                    />
                  </div>
                ))}
              </div>
              {customImages.length > 0 && (
                <div className="text-sm text-green-600">
                  ✓ Đã chọn {customImages.length} hình ảnh
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Variants Selection */}
      {selectedProduct && selectedProduct.variants && (
        <div className="space-y-3">
          <Label className="text-base font-medium">
            Chọn biến thể để thêm vào sản phẩm mới
          </Label>
          <div className="space-y-2">
            {selectedProduct.variants.map((variant) => (
              <div
                key={variant.id}
                className={`border rounded-lg p-4 ${
                  selectedVariants.includes(variant.id)
                    ? "bg-blue-50 border-blue-200"
                    : "bg-white border-gray-200"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={selectedVariants.includes(variant.id)}
                    onCheckedChange={(checked) =>
                      handleVariantSelection(variant.id, checked as boolean)
                    }
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{variant.name}ml</div>
                        <div className="text-sm text-gray-500">
                          Giá: {formatPrice(variant.price)} VNĐ • Tồn kho:{" "}
                          {variant.stockQty}
                        </div>
                      </div>
                      {selectedVariants.includes(variant.id) && (
                        <div className="text-sm text-green-600 font-medium">
                          ✓ Đã chọn
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {selectedVariants.length > 0 && (
            <div className="text-sm text-green-600 bg-green-50 p-2 rounded">
              Đã chọn {selectedVariants.length} biến thể
            </div>
          )}
        </div>
      )}

      {/* Submit Button */}
      <div className="pt-4">
        <Button
          type="submit"
          disabled={
            loading || !selectedProductId || selectedVariants.length === 0
          }
          className="w-full h-12"
        >
          {loading ? "Đang tạo sản phẩm mới..." : "Tạo sản phẩm mới"}
        </Button>

        {selectedProductId && selectedVariants.length === 0 && (
          <div className="mt-2 text-sm text-orange-600 text-center">
            Vui lòng chọn ít nhất một biến thể
          </div>
        )}

        {!selectedProductId && (
          <div className="mt-2 text-sm text-red-600 text-center">
            Vui lòng chọn sản phẩm trước
          </div>
        )}
      </div>
    </form>
  );
}

// FlashDeals form component
function FlashDealsForm({
  onSubmit,
  loading,
}: {
  onSubmit: (data: Omit<Product, "id">) => void;
  loading?: boolean;
}) {
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [selectedProduct, setSelectedProduct] =
    useState<InventoryProduct | null>(null);
  const [selectedVariants, setSelectedVariants] = useState<string[]>([]);
  const [flashDealPrices, setFlashDealPrices] = useState<{
    [key: string]: number;
  }>({});
  const [customDescription, setCustomDescription] = useState<string>("");
  const [customImages, setCustomImages] = useState<string[]>([]);
  const [inventoryProducts, setInventoryProducts] = useState<
    InventoryProduct[]
  >([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [existingProducts, setExistingProducts] = useState<Product[]>([]);
  const [filteredInventoryProducts, setFilteredInventoryProducts] = useState<
    InventoryProduct[]
  >([]);

  // Load inventory products
  useEffect(() => {
    const inventoryRef = ref(database, "inventory");
    const unsubscribe = onValue(inventoryRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) return setInventoryProducts([]);

      const productsArray = Object.entries(data)
        .map(([id, value]: [string, unknown]) => {
          if (value && typeof value === "object") {
            return {
              id,
              ...value,
            } as InventoryProduct;
          }
          return null;
        })
        .filter((item): item is InventoryProduct => item !== null);

      setInventoryProducts(productsArray);
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

  // Load existing products (all products from both categories)
  useEffect(() => {
    const productsRef = ref(database, "products");
    const unsubscribe = onValue(productsRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        setExistingProducts([]);
        return;
      }

      const allProducts = Object.entries(data)
        .map(([id, value]: [string, unknown]) => {
          if (
            typeof value === "object" &&
            value !== null &&
            "name" in value &&
            "category" in value &&
            "description" in value &&
            "image" in value &&
            "variants" in value
          ) {
            return {
              id,
              ...value,
            } as Product;
          }
          return null;
        })
        .filter((item): item is Product => item !== null);

      setExistingProducts(allProducts);
    });
    return () => unsubscribe();
  }, []);

  // Filter inventory products to avoid duplication
  useEffect(() => {
    const filtered = filterAvailableProducts(
      inventoryProducts,
      existingProducts,
      "flashDeal"
    );
    setFilteredInventoryProducts(filtered);
  }, [inventoryProducts, existingProducts]);

  // Handle product selection
  const handleProductChange = (productId: string) => {
    setSelectedProductId(productId);
    const product = filteredInventoryProducts.find((p) => p.id === productId);
    if (product) {
      setSelectedProduct(product);

      // Reset selections
      setSelectedVariants([]);
      setFlashDealPrices({});
      setCustomDescription(product.description || "");
      setCustomImages(product.media?.map((m) => m.url) || []);
    }
  };

  // Handle variant selection
  const handleVariantSelection = (variantId: string, checked: boolean) => {
    if (checked) {
      setSelectedVariants((prev) => [...prev, variantId]);
      // Tự động set giá FlashDeal = giá gốc khi chọn biến thể
      if (selectedProduct) {
        const variant = selectedProduct.variants.find(
          (v) => v.id === variantId
        );
        if (variant) {
          setFlashDealPrices((prev) => ({
            ...prev,
            [variantId]: variant.price,
          }));
        }
      }
    } else {
      setSelectedVariants((prev) => prev.filter((id) => id !== variantId));
      // Remove flash deal price for unselected variant
      const newPrices = { ...flashDealPrices };
      delete newPrices[variantId];
      setFlashDealPrices(newPrices);
    }
  };

  // Flash deal price is now automatically set to original price

  // Format price
  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat("vi-VN").format(price);
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedProductId) {
      toast.error("Vui lòng chọn sản phẩm!");
      return;
    }

    if (selectedVariants.length === 0) {
      toast.error("Vui lòng chọn ít nhất một biến thể!");
      return;
    }

    // Validate flash deal prices - giờ chỉ cần kiểm tra có giá hay không
    const invalidVariants = selectedVariants.filter((variantId) => {
      const flashDealPrice = flashDealPrices[variantId] || 0;
      return flashDealPrice <= 0;
    });

    if (invalidVariants.length > 0) {
      toast.error("Có lỗi với giá FlashDeal!");
      return;
    }

    if (!selectedProduct) {
      toast.error("Vui lòng chọn sản phẩm!");
      return;
    }

    // Tạo sản phẩm FlashDeal từ sản phẩm kho - lưu vào nhánh products
    const productData = {
      name: selectedProduct.name,
      category: "FlashDeals", // Tự động set category là FlashDeals
      description: customDescription,
      image:
        customImages.length > 0
          ? customImages[0]
          : selectedProduct.media?.[0]?.url || "",
      variants: selectedVariants.map((variantId) => {
        const variant = selectedProduct.variants.find(
          (v) => v.id === variantId
        );
        if (!variant) {
          throw new Error(`Không tìm thấy biến thể ${variantId}`);
        }
        return {
          size: variant.name,
          price: flashDealPrices[variantId] || variant.price,
          stockQty: variant.stockQty || 0, // Lấy số lượng tồn kho từ inventory
        };
      }),
      brandId: selectedProduct.brandId,
      // Lưu ID sản phẩm gốc để có thể tra cứu tồn kho
      originalProductId: selectedProductId,
    };

    // Gọi onSubmit với productData để lưu vào products
    onSubmit(productData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Product Selection */}
      <div className="space-y-3">
        <Label className="text-base font-medium">Chọn sản phẩm từ kho</Label>
        <Select
          value={selectedProductId}
          onValueChange={handleProductChange}
          required
        >
          <SelectTrigger className="h-12">
            <SelectValue placeholder="Chọn sản phẩm từ kho hàng..." />
          </SelectTrigger>
          <SelectContent className="max-h-60">
            {filteredInventoryProducts.map((product) => (
              <SelectItem key={product.id} value={product.id}>
                <div className="flex items-center gap-3">
                  {product.media && product.media[0] && (
                    <Image
                      src={product.media[0].url}
                      alt={product.name}
                      width={32}
                      height={32}
                      className="w-8 h-8 object-cover rounded"
                    />
                  )}
                  <div>
                    <div className="font-medium">{product.name}</div>
                    <div className="text-xs text-gray-500 flex items-center gap-1">
                      {product.brandId &&
                        brands.find((b) => b.id === product.brandId) && (
                          <span>
                            {brands.find((b) => b.id === product.brandId)?.name}
                          </span>
                        )}
                      <span>• {product.variants?.length || 0} biến thể</span>
                    </div>
                  </div>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Product Information */}
      {selectedProduct && (
        <div className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-lg mb-3">Thông tin sản phẩm</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Tên:</span>
                <div className="font-medium">{selectedProduct.name}</div>
              </div>
              <div>
                <span className="text-gray-600">Thương hiệu:</span>
                <div className="font-medium">
                  {selectedProduct.brandId &&
                  brands.find((b) => b.id === selectedProduct.brandId)
                    ? brands.find((b) => b.id === selectedProduct.brandId)?.name
                    : "Không có"}
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label>Mô tả sản phẩm</Label>
            <Textarea
              value={customDescription}
              onChange={(e) => setCustomDescription(e.target.value)}
              placeholder="Nhập mô tả cho FlashDeal..."
              rows={3}
              className="resize-none"
            />
          </div>

          {/* Images */}
          {selectedProduct.media && selectedProduct.media.length > 0 && (
            <div className="space-y-2">
              <Label>Hình ảnh sản phẩm</Label>
              <div className="grid grid-cols-4 gap-2">
                {selectedProduct.media.map((media, index) => (
                  <div key={index} className="relative">
                    <Image
                      src={media.url}
                      alt={`Image ${index + 1}`}
                      width={80}
                      height={80}
                      className="w-20 h-20 object-cover rounded border"
                    />
                    <Checkbox
                      checked={customImages.includes(media.url)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setCustomImages((prev) => [...prev, media.url]);
                        } else {
                          setCustomImages((prev) =>
                            prev.filter((url) => url !== media.url)
                          );
                        }
                      }}
                      className="absolute top-1 right-1"
                    />
                  </div>
                ))}
              </div>
              {customImages.length > 0 && (
                <div className="text-sm text-green-600">
                  ✓ Đã chọn {customImages.length} hình ảnh
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Variants Selection */}
      {selectedProduct && selectedProduct.variants && (
        <div className="space-y-3">
          <Label className="text-base font-medium">
            Chọn biến thể áp dụng FlashDeal
          </Label>
          <div className="space-y-2">
            {selectedProduct.variants.map((variant) => (
              <div
                key={variant.id}
                className={`border rounded-lg p-4 ${
                  selectedVariants.includes(variant.id)
                    ? "bg-blue-50 border-blue-200"
                    : "bg-white border-gray-200"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={selectedVariants.includes(variant.id)}
                    onCheckedChange={(checked) =>
                      handleVariantSelection(variant.id, checked as boolean)
                    }
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{variant.name}ml</div>
                        <div className="text-sm text-gray-500">
                          Giá: {formatPrice(variant.price)} VNĐ • Tồn kho:{" "}
                          {variant.stockQty}
                        </div>
                      </div>
                      {selectedVariants.includes(variant.id) && (
                        <div className="text-sm text-green-600 font-medium">
                          ✓ Đã chọn
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {selectedVariants.length > 0 && (
            <div className="text-sm text-green-600 bg-green-50 p-2 rounded">
              Đã chọn {selectedVariants.length} biến thể
            </div>
          )}
        </div>
      )}

      {/* Submit Button */}
      <div className="pt-4">
        <Button
          type="submit"
          disabled={
            loading || !selectedProductId || selectedVariants.length === 0
          }
          className="w-full h-12"
        >
          {loading ? "Đang tạo FlashDeal..." : "Tạo FlashDeal"}
        </Button>

        {selectedProductId && selectedVariants.length === 0 && (
          <div className="mt-2 text-sm text-orange-600 text-center">
            Vui lòng chọn ít nhất một biến thể
          </div>
        )}

        {!selectedProductId && (
          <div className="mt-2 text-sm text-red-600 text-center">
            Vui lòng chọn sản phẩm trước
          </div>
        )}
      </div>
    </form>
  );
}

export default function ProductsPage({ category }: { category?: string }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // FlashDeals state
  const [flashDealsOpen, setFlashDealsOpen] = useState(false);

  // NewProduct state
  const [newProductOpen, setNewProductOpen] = useState(false);

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBrand, setSelectedBrand] = useState<string>("all");
  const [selectedStockStatus, setSelectedStockStatus] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Get inventory data
  const { getStockQuantity } = useInventoryData();

  // Reset currentPage khi category hoặc filters thay đổi
  React.useEffect(() => {
    setCurrentPage(1);
  }, [category, searchTerm, selectedBrand, selectedStockStatus]);

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

  useEffect(() => {
    const productsRef = ref(database, "products");
    const unsubscribe = onValue(productsRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) return setProducts([]);
      const productsArray = Object.entries(data)
        .map(([id, value]: [string, unknown]) => {
          if (
            typeof value === "object" &&
            value !== null &&
            "name" in value &&
            "category" in value &&
            "description" in value &&
            "image" in value &&
            "variants" in value
          ) {
            const v = value as {
              name: string;
              category: string;
              description: string;
              image: string;
              variants: ProductVariant[];
              brandId?: string;
              originalProductId?: string;
            };
            const product = {
              id,
              ...v,
            };

            // Debug: Log products with originalProductId
            if (product.originalProductId) {
              console.log("FlashDeal product loaded:", {
                id: product.id,
                name: product.name,
                originalProductId: product.originalProductId,
              });
            }

            return product;
          }
          // Support legacy products without variants
          if (
            typeof value === "object" &&
            value !== null &&
            "name" in value &&
            "price" in value &&
            "category" in value &&
            "description" in value &&
            "image" in value
          ) {
            const v = value as {
              name: string;
              price: number;
              category: string;
              description: string;
              image: string;
              brandId?: string;
              originalProductId?: string;
            };
            return {
              id,
              name: v.name,
              category: v.category,
              description: v.description,
              image: v.image,
              variants: [{ size: "Mặc định", price: v.price, stockQty: 0 }],
              brandId: v.brandId,
              originalProductId: v.originalProductId,
            };
          }
          return null;
        })
        .filter((item): item is Product => item !== null);
      setProducts(productsArray);
    });
    return () => unsubscribe();
  }, []);

  const handleAddProduct = async (data: Omit<Product, "id">) => {
    try {
      setLoading(true);
      const productsRef = ref(database, "products");
      await push(productsRef, data);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setLoading(false);
      setOpen(false);
      setFlashDealsOpen(false);
      setNewProductOpen(false);
      toast.success("Thêm sản phẩm thành công!");
    } catch {
      setLoading(false);
      toast.error("Có lỗi xảy ra khi thêm sản phẩm!");
    }
  };

  const handleEditProduct = async (
    productId: string,
    data: Omit<Product, "id">
  ) => {
    try {
      setLoading(true);
      await set(ref(database, `products/${productId}`), data);

      // Thêm delay để hiển thị trạng thái loading lâu hơn
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setLoading(false);
      setEditDialogOpen(null);
      toast.success("Cập nhật sản phẩm thành công!");
    } catch {
      setLoading(false);
      toast.error("Có lỗi xảy ra khi cập nhật!");
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    try {
      setLoading(true);
      await remove(ref(database, `products/${productId}`));
      setLoading(false);
      setDeleteDialogOpen(null);
      toast.success("Xóa sản phẩm thành công!");
    } catch {
      setLoading(false);
      toast.error("Có lỗi xảy ra khi xóa sản phẩm!");
    }
  };

  // FlashDeal giờ sử dụng handleAddProduct để lưu vào products với category="FlashDeals"

  // Lọc sản phẩm theo category và các bộ lọc khác
  const filteredProducts = React.useMemo(() => {
    let filtered = category
      ? products.filter((product) => product.category === category)
      : products;

    // Lọc theo tên sản phẩm
    if (searchTerm.trim()) {
      filtered = filtered.filter((product) =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Lọc theo thương hiệu
    if (selectedBrand !== "all") {
      filtered = filtered.filter(
        (product) => product.brandId === selectedBrand
      );
    }

    // Lọc theo trạng thái tồn kho
    if (selectedStockStatus !== "all") {
      filtered = filtered.filter((product) => {
        const hasVariantsWithStock = product.variants?.some((variant) => {
          const stockQty =
            variant.stockQty !== undefined
              ? variant.stockQty
              : getStockQuantity(
                  product.originalProductId || product.id,
                  variant.size
                );

          switch (selectedStockStatus) {
            case "in_stock":
              return stockQty > 10;
            case "low_stock":
              return stockQty > 0 && stockQty <= 10;
            case "out_of_stock":
              return stockQty === 0;
            default:
              return true;
          }
        });
        return hasVariantsWithStock;
      });
    }

    return filtered;
  }, [
    products,
    category,
    searchTerm,
    selectedBrand,
    selectedStockStatus,
    getStockQuantity,
  ]);

  // Tính toán pagination
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentProducts = filteredProducts.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Helper function to get brand name
  const getBrandName = (brandId?: string): string => {
    if (!brandId || brandId === "none") return "";
    const brand = brands.find((b) => b.id === brandId);
    return brand?.name || "";
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">
          {category === "new_product"
            ? "Quản lý sản phẩm - Sản phẩm mới"
            : category
            ? `Quản lý sản phẩm - ${category}`
            : "Quản lý sản phẩm"}
        </h1>
        <div className="flex gap-3">
          {category === "FlashDeals" && (
            <Dialog open={flashDealsOpen} onOpenChange={setFlashDealsOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  onClick={() => setFlashDealsOpen(true)}
                >
                  + Thêm FlashDeals
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Thêm sản phẩm FlashDeals</DialogTitle>
                </DialogHeader>
                <div className="p-2">
                  <FlashDealsForm
                    onSubmit={handleAddProduct}
                    loading={loading}
                  />
                </div>
              </DialogContent>
            </Dialog>
          )}

          {category === "new_product" && (
            <Dialog open={newProductOpen} onOpenChange={setNewProductOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  onClick={() => setNewProductOpen(true)}
                >
                  + Thêm sản phẩm mới từ kho hàng
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Thêm sản phẩm mới từ kho</DialogTitle>
                </DialogHeader>
                <div className="p-2">
                  <NewProductForm
                    onSubmit={handleAddProduct}
                    loading={loading}
                  />
                </div>
              </DialogContent>
            </Dialog>
          )}

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setOpen(true)}>
                +{" "}
                {category === "FlashDeals"
                  ? "Thêm sản phẩm mới"
                  : category === "new_product"
                  ? "Thêm Sản phẩm mới"
                  : "Thêm sản phẩm"}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {category === "FlashDeals"
                    ? "Thêm sản phẩm mới"
                    : category === "new_product"
                    ? "Thêm Sản phẩm mới"
                    : "Thêm sản phẩm mới"}
                </DialogTitle>
              </DialogHeader>
              <div className="p-2">
                <ProductForm
                  onSubmit={handleAddProduct}
                  loading={loading}
                  category={category}
                />
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stock Summary */}
      <ProductStockSummary
        products={filteredProducts}
        getStockQuantity={(productId, variantSize) => {
          const product = filteredProducts.find((p) => p.id === productId);
          if (product) {
            const variant = product.variants.find(
              (v) => v.size === variantSize
            );
            if (variant && variant.stockQty !== undefined) {
              return variant.stockQty;
            }
          }

          // Fallback: sử dụng inventory service cho sản phẩm thường
          const productIdForStock = product?.originalProductId || productId;
          return getStockQuantity(productIdForStock, variantSize);
        }}
      />

      {/* Controls Section - Bộ lọc */}
      <Card className="mb-4 mt-4">
        <CardContent className="p-4 ">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex items-center gap-4 flex-1">
              <div className="relative flex-1 max-w-sm">
                <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Tìm kiếm sản phẩm..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="flex items-center gap-2">
                <IconFilter className="h-4 w-4 text-muted-foreground" />
                <Select value={selectedBrand} onValueChange={setSelectedBrand}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Thương hiệu" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả thương hiệu</SelectItem>
                    {brands.map((brand) => (
                      <SelectItem key={brand.id} value={brand.id}>
                        {brand.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <Select
                  value={selectedStockStatus}
                  onValueChange={setSelectedStockStatus}
                >
                  <SelectTrigger className="w-36">
                    <SelectValue placeholder="Tồn kho" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả</SelectItem>
                    <SelectItem value="in_stock">Còn hàng</SelectItem>
                    <SelectItem value="low_stock">Sắp hết</SelectItem>
                    <SelectItem value="out_of_stock">Hết hàng</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === "grid" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("grid")}
              >
                <IconLayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("list")}
              >
                <IconList className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Filter Summary */}
          <div className="flex justify-between items-center mt-3 pt-3 border-t text-sm text-gray-600">
            <span>
              Hiển thị {filteredProducts.length} sản phẩm
              {category &&
                ` trong danh mục ${
                  category === "new_product" ? "Sản phẩm mới" : category
                }`}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchTerm("");
                setSelectedBrand("all");
                setSelectedStockStatus("all");
              }}
              className="h-7 text-xs"
            >
              Xóa bộ lọc
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            {category === "new_product"
              ? "Danh sách Sản phẩm mới"
              : category
              ? `Danh sách sản phẩm ${category}`
              : "Danh sách sản phẩm"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className={
              viewMode === "grid"
                ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-4 gap-3"
                : "space-y-3"
            }
          >
            {currentProducts.map((product) => (
              <Card
                key={product.id}
                className={`shadow-md hover:shadow-xl transition-all duration-300 border-0 bg-white ${
                  viewMode === "grid"
                    ? "flex flex-col h-full hover:scale-105 hover:-translate-y-1"
                    : "flex flex-row items-center p-4"
                }`}
              >
                <div
                  className={`relative overflow-hidden ${
                    viewMode === "grid" ? "rounded-t-lg" : "rounded-lg mr-4"
                  }`}
                >
                  <Image
                    src={product.image}
                    alt={product.name}
                    width={viewMode === "grid" ? 200 : 80}
                    height={viewMode === "grid" ? 128 : 80}
                    className={
                      viewMode === "grid"
                        ? "w-full h-32 object-cover transition-transform duration-300 hover:scale-110"
                        : "w-20 h-20 object-cover rounded-lg"
                    }
                  />
                  {viewMode === "grid" && (
                    <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors duration-300" />
                  )}
                </div>
                <CardContent
                  className={`flex-1 ${viewMode === "grid" ? "p-3" : "p-0"}`}
                >
                  <div
                    className={
                      viewMode === "grid"
                        ? "space-y-1.5"
                        : "flex justify-between items-center w-full"
                    }
                  >
                    <div className={viewMode === "list" ? "flex-1" : ""}>
                      <h3
                        className={`font-medium leading-tight hover:text-primary transition-colors duration-200 ${
                          viewMode === "grid"
                            ? "text-sm line-clamp-2"
                            : "text-base mb-1"
                        }`}
                        title={product.name}
                      >
                        {product.name}
                      </h3>
                      {viewMode === "list" && (
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                          <div className="text-xs text-muted-foreground bg-gray-100 px-2 py-1 rounded-full inline-block">
                            {product.category}
                          </div>
                          {product.brandId && getBrandName(product.brandId) && (
                            <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full inline-block">
                              {getBrandName(product.brandId)}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <div
                      className={
                        viewMode === "grid"
                          ? "space-y-2"
                          : "flex items-center gap-4"
                      }
                    >
                      {product.variants.map((variant, idx) => {
                        // Ưu tiên sử dụng stockQty từ variant (cho FlashDeal products)
                        // Nếu không có thì mới dùng getStockQuantity từ inventory
                        let stockQty = 0;

                        if (variant.stockQty !== undefined) {
                          // FlashDeal products có stockQty trực tiếp trong variant
                          stockQty = variant.stockQty;
                          console.log("Using direct stockQty from variant:", {
                            productName: product.name,
                            variantSize: variant.size,
                            stockQty: variant.stockQty,
                          });
                        } else {
                          // Sản phẩm thường lấy từ inventory
                          const productIdForStock =
                            product.originalProductId || product.id;
                          stockQty = getStockQuantity(
                            productIdForStock,
                            variant.size
                          );
                          console.log("Using inventory stockQty:", {
                            productName: product.name,
                            variantSize: variant.size,
                            stockQty,
                          });
                        }

                        return (
                          <div
                            key={idx}
                            className={
                              viewMode === "grid" ? "space-y-1" : "text-sm"
                            }
                          >
                            <div
                              className={
                                viewMode === "grid" ? "text-xs" : "font-medium"
                              }
                            >
                              <span className="font-medium text-primary">
                                {variant.size}:{" "}
                                {new Intl.NumberFormat("vi-VN").format(
                                  variant.price
                                )}{" "}
                                VNĐ
                              </span>
                            </div>
                            <StockStatus
                              stockQty={stockQty}
                              variant={variant.size}
                              className={viewMode === "grid" ? "ml-2" : ""}
                            />
                          </div>
                        );
                      })}
                    </div>
                    {viewMode === "grid" && (
                      <>
                        <div className="flex items-center gap-2 flex-wrap">
                          <div className="text-xs text-muted-foreground bg-gray-100 px-2 py-1 rounded-full inline-block">
                            {product.category}
                          </div>
                          {product.brandId && getBrandName(product.brandId) && (
                            <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full inline-block">
                              {getBrandName(product.brandId)}
                            </div>
                          )}
                        </div>
                        <p
                          className="text-xs text-muted-foreground line-clamp-2 leading-tight"
                          title={product.description}
                        >
                          {product.description}
                        </p>
                      </>
                    )}
                    <div
                      className={`flex ${
                        viewMode === "grid"
                          ? "justify-end gap-1 mt-3 pt-2 border-t border-gray-100"
                          : "gap-2"
                      }`}
                    >
                      <Dialog
                        open={editDialogOpen === product.id}
                        onOpenChange={(open) =>
                          setEditDialogOpen(open ? product.id : null)
                        }
                      >
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            className={`hover:bg-blue-50 hover:border-blue-300 transition-colors duration-200 ${
                              viewMode === "grid"
                                ? "text-xs px-3 py-1.5 h-8"
                                : "text-sm px-4 py-2 h-9"
                            }`}
                            onClick={() => setEditDialogOpen(product.id)}
                          >
                            Sửa
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Sửa sản phẩm</DialogTitle>
                          </DialogHeader>
                          <div className="p-2">
                            <ProductForm
                              onSubmit={(data) =>
                                handleEditProduct(product.id, data)
                              }
                              loading={loading}
                              initialData={product}
                            />
                          </div>
                        </DialogContent>
                      </Dialog>
                      <Dialog
                        open={deleteDialogOpen === product.id}
                        onOpenChange={(open) =>
                          setDeleteDialogOpen(open ? product.id : null)
                        }
                      >
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="destructive"
                            className={`hover:bg-red-600 transition-colors duration-200 ${
                              viewMode === "grid"
                                ? "text-xs px-3 py-1.5 h-8"
                                : "text-sm px-4 py-2 h-9"
                            }`}
                            onClick={() => setDeleteDialogOpen(product.id)}
                          >
                            Xóa
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md w-full">
                          <DialogHeader>
                            <DialogTitle>Xác nhận xóa sản phẩm</DialogTitle>
                          </DialogHeader>
                          <div className="p-4">
                            <p className="mb-4">
                              Bạn có chắc chắn muốn xóa sản phẩm &quot;
                              {product.name}&quot; không?
                            </p>
                            <p className="text-sm text-muted-foreground mb-4">
                              Hành động này không thể hoàn tác.
                            </p>
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                onClick={() => setDeleteDialogOpen(null)}
                                disabled={loading}
                              >
                                Hủy
                              </Button>
                              <Button
                                variant="destructive"
                                onClick={() => handleDeleteProduct(product.id)}
                                disabled={loading}
                              >
                                {loading ? "Đang xóa..." : "Xóa"}
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          {totalPages > 1 && (
            <div className="mt-6">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage > 1) {
                          handlePageChange(currentPage - 1);
                        }
                      }}
                      className={
                        currentPage === 1
                          ? "pointer-events-none opacity-50"
                          : ""
                      }
                    />
                  </PaginationItem>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (page) => (
                      <PaginationItem key={page}>
                        <PaginationLink
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            handlePageChange(page);
                          }}
                          isActive={currentPage === page}
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    )
                  )}

                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage < totalPages) {
                          handlePageChange(currentPage + 1);
                        }
                      }}
                      className={
                        currentPage === totalPages
                          ? "pointer-events-none opacity-50"
                          : ""
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
