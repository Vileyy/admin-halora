import { useState, useEffect } from "react";
import { database } from "@/lib/firebase";
import { ref, onValue, off } from "firebase/database";

export interface OrderItem {
  id: string;
  image: string;
  name: string;
  price: string;
  quantity: number;
  category?: string;
  description?: string;
}

export interface Order {
  id: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  status: string;
  paymentMethod: string;
  shippingMethod: string;
  shippingCost?: number;
  items: OrderItem[];
  itemsSubtotal?: number;
  totalAmount: number;
  appliedCoupon?: string;
  discountAmount?: number;
  // Thông tin user
  userInfo?: {
    displayName: string;
    email: string;
    phone: string;
    address: string;
  };
}

export interface OrdersStats {
  total: number;
  pending: number;
  processing: number;
  shipped: number;
  delivered: number;
  cancelled: number;
  totalRevenue: number;
}

export function useRealtimeOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<OrdersStats>({
    total: 0,
    pending: 0,
    processing: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
    totalRevenue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const usersRef = ref(database, "users");

    const unsubscribe = onValue(
      usersRef,
      (snapshot) => {
        try {
          const data = snapshot.val();
          if (!data) {
            setOrders([]);
            setStats({
              total: 0,
              pending: 0,
              processing: 0,
              shipped: 0,
              delivered: 0,
              cancelled: 0,
              totalRevenue: 0,
            });
            setLoading(false);
            return;
          }

          const allOrders: Order[] = [];

          // Duyệt qua tất cả users
          Object.entries(data).forEach(
            ([userId, userData]: [string, unknown]) => {
              if (
                userData &&
                typeof userData === "object" &&
                "orders" in userData
              ) {
                const user = userData as {
                  displayName?: string;
                  email?: string;
                  phone?: string;
                  address?: string;
                  orders: Record<string, unknown>;
                };

                const userInfo = {
                  displayName: user.displayName || "",
                  email: user.email || "",
                  phone: user.phone || "",
                  address: user.address || "",
                };

                // Duyệt qua tất cả orders của user này
                Object.entries(user.orders).forEach(
                  ([orderId, orderData]: [string, unknown]) => {
                    if (orderData && typeof orderData === "object") {
                      const orderObj = orderData as {
                        createdAt?: string;
                        updatedAt?: string;
                        status?: string;
                        paymentMethod?: string;
                        shippingMethod?: string;
                        shippingCost?: number;
                        items?: OrderItem[];
                        itemsSubtotal?: number;
                        totalAmount?: number;
                        appliedCoupon?: string;
                        discountAmount?: number;
                      };

                      const order: Order = {
                        id: orderId,
                        userId,
                        createdAt: orderObj.createdAt || "",
                        updatedAt:
                          orderObj.updatedAt || orderObj.createdAt || "",
                        status: orderObj.status || "pending",
                        paymentMethod: orderObj.paymentMethod || "cod",
                        shippingMethod: orderObj.shippingMethod || "standard",
                        shippingCost: orderObj.shippingCost || 0,
                        items: orderObj.items || [],
                        itemsSubtotal: orderObj.itemsSubtotal || 0,
                        totalAmount: orderObj.totalAmount || 0,
                        appliedCoupon: orderObj.appliedCoupon,
                        discountAmount: orderObj.discountAmount || 0,
                        userInfo,
                      };

                      allOrders.push(order);
                    }
                  }
                );
              }
            }
          );

          // Sắp xếp theo thời gian tạo (mới nhất trước)
          allOrders.sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );

          // Tính toán thống kê
          const newStats: OrdersStats = {
            total: allOrders.length,
            pending: allOrders.filter((o) => o.status === "pending").length,
            processing: allOrders.filter((o) => o.status === "processing")
              .length,
            shipped: allOrders.filter((o) => o.status === "shipped").length,
            delivered: allOrders.filter((o) => o.status === "delivered").length,
            cancelled: allOrders.filter((o) => o.status === "cancelled").length,
            totalRevenue: allOrders
              .filter((o) => o.status === "delivered")
              .reduce((sum, o) => sum + o.totalAmount, 0),
          };

          setOrders(allOrders);
          setStats(newStats);
          setLoading(false);
          setError(null);
        } catch (err) {
          console.error("Error processing orders data:", err);
          setError("Có lỗi xảy ra khi tải dữ liệu đơn hàng");
          setLoading(false);
        }
      },
      (error) => {
        console.error("Firebase error:", error);
        setError("Không thể kết nối tới cơ sở dữ liệu");
        setLoading(false);
      }
    );

    return () => {
      off(usersRef, "value", unsubscribe);
    };
  }, []);

  return {
    orders,
    stats,
    loading,
    error,
  };
}
