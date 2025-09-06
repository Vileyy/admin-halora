"use client";

import React from "react";
import { InventoryItem } from "@/types/Inventory";
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
import Image from "next/image";
import { Edit, AlertTriangle } from "lucide-react";

interface InventoryTableProps {
  inventoryItems: InventoryItem[];
  onEdit: (item: InventoryItem) => void;
  loading?: boolean;
}

export function InventoryTable({
  inventoryItems,
  onEdit,
  loading,
}: InventoryTableProps) {
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
    if (stockQty < 10) {
      return (
        <Badge variant="destructive" className="flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" />
          Cảnh báo
        </Badge>
      );
    }
    return <Badge variant="secondary">Bình thường</Badge>;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Danh sách tồn kho</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
              <p className="mt-2 text-sm text-muted-foreground">
                Đang tải dữ liệu...
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (inventoryItems.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Danh sách tồn kho</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              Chưa có dữ liệu tồn kho nào.
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Hãy thêm mới để bắt đầu quản lý kho.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Danh sách tồn kho</span>
          <Badge variant="outline" className="text-sm">
            {inventoryItems.length} sản phẩm
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Hình ảnh</TableHead>
                <TableHead>Tên sản phẩm</TableHead>
                <TableHead>Biến thể</TableHead>
                <TableHead className="text-center">Tồn kho</TableHead>
                <TableHead className="text-right">Giá nhập</TableHead>
                <TableHead className="text-right">Giá bán</TableHead>
                <TableHead>Nhà cung cấp</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Cập nhật</TableHead>
                <TableHead className="text-center">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inventoryItems.map((item) => (
                <TableRow key={`${item.productId}-${item.variantId}`}>
                  <TableCell>
                    <div className="flex items-center justify-center">
                      {item.productImage ? (
                        <Image
                          src={item.productImage}
                          alt={item.productName || "Product"}
                          width={48}
                          height={48}
                          className="w-12 h-12 object-cover rounded-md border"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gray-100 rounded-md border flex items-center justify-center">
                          <span className="text-xs text-muted-foreground">
                            N/A
                          </span>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium text-sm line-clamp-2">
                        {item.productName || "Unknown Product"}
                      </p>
                      {item.productCategory && (
                        <Badge variant="outline" className="text-xs mt-1">
                          {item.productCategory}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-xs">
                      {item.variantName}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex flex-col items-center gap-1">
                      <span className="font-medium">{item.stockQty}</span>
                      {item.stockQty < 10 && (
                        <span className="text-xs text-red-600">Sắp hết</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="text-sm font-mono">
                      {formatPrice(item.importPrice)} VNĐ
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="text-sm font-mono font-medium">
                      {formatPrice(item.price)} VNĐ
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{item.supplier || "N/A"}</span>
                  </TableCell>
                  <TableCell>{getStockBadge(item.stockQty)}</TableCell>
                  <TableCell>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(item.updatedAt)}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onEdit(item)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
