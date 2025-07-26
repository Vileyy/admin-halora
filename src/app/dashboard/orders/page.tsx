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
import { toast } from "sonner";
import {
  IconPackage,
  IconTruck,
  IconCreditCard,
  IconCalendar,
  IconUser,
  IconShoppingCart,
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

const statusOptions = [
  {
    value: "pending",
    label: "Chờ xử lý",
    color: "bg-yellow-50 text-yellow-700 border-yellow-200",
    icon: "⏳",
  },
  {
    value: "processing",
    label: "Đang xử lý",
    color: "bg-blue-50 text-blue-700 border-blue-200",
    icon: "⚙️",
  },
  {
    value: "shipped",
    label: "Đã gửi hàng",
    color: "bg-purple-50 text-purple-700 border-purple-200",
    icon: "📦",
  },
  {
    value: "delivered",
    label: "Đã giao hàng",
    color: "bg-green-50 text-green-700 border-green-200",
    icon: "✅",
  },
  {
    value: "cancelled",
    label: "Đã hủy",
    color: "bg-red-50 text-red-700 border-red-200",
    icon: "❌",
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
    return statusOption?.color || "bg-gray-100 text-gray-800";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("vi-VN");
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN").format(price);
  };

  return (
    <div className="space-y-8">
      {/* Header với thông tin cơ bản */}
      <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-xl p-8 shadow-sm">
        <div className="flex items-center justify-between mb-6">
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
            )} border-2 px-4 py-2 text-sm font-medium`}
          >
            <span className="mr-2 text-lg">
              {statusOptions.find((option) => option.value === status)?.icon}
            </span>
            {statusOptions.find((option) => option.value === status)?.label ||
              status}
          </Badge>
        </div>
      </div>

      {/* Thông tin chi tiết */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Thông tin đơn hàng */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2">
              <IconShoppingCart className="w-5 h-5" />
              <span>Thông tin đơn hàng</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <IconCalendar className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium">Ngày tạo</p>
                    <p className="text-sm text-gray-600">
                      {formatDate(order.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <IconCalendar className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium">Cập nhật lần cuối</p>
                    <p className="text-sm text-gray-600">
                      {formatDate(order.updatedAt)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <IconUser className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium">Mã khách hàng</p>
                    <p className="text-sm text-gray-600">
                      {order.userId.slice(-8)}
                    </p>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <IconCreditCard className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium">Thanh toán</p>
                    <p className="text-sm text-gray-600">
                      {order.paymentMethod === "cod"
                        ? "Thanh toán khi nhận hàng"
                        : "Chuyển khoản"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <IconTruck className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium">Vận chuyển</p>
                    <p className="text-sm text-gray-600">
                      {order.shippingMethod === "standard"
                        ? "Tiêu chuẩn"
                        : "Nhanh"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <IconPackage className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium">Phí vận chuyển</p>
                    <p className="text-sm text-gray-600">
                      {formatPrice(order.shippingFee)} VNĐ
                    </p>
                  </div>
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
                  {
                    statusOptions.find((option) => option.value === status)
                      ?.icon
                  }
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
                      <span className="mr-2">{option.icon}</span>
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
  const [loading, setLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

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

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      setLoading(true);
      await set(ref(database, `orders/${orderId}/status`), newStatus);
      await set(
        ref(database, `orders/${orderId}/updatedAt`),
        new Date().toISOString()
      );
      setLoading(false);
      setDetailDialogOpen(false);
      toast.success("Cập nhật trạng thái đơn hàng thành công!");
    } catch (error) {
      setLoading(false);
      toast.error("Có lỗi xảy ra khi cập nhật trạng thái!");
    }
  };

  const getStatusColor = (status: string) => {
    const statusOption = statusOptions.find(
      (option) => option.value === status
    );
    return statusOption?.color || "bg-gray-100 text-gray-800";
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
        <div className="flex items-center space-x-2">
          <div className="text-right">
            <p className="text-sm text-gray-600">Tổng đơn hàng</p>
            <p className="text-2xl font-bold text-blue-600">{orders.length}</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {orders.map((order) => (
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
                            {
                              statusOptions.find(
                                (option) => option.value === order.status
                              )?.icon
                            }
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

        {orders.length === 0 && (
          <Card>
            <CardContent className="p-12">
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <IconPackage className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Chưa có đơn hàng nào
                </h3>
                <p className="text-gray-600">
                  Khi có đơn hàng mới, chúng sẽ xuất hiện ở đây
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
