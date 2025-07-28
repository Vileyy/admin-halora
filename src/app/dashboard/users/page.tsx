import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { database } from "@/lib/firebase";
import { ref, onValue } from "firebase/database";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  IconUser,
  IconMail,
  IconPhone,
  IconMapPin,
  IconShoppingCart,
  IconEye,
  IconEyeOff,
  IconRefresh,
  IconSearch,
  IconCheck,
  IconX,
} from "@tabler/icons-react";

interface UserOrderItem {
  id: string;
  image: string;
  name: string;
  price: number | string;
  quantity: number;
}

interface UserOrder {
  orderId: string;
  createdAt: string;
  deliveredDate?: string;
  shippedDate?: string;
  cancelledDate?: string;
  items: UserOrderItem[];
  status: string;
  total: number;
}

interface UserCartItem {
  id: string;
  image: string;
  name: string;
  price: number | string;
  quantity: number;
  category: string;
  description: string;
  selected: boolean;
}

interface UserData {
  id: string;
  displayName: string;
  email: string;
  phone: string;
  address: string;
  gender: string;
  photoURL: string;
  status: string;
  cart: UserCartItem[];
  orders: Record<string, UserOrder>;
}

const statusOptions = [
  {
    value: "active",
    label: "Đang hoạt động",
    color: "bg-green-50 text-green-700 border-green-200",
    icon: <IconCheck className="w-4 h-4" />,
  },
  {
    value: "inactive",
    label: "Ngừng hoạt động",
    color: "bg-red-50 text-red-700 border-red-200",
    icon: <IconX className="w-4 h-4" />,
  },
];

function UserDetailDialog({ user }: { user: UserData }) {
  const formatPrice = (price: number | string) => {
    return new Intl.NumberFormat("vi-VN").format(Number(price));
  };
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("vi-VN");
  };
  const getStatusColor = (status: string) => {
    const statusOption = statusOptions.find(
      (option) => option.value === status
    );
    return statusOption?.color || "bg-gray-100 text-gray-800";
  };
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center gap-4 pb-3">
          <img
            src={user.photoURL}
            alt={user.displayName}
            className="w-16 h-16 rounded-full object-cover border"
          />
          <div>
            <CardTitle className="text-xl font-bold">
              {user.displayName}
            </CardTitle>
            <Badge
              className={getStatusColor(user.status) + " border px-3 py-1 ml-2"}
            >
              {statusOptions.find((o) => o.value === user.status)?.icon}
              <span className="ml-1">
                {statusOptions.find((o) => o.value === user.status)?.label ||
                  user.status}
              </span>
            </Badge>
            <div className="flex items-center gap-2 mt-2 text-gray-600">
              <IconMail className="w-4 h-4" />
              <span>{user.email}</span>
            </div>
            <div className="flex items-center gap-2 mt-1 text-gray-600">
              <IconPhone className="w-4 h-4" />
              <span>{user.phone}</span>
            </div>
            <div className="flex items-center gap-2 mt-1 text-gray-600">
              <IconMapPin className="w-4 h-4" />
              <span>{user.address}</span>
            </div>
          </div>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Giỏ hàng hiện tại ({user.cart.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {user.cart.length === 0 && (
              <div className="text-gray-500">Không có sản phẩm trong giỏ.</div>
            )}
            {user.cart.map((item) => (
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
                    {formatPrice(item.price)} VNĐ x {item.quantity}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {item.description}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">
                    {formatPrice(Number(item.price) * item.quantity)} VNĐ
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>
            Lịch sử đơn hàng ({Object.keys(user.orders).length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.values(user.orders).length === 0 && (
              <div className="text-gray-500">Chưa có đơn hàng.</div>
            )}
            {Object.values(user.orders).map((order: UserOrder) => (
              <div
                key={order.orderId}
                className="p-4 bg-gray-50 rounded-lg mb-2"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-semibold">
                      #{order.orderId.slice(-8)}
                    </span>
                    <span className="ml-2 text-sm text-gray-600">
                      {order.status === "delivered"
                        ? "Đã giao"
                        : order.status === "cancelled"
                        ? "Đã hủy"
                        : "Đang xử lý"}
                    </span>
                  </div>
                  <span className="text-green-700 font-bold">
                    {formatPrice(order.total)} VNĐ
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {order.items.map((item: UserOrderItem) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-2 bg-white rounded px-2 py-1 border"
                    >
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-8 h-8 rounded object-cover"
                      />
                      <span className="text-xs">{item.name}</span>
                      <span className="text-xs text-gray-500">
                        x{item.quantity}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  Ngày tạo: {formatDate(order.createdAt)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserData[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  useEffect(() => {
    const usersRef = ref(database, "users");
    const unsubscribe = onValue(usersRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) return setUsers([]);
      const usersArray = Object.entries(data).map(
        ([id, value]: [string, unknown]) => {
          const { id: _omit, ...user } = value as UserData;
          return {
            id,
            ...user,
          };
        }
      );
      setUsers(usersArray);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    let filtered = [...users];
    if (searchTerm) {
      filtered = filtered.filter(
        (user) =>
          user.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.phone.includes(searchTerm)
      );
    }
    setFilteredUsers(filtered);
  }, [users, searchTerm]);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Quản lý người dùng
          </h1>
          <p className="text-gray-600 mt-1">
            Theo dõi và quản lý tất cả người dùng
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <p className="text-sm text-gray-600">Tổng người dùng</p>
            <p className="text-2xl font-bold text-blue-600">{users.length}</p>
          </div>
        </div>
      </div>
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
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSearchTerm("")}
              >
                <IconRefresh className="w-4 h-4" />
                Xóa bộ lọc
              </Button>
            </div>
          </div>
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Tìm kiếm
                </label>
                <div className="relative">
                  <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Tìm theo tên, email, số điện thoại..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          )}
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Hiển thị {filteredUsers.length} trong tổng số {users.length}{" "}
                người dùng
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      <div className="space-y-4">
        {filteredUsers.map((user) => (
          <Card
            key={user.id}
            className="hover:shadow-lg transition-shadow duration-200"
          >
            <CardContent className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <img
                  src={user.photoURL}
                  alt={user.displayName}
                  className="w-14 h-14 rounded-full object-cover border"
                />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {user.displayName}
                  </h3>
                  <div className="flex items-center gap-2 mt-1 text-gray-600">
                    <IconMail className="w-4 h-4" />
                    <span>{user.email}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-gray-600">
                    <IconPhone className="w-4 h-4" />
                    <span>{user.phone}</span>
                  </div>
                  <Badge
                    className={
                      (statusOptions.find((o) => o.value === user.status)
                        ?.color || "") + " border px-2 py-1 ml-1"
                    }
                  >
                    {statusOptions.find((o) => o.value === user.status)?.icon}
                    <span className="ml-1">
                      {statusOptions.find((o) => o.value === user.status)
                        ?.label || user.status}
                    </span>
                  </Badge>
                </div>
              </div>
              <div>
                <Dialog
                  open={detailDialogOpen && selectedUser?.id === user.id}
                  onOpenChange={(open) => {
                    setDetailDialogOpen(open);
                    if (open) {
                      setSelectedUser(user);
                    } else {
                      setSelectedUser(null);
                    }
                  }}
                >
                  <DialogTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      className="bg-white hover:bg-gray-50"
                      onClick={() => {
                        setSelectedUser(user);
                        setDetailDialogOpen(true);
                      }}
                    >
                      Xem chi tiết
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl w-[95vw] max-h-[95vh] overflow-y-auto p-0">
                    <DialogHeader className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 px-8 py-8 border-b">
                      <DialogTitle className="text-3xl font-bold text-gray-900 flex items-center space-x-4">
                        <div className="p-3 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl shadow-sm">
                          <IconUser className="w-8 h-8 text-blue-600" />
                        </div>
                        <div>
                          <span>Chi tiết người dùng</span>
                          <p className="text-gray-600 mt-1 text-lg">
                            Xem thông tin, giỏ hàng, đơn hàng của người dùng
                          </p>
                        </div>
                      </DialogTitle>
                    </DialogHeader>
                    <div className="p-8">
                      <UserDetailDialog user={user} />
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        ))}
        {filteredUsers.length === 0 && (
          <Card>
            <CardContent className="p-12">
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <IconUser className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {users.length === 0
                    ? "Chưa có người dùng nào"
                    : "Không tìm thấy người dùng"}
                </h3>
                <p className="text-gray-600">
                  {users.length === 0
                    ? "Khi có người dùng mới, họ sẽ xuất hiện ở đây"
                    : "Thử điều chỉnh bộ lọc để tìm kiếm người dùng khác"}
                </p>
                {users.length > 0 && (
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => setSearchTerm("")}
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
