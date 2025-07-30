"use client";

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
  TrendingUp,
  Calendar,
  DollarSign,
  Package,
  Search,
  Filter,
  RefreshCw,
  Download,
  Eye,
  EyeOff,
  BarChart3,
  ShoppingCart,
  Users,
  Truck,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Target,
  Zap,
  Star,
} from "lucide-react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

interface OrderItem {
  id: string;
  image: string;
  name: string;
  price: string | number;
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

interface RevenueData {
  date: string;
  revenue: number;
  orders: number;
}

interface ProductSalesData {
  id: string;
  name: string;
  image: string;
  totalQuantity: number;
  totalRevenue: number;
  averagePrice: number;
}

interface RevenueStats {
  daily: number;
  monthly: number;
  yearly: number;
  totalOrders: number;
  totalProducts: number;
  growthRate: number;
}

const chartConfig = {
  revenue: {
    label: "Doanh thu",
    color: "var(--chart-1)",
  },
  orders: {
    label: "Đơn hàng",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

// Utility functions
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
};

const formatQuantity = (quantity: number): string => {
  return new Intl.NumberFormat("vi-VN").format(quantity);
};

const calculateRevenueStats = (orders: Order[]): RevenueStats => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const thisYear = new Date(now.getFullYear(), 0, 1);
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  let dailyRevenue = 0;
  let monthlyRevenue = 0;
  let yearlyRevenue = 0;
  let lastMonthRevenue = 0;

  orders.forEach((order) => {
    if (order.status === "delivered" || order.status === "pending") {
      const orderDate = new Date(order.createdAt);

      if (orderDate >= today) {
        dailyRevenue += order.total;
      }

      if (orderDate >= thisMonth) {
        monthlyRevenue += order.total;
      }

      if (orderDate >= thisYear) {
        yearlyRevenue += order.total;
      }

      if (orderDate >= lastMonth && orderDate < thisMonth) {
        lastMonthRevenue += order.total;
      }
    }
  });

  const growthRate =
    lastMonthRevenue > 0
      ? ((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
      : 0;

  return {
    daily: dailyRevenue,
    monthly: monthlyRevenue,
    yearly: yearlyRevenue,
    totalOrders: orders.length,
    totalProducts: orders.filter(
      (order) => order.status === "delivered" || order.status === "pending"
    ).length,
    growthRate,
  };
};

const generateRevenueChartData = (
  orders: Order[],
  days: number = 30
): RevenueData[] => {
  const data: RevenueData[] = [];
  const now = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];

    let dailyRevenue = 0;
    let dailyOrders = 0;

    orders.forEach((order) => {
      const orderDate = new Date(order.createdAt);
      const orderDateStr = orderDate.toISOString().split("T")[0];

      if (
        orderDateStr === dateStr &&
        (order.status === "delivered" || order.status === "pending")
      ) {
        dailyRevenue += order.total;
        dailyOrders += 1;
      }
    });

    data.push({
      date: dateStr,
      revenue: dailyRevenue,
      orders: dailyOrders,
    });
  }

  return data;
};

const calculateProductSales = (orders: Order[]): ProductSalesData[] => {
  const productMap = new Map<string, ProductSalesData>();

  orders.forEach((order) => {
    if (order.status === "delivered" || order.status === "pending") {
      order.orderItems.forEach((item) => {
        const price =
          typeof item.price === "string" ? parseFloat(item.price) : item.price;

        if (productMap.has(item.id)) {
          const existing = productMap.get(item.id)!;
          existing.totalQuantity += item.quantity;
          existing.totalRevenue += price * item.quantity;
          existing.averagePrice =
            existing.totalRevenue / existing.totalQuantity;
        } else {
          productMap.set(item.id, {
            id: item.id,
            name: item.name,
            image: item.image,
            totalQuantity: item.quantity,
            totalRevenue: price * item.quantity,
            averagePrice: price,
          });
        }
      });
    }
  });

  return Array.from(productMap.values()).sort(
    (a, b) => b.totalRevenue - a.totalRevenue
  );
};

function RevenueChart({ data }: { data: RevenueData[] }) {
  const [timeRange, setTimeRange] = useState("30d");

  const filteredData = React.useMemo(() => {
    const days = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 90;
    return data.slice(-days);
  }, [data, timeRange]);

  return (
    <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50/50">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-blue-600" />
              Biểu đồ doanh thu
            </CardTitle>
            <p className="text-gray-600 mt-1">
              Theo dõi xu hướng doanh thu theo thời gian
            </p>
          </div>
          <div className="relative w-32">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="w-full h-9 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="7d">7 ngày</option>
              <option value="30d">30 ngày</option>
              <option value="90d">90 ngày</option>
            </select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[350px] w-full"
        >
          <AreaChart data={filteredData}>
            <defs>
              <linearGradient id="fillRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-revenue)"
                  stopOpacity={1.0}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-revenue)"
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString("vi-VN", {
                  month: "short",
                  day: "numeric",
                });
              }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => {
                return new Intl.NumberFormat("vi-VN", {
                  notation: "compact",
                  maximumFractionDigits: 1,
                }).format(value);
              }}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString("vi-VN", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    });
                  }}
                  indicator="dot"
                  formatter={(value, name) => {
                    if (name === "revenue") {
                      return [formatCurrency(value as number), "Doanh thu"];
                    }
                    return [value, "Đơn hàng"];
                  }}
                />
              }
            />
            <Area
              dataKey="revenue"
              type="natural"
              fill="url(#fillRevenue)"
              stroke="var(--color-revenue)"
              strokeWidth={3}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

export default function RevenuePage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<ProductSalesData[]>(
    []
  );
  const [loading, setLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] =
    useState<ProductSalesData | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  // Filter states
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<string>("revenue");

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

  // Calculate statistics
  const stats = calculateRevenueStats(orders);
  const chartData = generateRevenueChartData(orders);
  const productSales = calculateProductSales(orders);

  // Filter products based on search
  useEffect(() => {
    let filtered = [...productSales];

    if (searchTerm) {
      filtered = filtered.filter((product) =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sort products
    filtered.sort((a, b) => {
      if (sortBy === "revenue") {
        return b.totalRevenue - a.totalRevenue;
      } else if (sortBy === "quantity") {
        return b.totalQuantity - a.totalQuantity;
      } else if (sortBy === "name") {
        return a.name.localeCompare(b.name);
      }
      return 0;
    });

    setFilteredProducts(filtered);
  }, [productSales, searchTerm, sortBy]);

  const clearFilters = () => {
    setSearchTerm("");
    setSortBy("revenue");
  };

  return (
    <div className="p-4 space-y-4">
      {/* Header with Tabs */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-5 h-5" />
          <h1 className="text-xl font-semibold">Báo cáo doanh thu</h1>
        </div>
        <div className="flex gap-2">
          <Button
            variant={activeTab === "overview" ? "default" : "outline"}
            onClick={() => setActiveTab("overview")}
            className="rounded-full"
          >
            Tổng quan
          </Button>
          <Button
            variant={activeTab === "products" ? "default" : "outline"}
            onClick={() => setActiveTab("products")}
            className="rounded-full"
          >
            Sản phẩm
          </Button>
          <Button
            variant={activeTab === "categories" ? "default" : "outline"}
            onClick={() => setActiveTab("categories")}
            className="rounded-full"
          >
            Danh mục
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-blue-500 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Hôm nay</p>
                <p className="text-xl font-bold mt-1">
                  {formatCurrency(stats.daily)}
                </p>
              </div>
              <div className="bg-blue-400 p-2 rounded-lg">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-rose-500 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Tháng này</p>
                <p className="text-xl font-bold mt-1">
                  {formatCurrency(stats.monthly)}
                </p>
              </div>
              <div className="bg-rose-400 p-2 rounded-lg">
                <Calendar className="w-5 h-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-emerald-500 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Cả năm</p>
                <p className="text-xl font-bold mt-1">
                  {formatCurrency(stats.yearly)}
                </p>
              </div>
              <div className="bg-emerald-400 p-2 rounded-lg">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-amber-500 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Sản phẩm đã bán</p>
                <p className="text-xl font-bold mt-1">{stats.totalProducts}</p>
              </div>
              <div className="bg-amber-400 p-2 rounded-lg">
                <Package className="w-5 h-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Chart */}
      <Card className="bg-white shadow-sm">
        <CardHeader className="pb-0">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-semibold">
                Doanh thu theo thời gian
              </CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Input
                type="date"
                className="w-32"
                defaultValue={new Date().toISOString().split("T")[0]}
              />
              <span>đến</span>
              <Input
                type="date"
                className="w-32"
                defaultValue={new Date().toISOString().split("T")[0]}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <RevenueChart data={chartData} />
        </CardContent>
      </Card>

      {/* Top Products */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">
              Top 5 sản phẩm bán chạy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredProducts.slice(0, 5).map((product, index) => (
                <div key={product.id} className="flex items-center gap-4">
                  <div className="relative w-12 h-12">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover rounded-lg"
                    />
                    <div className="absolute -top-2 -right-2">
                      <Badge variant="default" className="bg-blue-500">
                        #{index + 1}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{product.name}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>SL: {formatQuantity(product.totalQuantity)}</span>
                      <span>{formatCurrency(product.totalRevenue)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">
              Chi tiết sản phẩm được bán ra
            </CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-gray-500">
                  <th className="pb-2">Ảnh</th>
                  <th className="pb-2">Sản phẩm</th>
                  <th className="pb-2 text-right">SL</th>
                  <th className="pb-2 text-right">Doanh thu</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.slice(0, 5).map((product) => (
                  <tr key={product.id} className="border-t">
                    <td className="py-2">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-10 h-10 object-cover rounded-lg"
                      />
                    </td>
                    <td className="py-2">
                      <p className="font-medium truncate max-w-[200px]">
                        {product.name}
                      </p>
                    </td>
                    <td className="py-2 text-right">
                      {formatQuantity(product.totalQuantity)}
                    </td>
                    <td className="py-2 text-right">
                      {formatCurrency(product.totalRevenue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>

      {/* Product Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2 text-2xl">
              <ShoppingCart className="w-6 h-6 text-blue-600" />
              <span>Chi tiết sản phẩm</span>
            </DialogTitle>
          </DialogHeader>
          {selectedProduct && (
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <img
                  src={selectedProduct.image}
                  alt={selectedProduct.name}
                  className="w-32 h-32 object-cover rounded-xl shadow-lg"
                />
                <div>
                  <h3 className="text-2xl font-semibold text-gray-900">
                    {selectedProduct.name}
                  </h3>
                  <p className="text-gray-600">ID: {selectedProduct.id}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-0">
                  <CardContent className="p-4">
                    <div className="text-center">
                      <Package className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                      <p className="text-sm text-blue-600 font-medium">
                        Tổng số lượng bán
                      </p>
                      <p className="text-2xl font-bold text-blue-800">
                        {formatQuantity(selectedProduct.totalQuantity)}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-50 to-green-100 border-0">
                  <CardContent className="p-4">
                    <div className="text-center">
                      <DollarSign className="w-8 h-8 text-green-600 mx-auto mb-2" />
                      <p className="text-sm text-green-600 font-medium">
                        Tổng doanh thu
                      </p>
                      <p className="text-2xl font-bold text-green-800">
                        {formatCurrency(selectedProduct.totalRevenue)}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-0">
                  <CardContent className="p-4">
                    <div className="text-center">
                      <Target className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                      <p className="text-sm text-purple-600 font-medium">
                        Giá trung bình
                      </p>
                      <p className="text-2xl font-bold text-purple-800">
                        {formatCurrency(selectedProduct.averagePrice)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-xl">
                <h4 className="font-semibold text-gray-900 mb-4 text-lg">
                  Thống kê chi tiết
                </h4>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                    <span className="text-gray-600">Số lượng bán ra:</span>
                    <span className="font-semibold text-gray-900">
                      {formatQuantity(selectedProduct.totalQuantity)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                    <span className="text-gray-600">Tổng doanh thu:</span>
                    <span className="font-semibold text-gray-900">
                      {formatCurrency(selectedProduct.totalRevenue)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                    <span className="text-gray-600">Giá trung bình:</span>
                    <span className="font-semibold text-gray-900">
                      {formatCurrency(selectedProduct.averagePrice)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                    <span className="text-gray-600">Tỷ lệ đóng góp:</span>
                    <span className="font-semibold text-gray-900">
                      {(
                        (selectedProduct.totalRevenue / stats.yearly) *
                        100
                      ).toFixed(2)}
                      %
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
