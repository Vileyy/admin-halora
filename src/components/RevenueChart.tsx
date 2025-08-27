import React from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  IconTrendingUp,
  IconShoppingCart,
  IconPackage,
  IconCoin,
} from "@tabler/icons-react";
import { useRealtimeRevenue, MonthlyData } from "@/hooks/useRealtimeRevenue";

const formatPrice = (price: number) => {
  return new Intl.NumberFormat("vi-VN").format(price);
};

const formatShortPrice = (price: number) => {
  if (price >= 1000000) {
    return `${(price / 1000000).toFixed(1)}M`;
  }
  if (price >= 1000) {
    return `${(price / 1000).toFixed(1)}K`;
  }
  return formatPrice(price);
};

// Component biểu đồ doanh thu theo tháng
function MonthlyRevenueChart({ data }: { data: MonthlyData[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
        <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#6B7280" />
        <YAxis
          tick={{ fontSize: 12 }}
          stroke="#6B7280"
          tickFormatter={formatShortPrice}
        />
        <Tooltip
          content={({ active, payload, label }) => {
            if (active && payload && payload.length) {
              return (
                <div className="bg-white p-3 border rounded-lg shadow-lg">
                  <p className="font-medium">{label}</p>
                  <p className="text-blue-600">
                    Doanh thu: {formatPrice(payload[0].value as number)} VNĐ
                  </p>
                  <p className="text-gray-600">
                    Đơn hàng: {payload[0].payload.orders}
                  </p>
                  <p className="text-gray-600">
                    Sản phẩm: {payload[0].payload.products}
                  </p>
                </div>
              );
            }
            return null;
          }}
        />
        <Area
          type="monotone"
          dataKey="revenue"
          stroke="#3B82F6"
          strokeWidth={2}
          fillOpacity={1}
          fill="url(#colorRevenue)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// Component biểu đồ số đơn hàng theo tháng
function MonthlyOrdersChart({ data }: { data: MonthlyData[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
        <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#6B7280" />
        <YAxis tick={{ fontSize: 12 }} stroke="#6B7280" />
        <Tooltip
          content={({ active, payload, label }) => {
            if (active && payload && payload.length) {
              return (
                <div className="bg-white p-3 border rounded-lg shadow-lg">
                  <p className="font-medium">{label}</p>
                  <p className="text-green-600">Đơn hàng: {payload[0].value}</p>
                  <p className="text-gray-600">
                    Sản phẩm: {payload[0].payload.products}
                  </p>
                </div>
              );
            }
            return null;
          }}
        />
        <Bar dataKey="orders" fill="#10B981" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// Component biểu đồ tròn doanh thu theo danh mục
function CategoryRevenueChart({
  categoryRevenue,
}: {
  categoryRevenue: { [category: string]: number };
}) {
  const data = Object.entries(categoryRevenue).map(([category, revenue]) => ({
    name: category,
    value: revenue,
  }));

  const COLORS = [
    "#3B82F6",
    "#10B981",
    "#F59E0B",
    "#EF4444",
    "#8B5CF6",
    "#F97316",
  ];

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          outerRadius={80}
          dataKey="value"
          label={({ name, percent }) =>
            `${name} ${(percent * 100).toFixed(0)}%`
          }
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value: number) => [
            `${formatPrice(value)} VNĐ`,
            "Doanh thu",
          ]}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

// Component top sản phẩm bán chạy
function TopProductsTable({
  productRevenue,
}: {
  productRevenue: {
    [productId: string]: { name: string; revenue: number; quantity: number };
  };
}) {
  const topProducts = Object.entries(productRevenue)
    .sort(([, a], [, b]) => b.revenue - a.revenue)
    .slice(0, 10);

  return (
    <div className="space-y-4">
      {topProducts.map(([productId, product], index) => (
        <div
          key={productId}
          className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
        >
          <div className="flex items-center space-x-3">
            <Badge variant="outline" className="bg-blue-100 text-blue-800">
              #{index + 1}
            </Badge>
            <div>
              <p className="font-medium text-gray-900 line-clamp-2">
                {product.name}
              </p>
              <p className="text-sm text-gray-600">
                Đã bán: {product.quantity} sản phẩm
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-semibold text-green-600">
              {formatPrice(product.revenue)} VNĐ
            </p>
            <p className="text-xs text-gray-500">
              TB: {formatPrice(product.revenue / product.quantity)} VNĐ/SP
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function RevenueChart() {
  const { stats, loading, error, getMonthlyChartData } = useRealtimeRevenue();

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-20 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-6">
          <p className="text-red-600">{error}</p>
        </CardContent>
      </Card>
    );
  }

  const monthlyData = getMonthlyChartData();

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-r from-blue-50 to-blue-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">
                  Tổng doanh thu
                </p>
                <p className="text-2xl font-bold text-blue-800">
                  {formatPrice(stats.totalRevenue)} VNĐ
                </p>
              </div>
              <div className="p-3 bg-blue-200 rounded-lg">
                <IconCoin className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-50 to-green-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium">
                  Đơn hàng hoàn thành
                </p>
                <p className="text-2xl font-bold text-green-800">
                  {stats.totalOrders}
                </p>
              </div>
              <div className="p-3 bg-green-200 rounded-lg">
                <IconShoppingCart className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-50 to-purple-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600 font-medium">
                  Sản phẩm đã bán
                </p>
                <p className="text-2xl font-bold text-purple-800">
                  {stats.totalProducts}
                </p>
              </div>
              <div className="p-3 bg-purple-200 rounded-lg">
                <IconPackage className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-orange-50 to-orange-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-600 font-medium">
                  Giá trị đơn hàng TB
                </p>
                <p className="text-2xl font-bold text-orange-800">
                  {formatPrice(stats.averageOrderValue)} VNĐ
                </p>
              </div>
              <div className="p-3 bg-orange-200 rounded-lg">
                <IconTrendingUp className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="revenue" className="space-y-6">
        <TabsList className="grid grid-cols-4 w-full max-w-md">
          <TabsTrigger value="revenue">Doanh thu</TabsTrigger>
          <TabsTrigger value="orders">Đơn hàng</TabsTrigger>
          <TabsTrigger value="categories">Danh mục</TabsTrigger>
          <TabsTrigger value="products">Sản phẩm</TabsTrigger>
        </TabsList>

        {/* <TabsList className="grid grid-cols-4 w-full max-w-md">
          <TabsTrigger value="day">Ngày</TabsTrigger>
          <TabsTrigger value="week">Tuần</TabsTrigger>
          <TabsTrigger value="month">Tháng</TabsTrigger>
          <TabsTrigger value="year">Năm</TabsTrigger>
        </TabsList> */}

        <TabsContent value="revenue">
          <Card>
            <CardHeader>
              <CardTitle>Doanh thu theo tháng (12 tháng gần nhất)</CardTitle>
            </CardHeader>
            <CardContent>
              <MonthlyRevenueChart data={monthlyData} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders">
          <Card>
            <CardHeader>
              <CardTitle>Số đơn hàng theo tháng (12 tháng gần nhất)</CardTitle>
            </CardHeader>
            <CardContent>
              <MonthlyOrdersChart data={monthlyData} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories">
          <Card>
            <CardHeader>
              <CardTitle>Doanh thu theo danh mục sản phẩm</CardTitle>
            </CardHeader>
            <CardContent>
              <CategoryRevenueChart categoryRevenue={stats.categoryRevenue} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products">
          <Card>
            <CardHeader>
              <CardTitle>Top 10 sản phẩm bán chạy nhất</CardTitle>
            </CardHeader>
            <CardContent>
              <TopProductsTable productRevenue={stats.productRevenue} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
