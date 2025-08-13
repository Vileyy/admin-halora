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
import { toast } from "sonner";

interface Brand {
  id: string;
  image: string;
}

function BrandForm({
  onSubmit,
  loading,
  initialData,
}: {
  onSubmit: (data: Omit<Brand, "id">) => void;
  loading?: boolean;
  initialData?: Partial<Omit<Brand, "id">>;
}) {
  const [image, setImage] = useState(initialData?.image || "");
  const [uploading, setUploading] = useState(false);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    setImage(data.secure_url || data.url || "");
    setUploading(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ image });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label style={{ marginBottom: 10 }}>Hình ảnh thương hiệu</Label>
        {image && (
          <img
            src={image}
            alt="preview"
            className="w-32 h-32 object-cover mb-2 rounded"
          />
        )}
        <Input
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          required
        />
        {uploading && <div>Đang upload ảnh...</div>}
      </div>
      <Button type="submit" disabled={loading || uploading} className="w-full">
        {loading ? "Đang lưu..." : "Lưu thương hiệu"}
      </Button>
    </form>
  );
}

export default function BrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<string | null>(null);

  useEffect(() => {
    const brandsRef = ref(database, "brands");
    const unsubscribe = onValue(brandsRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) return setBrands([]);
      const brandsArray = Object.entries(data)
        .map(([id, value]: [string, unknown]) => {
          if (typeof value === "object" && value !== null && "image" in value) {
            const v = value as {
              image: string;
            };
            return {
              id,
              ...v,
            };
          }
          return null;
        })
        .filter((item): item is Brand => item !== null);
      setBrands(brandsArray);
    });
    return () => unsubscribe();
  }, []);

  const handleAddBrand = async (data: Omit<Brand, "id">) => {
    try {
      setLoading(true);
      const brandsRef = ref(database, "brands");
      await push(brandsRef, data);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setLoading(false);
      setOpen(false);
      toast.success("Thêm thương hiệu thành công!");
    } catch (error) {
      setLoading(false);
      toast.error("Có lỗi xảy ra khi thêm thương hiệu!");
    }
  };

  const handleEditBrand = async (brandId: string, data: Omit<Brand, "id">) => {
    try {
      setLoading(true);
      await set(ref(database, `brands/${brandId}`), data);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setLoading(false);
      setEditDialogOpen(null);
      toast.success("Cập nhật thương hiệu thành công!");
    } catch (error) {
      setLoading(false);
      toast.error("Có lỗi xảy ra khi cập nhật!");
    }
  };

  const handleDeleteBrand = async (brandId: string) => {
    try {
      setLoading(true);
      await remove(ref(database, `brands/${brandId}`));
      setLoading(false);
      setDeleteDialogOpen(null);
      toast.success("Xóa thương hiệu thành công!");
    } catch (error) {
      setLoading(false);
      toast.error("Có lỗi xảy ra khi xóa thương hiệu!");
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Quản lý thương hiệu</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setOpen(true)}>+ Thêm thương hiệu</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md w-full">
            <DialogHeader>
              <DialogTitle>Thêm thương hiệu mới</DialogTitle>
            </DialogHeader>
            <div className="p-2">
              <BrandForm onSubmit={handleAddBrand} loading={loading} />
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Danh sách thương hiệu</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {brands.map((brand) => (
              <Card key={brand.id} className="flex flex-col h-full">
                <img
                  src={brand.image}
                  alt="Brand"
                  className="w-full h-48 object-cover rounded-t"
                />
                <CardContent className="flex-1 p-4">
                  <div className="space-y-2">
                    <div className="flex justify-end gap-2 mt-2">
                      <Dialog
                        open={editDialogOpen === brand.id}
                        onOpenChange={(open) =>
                          setEditDialogOpen(open ? brand.id : null)
                        }
                      >
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditDialogOpen(brand.id)}
                          >
                            Sửa
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md w-full">
                          <DialogHeader>
                            <DialogTitle>Sửa thương hiệu</DialogTitle>
                          </DialogHeader>
                          <div className="p-2">
                            <BrandForm
                              onSubmit={(data) =>
                                handleEditBrand(brand.id, data)
                              }
                              loading={loading}
                              initialData={brand}
                            />
                          </div>
                        </DialogContent>
                      </Dialog>
                      <Dialog
                        open={deleteDialogOpen === brand.id}
                        onOpenChange={(open) =>
                          setDeleteDialogOpen(open ? brand.id : null)
                        }
                      >
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => setDeleteDialogOpen(brand.id)}
                          >
                            Xóa
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md w-full">
                          <DialogHeader>
                            <DialogTitle>Xác nhận xóa thương hiệu</DialogTitle>
                          </DialogHeader>
                          <div className="p-4">
                            <p className="mb-4">
                              Bạn có chắc chắn muốn xóa thương hiệu này không?
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
                                onClick={() => handleDeleteBrand(brand.id)}
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
        </CardContent>
      </Card>
    </div>
  );
}
