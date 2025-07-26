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

interface Category {
  id: string;
  title: string;
  image: string;
}

function CategoryForm({
  onSubmit,
  loading,
  initialData,
}: {
  onSubmit: (data: Omit<Category, "id">) => void;
  loading?: boolean;
  initialData?: Partial<Omit<Category, "id">>;
}) {
  const [title, setTitle] = useState(initialData?.title || "");
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
    onSubmit({ title, image });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label style={{ marginBottom: 10 }}>Tên danh mục</Label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          placeholder="Nhập tên danh mục"
        />
      </div>
      <div>
        <Label style={{ marginBottom: 10 }}>Hình ảnh danh mục</Label>
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
        {loading ? "Đang lưu..." : "Lưu danh mục"}
      </Button>
    </form>
  );
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<string | null>(null);

  useEffect(() => {
    const categoriesRef = ref(database, "categories");
    const unsubscribe = onValue(categoriesRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) return setCategories([]);
      const categoriesArray = Object.entries(data)
        .map(([id, value]: [string, unknown]) => {
          if (
            typeof value === "object" &&
            value !== null &&
            "title" in value &&
            "image" in value
          ) {
            const v = value as {
              title: string;
              image: string;
            };
            return {
              id,
              ...v,
            };
          }
          return null;
        })
        .filter((item): item is Category => item !== null);
      setCategories(categoriesArray);
    });
    return () => unsubscribe();
  }, []);

  const handleAddCategory = async (data: Omit<Category, "id">) => {
    try {
      setLoading(true);
      const categoriesRef = ref(database, "categories");
      await push(categoriesRef, data);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setLoading(false);
      setOpen(false);
      toast.success("Thêm danh mục thành công!");
    } catch (error) {
      setLoading(false);
      toast.error("Có lỗi xảy ra khi thêm danh mục!");
    }
  };

  const handleEditCategory = async (
    categoryId: string,
    data: Omit<Category, "id">
  ) => {
    try {
      setLoading(true);
      await set(ref(database, `categories/${categoryId}`), data);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setLoading(false);
      setEditDialogOpen(null);
      toast.success("Cập nhật danh mục thành công!");
    } catch (error) {
      setLoading(false);
      toast.error("Có lỗi xảy ra khi cập nhật!");
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    try {
      setLoading(true);
      await remove(ref(database, `categories/${categoryId}`));
      setLoading(false);
      setDeleteDialogOpen(null);
      toast.success("Xóa danh mục thành công!");
    } catch (error) {
      setLoading(false);
      toast.error("Có lỗi xảy ra khi xóa danh mục!");
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Quản lý danh mục</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setOpen(true)}>+ Thêm danh mục</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md w-full">
            <DialogHeader>
              <DialogTitle>Thêm danh mục mới</DialogTitle>
            </DialogHeader>
            <div className="p-2">
              <CategoryForm onSubmit={handleAddCategory} loading={loading} />
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Danh sách danh mục</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {categories.map((category) => (
              <Card key={category.id} className="flex flex-col h-full">
                <img
                  src={category.image}
                  alt={category.title}
                  className="w-full h-48 object-cover rounded-t"
                />
                <CardContent className="flex-1 p-4">
                  <div className="space-y-2">
                    <h3
                      className="font-semibold line-clamp-2"
                      title={category.title}
                    >
                      {category.title}
                    </h3>
                    <div className="flex justify-end gap-2 mt-2">
                      <Dialog
                        open={editDialogOpen === category.id}
                        onOpenChange={(open) =>
                          setEditDialogOpen(open ? category.id : null)
                        }
                      >
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditDialogOpen(category.id)}
                          >
                            Sửa
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md w-full">
                          <DialogHeader>
                            <DialogTitle>Sửa danh mục</DialogTitle>
                          </DialogHeader>
                          <div className="p-2">
                            <CategoryForm
                              onSubmit={(data) =>
                                handleEditCategory(category.id, data)
                              }
                              loading={loading}
                              initialData={category}
                            />
                          </div>
                        </DialogContent>
                      </Dialog>
                      <Dialog
                        open={deleteDialogOpen === category.id}
                        onOpenChange={(open) =>
                          setDeleteDialogOpen(open ? category.id : null)
                        }
                      >
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => setDeleteDialogOpen(category.id)}
                          >
                            Xóa
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md w-full">
                          <DialogHeader>
                            <DialogTitle>Xác nhận xóa danh mục</DialogTitle>
                          </DialogHeader>
                          <div className="p-4">
                            <p className="mb-4">
                              Bạn có chắc chắn muốn xóa danh mục &quot;
                              {category.title}&quot; không?
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
                                onClick={() =>
                                  handleDeleteCategory(category.id)
                                }
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
