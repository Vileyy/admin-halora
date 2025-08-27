"use client";

import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  IconPlus,
  IconTicket,
  IconTruck,
  IconSearch,
  IconFilter,
  IconPercentage,
  IconCoins,
} from "@tabler/icons-react";

// Mock data for vouchers
const mockVouchers = [
  {
    id: 1,
    code: "FREESHIP50",
    title: "Miễn phí vận chuyển đơn từ 50k",
    discount: "100",
    discountType: "percentage",
    minOrder: 50000,
    status: "active",
    type: "shipping",
    usageCount: 245,
    usageLimit: 1000,
  },
  {
    id: 2,
    code: "SALE10",
    title: "Giảm 10% tổng đơn hàng",
    discount: "10",
    discountType: "percentage",
    minOrder: 200000,
    status: "active",
    type: "product",
    usageCount: 342,
    usageLimit: 1000,
  },
];

export default function VoucherPage({
  type,
}: {
  type?: "shipping" | "product";
}) {
  const [activeTab, setActiveTab] = useState(type || "all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  // Filter vouchers by type
  const filteredVouchers = useMemo(() => {
    if (type) {
      return mockVouchers.filter((voucher) => voucher.type === type);
    } else if (activeTab !== "all") {
      return mockVouchers.filter((voucher) => voucher.type === activeTab);
    }
    return mockVouchers;
  }, [activeTab, type]);

  // Calculate stats
  const stats = useMemo(() => {
    const relevantVouchers = type
      ? mockVouchers.filter((v) => v.type === type)
      : mockVouchers;

    const activeVouchers = relevantVouchers.filter(
      (v) => v.status === "active"
    );
    const totalUsage = relevantVouchers.reduce(
      (sum, v) => sum + v.usageCount,
      0
    );

    return {
      totalActive: activeVouchers.length,
      totalVouchers: relevantVouchers.length,
      totalUsage,
    };
  }, [type]);

  const pageTitle =
    type === "shipping"
      ? "Voucher Phí Vận Chuyển"
      : type === "product"
      ? "Mã Giảm Giá Sản Phẩm"
      : "Quản Lý Voucher";

  const pageDescription =
    type === "shipping"
      ? "Quản lý voucher miễn phí và giảm phí vận chuyển"
      : type === "product"
      ? "Quản lý mã giảm giá cho sản phẩm và đơn hàng"
      : "Tạo và quản lý tất cả voucher giảm giá";

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{pageTitle}</h1>
          <p className="text-muted-foreground">{pageDescription}</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">
            <IconFilter className="w-4 h-4 mr-2" />
            Bộ lọc nâng cao
          </Button>
          <Dialog
            open={isCreateDialogOpen}
            onOpenChange={setIsCreateDialogOpen}
          >
            <DialogTrigger asChild>
              <Button>
                <IconPlus className="w-4 h-4 mr-2" />
                Tạo voucher mới
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Tạo voucher mới</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="code">Mã voucher</Label>
                  <Input
                    id="code"
                    placeholder="VD: FREESHIP50"
                    className="font-mono"
                  />
                </div>
                <div>
                  <Label htmlFor="title">Tên voucher</Label>
                  <Input id="title" placeholder="Nhập tên voucher" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="discountType">Loại giảm giá</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn loại" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">
                          Phần trăm (%)
                        </SelectItem>
                        <SelectItem value="fixed">
                          Số tiền cố định (đ)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="discountValue">Giá trị giảm</Label>
                    <Input id="discountValue" type="number" placeholder="0" />
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
                    Hủy
                  </Button>
                  <Button onClick={() => setIsCreateDialogOpen(false)}>
                    Tạo voucher
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Voucher hoạt động
            </CardTitle>
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
              <IconTicket className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalActive}</div>
            <p className="text-xs text-muted-foreground">
              Trên tổng {stats.totalVouchers} voucher
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lượt sử dụng</CardTitle>
            <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
              {type === "shipping" ? (
                <IconTruck className="h-4 w-4 text-green-600" />
              ) : (
                <IconPercentage className="h-4 w-4 text-green-600" />
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsage}</div>
            <p className="text-xs text-muted-foreground">Tổng lượt sử dụng</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hiệu quả</CardTitle>
            <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center">
              <IconCoins className="h-4 w-4 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">85%</div>
            <p className="text-xs text-muted-foreground">
              Tỷ lệ sử dụng thành công
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardContent className="p-0">
          {!type && (
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <div className="flex items-center justify-between p-6 pb-0">
                <TabsList className="grid w-full max-w-md grid-cols-3">
                  <TabsTrigger value="all">
                    Tất cả ({mockVouchers.length})
                  </TabsTrigger>
                  <TabsTrigger value="shipping">
                    Vận chuyển (
                    {mockVouchers.filter((v) => v.type === "shipping").length})
                  </TabsTrigger>
                  <TabsTrigger value="product">
                    Sản phẩm (
                    {mockVouchers.filter((v) => v.type === "product").length})
                  </TabsTrigger>
                </TabsList>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">
                    Hiển thị {filteredVouchers.length} voucher
                  </span>
                </div>
              </div>
            </Tabs>
          )}

          {/* Filter Bar */}
          <div className="flex flex-col gap-4 p-4 bg-white dark:bg-gray-950 border-b">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-4 flex-1">
                <div className="relative flex-1 max-w-md">
                  <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Tìm kiếm theo mã, tên voucher..."
                    className="pl-10"
                  />
                </div>
                <Select>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Trạng thái" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả trạng thái</SelectItem>
                    <SelectItem value="active">Hoạt động</SelectItem>
                    <SelectItem value="inactive">Tạm dừng</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Voucher List */}
          <div className="p-6">
            <div className="space-y-4">
              {filteredVouchers.map((voucher) => (
                <div
                  key={voucher.id}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center">
                        {voucher.type === "shipping" ? (
                          <IconTruck className="w-6 h-6 text-orange-600" />
                        ) : (
                          <IconTicket className="w-6 h-6 text-orange-600" />
                        )}
                      </div>
                      <div>
                        <div className="font-mono font-semibold text-sm bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded inline-block mb-1">
                          {voucher.code}
                        </div>
                        <div className="font-medium">{voucher.title}</div>
                        <div className="text-sm text-gray-500">
                          Đã sử dụng: {voucher.usageCount}/{voucher.usageLimit}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-orange-600 text-xl">
                        {voucher.discountType === "percentage"
                          ? `GIẢM ${voucher.discount}%`
                          : `GIẢM ${formatCurrency(
                              parseInt(voucher.discount)
                            )}`}
                      </div>
                      <div className="text-sm text-gray-500">
                        Đơn tối thiểu {formatCurrency(voucher.minOrder)}
                      </div>
                      <Badge className="mt-2 bg-green-100 text-green-800">
                        Hoạt động
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
