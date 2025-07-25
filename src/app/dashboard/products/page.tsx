import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { database } from "@/lib/firebase";
import { ref, onValue, push, set, remove } from "firebase/database";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
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
import { ref as dbRef, get } from "firebase/database";
import { toast } from "sonner";

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

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Chỉ cho nhập số
    let value = e.target.value.replace(/[^\d]/g, "");
    // Format số theo định dạng Việt Nam
    if (value) {
      value = new Intl.NumberFormat("vi-VN").format(parseInt(value));
    }
    setPrice(value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Chuyển giá về số bằng cách bỏ dấu chấm
    const priceNumber = Number(price.replace(/\./g, ""));
    onSubmit({ name, price: priceNumber, category, description, image });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>Tên sản phẩm</Label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>
      <div>
        <Label>Giá</Label>
        <Input
          type="text"
          value={price}
          onChange={handlePriceChange}
          required
          placeholder="VNĐ"
        />
      </div>
      <div>
        <Label>Danh mục</Label>
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
        <Label>Mô tả</Label>
        <Input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />
      </div>
      <div>
        <Label>Hình ảnh</Label>
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
      setLoading(false);
      setOpen(false);
      toast.success("Thêm sản phẩm thành công!");
    } catch (error) {
      setLoading(false);
      toast.error("Có lỗi xảy ra khi thêm sản phẩm!");
    }
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
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((product) => (
              <Card key={product.id} className="flex flex-col h-full">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-48 object-cover rounded-t"
                />
                <CardContent className="flex-1 p-4">
                  <div className="space-y-2">
                    <h3
                      className="font-semibold line-clamp-2"
                      title={product.name}
                    >
                      {product.name}
                    </h3>
                    <div className="text-primary font-medium">
                      {new Intl.NumberFormat("vi-VN").format(product.price)} VNĐ
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {product.category}
                    </div>
                    <p
                      className="text-sm text-muted-foreground line-clamp-2"
                      title={product.description}
                    >
                      {product.description}
                    </p>
                    <div className="flex justify-end gap-2 mt-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline">
                            Sửa
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md w-full">
                          <DialogHeader>
                            <DialogTitle>Sửa sản phẩm</DialogTitle>
                          </DialogHeader>
                          <div className="p-2">
                            <ProductForm
                              onSubmit={async (data) => {
                                try {
                                  setLoading(true);
                                  await set(
                                    ref(database, `products/${product.id}`),
                                    data
                                  );
                                  setLoading(false);
                                  toast.success(
                                    "Cập nhật sản phẩm thành công!"
                                  );
                                } catch (error) {
                                  setLoading(false);
                                  toast.error("Có lỗi xảy ra khi cập nhật!");
                                }
                              }}
                              loading={loading}
                              initialData={product}
                            />
                          </div>
                        </DialogContent>
                      </Dialog>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={async () => {
                          try {
                            setLoading(true);
                            await remove(
                              ref(database, `products/${product.id}`)
                            );
                            setLoading(false);
                            toast.success("Xóa sản phẩm thành công!");
                          } catch (error) {
                            setLoading(false);
                            toast.error("Có lỗi xảy ra khi xóa sản phẩm!");
                          }
                        }}
                      >
                        Xóa
                      </Button>
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
