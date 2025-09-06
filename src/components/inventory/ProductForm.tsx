"use client";

import React, { useState, useEffect } from "react";
import { ProductFormData as InventoryProductFormData } from "@/types/Inventory";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Brand } from "@/types/Brand";
import { database } from "@/lib/firebase";
import { ref, onValue } from "firebase/database";
import Image from "next/image";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Trash2,
  Plus,
  Upload,
  X,
  ImageIcon,
  Video,
  Package,
  DollarSign,
  Camera,
  ShoppingCart,
} from "lucide-react";

// Type definitions are imported from @/types/Inventory

interface ProductFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: InventoryProductFormData) => Promise<void>;
  loading?: boolean;
  mode: "add" | "edit";
  initialData?: InventoryProductFormData | null;
}

export default function ProductForm({
  open,
  onOpenChange,
  onSubmit,
  loading = false,
  mode,
  initialData,
}: ProductFormProps) {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [formData, setFormData] = useState<InventoryProductFormData>(() => {
    // Initialize with initialData if in edit mode
    if (initialData && mode === "edit") {
      return {
        name: initialData.name || "",
        category: initialData.category || "",
        description: initialData.description || "",
        supplier: initialData.supplier || "",
        brandId: initialData.brandId || undefined,
        variants: initialData.variants || [],
        mediaFiles: [],
        existingMedia: initialData.existingMedia || [],
      };
    }
    return {
      name: "",
      category: "",
      description: "",
      supplier: "",
      brandId: undefined,
      variants: [],
      mediaFiles: [],
      existingMedia: [],
    };
  });

  const [mediaPreview, setMediaPreview] = useState<
    Array<{
      file?: File;
      url: string;
      type: "image" | "video";
    }>
  >(() => {
    // Initialize with existing media if in edit mode
    if (initialData && mode === "edit" && initialData.existingMedia) {
      return initialData.existingMedia.map((media) => ({
        url: media.url,
        type: media.type as "image" | "video",
      }));
    }
    return [];
  });

  const [newVariant, setNewVariant] = useState({
    name: "",
    price: 0,
    importPrice: 0,
    stockQty: 0,
  });

  // Load brands from Firebase
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

  // Update form data when mode changes
  useEffect(() => {
    if (mode === "add") {
      // Reset form when switching to add mode
      setFormData({
        name: "",
        category: "",
        description: "",
        supplier: "",
        brandId: undefined,
        variants: [],
        mediaFiles: [],
        existingMedia: [],
      });
      setMediaPreview([]);
      setNewVariant({
        name: "",
        price: 0,
        importPrice: 0,
        stockQty: 0,
      });
    } else if (mode === "edit" && initialData) {
      // console.log("ProductForm - Received initialData:", initialData); // Debug log
      // console.log("ProductForm - initialData.brandId:", initialData.brandId); // Debug log
      // // Update form when switching to edit mode with new data
      setFormData({
        name: initialData.name || "",
        category: initialData.category || "",
        description: initialData.description || "",
        supplier: initialData.supplier || "",
        brandId: initialData.brandId || undefined,
        variants: initialData.variants || [],
        mediaFiles: [],
        existingMedia: initialData.existingMedia || [],
      });

      // Set media preview for existing media
      if (initialData.existingMedia && initialData.existingMedia.length > 0) {
        setMediaPreview(
          initialData.existingMedia.map((media) => ({
            url: media.url,
            type: media.type as "image" | "video",
          }))
        );
      }
    }
  }, [mode, initialData]);

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat("vi-VN").format(price);
  };

  const handlePriceChange = (field: string, value: string) => {
    const numericValue = value.replace(/[^\d]/g, "");
    setNewVariant((prev) => ({
      ...prev,
      [field]: numericValue ? parseInt(numericValue) : 0,
    }));
  };

  const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    if (mediaPreview.length + files.length > 5) {
      alert("Chỉ được phép tối đa 5 tệp media!");
      return;
    }

    files.forEach((file) => {
      const isVideo = file.type.startsWith("video/");
      const isImage = file.type.startsWith("image/");

      if (!isImage && !isVideo) {
        alert("Chỉ chấp nhận file ảnh hoặc video!");
        return;
      }

      if (isVideo && file.size > 50 * 1024 * 1024) {
        alert("Video không được vượt quá 50MB!");
        return;
      }

      if (isImage && file.size > 5 * 1024 * 1024) {
        alert("Ảnh không được vượt quá 5MB!");
        return;
      }

      // Create placeholder image for demo
      const placeholderUrl = `https://via.placeholder.com/400x400/e5e7eb/6b7280?text=Preview+${Math.floor(
        Math.random() * 1000
      )}`;

      setMediaPreview((prev) => [
        ...prev,
        {
          file,
          url: placeholderUrl,
          type: isVideo ? "video" : "image",
        },
      ]);

      setFormData((prev) => ({
        ...prev,
        mediaFiles: [...prev.mediaFiles, file],
      }));
    });

    e.target.value = "";
  };

  const removeMedia = (index: number) => {
    setMediaPreview((prev) => {
      const newPreview = [...prev];
      newPreview.splice(index, 1);
      return newPreview;
    });

    setFormData((prev) => ({
      ...prev,
      mediaFiles: prev.mediaFiles.filter((_, i) => i !== index),
    }));
  };

  const addVariant = () => {
    if (!newVariant.name.trim()) {
      alert("Vui lòng nhập tên biến thể!");
      return;
    }

    if (newVariant.price <= 0 || newVariant.importPrice <= 0) {
      alert("Giá bán và giá nhập phải lớn hơn 0!");
      return;
    }

    if (newVariant.stockQty < 0) {
      alert("Số lượng không được âm!");
      return;
    }

    setFormData((prev) => ({
      ...prev,
      variants: [...prev.variants, { ...newVariant }],
    }));

    setNewVariant({
      name: "",
      price: 0,
      importPrice: 0,
      stockQty: 0,
    });
  };

  const removeVariant = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      alert("Vui lòng nhập tên sản phẩm!");
      return;
    }

    if (mediaPreview.length < 2) {
      alert("Cần ít nhất 2 hình ảnh/video!");
      return;
    }

    if (formData.variants.length === 0) {
      alert("Cần ít nhất 1 biến thể!");
      return;
    }

    if (!formData.supplier.trim()) {
      alert("Vui lòng nhập nhà cung cấp!");
      return;
    }

    try {
      await onSubmit(formData);

      if (mode === "add") {
        setFormData({
          name: "",
          category: "",
          description: "",
          supplier: "",
          brandId: undefined,
          variants: [],
          mediaFiles: [],
          existingMedia: [],
        });
        setMediaPreview([]);
        setNewVariant({
          name: "",
          price: 0,
          importPrice: 0,
          stockQty: 0,
        });
      }
    } catch (error) {
      console.error("Error submitting form:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl w-full max-h-[98vh] overflow-y-auto p-0">
        <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 min-h-full">
          {/* Modern Header */}
          <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-md border-b border-gray-200/50 p-8">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                <Package className="h-6 w-6 text-white" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold text-gray-900">
                  {mode === "add" ? "Tạo sản phẩm mới" : "Chỉnh sửa sản phẩm"}
                </DialogTitle>
                <p className="text-gray-600 mt-1">
                  Thêm thông tin chi tiết về sản phẩm của bạn
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-8">
            {/* Basic Product Info */}
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-6">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <ShoppingCart className="h-5 w-5 text-blue-600" />
                  </div>
                  <CardTitle className="text-xl text-gray-900">
                    Thông tin cơ bản
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <Label className="text-base font-medium text-gray-700">
                    Tên sản phẩm *
                  </Label>
                  <Input
                    value={formData.name}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    placeholder="Nhập tên sản phẩm"
                    className="h-12 text-base border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div className="space-y-3">
                  <Label className="text-base font-medium text-gray-700">
                    Mô tả sản phẩm
                  </Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    placeholder="Nhập mô tả chi tiết về sản phẩm"
                    rows={4}
                    className="text-base border-gray-300 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-3">
                  <Label className="text-base font-medium text-gray-700">
                    Nhà cung cấp *
                  </Label>
                  <Input
                    value={formData.supplier}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        supplier: e.target.value,
                      }))
                    }
                    placeholder="Nhập tên nhà cung cấp"
                    className="h-12 text-base border-gray-300 focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="space-y-3">
                  <Label className="text-base font-medium text-gray-700">
                    Thương hiệu (tùy chọn)
                  </Label>
                  <Select
                    value={formData.brandId || "none"}
                    onValueChange={(value) =>
                      setFormData((prev) => ({
                        ...prev,
                        brandId: value === "none" ? undefined : value,
                      }))
                    }
                  >
                    <SelectTrigger className="h-12 text-base border-gray-300 focus:ring-2 focus:ring-blue-500">
                      <SelectValue placeholder="Chọn thương hiệu (tùy chọn)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">
                        Không chọn thương hiệu
                      </SelectItem>
                      {brands.map((brand) => (
                        <SelectItem key={brand.id} value={brand.id}>
                          <div className="flex items-center gap-3">
                            {brand.logoUrl && (
                              <Image
                                src={brand.logoUrl}
                                alt={brand.name}
                                width={24}
                                height={24}
                                className="w-6 h-6 object-cover rounded"
                              />
                            )}
                            <div className="flex flex-col">
                              <span className="font-medium">{brand.name}</span>
                              {brand.description && (
                                <span className="text-xs text-gray-500 truncate max-w-[200px]">
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
              </CardContent>
            </Card>

            {/* Media Upload */}
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-6">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                    <Camera className="h-5 w-5 text-purple-600" />
                  </div>
                  <CardTitle className="text-xl text-gray-900">
                    Hình ảnh & Video (2-5 tệp) *
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <Label
                      htmlFor="media-upload"
                      className="flex flex-col items-center gap-4 p-8 border-2 border-dashed border-gray-300 rounded-2xl cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-all duration-200 group"
                    >
                      <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Upload className="w-8 h-8 text-white" />
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-medium text-gray-700 mb-2">
                          Click để tải lên hình ảnh/video
                        </div>
                        <div className="text-gray-500 space-y-1">
                          <p>Ảnh: tối đa 5MB, Video: tối đa 50MB</p>
                          <p className="text-sm text-blue-600 bg-blue-50 px-3 py-1 rounded-full inline-block">
                            💡 Đang sử dụng placeholder images để demo
                          </p>
                        </div>
                      </div>
                    </Label>
                    <Input
                      id="media-upload"
                      type="file"
                      multiple
                      accept="image/*,video/*"
                      onChange={handleMediaUpload}
                      className="hidden"
                    />
                  </div>

                  {mediaPreview.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
                      {mediaPreview.map((media, index) => (
                        <div key={index} className="relative group">
                          <div className="aspect-square border-2 border-gray-200 rounded-2xl overflow-hidden bg-gray-50 hover:shadow-lg transition-shadow">
                            {media.type === "image" ? (
                              <Image
                                src={media.url}
                                alt={`Media ${index + 1}`}
                                width={400}
                                height={400}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="relative w-full h-full bg-gray-900">
                                <video
                                  src={media.url}
                                  className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <div className="bg-black/50 rounded-full p-3">
                                    <Video className="w-6 h-6 text-white" />
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            variant="destructive"
                            className="absolute -top-2 -right-2 h-8 w-8 rounded-full p-0 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                            onClick={() => removeMedia(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                          <Badge className="absolute bottom-2 left-2 bg-white/90 text-gray-700">
                            {media.type === "image" ? (
                              <ImageIcon className="w-3 h-3 mr-1" />
                            ) : (
                              <Video className="w-3 h-3 mr-1" />
                            )}
                            {media.type}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Variants */}
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-6">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                    <DollarSign className="h-5 w-5 text-green-600" />
                  </div>
                  <CardTitle className="text-xl text-gray-900">
                    Biến thể sản phẩm
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Add New Variant */}
                <div className="border-2 border-dashed border-gray-300 rounded-2xl p-6 bg-gradient-to-br from-gray-50 to-white">
                  <h4 className="font-semibold mb-4 text-lg text-gray-800">
                    Thêm biến thể mới
                  </h4>
                  <div className="flex flex-wrap items-end gap-4">
                    <div className="space-y-2 min-w-[200px]">
                      <Label className="text-sm font-medium text-gray-700">
                        Dung tích
                      </Label>
                      <Input
                        value={newVariant.name}
                        onChange={(e) =>
                          setNewVariant((prev) => ({
                            ...prev,
                            name: e.target.value,
                          }))
                        }
                        placeholder="Ví dụ: 50, 100, 200..."
                        className="h-11 border-gray-300 focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                    <div className="space-y-2 min-w-[180px]">
                      <Label className="text-sm font-medium text-gray-700">
                        Giá nhập (VNĐ)
                      </Label>
                      <Input
                        type="text"
                        value={
                          newVariant.importPrice > 0
                            ? formatPrice(newVariant.importPrice)
                            : ""
                        }
                        onChange={(e) =>
                          handlePriceChange("importPrice", e.target.value)
                        }
                        placeholder="0"
                        className="h-11 border-gray-300 focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                    <div className="space-y-2 min-w-[180px]">
                      <Label className="text-sm font-medium text-gray-700">
                        Giá bán (VNĐ)
                      </Label>
                      <Input
                        type="text"
                        value={
                          newVariant.price > 0
                            ? formatPrice(newVariant.price)
                            : ""
                        }
                        onChange={(e) =>
                          handlePriceChange("price", e.target.value)
                        }
                        placeholder="0"
                        className="h-11 border-gray-300 focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                    <div className="space-y-2 min-w-[180px]">
                      <Label className="text-sm font-medium text-gray-700">
                        Số lượng
                      </Label>
                      <Input
                        type="number"
                        value={newVariant.stockQty || ""}
                        onChange={(e) => {
                          const value = e.target.value.trim();
                          const numValue = value === "" ? 0 : parseInt(value);
                          console.log("Stock input change:", {
                            value,
                            numValue,
                            isValid: !isNaN(numValue),
                          });
                          if (!isNaN(numValue) && numValue >= 0) {
                            setNewVariant((prev) => ({
                              ...prev,
                              stockQty: numValue,
                            }));
                          }
                        }}
                        placeholder="0"
                        min="0"
                        className="h-11 border-gray-300 focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                    <Button
                      type="button"
                      onClick={addVariant}
                      className="h-11 px-8 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-medium shadow-lg hover:shadow-xl transition-all min-w-[200px]"
                    >
                      <Plus className="w-5 h-5 mr-2" />
                      Thêm biến thể
                    </Button>
                  </div>

                  {/* Profit Calculation */}
                  {newVariant.importPrice > 0 && newVariant.price > 0 && (
                    <div className="mt-4 p-4 bg-white rounded-xl border border-gray-200">
                      <span className="text-gray-600 text-sm">
                        Lợi nhuận dự kiến:{" "}
                      </span>
                      <span
                        className={`font-semibold text-lg ${
                          newVariant.price > newVariant.importPrice
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {formatPrice(newVariant.price - newVariant.importPrice)}{" "}
                        VNĐ
                      </span>
                      <span className="text-gray-500 text-sm ml-2">
                        (
                        {(
                          ((newVariant.price - newVariant.importPrice) /
                            newVariant.importPrice) *
                          100
                        ).toFixed(1)}
                        %)
                      </span>
                    </div>
                  )}
                </div>

                {/* Existing Variants */}
                {formData.variants.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-4 text-lg text-gray-800">
                      Danh sách biến thể ({formData.variants.length})
                    </h4>
                    <div className="space-y-3">
                      {formData.variants.map((variant, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-4 border border-gray-200 rounded-xl bg-white hover:shadow-md transition-shadow"
                        >
                          <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-4">
                            <div>
                              <div className="text-sm text-gray-500">
                                Dung tích
                              </div>
                              <div className="font-semibold text-gray-900">
                                {variant.name}ml
                              </div>
                            </div>
                            <div>
                              <div className="text-sm text-gray-500">
                                Giá nhập
                              </div>
                              <div className="font-medium">
                                {formatPrice(variant.importPrice)} VNĐ
                              </div>
                            </div>
                            <div>
                              <div className="text-sm text-gray-500">
                                Giá bán
                              </div>
                              <div className="font-semibold text-blue-600">
                                {formatPrice(variant.price)} VNĐ
                              </div>
                            </div>
                            <div>
                              <div className="text-sm text-gray-500">
                                Số lượng
                              </div>
                              <div className="font-medium">
                                {variant.stockQty}
                              </div>
                            </div>
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => removeVariant(index)}
                            className="ml-4 h-10 w-10 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Form Actions */}
            <div className="flex justify-end gap-4 pt-6 sticky bottom-0 bg-gradient-to-t from-white via-white to-transparent p-4 -m-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
                className="px-8 py-3 text-base h-12 border-gray-300 hover:bg-gray-50"
              >
                Hủy bỏ
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="px-8 py-3 text-base h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all"
              >
                {loading
                  ? "Đang xử lý..."
                  : mode === "add"
                  ? "Tạo sản phẩm"
                  : "Cập nhật sản phẩm"}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
