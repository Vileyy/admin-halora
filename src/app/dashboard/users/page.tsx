"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { NoSSR } from "@/components/ui/no-ssr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { database } from "@/lib/firebase";
import { ref, onValue, update, remove } from "firebase/database";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  IconUser,
  IconMail,
  IconPhone,
  IconMapPin,
  IconRefresh,
  IconSearch,
  IconCheck,
  IconX,
  IconEdit,
  IconLock,
  IconTrash,
  IconChevronRight,
  IconAlertCircle,
} from "@tabler/icons-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

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
  avatar: string;
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

// Helper function get user avatar
const getUserAvatar = (user: UserData): string => {
  return user.avatar || user.photoURL || "/default-avatar.svg";
};

function UserAvatar({
  user,
  size = "w-14 h-14",
  showOnlineStatus = false,
}: {
  user: UserData;
  size?: string;
  showOnlineStatus?: boolean;
}) {
  const getSizeInPixels = (sizeClass: string): number => {
    if (sizeClass.includes("16")) return 64;
    if (sizeClass.includes("14")) return 56;
    if (sizeClass.includes("12")) return 48;
    if (sizeClass.includes("10")) return 40;
    if (sizeClass.includes("8")) return 32;
    return 56;
  };

  const pixelSize = getSizeInPixels(size);

  return (
    <div className="relative">
      <NoSSR
        fallback={<div className={`${size} rounded-full bg-gray-200 border`} />}
      >
        <Image
          src={getUserAvatar(user)}
          alt={user.displayName || "User"}
          width={pixelSize}
          height={pixelSize}
          className={`${size} rounded-full object-cover border`}
          onError={(e) => {
            e.currentTarget.src = "/default-avatar.svg";
          }}
          priority={false}
          placeholder="blur"
          blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iNTAiIGN5PSI1MCIgcj0iNTAiIGZpbGw9IiNmM2Y0ZjYiLz48L3N2Zz4="
        />
      </NoSSR>
      {showOnlineStatus && (
        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
      )}
    </div>
  );
}

function EditUserDialog({
  user,
  onUpdate,
}: {
  user: UserData;
  onUpdate: (userId: string, data: Partial<UserData>) => void;
}) {
  const [formData, setFormData] = useState({
    displayName: user.displayName || "",
    email: user.email || "",
    phone: user.phone || "",
    address: user.address || "",
    gender: user.gender || "other",
    status: user.status || "active",
  });
  const [isOpen, setIsOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate(user.id, formData);
    setIsOpen(false);
    toast.success("Cập nhật thông tin người dùng thành công!");
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          className="bg-white hover:bg-gray-50"
        >
          <IconEdit className="w-4 h-4 mr-2" />
          Chỉnh sửa
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Chỉnh sửa thông tin người dùng</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="displayName" className="mb-2">
              Tên hiển thị
            </Label>
            <Input
              id="displayName"
              value={formData.displayName}
              onChange={(e) =>
                setFormData({ ...formData, displayName: e.target.value })
              }
              required
            />
          </div>
          <div>
            <Label htmlFor="email" className="mb-2">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              required
            />
          </div>
          <div>
            <Label htmlFor="phone" className="mb-2">
              Số điện thoại
            </Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              required
            />
          </div>
          <div>
            <Label htmlFor="address" className="mb-2">
              Địa chỉ
            </Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) =>
                setFormData({ ...formData, address: e.target.value })
              }
              required
            />
          </div>
          <div>
            <Label htmlFor="gender" className="mb-2">
              Giới tính
            </Label>
            <Select
              value={formData.gender}
              onValueChange={(value) =>
                setFormData({ ...formData, gender: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Nam</SelectItem>
                <SelectItem value="female">Nữ</SelectItem>
                <SelectItem value="other">Khác</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="status" className="mb-2">
              Trạng thái
            </Label>
            <Select
              value={formData.status}
              onValueChange={(value) =>
                setFormData({ ...formData, status: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Đang hoạt động</SelectItem>
                <SelectItem value="inactive">Ngừng hoạt động</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
            >
              Hủy
            </Button>
            <Button type="submit">Cập nhật</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

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
          <UserAvatar user={user} size="w-16 h-16" />
          <div>
            <CardTitle className="text-xl font-bold">
              {user.displayName || "Không có tên"}
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
              <span>{user.email || "Không có email"}</span>
            </div>
            <div className="flex items-center gap-2 mt-1 text-gray-600">
              <IconPhone className="w-4 h-4" />
              <span>{user.phone || "Không có số điện thoại"}</span>
            </div>
            <div className="flex items-center gap-2 mt-1 text-gray-600">
              <IconMapPin className="w-4 h-4" />
              <span>{user.address || "Không có địa chỉ"}</span>
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
                <Image
                  src={item.image}
                  alt={item.name}
                  width={64}
                  height={64}
                  className="w-16 h-16 object-cover rounded-lg shadow-sm"
                />
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{item.name}</h4>
                  <p className="text-sm text-gray-600">
                    {formatPrice(item.price)} VNĐ x {item.quantity}
                  </p>
                  {/* <p className="text-xs text-gray-400 mt-1">
                    {item.description}
                  </p> */}
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
                      <Image
                        src={item.image}
                        alt={item.name}
                        width={32}
                        height={32}
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
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Tránh hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const usersRef = ref(database, "users");
    const unsubscribe = onValue(usersRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) return setUsers([]);
      const usersArray = Object.entries(data).map(
        ([id, value]: [string, unknown]) => {
          const userData = value as UserData;
          return {
            ...userData,
            id,
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
          (user.displayName?.toLowerCase() || "").includes(
            searchTerm.toLowerCase()
          ) ||
          (user.email?.toLowerCase() || "").includes(
            searchTerm.toLowerCase()
          ) ||
          (user.phone || "").includes(searchTerm)
      );
    }
    setFilteredUsers(filtered);
  }, [users, searchTerm]);

  const handleUpdateUser = async (userId: string, data: Partial<UserData>) => {
    try {
      const userRef = ref(database, `users/${userId}`);
      await update(userRef, data);
      toast.success("Cập nhật người dùng thành công!");
    } catch {
      toast.error("Có lỗi xảy ra khi cập nhật người dùng!");
    }
  };

  const handleToggleUserStatus = async (
    userId: string,
    currentStatus: string
  ) => {
    try {
      const newStatus = currentStatus === "active" ? "banned" : "active";
      const userRef = ref(database, `users/${userId}`);
      await update(userRef, { status: newStatus });
      toast.success(
        newStatus === "active"
          ? "Mở khóa tài khoản thành công!"
          : "Khóa tài khoản thành công!"
      );
    } catch {
      toast.error("Có lỗi xảy ra khi thay đổi trạng thái tài khoản!");
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      const userRef = ref(database, `users/${userId}`);
      await remove(userRef);
      toast.success("Xóa người dùng thành công!");
    } catch {
      toast.error("Có lỗi xảy ra khi xóa người dùng!");
    }
  };

  // Hiển thị loading cho đến khi component mounted để tránh hydration mismatch
  if (!mounted) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Quản lý người dùng
            </h1>
            <p className="text-gray-600 mt-1">Đang tải dữ liệu người dùng...</p>
          </div>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white rounded-lg border p-6 animate-pulse"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gray-200 rounded-full"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-32"></div>
                  <div className="h-3 bg-gray-200 rounded w-48"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

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
            <h3 className="text-lg font-semibold text-gray-900">Tìm kiếm</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSearchTerm("")}
            >
              <IconRefresh className="w-4 h-4" />
              Xóa tìm kiếm
            </Button>
          </div>
          <div className="relative">
            <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Tìm theo tên, email, số điện thoại..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
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
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <UserAvatar
                    user={user}
                    size="w-14 h-14"
                    showOnlineStatus={true}
                  />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {user.displayName || "Không có tên"}
                    </h3>
                    <div className="flex items-center gap-2 mt-1 text-gray-600">
                      <IconMail className="w-4 h-4" />
                      <span className="text-sm">
                        {user.email || "Không có email"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-gray-600">
                      <IconPhone className="w-4 h-4" />
                      <span className="text-sm">
                        {user.phone || "Không có số điện thoại"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-gray-600">
                      <IconMapPin className="w-4 h-4" />
                      <span className="text-sm">
                        {user.address || "Không có địa chỉ"}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <EditUserDialog user={user} onUpdate={handleUpdateUser} />

                  <Button
                    size="sm"
                    variant="outline"
                    className="bg-white hover:bg-gray-50"
                    onClick={() => handleToggleUserStatus(user.id, user.status)}
                  >
                    <IconLock className="w-4 h-4 mr-2" />
                    {user.status === "active" ? "Khóa" : "Mở khóa"}
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        size="sm"
                        variant="outline"
                        className="bg-white hover:bg-red-50 text-red-600 border-red-200"
                      >
                        <IconTrash className="w-4 h-4 mr-2" />
                        Xóa
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                          <IconAlertCircle className="w-5 h-5 text-red-500" />
                          Xác nhận xóa người dùng
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          Bạn có chắc chắn muốn xóa người dùng &quot;
                          {user.displayName}&quot;? Hành động này không thể hoàn
                          tác.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Hủy</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteUser(user.id)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Xóa
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>

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
                        <IconChevronRight className="w-4 h-4" />
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
