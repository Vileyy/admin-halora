"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  IconSearch,
  IconRefresh,
  IconDownload,
  IconCalendar,
  IconUser,
  IconPackage,
  IconFilter,
  IconTrendingUp,
  IconAlertCircle,
} from "@tabler/icons-react";
import RevenueChart from "@/components/RevenueChart";
import { useRealtimeRevenue } from "@/hooks/useRealtimeRevenue";
import { migrateExistingDeliveredOrders } from "@/utils/migrateExistingRevenue";
import { toast } from "sonner";

const formatPrice = (price: number) => {
  return new Intl.NumberFormat("vi-VN").format(price);
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("vi-VN");
};

export default function RevenuePage() {
  const { revenueItems, loading, error } = useRealtimeRevenue();
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [monthFilter, setMonthFilter] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [migrating, setMigrating] = useState(false);

  // Filter revenue items
  const filteredItems = revenueItems.filter((item) => {
    const matchesSearch =
      item.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.userInfo.displayName
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      item.userInfo.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.orderId.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory =
      categoryFilter === "all" || item.productCategory === categoryFilter;
    const matchesMonth = monthFilter === "all" || item.month === monthFilter;

    return matchesSearch && matchesCategory && matchesMonth;
  });

  // Get unique categories and months for filters
  const categories = [
    ...new Set(revenueItems.map((item) => item.productCategory)),
  ];
  const months = [...new Set(revenueItems.map((item) => item.month))]
    .sort()
    .reverse();

  const clearFilters = () => {
    setSearchTerm("");
    setCategoryFilter("all");
    setMonthFilter("all");
  };

  const handleMigration = async () => {
    if (revenueItems.length > 0) {
      const confirmed = window.confirm(
        "Dữ liệu doanh thu đã tồn tại. Việc migration có thể tạo ra dữ liệu trùng lặp. Bạn có chắc chắn muốn tiếp tục?"
      );
      if (!confirmed) return;
    }

    setMigrating(true);
    try {
      const result = await migrateExistingDeliveredOrders();
      toast.success(
        `Migration thành công! Đã chuyển ${result.success} sản phẩm, ${result.errors} lỗi.`
      );
    } catch (error) {
      console.error("Migration failed:", error);
      toast.error("Migration thất bại. Vui lòng thử lại.");
    } finally {
      setMigrating(false);
    }
  };

  if (error) {
    return (
      <div className="p-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <IconAlertCircle className="w-6 h-6 text-red-600" />
              <div>
                <h3 className="text-lg font-semibold text-red-800">
                  Lỗi kết nối
                </h3>
                <p className="text-red-600">{error}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Báo cáo doanh thu
          </h1>
          <p className="text-gray-600 mt-1">
            Phân tích doanh thu và hiệu suất kinh doanh
          </p>
          {loading && (
            <p className="text-sm text-blue-600 mt-1 flex items-center">
              <IconRefresh className="w-4 h-4 mr-1 animate-spin" />
              Đang tải dữ liệu...
            </p>
          )}
        </div>
        <div className="flex items-center space-x-4">
          {revenueItems.length === 0 && (
            <Button
              onClick={handleMigration}
              disabled={migrating}
              variant="default"
              size="sm"
            >
              <IconTrendingUp className="w-4 h-4 mr-2" />
              {migrating ? "Đang chuyển dữ liệu..." : "Chuyển dữ liệu cũ"}
            </Button>
          )}
          <Button variant="outline" size="sm">
            <IconDownload className="w-4 h-4 mr-2" />
            Xuất báo cáo
          </Button>
        </div>
      </div>

      {/* Revenue Chart and Statistics */}
      <RevenueChart />

      {/* Filters Section */}
      <Card className="mb-6 mt-6">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Chi tiết giao dịch
            </h3>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <IconFilter className="w-4 h-4 mr-2" />
                {showFilters ? "Ẩn bộ lọc" : "Hiện bộ lọc"}
              </Button>
              <Button variant="outline" size="sm" onClick={clearFilters}>
                <IconRefresh className="w-4 h-4 mr-2" />
                Xóa bộ lọc
              </Button>
            </div>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              {/* Search */}
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Tìm kiếm
                </label>
                <div className="relative">
                  <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Tìm theo sản phẩm, khách hàng, mã đơn..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Category Filter */}
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Danh mục
                </label>
                <Select
                  value={categoryFilter}
                  onValueChange={setCategoryFilter}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tất cả danh mục" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả danh mục</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Month Filter */}
              <div>
                <label className="text-sm font-medium mb-2 block">Tháng</label>
                <Select value={monthFilter} onValueChange={setMonthFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tất cả tháng" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả tháng</SelectItem>
                    {months.map((month) => (
                      <SelectItem key={month} value={month}>
                        {month}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Results Summary */}
          <div className="pt-4 border-t">
            <p className="text-sm text-gray-600">
              Hiển thị {filteredItems.length} trong tổng số{" "}
              {revenueItems.length} giao dịch
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Revenue Items List */}
      <div className="space-y-4">
        {filteredItems.map((item) => (
          <Card
            key={item.id}
            className="hover:shadow-lg transition-shadow duration-200"
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-4 mb-3">
                    <div className="w-16 h-16 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.productImage}
                        alt={item.productName}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {item.productName}
                        </h3>
                        <Badge
                          variant="outline"
                          className="bg-blue-50 text-blue-700"
                        >
                          {item.productCategory}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <div className="flex items-center space-x-1">
                          <IconCalendar className="w-4 h-4" />
                          <span>{formatDate(item.completedAt)}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <IconUser className="w-4 h-4" />
                          <span>{item.userInfo.displayName}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <IconPackage className="w-4 h-4" />
                          <span>Số lượng: {item.quantity}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-sm text-gray-600">Giá đơn vị</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {formatPrice(item.unitPrice)} VNĐ
                      </p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-sm text-gray-600">Số lượng</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {item.quantity} sản phẩm
                      </p>
                    </div>
                    <div className="bg-green-50 p-3 rounded-lg">
                      <p className="text-sm text-green-600">Tổng doanh thu</p>
                      <p className="text-lg font-semibold text-green-800">
                        {formatPrice(item.totalPrice)} VNĐ
                      </p>
                    </div>
                  </div>

                  {/* Customer Info */}
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm font-medium text-blue-800 mb-1">
                      Thông tin khách hàng
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-blue-700">
                      <p>Tên: {item.userInfo.displayName}</p>
                      <p>Email: {item.userInfo.email}</p>
                      <p>Điện thoại: {item.userInfo.phone}</p>
                      <p>Mã đơn hàng: #{item.orderId.slice(-8)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredItems.length === 0 && !loading && (
          <Card>
            <CardContent className="p-12">
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <IconTrendingUp className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {revenueItems.length === 0
                    ? "Chưa có doanh thu"
                    : "Không tìm thấy giao dịch"}
                </h3>
                <p className="text-gray-600">
                  {revenueItems.length === 0
                    ? "Khi có đơn hàng hoàn thành, doanh thu sẽ xuất hiện ở đây"
                    : "Thử điều chỉnh bộ lọc để tìm kiếm giao dịch khác"}
                </p>
                {revenueItems.length > 0 && (
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={clearFilters}
                  >
                    Xóa bộ lọc
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
