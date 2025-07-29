import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { database } from "@/lib/firebase";
import { ref, onValue, set } from "firebase/database";
import { Button } from "@/components/ui/button";
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
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  IconPackage,
  IconTruck,
  IconCreditCard,
  IconCalendar,
  IconUser,
  IconShoppingCart,
  IconSearch,
  IconFilter,
  IconRefresh,
  IconDownload,
  IconEye,
  IconEyeOff,
} from "@tabler/icons-react";

interface OrderItem {
  id: string;
  image: string;
  name: string;
  price: string;
  quantity: number;
}

interface Order {
  id: string;
  createdAt: string;
  discountCode: string;
  note: string;
  orderItems: OrderItem[];
  paymentMethod: string;
  shippingFee: number;
  shippingMethod: string;
  status: string;
  subtotal: number;
  total: number;
  updatedAt: string;
  userId: string;
}

// Helper function to map icon names to emojis
const getStatusIcon = (iconName: string) => {
  const iconMap: { [key: string]: string } = {
    "time-outline": "⏰",
    "sync-outline": "🔄",
    "car-outline": "🚚",
    "checkmark-circle-outline": "✅",
    "close-circle-outline": "❌",
  };
  return iconMap[iconName] || "📦";
};

const statusOptions = [
  {
    label: "Chờ xác nhận",
    value: "pending",
    color: "#f5a623",
    bgColor: "#FFF5E6",
    icon: "time-outline",
  },
  {
    label: "Đang xử lý",
    value: "processing",
    color: "#9C27B0",
    bgColor: "#F3E5F5",
    icon: "sync-outline",
  },
  {
    label: "Đang giao hàng",
    value: "shipped",
    color: "#4a90e2",
    bgColor: "#E3F2FD",
    icon: "car-outline",
  },
  {
    label: "Đã giao hàng",
    value: "delivered",
    color: "#4CAF50",
    bgColor: "#E8F5E9",
    icon: "checkmark-circle-outline",
  },
  {
    label: "Đã hủy",
    value: "cancelled",
    color: "#F44336",
    bgColor: "#FFEBEE",
    icon: "close-circle-outline",
  },
];

function OrderDetailDialog({
  order,
  onStatusChange,
  loading,
}: {
  order: Order;
  onStatusChange: (orderId: string, newStatus: string) => void;
  loading: boolean;
}) {
  const [status, setStatus] = useState(order.status);

  const handleStatusChange = () => {
    if (status !== order.status) {
      onStatusChange(order.id, status);
    }
  };

  const getStatusColor = (status: string) => {
    const statusOption = statusOptions.find(
      (option) => option.value === status
    );
    return statusOption
      ? `bg-[${statusOption.bgColor}] text-[${statusOption.color}] border-[${statusOption.color}]`
      : "bg-gray-100 text-gray-800";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("vi-VN");
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN").format(price);
  };

  return (
    <div className="space-y-6">
      {/* Header với thông tin cơ bản */}
      <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl shadow-sm">
              <IconPackage className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Đơn hàng #{order.id.slice(-8)}
              </h2>
              <p className="text-gray-600 mt-1">
                Tạo lúc {formatDate(order.createdAt)}
              </p>
            </div>
          </div>
          <Badge
            className={`${getStatusColor(
              status
            )} border-2 px-4 py-2 text-sm font-medium flex items-center`}
          >
            <span className="mr-2">
              {getStatusIcon(
                statusOptions.find((option) => option.value === status)?.icon ||
                  ""
              )}
            </span>
            {statusOptions.find((option) => option.value === status)?.label ||
              status}
          </Badge>
        </div>
      </div>

      {/* Thông tin chi tiết - Layout hàng ngang */}
      <div className="space-y-6">
        {/* Thông tin đơn hàng */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2">
              <IconShoppingCart className="w-5 h-5" />
              <span>Thông tin đơn hàng</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Ngày tạo và Cập nhật lần cuối */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <IconCalendar className="w-5 h-5 text-blue-500" />
                <div>
                  <p className="text-sm font-medium text-gray-700">Ngày tạo</p>
                  <p className="text-sm text-gray-600">
                    {formatDate(order.createdAt)}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <IconCalendar className="w-5 h-5 text-blue-500" />
                <div>
                  <p className="text-sm font-medium text-gray-700">
                    Cập nhật lần cuối
                  </p>
                  <p className="text-sm text-gray-600">
                    {formatDate(order.updatedAt)}
                  </p>
                </div>
              </div>
            </div>

            {/*Mã khách hàng và Phương thức thanh toán */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <IconUser className="w-5 h-5 text-blue-500" />
                <div>
                  <p className="text-sm font-medium text-gray-700">
                    Mã khách hàng
                  </p>
                  <p className="text-sm text-gray-600">
                    {order.userId.slice(-8)}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <IconCreditCard className="w-5 h-5 text-green-500" />
                <div>
                  <p className="text-sm font-medium text-gray-700">
                    Phương thức thanh toán
                  </p>
                  <p className="text-sm text-gray-600">
                    {order.paymentMethod === "cod"
                      ? "Thanh toán khi nhận hàng"
                      : "Chuyển khoản"}
                  </p>
                </div>
              </div>
            </div>

            {/*Vận chuyển và Phí vận chuyển */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <IconTruck className="w-5 h-5 text-purple-500" />
                <div>
                  <p className="text-sm font-medium text-gray-700">
                    Phương thức vận chuyển
                  </p>
                  <p className="text-sm text-gray-600">
                    {order.shippingMethod === "standard"
                      ? "Tiêu chuẩn"
                      : "Nhanh"}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <IconPackage className="w-5 h-5 text-orange-500" />
                <div>
                  <p className="text-sm font-medium text-gray-700">
                    Phí vận chuyển
                  </p>
                  <p className="text-sm text-gray-600">
                    {formatPrice(order.shippingFee)} VNĐ
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cập nhật trạng thái */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Cập nhật trạng thái</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Trạng thái hiện tại
              </label>
              <Badge
                className={`${getStatusColor(
                  status
                )} border w-full justify-center py-2`}
              >
                <span className="mr-1">
                  {getStatusIcon(
                    statusOptions.find((option) => option.value === status)
                      ?.icon || ""
                  )}
                </span>
                {statusOptions.find((option) => option.value === status)
                  ?.label || status}
              </Badge>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">
                Chọn trạng thái mới
              </label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <span className="mr-2">{getStatusIcon(option.icon)}</span>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handleStatusChange}
              disabled={loading || status === order.status}
              className="w-full"
            >
              {loading ? "Đang cập nhật..." : "Cập nhật trạng thái"}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Sản phẩm đã đặt */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center space-x-2">
            <IconShoppingCart className="w-5 h-5" />
            <span>Sản phẩm đã đặt ({order.orderItems.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {order.orderItems.map((item, index) => (
              <div
                key={item.id}
                className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg"
              >
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-16 h-16 object-cover rounded-lg shadow-sm"
                />
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{item.name}</h4>
                  <p className="text-sm text-gray-600">
                    {formatPrice(parseInt(item.price))} VNĐ x {item.quantity}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">
                    {formatPrice(parseInt(item.price) * item.quantity)} VNĐ
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Ghi chú */}
      {order.note && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Ghi chú</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">
              {order.note}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Tổng tiền */}
      <Card className="bg-gradient-to-r from-green-50 to-emerald-50">
        <CardHeader className="pb-3">
          <CardTitle className="text-green-800">Tổng thanh toán</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Tổng tiền hàng:</span>
              <span className="font-medium">
                {formatPrice(order.subtotal)} VNĐ
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Phí vận chuyển:</span>
              <span className="font-medium">
                {formatPrice(order.shippingFee)} VNĐ
              </span>
            </div>
            <Separator />
            <div className="flex justify-between items-center text-lg font-bold text-green-800">
              <span>Tổng cộng:</span>
              <span>{formatPrice(order.total)} VNĐ</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);
  const [dateRange, setDateRange] = useState<{
    start: string;
    end: string;
  }>({
    start: "",
    end: "",
  });

  useEffect(() => {
    const ordersRef = ref(database, "orders");
    const unsubscribe = onValue(ordersRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) return setOrders([]);
      const ordersArray = Object.entries(data)
        .map(([id, value]: [string, unknown]) => {
          if (
            typeof value === "object" &&
            value !== null &&
            "createdAt" in value &&
            "orderItems" in value &&
            "status" in value
          ) {
            const v = value as {
              createdAt: string;
              discountCode: string;
              note: string;
              orderItems: OrderItem[];
              paymentMethod: string;
              shippingFee: number;
              shippingMethod: string;
              status: string;
              subtotal: number;
              total: number;
              updatedAt: string;
              userId: string;
            };
            return {
              id,
              ...v,
            };
          }
          return null;
        })
        .filter((item): item is Order => item !== null)
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      setOrders(ordersArray);
    });
    return () => unsubscribe();
  }, []);

  // Filter orders based on current filters
  useEffect(() => {
    let filtered = [...orders];

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter((order) => order.status === statusFilter);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (order) =>
          order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.userId.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.orderItems.some((item) =>
            item.name.toLowerCase().includes(searchTerm.toLowerCase())
          )
      );
    }

    // Filter by date range
    if (dateRange.start || dateRange.end) {
      filtered = filtered.filter((order) => {
        const orderDate = new Date(order.createdAt);
        const startDate = dateRange.start ? new Date(dateRange.start) : null;
        const endDate = dateRange.end ? new Date(dateRange.end) : null;

        if (startDate && endDate) {
          return orderDate >= startDate && orderDate <= endDate;
        } else if (startDate) {
          return orderDate >= startDate;
        } else if (endDate) {
          return orderDate <= endDate;
        }
        return true;
      });
    }

    setFilteredOrders(filtered);
  }, [orders, statusFilter, searchTerm, dateRange]);

  // Calculate statistics
  const getStatusCount = (status: string) => {
    return orders.filter((order) => order.status === status).length;
  };

  const getTotalRevenue = () => {
    return orders
      .filter((order) => order.status === "delivered")
      .reduce((total, order) => total + order.total, 0);
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      setLoading(true);

      // Cập nhật vào orders collection (cho admin)
      await set(ref(database, `orders/${orderId}/status`), newStatus);
      await set(
        ref(database, `orders/${orderId}/updatedAt`),
        new Date().toISOString()
      );

      // Cập nhật vào users collection (cho mobile app)
      const order = orders.find((o) => o.id === orderId);
      if (order) {
        await set(
          ref(database, `users/${order.userId}/orders/${orderId}/status`),
          newStatus
        );
        await set(
          ref(database, `users/${order.userId}/orders/${orderId}/updatedAt`),
          new Date().toISOString()
        );
      }

      setLoading(false);
      setDetailDialogOpen(false);
      toast.success("Cập nhật trạng thái đơn hàng thành công!");
    } catch (error) {
      setLoading(false);
      toast.error("Có lỗi xảy ra khi cập nhật trạng thái!");
    }
  };

  const clearFilters = () => {
    setStatusFilter("all");
    setSearchTerm("");
    setDateRange({ start: "", end: "" });
  };

  const getStatusColor = (status: string) => {
    const statusOption = statusOptions.find(
      (option) => option.value === status
    );
    return statusOption
      ? `bg-[${statusOption.bgColor}] text-[${statusOption.color}] border-[${statusOption.color}]`
      : "bg-gray-100 text-gray-800";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN");
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN").format(price);
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quản lý đơn hàng</h1>
          <p className="text-gray-600 mt-1">
            Theo dõi và quản lý tất cả đơn hàng
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <p className="text-sm text-gray-600">Tổng đơn hàng</p>
            <p className="text-2xl font-bold text-blue-600">{orders.length}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Tổng doanh thu</p>
            <p className="text-2xl font-bold text-green-600">
              {formatPrice(getTotalRevenue())} VNĐ
            </p>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <Card className="bg-gradient-to-r from-blue-50 to-blue-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">
                  Chờ xác nhận
                </p>
                <p className="text-2xl font-bold text-blue-800">
                  {getStatusCount("pending")}
                </p>
              </div>
              <div className="p-2 bg-blue-200 rounded-lg">
                <IconPackage className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-yellow-50 to-yellow-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-yellow-600 font-medium">
                  Đang xử lý
                </p>
                <p className="text-2xl font-bold text-yellow-800">
                  {getStatusCount("processing")}
                </p>
              </div>
              <div className="p-2 bg-yellow-200 rounded-lg">
                <IconTruck className="w-5 h-5 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-50 to-purple-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600 font-medium">
                  Đang giao hàng
                </p>
                <p className="text-2xl font-bold text-purple-800">
                  {getStatusCount("shipped")}
                </p>
              </div>
              <div className="p-2 bg-purple-200 rounded-lg">
                <IconTruck className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-50 to-green-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium">
                  Đã giao hàng
                </p>
                <p className="text-2xl font-bold text-green-800">
                  {getStatusCount("delivered")}
                </p>
              </div>
              <div className="p-2 bg-green-200 rounded-lg">
                <IconPackage className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-red-50 to-red-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-600 font-medium">Đã hủy</p>
                <p className="text-2xl font-bold text-red-800">
                  {getStatusCount("cancelled")}
                </p>
              </div>
              <div className="p-2 bg-red-200 rounded-lg">
                <IconPackage className="w-5 h-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters Section */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Bộ lọc</h3>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                {showFilters ? (
                  <IconEyeOff className="w-4 h-4" />
                ) : (
                  <IconEye className="w-4 h-4" />
                )}
                {showFilters ? "Ẩn bộ lọc" : "Hiện bộ lọc"}
              </Button>
              <Button variant="outline" size="sm" onClick={clearFilters}>
                <IconRefresh className="w-4 h-4" />
                Xóa bộ lọc
              </Button>
            </div>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Search */}
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Tìm kiếm
                </label>
                <div className="relative">
                  <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Tìm theo mã đơn hàng, khách hàng..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Status Filter */}
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Trạng thái
                </label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tất cả trạng thái" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả trạng thái</SelectItem>
                    {statusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <span className="mr-2">
                          {getStatusIcon(option.icon)}
                        </span>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date Range Start */}
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Từ ngày
                </label>
                <Input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) =>
                    setDateRange({ ...dateRange, start: e.target.value })
                  }
                />
              </div>

              {/* Date Range End */}
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Đến ngày
                </label>
                <Input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) =>
                    setDateRange({ ...dateRange, end: e.target.value })
                  }
                />
              </div>
            </div>
          )}

          {/* Results Summary */}
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Hiển thị {filteredOrders.length} trong tổng số {orders.length}{" "}
                đơn hàng
              </p>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm">
                  <IconDownload className="w-4 h-4 mr-2" />
                  Xuất báo cáo
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {filteredOrders.map((order) => (
          <Card
            key={order.id}
            className="hover:shadow-lg transition-shadow duration-200"
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-4 mb-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <IconPackage className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h3 className="text-lg font-semibold text-gray-900">
                          Đơn hàng #{order.id.slice(-8)}
                        </h3>
                        <Badge
                          className={`${getStatusColor(order.status)} border`}
                        >
                          <span className="mr-1">
                            {getStatusIcon(
                              statusOptions.find(
                                (option) => option.value === order.status
                              )?.icon || ""
                            )}
                          </span>
                          {statusOptions.find(
                            (option) => option.value === order.status
                          )?.label || order.status}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                        <div className="flex items-center space-x-1">
                          <IconCalendar className="w-4 h-4" />
                          <span>{formatDate(order.createdAt)}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <IconShoppingCart className="w-4 h-4" />
                          <span>{order.orderItems.length} sản phẩm</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <IconCreditCard className="w-4 h-4" />
                          <span>
                            {order.paymentMethod === "cod"
                              ? "COD"
                              : "Chuyển khoản"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-sm text-gray-600">Tổng tiền</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {formatPrice(order.total)} VNĐ
                      </p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-sm text-gray-600">Tiền hàng</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {formatPrice(order.subtotal)} VNĐ
                      </p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-sm text-gray-600">Phí vận chuyển</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {formatPrice(order.shippingFee)} VNĐ
                      </p>
                    </div>
                  </div>
                </div>

                <div className="ml-6">
                  <Dialog
                    open={detailDialogOpen && selectedOrder?.id === order.id}
                    onOpenChange={(open) => {
                      setDetailDialogOpen(open);
                      if (open) {
                        setSelectedOrder(order);
                      } else {
                        setSelectedOrder(null);
                      }
                    }}
                  >
                    <DialogTrigger asChild>
                      <Button
                        size="sm"
                        variant="outline"
                        className="bg-white hover:bg-gray-50"
                        onClick={() => {
                          setSelectedOrder(order);
                          setDetailDialogOpen(true);
                        }}
                      >
                        Xem chi tiết
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-7xl w-[95vw] max-h-[95vh] overflow-y-auto p-0">
                      <DialogHeader className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 px-8 py-8 border-b">
                        <DialogTitle className="text-3xl font-bold text-gray-900 flex items-center space-x-4">
                          <div className="p-3 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl shadow-sm">
                            <IconPackage className="w-8 h-8 text-blue-600" />
                          </div>
                          <div>
                            <span>Chi tiết đơn hàng #{order.id.slice(-8)}</span>
                            <p className="text-gray-600 mt-1 text-lg">
                              Xem và quản lý thông tin chi tiết đơn hàng
                            </p>
                          </div>
                        </DialogTitle>
                      </DialogHeader>
                      <div className="p-8">
                        <OrderDetailDialog
                          order={order}
                          onStatusChange={handleStatusChange}
                          loading={loading}
                        />
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredOrders.length === 0 && (
          <Card>
            <CardContent className="p-12">
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <IconPackage className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {orders.length === 0
                    ? "Chưa có đơn hàng nào"
                    : "Không tìm thấy đơn hàng"}
                </h3>
                <p className="text-gray-600">
                  {orders.length === 0
                    ? "Khi có đơn hàng mới, chúng sẽ xuất hiện ở đây"
                    : "Thử điều chỉnh bộ lọc để tìm kiếm đơn hàng khác"}
                </p>
                {orders.length > 0 && (
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
