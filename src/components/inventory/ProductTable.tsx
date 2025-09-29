"use client";

import React, { useState } from "react";
import { Product, ProductVariant } from "@/types/Inventory";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import Image from "next/image";
import {
  Edit,
  AlertTriangle,
  Eye,
  Search,
  ImageIcon,
  Video,
  Package,
  Trash2,
  TrendingUp,
  Box,
  DollarSign,
  Clock,
  Building,
  Tag,
} from "lucide-react";

interface ProductTableProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete?: (productId: string) => void;
  onUpdateStock?: (
    productId: string,
    variantId: string,
    newStock: number
  ) => void;
  loading?: boolean;
  resetPagination?: boolean;
}

export function ProductTable({
  products,
  onEdit,
  onDelete,
  onUpdateStock,
  loading,
  resetPagination,
}: ProductTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [jumpToPage, setJumpToPage] = useState("");
  const itemsPerPage = 5;

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat("vi-VN").format(price);
  };

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("vi-VN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "N/A";
    }
  };

  const getStockBadge = (stockQty: number) => {
    if (stockQty === 0) {
      return (
        <Badge
          variant="destructive"
          className="flex items-center gap-1.5 px-3 py-1"
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span className="font-medium">Hết hàng</span>
        </Badge>
      );
    }
    if (stockQty < 10) {
      return (
        <Badge
          variant="secondary"
          className="flex items-center gap-1.5 px-3 py-1 bg-orange-50 text-orange-700 border-orange-200"
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span className="font-medium">Sắp hết</span>
        </Badge>
      );
    }
    return (
      <Badge
        variant="secondary"
        className="flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-700 border-green-200"
      >
        <Box className="w-3.5 h-3.5" />
        <span className="font-medium">Còn hàng</span>
      </Badge>
    );
  };

  const getTotalStock = (variants: ProductVariant[]): number => {
    return (
      variants?.reduce(
        (total, variant) => total + (variant?.stockQty || 0),
        0
      ) || 0
    );
  };

  const getTotalValue = (variants: ProductVariant[]): number => {
    return (
      variants?.reduce(
        (total, variant) =>
          total + (variant?.price || 0) * (variant?.stockQty || 0),
        0
      ) || 0
    );
  };

  const filteredProducts =
    products?.filter(
      (product) =>
        product?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product?.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product?.supplier?.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];

  // Reset to page 1 when search query changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Reset to page 1 when resetPagination changes
  React.useEffect(() => {
    if (resetPagination) {
      setCurrentPage(1);
    }
  }, [resetPagination]);

  // Pagination logic
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

  if (loading) {
    return (
      <Card className="shadow-sm">
        <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardTitle className="flex items-center gap-2 text-xl">
            <Package className="w-6 h-6 text-blue-600" />
            Danh sách sản phẩm
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8">
          <div className="flex items-center justify-center h-32">
            <div className="text-center">
              <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
              <p className="mt-4 text-base text-muted-foreground">
                Đang tải dữ liệu...
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm border-0 bg-white">
      <CardHeader className="border-b bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 pb-6">
        <div className="flex items-center justify-between mb-4">
          <CardTitle className="flex items-center gap-3 text-2xl font-bold text-gray-800">
            <div className="p-2 bg-blue-600 rounded-lg">
              <Package className="w-6 h-6 text-white" />
            </div>
            Danh sách sản phẩm trong kho
          </CardTitle>
          <div className="flex items-center gap-3">
            <Badge
              variant="outline"
              className="px-4 py-2 text-base font-semibold bg-white"
            >
              <Box className="w-4 h-4 mr-2" />
              {filteredProducts.length} sản phẩm
            </Badge>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            placeholder="Tìm kiếm theo tên, danh mục, nhà cung cấp..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 pr-4 py-3 text-base border-gray-200 focus:border-blue-500 focus:ring-blue-500 bg-white"
          />
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {paginatedProducts.length === 0 ? (
          <div className="text-center py-16 px-8">
            <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
              <Package className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              {searchQuery ? "Không tìm thấy sản phẩm" : "Chưa có sản phẩm nào"}
            </h3>
            <p className="text-gray-500 mb-6">
              {searchQuery
                ? "Thử thay đổi từ khóa tìm kiếm hoặc kiểm tra lại chính tả."
                : "Hãy thêm sản phẩm mới để bắt đầu quản lý kho hàng."}
            </p>
          </div>
        ) : (
          <div className="overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 border-b-2 border-gray-200">
                  <TableHead className="h-14 px-6 font-semibold text-gray-700">
                    <div className="flex items-center gap-2">
                      <ImageIcon className="w-4 h-4" />
                      Hình ảnh
                    </div>
                  </TableHead>
                  <TableHead className="h-14 px-6 font-semibold text-gray-700 min-w-[250px]">
                    <div className="flex items-center gap-2">
                      <Box className="w-4 h-4" />
                      Thông tin sản phẩm
                    </div>
                  </TableHead>
                  <TableHead className="h-14 px-6 font-semibold text-gray-700">
                    <div className="flex items-center gap-2">
                      <Tag className="w-4 h-4" />
                      Danh mục
                    </div>
                  </TableHead>
                  <TableHead className="h-14 px-6 font-semibold text-gray-700 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Package className="w-4 h-4" />
                      Biến thể
                    </div>
                  </TableHead>
                  <TableHead className="h-14 px-6 font-semibold text-gray-700 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <TrendingUp className="w-4 h-4" />
                      Tồn kho
                    </div>
                  </TableHead>
                  <TableHead className="h-14 px-6 font-semibold text-gray-700 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <DollarSign className="w-4 h-4" />
                      Giá trị kho
                    </div>
                  </TableHead>
                  <TableHead className="h-14 px-6 font-semibold text-gray-700">
                    <div className="flex items-center gap-2">
                      <Building className="w-4 h-4" />
                      Nhà cung cấp
                    </div>
                  </TableHead>
                  <TableHead className="h-14 px-6 font-semibold text-gray-700">
                    Trạng thái
                  </TableHead>
                  <TableHead className="h-14 px-6 font-semibold text-gray-700">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Cập nhật
                    </div>
                  </TableHead>
                  <TableHead className="h-14 px-6 font-semibold text-gray-700 text-center">
                    Thao tác
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedProducts.map((product, index) => {
                  const totalStock = getTotalStock(product?.variants || []);
                  const totalValue = getTotalValue(product?.variants || []);
                  const primaryImage = product?.media?.find(
                    (m) => m?.type === "image"
                  );

                  return (
                    <TableRow
                      key={product.id}
                      className={`hover:bg-blue-50/50 transition-colors border-b ${
                        index % 2 === 0 ? "bg-white" : "bg-gray-50/30"
                      }`}
                    >
                      <TableCell className="px-6 py-4">
                        <div className="flex items-center justify-center">
                          {primaryImage ? (
                            <div className="relative">
                              <Image
                                src={primaryImage.url}
                                alt={product.name}
                                width={64}
                                height={64}
                                className="w-16 h-16 object-cover rounded-xl border-2 border-gray-200 shadow-sm"
                              />
                              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                            </div>
                          ) : (
                            <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl border-2 border-gray-200 flex items-center justify-center">
                              <ImageIcon className="w-8 h-8 text-gray-400" />
                            </div>
                          )}
                        </div>
                      </TableCell>

                      <TableCell className="px-6 py-4">
                        <div className="space-y-2">
                          <h3 className="font-semibold text-gray-900 text-base leading-tight break-words whitespace-normal">
                            {product?.name || "Sản phẩm chưa đặt tên"}
                          </h3>
                          <p className="text-sm text-gray-600 leading-relaxed">
                            {(() => {
                              const desc =
                                product?.description ||
                                "Chưa có mô tả sản phẩm";
                              const words = desc.split(" ");
                              if (words.length > 40) {
                                return words.slice(0, 10).join(" ") + "...";
                              }
                              return desc;
                            })()}
                          </p>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="outline"
                              className="text-xs px-2 py-1"
                            >
                              ID: {product.id.slice(-6).toUpperCase()}
                            </Badge>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="px-6 py-4">
                        <Badge
                          variant="secondary"
                          className="px-3 py-1.5 text-sm font-medium bg-blue-50 text-blue-700 border-blue-200"
                        >
                          <Tag className="w-3.5 h-3.5 mr-1.5" />
                          {product?.category === "new_product"
                            ? "Sản phẩm mới"
                            : product?.category === "FlashDeals"
                            ? "Flash Deals"
                            : product?.category || "Chưa phân loại"}
                        </Badge>
                      </TableCell>

                      <TableCell className="px-6 py-4 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <div className="flex items-center justify-center w-10 h-10 bg-indigo-100 rounded-full">
                            <span className="font-bold text-indigo-700">
                              {product?.variants?.length || 0}
                            </span>
                          </div>
                          <span className="text-xs text-gray-500">
                            biến thể
                          </span>
                        </div>
                      </TableCell>

                      <TableCell className="px-6 py-4">
                        <div className="flex flex-col items-center gap-2">
                          <div className="flex items-center gap-2">
                            <div className="flex items-center justify-center w-12 h-8 bg-green-100 rounded-lg">
                              <span className="font-bold text-green-700 text-lg">
                                {totalStock}
                              </span>
                            </div>
                          </div>
                          {totalStock < 10 && totalStock > 0 && (
                            <div className="flex items-center gap-1 text-orange-600">
                              <AlertTriangle className="w-3 h-3" />
                              <span className="text-xs font-medium">
                                Cần nhập thêm
                              </span>
                            </div>
                          )}
                        </div>
                      </TableCell>

                      <TableCell className="px-6 py-4 text-right">
                        <div className="space-y-1">
                          <div className="text-lg font-bold text-green-600">
                            {formatPrice(totalValue)}
                          </div>
                          <div className="text-xs text-gray-500">VNĐ</div>
                        </div>
                      </TableCell>

                      <TableCell className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                            <Building className="w-4 h-4 text-purple-600" />
                          </div>
                          <div>
                            <div className="font-medium text-sm text-gray-900">
                              {product?.supplier || "Chưa có NCC"}
                            </div>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="px-6 py-4">
                        {getStockBadge(totalStock)}
                      </TableCell>

                      <TableCell className="px-6 py-4">
                        <div className="text-center">
                          <div className="text-sm font-medium text-gray-700">
                            {
                              formatDate(
                                product?.updatedAt || new Date().toISOString()
                              ).split(" ")[0]
                            }
                          </div>
                          <div className="text-xs text-gray-500">
                            {
                              formatDate(
                                product?.updatedAt || new Date().toISOString()
                              ).split(" ")[1]
                            }
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          {/* View Details */}
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-9 w-9 p-0 hover:bg-blue-50 hover:border-blue-300"
                                onClick={() => setSelectedProduct(product)}
                              >
                                <Eye className="h-4 w-4 text-blue-600" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                              <DialogHeader className="border-b pb-4">
                                <DialogTitle className="text-2xl font-bold flex items-center gap-3">
                                  <div className="p-2 bg-blue-600 rounded-lg">
                                    <Eye className="w-5 h-5 text-white" />
                                  </div>
                                  Chi tiết sản phẩm
                                </DialogTitle>
                              </DialogHeader>

                              {selectedProduct && (
                                <div className="space-y-8 pt-4">
                                  {/* Product Info */}
                                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                    <div className="space-y-6">
                                      <div>
                                        <h3 className="text-2xl font-bold text-gray-900 mb-4">
                                          {selectedProduct.name}
                                        </h3>
                                        <div className="grid grid-cols-1 gap-4">
                                          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                            <Tag className="w-5 h-5 text-gray-600" />
                                            <div>
                                              <span className="text-sm font-medium text-gray-700">
                                                Danh mục:
                                              </span>
                                              <div className="font-semibold">
                                                {selectedProduct.category}
                                              </div>
                                            </div>
                                          </div>
                                          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                            <Building className="w-5 h-5 text-gray-600" />
                                            <div>
                                              <span className="text-sm font-medium text-gray-700">
                                                Nhà cung cấp:
                                              </span>
                                              <div className="font-semibold">
                                                {selectedProduct.supplier}
                                              </div>
                                            </div>
                                          </div>
                                          <div className="p-3 bg-gray-50 rounded-lg">
                                            <span className="text-sm font-medium text-gray-700 block mb-2">
                                              Mô tả:
                                            </span>
                                            <p className="text-gray-800 leading-relaxed">
                                              {selectedProduct.description ||
                                                "Không có mô tả"}
                                            </p>
                                          </div>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Media Gallery */}
                                    <div>
                                      <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                        <ImageIcon className="w-5 h-5" />
                                        Hình ảnh & Video
                                      </h4>
                                      <div className="grid grid-cols-2 gap-3">
                                        {selectedProduct.media.map((media) => (
                                          <div
                                            key={media.id}
                                            className="relative aspect-square border-2 border-gray-200 rounded-xl overflow-hidden group hover:border-blue-300 transition-colors"
                                          >
                                            {media.type === "image" ? (
                                              <Image
                                                src={media.url}
                                                alt="Product media"
                                                fill
                                                className="object-cover group-hover:scale-105 transition-transform"
                                              />
                                            ) : (
                                              <video
                                                src={media.url}
                                                className="w-full h-full object-cover"
                                                controls
                                              />
                                            )}
                                            <Badge className="absolute top-2 right-2 bg-white/90 text-gray-700">
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
                                    </div>
                                  </div>

                                  {/* Variants Table */}
                                  <div>
                                    <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                      <Package className="w-5 h-5" />
                                      Danh sách biến thể (
                                      {selectedProduct.variants.length})
                                    </h4>
                                    <div className="border-2 border-gray-200 rounded-xl overflow-hidden">
                                      <Table>
                                        <TableHeader>
                                          <TableRow className="bg-gray-50">
                                            <TableHead className="h-12 font-semibold text-gray-700">
                                              Tên biến thể
                                            </TableHead>
                                            <TableHead className="h-12 font-semibold text-gray-700 text-right">
                                              Giá nhập
                                            </TableHead>
                                            <TableHead className="h-12 font-semibold text-gray-700 text-right">
                                              Giá bán
                                            </TableHead>
                                            <TableHead className="h-12 font-semibold text-gray-700 text-center">
                                              Tồn kho
                                            </TableHead>
                                            <TableHead className="h-12 font-semibold text-gray-700 text-right">
                                              Giá trị
                                            </TableHead>
                                            <TableHead className="h-12 font-semibold text-gray-700 text-center">
                                              Cập nhật SL
                                            </TableHead>
                                          </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                          {selectedProduct.variants.map(
                                            (variant, variantIndex) => (
                                              <TableRow
                                                key={variant.id}
                                                className={`hover:bg-blue-50/50 ${
                                                  variantIndex % 2 === 0
                                                    ? "bg-white"
                                                    : "bg-gray-50/30"
                                                }`}
                                              >
                                                <TableCell className="font-semibold text-gray-900">
                                                  {variant.name}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                  <span className="font-mono text-sm text-gray-700">
                                                    {formatPrice(
                                                      variant.importPrice
                                                    )}{" "}
                                                    VNĐ
                                                  </span>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                  <span className="font-mono font-bold text-green-600">
                                                    {formatPrice(variant.price)}{" "}
                                                    VNĐ
                                                  </span>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                  <div className="flex items-center justify-center gap-2">
                                                    <div className="flex items-center justify-center w-12 h-8 bg-blue-100 rounded-lg">
                                                      <span className="font-bold text-blue-700">
                                                        {variant.stockQty}
                                                      </span>
                                                    </div>
                                                    {variant.stockQty < 10 &&
                                                      variant.stockQty > 0 && (
                                                        <AlertTriangle className="w-4 h-4 text-orange-500" />
                                                      )}
                                                  </div>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                  <span className="font-mono font-bold text-green-600">
                                                    {formatPrice(
                                                      variant.price *
                                                        variant.stockQty
                                                    )}{" "}
                                                    VNĐ
                                                  </span>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                  {onUpdateStock && (
                                                    <Input
                                                      type="number"
                                                      min="0"
                                                      defaultValue={
                                                        variant.stockQty
                                                      }
                                                      className="w-20 h-9 text-center font-semibold border-gray-300 focus:border-blue-500"
                                                      onBlur={(e) => {
                                                        const newStock =
                                                          parseInt(
                                                            e.target.value
                                                          ) || 0;
                                                        if (
                                                          newStock !==
                                                          variant.stockQty
                                                        ) {
                                                          onUpdateStock(
                                                            selectedProduct.id,
                                                            variant.id,
                                                            newStock
                                                          );
                                                        }
                                                      }}
                                                    />
                                                  )}
                                                </TableCell>
                                              </TableRow>
                                            )
                                          )}
                                        </TableBody>
                                      </Table>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>

                          {/* Edit */}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onEdit(product)}
                            className="h-9 w-9 p-0 hover:bg-green-50 hover:border-green-300"
                          >
                            <Edit className="h-4 w-4 text-green-600" />
                          </Button>

                          {/* Delete */}
                          {onDelete && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                if (
                                  confirm(
                                    "Bạn có chắc chắn muốn xóa sản phẩm này?\nHành động này không thể hoàn tác!"
                                  )
                                ) {
                                  onDelete(product.id);
                                }
                              }}
                              className="h-9 w-9 p-0 hover:bg-red-50 hover:border-red-300"
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Pagination */}
        {filteredProducts.length > 0 && totalPages > 1 && (
          <div className="mt-6 p-4 border-t bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Hiển thị {startIndex + 1}-
                {Math.min(endIndex, filteredProducts.length)} /{" "}
                {filteredProducts.length} sản phẩm
              </div>

              <div className="flex items-center space-x-3">
                {/* Previous Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="h-8 px-3"
                >
                  ← Trước
                </Button>

                {/* Page Numbers - Show max 5 pages */}
                <div className="flex items-center space-x-1">
                  {(() => {
                    const maxVisible = 5;
                    const start = Math.max(
                      1,
                      currentPage - Math.floor(maxVisible / 2)
                    );
                    const end = Math.min(totalPages, start + maxVisible - 1);
                    const pages = [];

                    for (let i = start; i <= end; i++) {
                      pages.push(
                        <Button
                          key={i}
                          variant={currentPage === i ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(i)}
                          className={`h-8 w-8 p-0 ${
                            currentPage === i
                              ? "bg-blue-600 text-white font-bold"
                              : "hover:bg-gray-100"
                          }`}
                        >
                          {i}
                        </Button>
                      );
                    }
                    return pages;
                  })()}
                </div>

                {/* Next Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage(Math.min(totalPages, currentPage + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="h-8 px-3"
                >
                  Sau →
                </Button>

                {/* Jump to Page Input */}
                <div className="flex items-center space-x-2 ml-4">
                  <span className="text-sm text-gray-600">Đến trang:</span>
                  <Input
                    type="number"
                    min="1"
                    max={totalPages}
                    value={jumpToPage}
                    onChange={(e) => setJumpToPage(e.target.value)}
                    placeholder="Số trang"
                    className="w-20 h-8 text-center"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        const targetPage = parseInt(jumpToPage);
                        if (targetPage >= 1 && targetPage <= totalPages) {
                          setCurrentPage(targetPage);
                          setJumpToPage("");
                        }
                      }
                    }}
                  />
                  <span className="text-sm text-gray-500">/ {totalPages}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
