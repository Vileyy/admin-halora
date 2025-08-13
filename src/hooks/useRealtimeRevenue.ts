import { useState, useEffect } from "react";
import { database } from "@/lib/firebase";
import { ref, onValue, off, push } from "firebase/database";

export interface RevenueItem {
  id: string;
  orderId: string;
  userId: string;
  userInfo: {
    displayName: string;
    email: string;
    phone: string;
    address: string;
  };
  productId: string;
  productName: string;
  productImage: string;
  productCategory: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  completedAt: string;
  date: string; // YYYY-MM-DD format
  month: string; // YYYY-MM format
  year: string; // YYYY format
}

export interface RevenueStats {
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  averageOrderValue: number;
  monthlyRevenue: { [month: string]: number };
  yearlyRevenue: { [year: string]: number };
  productRevenue: {
    [productId: string]: { name: string; revenue: number; quantity: number };
  };
  categoryRevenue: { [category: string]: number };
}

export interface MonthlyData {
  month: string;
  revenue: number;
  orders: number;
  products: number;
}

export interface DailyData {
  date: string;
  revenue: number;
  orders: number;
  products: number;
}

export interface YearlyData {
  year: string;
  revenue: number;
  orders: number;
  products: number;
}

export function useRealtimeRevenue() {
  const [revenueItems, setRevenueItems] = useState<RevenueItem[]>([]);
  const [stats, setStats] = useState<RevenueStats>({
    totalRevenue: 0,
    totalOrders: 0,
    totalProducts: 0,
    averageOrderValue: 0,
    monthlyRevenue: {},
    yearlyRevenue: {},
    productRevenue: {},
    categoryRevenue: {},
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const revenueRef = ref(database, "revenue");

    const unsubscribe = onValue(
      revenueRef,
      (snapshot) => {
        try {
          const data = snapshot.val();
          if (!data) {
            setRevenueItems([]);
            setStats({
              totalRevenue: 0,
              totalOrders: 0,
              totalProducts: 0,
              averageOrderValue: 0,
              monthlyRevenue: {},
              yearlyRevenue: {},
              productRevenue: {},
              categoryRevenue: {},
            });
            setLoading(false);
            return;
          }

          const items: RevenueItem[] = Object.entries(data).map(
            ([id, item]: [string, Omit<RevenueItem, "id">]) => ({
              id,
              ...item,
            })
          );

          // Sắp xếp theo thời gian (mới nhất trước)
          items.sort(
            (a, b) =>
              new Date(b.completedAt).getTime() -
              new Date(a.completedAt).getTime()
          );

          // Tính toán thống kê
          const uniqueOrders = new Set(items.map((item) => item.orderId));
          const totalRevenue = items.reduce(
            (sum, item) => sum + item.totalPrice,
            0
          );
          const totalProducts = items.reduce(
            (sum, item) => sum + item.quantity,
            0
          );

          // Doanh thu theo tháng
          const monthlyRevenue: { [month: string]: number } = {};
          const yearlyRevenue: { [year: string]: number } = {};
          const productRevenue: {
            [productId: string]: {
              name: string;
              revenue: number;
              quantity: number;
            };
          } = {};
          const categoryRevenue: { [category: string]: number } = {};

          items.forEach((item) => {
            // Theo tháng
            monthlyRevenue[item.month] =
              (monthlyRevenue[item.month] || 0) + item.totalPrice;

            // Theo năm
            yearlyRevenue[item.year] =
              (yearlyRevenue[item.year] || 0) + item.totalPrice;

            // Theo sản phẩm
            if (!productRevenue[item.productId]) {
              productRevenue[item.productId] = {
                name: item.productName,
                revenue: 0,
                quantity: 0,
              };
            }
            productRevenue[item.productId].revenue += item.totalPrice;
            productRevenue[item.productId].quantity += item.quantity;

            // Theo danh mục
            categoryRevenue[item.productCategory] =
              (categoryRevenue[item.productCategory] || 0) + item.totalPrice;
          });

          const newStats: RevenueStats = {
            totalRevenue,
            totalOrders: uniqueOrders.size,
            totalProducts,
            averageOrderValue:
              uniqueOrders.size > 0 ? totalRevenue / uniqueOrders.size : 0,
            monthlyRevenue,
            yearlyRevenue,
            productRevenue,
            categoryRevenue,
          };

          setRevenueItems(items);
          setStats(newStats);
          setLoading(false);
          setError(null);
        } catch (err) {
          console.error("Error processing revenue data:", err);
          setError("Có lỗi xảy ra khi tải dữ liệu doanh thu");
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
      off(revenueRef, "value", unsubscribe);
    };
  }, []);

  // Hàm để lưu doanh thu khi đơn hàng hoàn thành
  const saveRevenueFromOrder = async (
    order: {
      id: string;
      userId: string;
      items: Array<{
        id: string;
        name: string;
        image: string;
        category?: string;
        quantity: number;
        price: string;
      }>;
    },
    userInfo: {
      displayName?: string;
      email?: string;
      phone?: string;
      address?: string;
    }
  ) => {
    try {
      const completedAt = new Date().toISOString();
      const date = new Date(completedAt);
      const month = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}`;
      const year = String(date.getFullYear());

      // Lưu từng sản phẩm trong đơn hàng
      for (const item of order.items) {
        const revenueItem: Omit<RevenueItem, "id"> = {
          orderId: order.id,
          userId: order.userId,
          userInfo: {
            displayName: userInfo.displayName || "",
            email: userInfo.email || "",
            phone: userInfo.phone || "",
            address: userInfo.address || "",
          },
          productId: item.id,
          productName: item.name,
          productImage: item.image,
          productCategory: item.category || "uncategorized",
          quantity: item.quantity,
          unitPrice: parseInt(item.price),
          totalPrice: parseInt(item.price) * item.quantity,
          completedAt,
          date: completedAt.split("T")[0], // YYYY-MM-DD format
          month,
          year,
        };

        // Lưu vào Firebase
        const revenueRef = ref(database, "revenue");
        await push(revenueRef, revenueItem);
      }

      return true;
    } catch (error) {
      console.error("Error saving revenue:", error);
      throw error;
    }
  };

  // Lấy dữ liệu cho biểu đồ theo ngày (30 ngày gần nhất)
  const getDailyChartData = (): DailyData[] => {
    const days: DailyData[] = [];
    const now = new Date();

    for (let i = 29; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(now.getDate() - i);
      const dateKey = date.toISOString().split("T")[0]; // YYYY-MM-DD format

      const dayItems = revenueItems.filter((item) => item.date === dateKey);
      const uniqueOrders = new Set(dayItems.map((item) => item.orderId));

      days.push({
        date: date.toLocaleDateString("vi-VN", {
          day: "2-digit",
          month: "2-digit",
        }),
        revenue: dayItems.reduce((sum, item) => sum + item.totalPrice, 0),
        orders: uniqueOrders.size,
        products: dayItems.reduce((sum, item) => sum + item.quantity, 0),
      });
    }

    return days;
  };

  // Lấy dữ liệu cho biểu đồ theo tháng (12 tháng gần nhất)
  const getMonthlyChartData = (): MonthlyData[] => {
    const months: MonthlyData[] = [];
    const now = new Date();

    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}`;

      const monthItems = revenueItems.filter((item) => item.month === monthKey);
      const uniqueOrders = new Set(monthItems.map((item) => item.orderId));

      months.push({
        month: date.toLocaleDateString("vi-VN", {
          month: "short",
          year: "numeric",
        }),
        revenue: stats.monthlyRevenue[monthKey] || 0,
        orders: uniqueOrders.size,
        products: monthItems.reduce((sum, item) => sum + item.quantity, 0),
      });
    }

    return months;
  };

  // Lấy dữ liệu cho biểu đồ theo năm (5 năm gần nhất)
  const getYearlyChartData = (): YearlyData[] => {
    const years: YearlyData[] = [];
    const currentYear = new Date().getFullYear();

    for (let i = 4; i >= 0; i--) {
      const year = currentYear - i;
      const yearKey = String(year);

      const yearItems = revenueItems.filter((item) => item.year === yearKey);
      const uniqueOrders = new Set(yearItems.map((item) => item.orderId));

      years.push({
        year: yearKey,
        revenue: stats.yearlyRevenue[yearKey] || 0,
        orders: uniqueOrders.size,
        products: yearItems.reduce((sum, item) => sum + item.quantity, 0),
      });
    }

    return years;
  };

  return {
    revenueItems,
    stats,
    loading,
    error,
    saveRevenueFromOrder,
    getDailyChartData,
    getMonthlyChartData,
    getYearlyChartData,
  };
}
