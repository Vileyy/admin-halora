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
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface ProductVariant {
  size: string;
  price: number;
  stock: number;
}

interface Product {
  id: string;
  name: string;
  category: string;
  description: string;
  image: string;
  variants: ProductVariant[];
  brandId?: string;
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
    initialData?.variants || [{ size: "", price: 0, stock: 0 }]
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
    if (field === "price" || field === "stock") {
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
    setVariants([...variants, { size: "", price: 0, stock: 0 }]);
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
        variant.size.trim() !== "" && variant.price > 0 && variant.stock >= 0
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
                    value={variant.stock}
                    onChange={(e) =>
                      handleVariantChange(index, "stock", e.target.value)
                    }
                    placeholder="100"
                    className="text-xs"
                    min="0"
                    required
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

export default function ProductsPage({ category }: { category?: string }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Reset currentPage khi category thay đổi
  React.useEffect(() => {
    setCurrentPage(1);
  }, [category]);

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
            };
            return {
              id,
              ...v,
            };
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
            };
            return {
              id,
              name: v.name,
              category: v.category,
              description: v.description,
              image: v.image,
              variants: [{ size: "Mặc định", price: v.price, stock: 100 }],
              brandId: v.brandId,
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

  // Lọc sản phẩm theo category nếu có
  const filteredProducts = category
    ? products.filter((product) => product.category === category)
    : products;

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
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setOpen(true)}>
              +{" "}
              {category === "FlashDeals"
                ? "Thêm FlashDeals"
                : category === "new_product"
                ? "Thêm Sản phẩm mới"
                : "Thêm sản phẩm"}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {category === "FlashDeals"
                  ? "Thêm sản phẩm FlashDeals"
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
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-4 gap-3">
            {currentProducts.map((product) => (
              <Card
                key={product.id}
                className="flex flex-col h-full shadow-md hover:shadow-xl transition-all duration-300 hover:scale-105 hover:-translate-y-1 border-0 bg-white"
              >
                <div className="relative overflow-hidden rounded-t-lg">
                  <Image
                    src={product.image}
                    alt={product.name}
                    width={200}
                    height={128}
                    className="w-full h-32 object-cover transition-transform duration-300 hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors duration-300" />
                </div>
                <CardContent className="flex-1 p-3">
                  <div className="space-y-1.5">
                    <h3
                      className="font-medium text-sm line-clamp-2 leading-tight hover:text-primary transition-colors duration-200"
                      title={product.name}
                    >
                      {product.name}
                    </h3>
                    <div className="space-y-1">
                      {product.variants.map((variant, idx) => (
                        <div key={idx} className="text-xs">
                          <span className="font-medium text-primary">
                            {variant.size}:{" "}
                            {new Intl.NumberFormat("vi-VN").format(
                              variant.price
                            )}{" "}
                            VNĐ
                          </span>
                          <span className="text-muted-foreground ml-2">
                            (SL: {variant.stock})
                          </span>
                        </div>
                      ))}
                    </div>
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
                    <div className="flex justify-end gap-1 mt-3 pt-2 border-t border-gray-100">
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
                            className="text-xs px-3 py-1.5 h-8 hover:bg-blue-50 hover:border-blue-300 transition-colors duration-200"
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
                            className="text-xs px-3 py-1.5 h-8 hover:bg-red-600 transition-colors duration-200"
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
