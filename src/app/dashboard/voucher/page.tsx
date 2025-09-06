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
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
  IconPlus,
  IconTicket,
  IconTruck,
  IconSearch,
  IconFilter,
  IconCoins,
  IconAlertCircle,
  IconCheck,
  IconX,
} from "@tabler/icons-react";
import { useVoucherData, useVoucherFilter } from "@/hooks/useVoucherData";
import { VoucherFormData } from "@/types/Voucher";
import { toast } from "sonner";

// Create Voucher Form Component
function CreateVoucherForm({
  isOpen,
  onClose,
  onSubmit,
  loading,
  type,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: VoucherFormData) => Promise<void>;
  loading: boolean;
  type?: "shipping" | "product";
}) {
  const [formData, setFormData] = useState<VoucherFormData>({
    code: "",
    title: "",
    discountType: "percentage",
    discountValue: 0,
    minOrder: 0,
    usageLimit: 0,
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    status: "active",
    type: type || "product",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [minOrderDisplay, setMinOrderDisplay] = useState<string>("");

  // Helper functions for currency formatting
  const formatCurrencyInput = (value: number): string => {
    if (value === 0) return "";
    return new Intl.NumberFormat("vi-VN").format(value) + " VNĐ";
  };

  const formatCurrencyForEdit = (value: number): string => {
    if (value === 0) return "";
    return new Intl.NumberFormat("vi-VN").format(value);
  };

  const parseCurrencyInput = (value: string): number => {
    if (!value) return 0;
    // Remove all non-numeric characters
    const cleanValue = value.replace(/[^\d]/g, "");
    return parseFloat(cleanValue) || 0;
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.code.trim()) {
      newErrors.code = "Mã voucher không được để trống";
    } else if (formData.code.length < 3) {
      newErrors.code = "Mã voucher phải có ít nhất 3 ký tự";
    }

    if (!formData.title.trim()) {
      newErrors.title = "Tên voucher không được để trống";
    }

    if (formData.discountValue <= 0) {
      newErrors.discountValue = "Giá trị giảm phải lớn hơn 0";
    }

    if (
      formData.discountType === "percentage" &&
      formData.discountValue > 100
    ) {
      newErrors.discountValue =
        "Giá trị giảm phần trăm không được vượt quá 100%";
    }

    if (formData.minOrder < 0) {
      newErrors.minOrder = "Giá trị đơn tối thiểu không được âm";
    }

    if (formData.usageLimit <= 0) {
      newErrors.usageLimit = "Số lần sử dụng phải lớn hơn 0";
    }

    if (new Date(formData.startDate) >= new Date(formData.endDate)) {
      newErrors.endDate = "Ngày kết thúc phải sau ngày bắt đầu";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit(formData);
      // Reset form
      setFormData({
        code: "",
        title: "",
        discountType: "percentage",
        discountValue: 0,
        minOrder: 0,
        usageLimit: 0,
        startDate: new Date().toISOString().split("T")[0],
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
        status: "active",
        type: type || "product",
      });
      setErrors({});
      setMinOrderDisplay("");
      onClose();
      toast.success("Voucher đã được tạo thành công!");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Có lỗi xảy ra";
      toast.error(errorMessage);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tạo voucher mới</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4 ">
            <div>
              <Label htmlFor="code" className="mb-2">
                Mã voucher *
              </Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    code: e.target.value.toUpperCase(),
                  }))
                }
                placeholder="VD: FREESHIP50"
                className="font-mono"
                disabled={loading}
              />
              {errors.code && (
                <p className="text-sm text-red-500 mt-1">{errors.code}</p>
              )}
            </div>
            <div>
              <Label htmlFor="type" className="mb-2">
                Loại voucher
              </Label>
              <Select
                value={formData.type}
                onValueChange={(value: "shipping" | "product") =>
                  setFormData((prev) => ({ ...prev, type: value }))
                }
                disabled={!!type || loading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="product">Sản phẩm</SelectItem>
                  <SelectItem value="shipping">Vận chuyển</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="title" className="mb-2">
              Tên voucher *
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, title: e.target.value }))
              }
              placeholder="Nhập tên voucher"
              disabled={loading}
            />
            {errors.title && (
              <p className="text-sm text-red-500 mt-1">{errors.title}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="discountType" className="mb-2">
                Loại giảm giá
              </Label>
              <Select
                value={formData.discountType}
                onValueChange={(value: "percentage" | "fixed") =>
                  setFormData((prev) => ({ ...prev, discountType: value }))
                }
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Phần trăm (%)</SelectItem>
                  <SelectItem value="fixed">Số tiền cố định (đ)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="discountValue" className="mb-2">
                Giá trị giảm *{" "}
                {formData.discountType === "percentage" ? "(%)" : "(VND)"}
              </Label>
              <Input
                id="discountValue"
                type="number"
                min="0"
                step="any"
                value={
                  formData.discountValue === 0 ? "" : formData.discountValue
                }
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === "" || value === "0") {
                    setFormData((prev) => ({ ...prev, discountValue: 0 }));
                  } else {
                    const numValue = parseFloat(value);
                    if (numValue >= 0) {
                      setFormData((prev) => ({
                        ...prev,
                        discountValue: numValue,
                      }));
                    }
                  }
                }}
                onKeyDown={(e) => {
                  // Ngăn nhập dấu trừ (-) và dấu cộng (+)
                  if (
                    e.key === "-" ||
                    e.key === "+" ||
                    e.key === "e" ||
                    e.key === "E"
                  ) {
                    e.preventDefault();
                  }
                }}
                placeholder="Nhập giá trị giảm"
                disabled={loading}
              />
              {errors.discountValue && (
                <p className="text-sm text-red-500 mt-1">
                  {errors.discountValue}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="minOrder" className="mb-2">
                Đơn hàng tối thiểu (VND)
              </Label>
              <Input
                id="minOrder"
                type="text"
                value={
                  minOrderDisplay ||
                  (formData.minOrder === 0
                    ? ""
                    : formatCurrencyInput(formData.minOrder))
                }
                onChange={(e) => {
                  const inputValue = e.target.value;
                  // Remove VNĐ and clean the input
                  const cleanValue = inputValue
                    .replace(/VNĐ/g, "")
                    .replace(/[^\d]/g, "");
                  const numericValue = parseCurrencyInput(cleanValue);

                  // Update display with formatted number (no VNĐ while typing)
                  if (cleanValue === "") {
                    setMinOrderDisplay("");
                    setFormData((prev) => ({ ...prev, minOrder: 0 }));
                  } else {
                    const formatted = formatCurrencyForEdit(numericValue);
                    setMinOrderDisplay(formatted);
                    setFormData((prev) => ({
                      ...prev,
                      minOrder: numericValue,
                    }));
                  }
                }}
                onBlur={() => {
                  // Add VNĐ when losing focus
                  if (formData.minOrder > 0) {
                    setMinOrderDisplay(formatCurrencyInput(formData.minOrder));
                  } else {
                    setMinOrderDisplay("");
                  }
                }}
                onFocus={() => {
                  // Remove VNĐ when focused for easier editing
                  if (formData.minOrder > 0) {
                    setMinOrderDisplay(
                      formatCurrencyForEdit(formData.minOrder)
                    );
                  } else {
                    setMinOrderDisplay("");
                  }
                }}
                onKeyDown={(e) => {
                  // Allow numbers, backspace, delete, tab, escape, enter
                  if (
                    // Allow: backspace, delete, tab, escape, enter
                    [8, 9, 27, 13, 46].indexOf(e.keyCode) !== -1 ||
                    // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
                    (e.keyCode === 65 && e.ctrlKey === true) ||
                    (e.keyCode === 67 && e.ctrlKey === true) ||
                    (e.keyCode === 86 && e.ctrlKey === true) ||
                    (e.keyCode === 88 && e.ctrlKey === true) ||
                    // Allow: home, end, left, right
                    (e.keyCode >= 35 && e.keyCode <= 39)
                  ) {
                    return;
                  }
                  // Ensure that it is a number and stop the keypress
                  if (
                    (e.shiftKey || e.keyCode < 48 || e.keyCode > 57) &&
                    (e.keyCode < 96 || e.keyCode > 105)
                  ) {
                    e.preventDefault();
                  }
                }}
                placeholder="Nhập giá trị đơn tối thiểu"
                disabled={loading}
              />
              {errors.minOrder && (
                <p className="text-sm text-red-500 mt-1">{errors.minOrder}</p>
              )}
            </div>
            <div>
              <Label htmlFor="usageLimit" className="mb-2">
                Số lần sử dụng tối đa *
              </Label>
              <Input
                id="usageLimit"
                type="number"
                min="1"
                step="1"
                value={formData.usageLimit === 0 ? "" : formData.usageLimit}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === "") {
                    setFormData((prev) => ({ ...prev, usageLimit: 0 }));
                  } else {
                    const numValue = parseInt(value);
                    if (numValue >= 0) {
                      setFormData((prev) => ({
                        ...prev,
                        usageLimit: numValue,
                      }));
                    }
                  }
                }}
                onKeyDown={(e) => {
                  if (
                    e.key === "-" ||
                    e.key === "+" ||
                    e.key === "." ||
                    e.key === "e" ||
                    e.key === "E"
                  ) {
                    e.preventDefault();
                  }
                }}
                placeholder="Nhập số lần sử dụng tối đa"
                disabled={loading}
              />
              {errors.usageLimit && (
                <p className="text-sm text-red-500 mt-1">{errors.usageLimit}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startDate" className="mb-2">
                Ngày bắt đầu *
              </Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    startDate: e.target.value,
                  }))
                }
                disabled={loading}
              />
            </div>
            <div>
              <Label htmlFor="endDate" className="mb-2">
                Ngày kết thúc *
              </Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, endDate: e.target.value }))
                }
                disabled={loading}
              />
              {errors.endDate && (
                <p className="text-sm text-red-500 mt-1">{errors.endDate}</p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="status" className="mb-2">
              Trạng thái
            </Label>
            <Select
              value={formData.status}
              onValueChange={(value: "active" | "inactive") =>
                setFormData((prev) => ({ ...prev, status: value }))
              }
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Hoạt động</SelectItem>
                <SelectItem value="inactive">Tạm dừng</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Đang tạo..." : "Tạo voucher"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function VoucherPage({
  type,
}: {
  type?: "shipping" | "product";
}) {
  const [activeTab, setActiveTab] = useState(type || "all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // Use Firebase hooks
  const {
    vouchers,
    loading,
    error,
    stats,
    createVoucher,
    updateVoucherStatus,
  } = useVoucherData(type);

  const {
    filteredVouchers,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
  } = useVoucherFilter(vouchers);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("vi-VN");
  };

  // Filter vouchers by active tab (when not in type-specific page)
  const displayVouchers = useMemo(() => {
    if (type) {
      return filteredVouchers; // Already filtered by type in hook
    } else if (activeTab !== "all") {
      return filteredVouchers.filter((voucher) => voucher.type === activeTab);
    }
    return filteredVouchers;
  }, [filteredVouchers, activeTab, type]);

  const handleCreateVoucher = async (voucherData: VoucherFormData) => {
    await createVoucher(voucherData);
  };

  const getBadgeVariant = (status: string) => {
    switch (status) {
      case "active":
        return "default";
      case "inactive":
        return "secondary";
      case "expired":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const getBadgeText = (status: string) => {
    switch (status) {
      case "active":
        return "Hoạt động";
      case "inactive":
        return "Tạm dừng";
      case "expired":
        return "Hết hạn";
      default:
        return status;
    }
  };

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
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <IconPlus className="w-4 h-4 mr-2" />
            Tạo voucher mới
          </Button>
          <CreateVoucherForm
            isOpen={isCreateDialogOpen}
            onClose={() => setIsCreateDialogOpen(false)}
            onSubmit={handleCreateVoucher}
            loading={loading}
            type={type}
          />
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <IconAlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng voucher</CardTitle>
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
              <IconTicket className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats.totalVouchers}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.activeVouchers} đang hoạt động
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Voucher hoạt động
            </CardTitle>
            <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
              <IconCheck className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats.activeVouchers}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.expiredVouchers} đã hết hạn
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lượt sử dụng</CardTitle>
            <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center">
              {type === "shipping" ? (
                <IconTruck className="h-4 w-4 text-orange-600" />
              ) : (
                <IconCoins className="h-4 w-4 text-orange-600" />
              )}
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {stats.totalUsage.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  Tổng lượt sử dụng
                </p>
              </>
            )}
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
                    Tất cả ({vouchers.length})
                  </TabsTrigger>
                  <TabsTrigger value="shipping">
                    Vận chuyển (
                    {vouchers.filter((v) => v.type === "shipping").length})
                  </TabsTrigger>
                  <TabsTrigger value="product">
                    Sản phẩm (
                    {vouchers.filter((v) => v.type === "product").length})
                  </TabsTrigger>
                </TabsList>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">
                    Hiển thị {displayVouchers.length} voucher
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
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Trạng thái" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả trạng thái</SelectItem>
                    <SelectItem value="active">Hoạt động</SelectItem>
                    <SelectItem value="inactive">Tạm dừng</SelectItem>
                    <SelectItem value="expired">Hết hạn</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Voucher List */}
          <div className="p-6">
            {loading && displayVouchers.length === 0 ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Skeleton className="w-12 h-12 rounded-full" />
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-4 w-48" />
                          <Skeleton className="h-3 w-32" />
                        </div>
                      </div>
                      <div className="text-right space-y-2">
                        <Skeleton className="h-6 w-24" />
                        <Skeleton className="h-3 w-32" />
                        <Skeleton className="h-6 w-20" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : displayVouchers.length === 0 ? (
              <div className="text-center py-12">
                <IconTicket className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  Chưa có voucher nào
                </h3>
                <p className="text-gray-500 mb-4">
                  Bắt đầu tạo voucher đầu tiên để thu hút khách hàng
                </p>
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <IconPlus className="w-4 h-4 mr-2" />
                  Tạo voucher mới
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {displayVouchers.map((voucher) => (
                  <div
                    key={voucher.id}
                    className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center flex-shrink-0">
                          {voucher.type === "shipping" ? (
                            <IconTruck className="w-6 h-6 text-orange-600" />
                          ) : (
                            <IconTicket className="w-6 h-6 text-orange-600" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="font-mono font-semibold text-sm bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                              {voucher.code}
                            </div>
                            <Badge variant={getBadgeVariant(voucher.status)}>
                              {getBadgeText(voucher.status)}
                            </Badge>
                          </div>
                          <div className="font-medium text-lg mb-1">
                            {voucher.title}
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm text-gray-500">
                            <div>
                              <span className="font-medium">Sử dụng:</span>{" "}
                              {voucher.usageCount.toLocaleString()}/
                              {voucher.usageLimit.toLocaleString()}
                            </div>
                            <div>
                              <span className="font-medium">
                                Đơn tối thiểu:
                              </span>{" "}
                              {formatCurrency(voucher.minOrder)}
                            </div>
                            <div>
                              <span className="font-medium">Bắt đầu:</span>{" "}
                              {formatDate(voucher.startDate)}
                            </div>
                            <div>
                              <span className="font-medium">Kết thúc:</span>{" "}
                              {formatDate(voucher.endDate)}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 ml-4">
                        <div className="font-bold text-orange-600 text-xl mb-1">
                          {voucher.discountType === "percentage"
                            ? `GIẢM ${voucher.discountValue}%`
                            : `GIẢM ${formatCurrency(voucher.discountValue)}`}
                        </div>
                        <div className="text-xs text-gray-500 mb-2">
                          {voucher.type === "shipping"
                            ? "Phí vận chuyển"
                            : "Giá sản phẩm"}
                        </div>
                        <div className="flex gap-1">
                          {voucher.status === "active" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                updateVoucherStatus(voucher.id, "inactive")
                              }
                            >
                              <IconX className="w-3 h-3" />
                            </Button>
                          )}
                          {voucher.status === "inactive" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                updateVoucherStatus(voucher.id, "active")
                              }
                            >
                              <IconCheck className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
