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
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  description: string;
  image: string;
}

function ProductForm({
  onSubmit,
  loading,
  initialData,
}: {
  onSubmit: (data: Omit<Product, "id">) => void;
  loading?: boolean;
  initialData?: Partial<Omit<Product, "id">>;
}) {
  const [name, setName] = useState(initialData?.name || "");
  const [price, setPrice] = useState(
    initialData?.price ? initialData.price.toLocaleString("vi-VN") : ""
  );
  const [category, setCategory] = useState(initialData?.category || "");
  const [description, setDescription] = useState(
    initialData?.description || ""
  );
  const [image, setImage] = useState(initialData?.image || "");
  const [uploading, setUploading] = useState(false);
  const [categories] = useState<string[]>(["FlashDeals", "new_product"]);

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

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/[^\d]/g, "");
    if (value) {
      value = new Intl.NumberFormat("vi-VN").format(parseInt(value));
    }
    setPrice(value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const priceNumber = Number(price.replace(/\./g, ""));
    onSubmit({ name, price: priceNumber, category, description, image });
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
        <Label style={{ marginBottom: 10 }}>Giá</Label>
        <Input
          type="text"
          value={price}
          onChange={handlePriceChange}
          required
          placeholder="VNĐ"
        />
      </div>
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
          <img
            src={image}
            alt="preview"
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

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

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
            };
            return {
              id,
              ...v,
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
    } catch (error) {
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
      setEditDialogOpen(null); // Đóng dialog sau khi cập nhật thành công
      toast.success("Cập nhật sản phẩm thành công!");
    } catch (error) {
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
    } catch (error) {
      setLoading(false);
      toast.error("Có lỗi xảy ra khi xóa sản phẩm!");
    }
  };

  // Tính toán pagination
  const totalPages = Math.ceil(products.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentProducts = products.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Quản lý sản phẩm</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setOpen(true)}>+ Thêm sản phẩm</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md w-full">
            <DialogHeader>
              <DialogTitle>Thêm sản phẩm mới</DialogTitle>
            </DialogHeader>
            <div className="p-2">
              <ProductForm onSubmit={handleAddProduct} loading={loading} />
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Danh sách sản phẩm</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-4 gap-3">
            {currentProducts.map((product) => (
              <Card
                key={product.id}
                className="flex flex-col h-full shadow-md hover:shadow-xl transition-all duration-300 hover:scale-105 hover:-translate-y-1 border-0 bg-white"
              >
                <div className="relative overflow-hidden rounded-t-lg">
                  <img
                    src={product.image}
                    alt={product.name}
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
                    <div className="text-primary font-semibold text-sm">
                      {new Intl.NumberFormat("vi-VN").format(product.price)} VNĐ
                    </div>
                    <div className="text-xs text-muted-foreground bg-gray-100 px-2 py-1 rounded-full inline-block">
                      {product.category}
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
                        <DialogContent className="max-w-md w-full">
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
