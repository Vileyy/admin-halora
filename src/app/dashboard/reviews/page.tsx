"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { database } from "@/lib/firebase";
import { ref, onValue, off } from "firebase/database";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  IconStar,
  IconStarFilled,
  IconUser,
  IconCalendar,
  IconSearch,
  IconRefresh,
  IconDownload,
  IconEye,
  IconEyeOff,
  IconAlertCircle,
  IconShoppingCart,
  IconTruck,
} from "@tabler/icons-react";
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
  DialogTrigger,
} from "@/components/ui/dialog";

export interface Review {
  id: string;
  comment: string;
  createdAt: string;
  orderId: string;
  productId: string;
  productImage: string;
  productName: string;
  rating: number;
  shippingRating: number;
  updatedAt: string;
  userId: string;
  userName: string;
}

interface ReviewStats {
  total: number;
  averageRating: number;
  averageShippingRating: number;
  fiveStars: number;
  fourStars: number;
  threeStars: number;
  twoStars: number;
  oneStar: number;
}

function ReviewDetailDialog({ review }: { review: Review }) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("vi-VN");
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <span key={index}>
        {index < rating ? (
          <IconStarFilled className="w-4 h-4 text-yellow-400" />
        ) : (
          <IconStar className="w-4 h-4 text-gray-300" />
        )}
      </span>
    ));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl shadow-sm">
              <IconStar className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Đánh giá #{review.id.slice(-8)}
              </h2>
              <p className="text-gray-600 mt-1">
                Tạo lúc {formatDate(review.createdAt)}
              </p>
            </div>
          </div>
          <div className="flex space-x-2">
            <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300 px-3 py-1">
              <div className="flex items-center space-x-1">
                {renderStars(review.rating)}
                <span className="ml-2">{review.rating}/5</span>
              </div>
            </Badge>
          </div>
        </div>
      </div>

      {/* Thông tin người dùng */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center space-x-2">
            <IconUser className="w-5 h-5" />
            <span>Thông tin người đánh giá</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <IconUser className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm font-medium text-gray-700">
                  Tên người dùng
                </p>
                <p className="text-sm text-gray-600">{review.userName}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <IconCalendar className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm font-medium text-gray-700">
                  Ngày đánh giá
                </p>
                <p className="text-sm text-gray-600">
                  {formatDate(review.createdAt)}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Thông tin sản phẩm */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center space-x-2">
            <IconShoppingCart className="w-5 h-5" />
            <span>Sản phẩm được đánh giá</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={review.productImage}
              alt={review.productName}
              className="w-20 h-20 object-cover rounded-lg shadow-sm"
            />
            <div className="flex-1">
              <h4 className="font-medium text-gray-900">
                {review.productName}
              </h4>
              <p className="text-sm text-gray-600 mt-1">
                ID: {review.productId}
              </p>
              <p className="text-sm text-gray-600">
                Đơn hàng: #{review.orderId.slice(-8)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Đánh giá chi tiết */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Chi tiết đánh giá</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-yellow-50 p-4 rounded-lg">
              <p className="text-sm font-medium text-gray-700 mb-2">
                Đánh giá sản phẩm
              </p>
              <div className="flex items-center space-x-2">
                <div className="flex">{renderStars(review.rating)}</div>
                <span className="text-lg font-semibold text-yellow-600">
                  {review.rating}/5
                </span>
              </div>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm font-medium text-gray-700 mb-2">
                Đánh giá vận chuyển
              </p>
              <div className="flex items-center space-x-2">
                <IconTruck className="w-5 h-5 text-blue-500" />
                <div className="flex">{renderStars(review.shippingRating)}</div>
                <span className="text-lg font-semibold text-blue-600">
                  {review.shippingRating}/5
                </span>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm font-medium text-gray-700 mb-2">Nhận xét</p>
            <p className="text-gray-800">{review.comment}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [filteredReviews, setFilteredReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  // Filter states
  const [ratingFilter, setRatingFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);
  const [dateRange, setDateRange] = useState<{
    start: string;
    end: string;
  }>({
    start: "",
    end: "",
  });

  // Stats
  const [stats, setStats] = useState<ReviewStats>({
    total: 0,
    averageRating: 0,
    averageShippingRating: 0,
    fiveStars: 0,
    fourStars: 0,
    threeStars: 0,
    twoStars: 0,
    oneStar: 0,
  });

  // Fetch reviews from Firebase
  useEffect(() => {
    const reviewsRef = ref(database, "reviews");

    const unsubscribe = onValue(
      reviewsRef,
      (snapshot) => {
        try {
          const data = snapshot.val();
          if (data) {
            const reviewsArray: Review[] = Object.keys(data).map((key) => ({
              id: key,
              ...data[key],
            }));

            // Sort by creation date (newest first)
            reviewsArray.sort(
              (a, b) =>
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime()
            );

            setReviews(reviewsArray);

            // Calculate stats
            const totalReviews = reviewsArray.length;
            const avgRating =
              totalReviews > 0
                ? reviewsArray.reduce((sum, review) => sum + review.rating, 0) /
                  totalReviews
                : 0;
            const avgShippingRating =
              totalReviews > 0
                ? reviewsArray.reduce(
                    (sum, review) => sum + review.shippingRating,
                    0
                  ) / totalReviews
                : 0;

            const ratingCounts = {
              5: reviewsArray.filter((r) => r.rating === 5).length,
              4: reviewsArray.filter((r) => r.rating === 4).length,
              3: reviewsArray.filter((r) => r.rating === 3).length,
              2: reviewsArray.filter((r) => r.rating === 2).length,
              1: reviewsArray.filter((r) => r.rating === 1).length,
            };

            setStats({
              total: totalReviews,
              averageRating: Math.round(avgRating * 10) / 10,
              averageShippingRating: Math.round(avgShippingRating * 10) / 10,
              fiveStars: ratingCounts[5],
              fourStars: ratingCounts[4],
              threeStars: ratingCounts[3],
              twoStars: ratingCounts[2],
              oneStar: ratingCounts[1],
            });
          } else {
            setReviews([]);
          }
          setLoading(false);
        } catch (error) {
          console.error("Error processing reviews:", error);
          setError("Có lỗi xảy ra khi xử lý dữ liệu đánh giá");
          setLoading(false);
        }
      },
      (error) => {
        console.error("Error fetching reviews:", error);
        setError("Không thể kết nối đến Firebase. Vui lòng kiểm tra kết nối.");
        setLoading(false);
      }
    );

    return () => off(reviewsRef, "value", unsubscribe);
  }, []);

  // Filter reviews based on current filters
  useEffect(() => {
    let filtered = [...reviews];

    // Filter by rating
    if (ratingFilter !== "all") {
      const rating = parseInt(ratingFilter);
      filtered = filtered.filter((review) => review.rating === rating);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (review) =>
          review.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          review.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          review.comment.toLowerCase().includes(searchTerm.toLowerCase()) ||
          review.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by date range
    if (dateRange.start || dateRange.end) {
      filtered = filtered.filter((review) => {
        const reviewDate = new Date(review.createdAt);
        const startDate = dateRange.start ? new Date(dateRange.start) : null;
        const endDate = dateRange.end ? new Date(dateRange.end) : null;

        if (startDate && endDate) {
          return reviewDate >= startDate && reviewDate <= endDate;
        } else if (startDate) {
          return reviewDate >= startDate;
        } else if (endDate) {
          return reviewDate <= endDate;
        }
        return true;
      });
    }

    setFilteredReviews(filtered);
  }, [reviews, ratingFilter, searchTerm, dateRange]);

  const clearFilters = () => {
    setRatingFilter("all");
    setSearchTerm("");
    setDateRange({ start: "", end: "" });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN");
  };

  const renderStars = (rating: number, size: "sm" | "md" = "sm") => {
    const starSize = size === "sm" ? "w-4 h-4" : "w-5 h-5";
    return Array.from({ length: 5 }, (_, index) => (
      <span key={index}>
        {index < rating ? (
          <IconStarFilled className={`${starSize} text-yellow-400`} />
        ) : (
          <IconStar className={`${starSize} text-gray-300`} />
        )}
      </span>
    ));
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return "text-green-600 bg-green-50 border-green-200";
    if (rating >= 3.5) return "text-yellow-600 bg-yellow-50 border-yellow-200";
    if (rating >= 2.5) return "text-orange-600 bg-orange-50 border-orange-200";
    return "text-red-600 bg-red-50 border-red-200";
  };

  // Show error if any
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
          <h1 className="text-3xl font-bold text-gray-900">Quản lý đánh giá</h1>
          <p className="text-gray-600 mt-1">
            Theo dõi và quản lý tất cả đánh giá sản phẩm từ khách hàng
          </p>
          {loading && (
            <p className="text-sm text-blue-600 mt-1 flex items-center">
              <IconRefresh className="w-4 h-4 mr-1 animate-spin" />
              Đang tải dữ liệu...
            </p>
          )}
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <p className="text-sm text-gray-600">Tổng đánh giá</p>
            <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Điểm trung bình</p>
            <p className="text-2xl font-bold text-yellow-600">
              {stats.averageRating}/5
            </p>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <Card className="bg-gradient-to-r from-green-50 to-green-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium">5 sao</p>
                <p className="text-2xl font-bold text-green-800">
                  {stats.fiveStars}
                </p>
              </div>
              <div className="p-2 bg-green-200 rounded-lg">
                <IconStarFilled className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-blue-50 to-blue-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">4 sao</p>
                <p className="text-2xl font-bold text-blue-800">
                  {stats.fourStars}
                </p>
              </div>
              <div className="p-2 bg-blue-200 rounded-lg">
                <IconStarFilled className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-yellow-50 to-yellow-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-yellow-600 font-medium">3 sao</p>
                <p className="text-2xl font-bold text-yellow-800">
                  {stats.threeStars}
                </p>
              </div>
              <div className="p-2 bg-yellow-200 rounded-lg">
                <IconStarFilled className="w-5 h-5 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-orange-50 to-orange-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-600 font-medium">2 sao</p>
                <p className="text-2xl font-bold text-orange-800">
                  {stats.twoStars}
                </p>
              </div>
              <div className="p-2 bg-orange-200 rounded-lg">
                <IconStarFilled className="w-5 h-5 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-red-50 to-red-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-600 font-medium">1 sao</p>
                <p className="text-2xl font-bold text-red-800">
                  {stats.oneStar}
                </p>
              </div>
              <div className="p-2 bg-red-200 rounded-lg">
                <IconStarFilled className="w-5 h-5 text-red-600" />
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
                    placeholder="Tìm theo sản phẩm, người dùng..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Rating Filter */}
              <div>
                <label className="text-sm font-medium mb-2 block">Số sao</label>
                <Select value={ratingFilter} onValueChange={setRatingFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tất cả đánh giá" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả đánh giá</SelectItem>
                    <SelectItem value="5">5 sao</SelectItem>
                    <SelectItem value="4">4 sao</SelectItem>
                    <SelectItem value="3">3 sao</SelectItem>
                    <SelectItem value="2">2 sao</SelectItem>
                    <SelectItem value="1">1 sao</SelectItem>
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
                Hiển thị {filteredReviews.length} trong tổng số {reviews.length}{" "}
                đánh giá
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

      {/* Reviews List */}
      <div className="space-y-4">
        {filteredReviews.map((review) => (
          <Card
            key={review.id}
            className="hover:shadow-lg transition-shadow duration-200"
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-4 mb-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <IconStar className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {review.productName}
                        </h3>
                        <Badge
                          className={`border ${getRatingColor(review.rating)}`}
                        >
                          <div className="flex items-center space-x-1">
                            {renderStars(review.rating)}
                            <span className="ml-1">{review.rating}/5</span>
                          </div>
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <div className="flex items-center space-x-1">
                          <IconUser className="w-4 h-4" />
                          <span>{review.userName}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <IconCalendar className="w-4 h-4" />
                          <span>{formatDate(review.createdAt)}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <IconTruck className="w-4 h-4" />
                          <span>Vận chuyển: {review.shippingRating}/5</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg mb-4">
                    <p className="text-gray-800">
                      &ldquo;{review.comment}&rdquo;
                    </p>
                  </div>

                  <div className="flex items-center space-x-4">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={review.productImage}
                      alt={review.productName}
                      className="w-16 h-16 object-cover rounded-lg shadow-sm"
                    />
                    <div className="text-sm text-gray-600">
                      <p>Mã đánh giá: #{review.id.slice(-8)}</p>
                      <p>Đơn hàng: #{review.orderId.slice(-8)}</p>
                      <p>Sản phẩm: #{review.productId.slice(-8)}</p>
                    </div>
                  </div>
                </div>

                <div className="ml-6">
                  <Dialog
                    open={detailDialogOpen && selectedReview?.id === review.id}
                    onOpenChange={(open) => {
                      setDetailDialogOpen(open);
                      if (open) {
                        setSelectedReview(review);
                      } else {
                        setSelectedReview(null);
                      }
                    }}
                  >
                    <DialogTrigger asChild>
                      <Button
                        size="sm"
                        variant="outline"
                        className="bg-white hover:bg-gray-50"
                        onClick={() => {
                          setSelectedReview(review);
                          setDetailDialogOpen(true);
                        }}
                      >
                        Xem chi tiết
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-5xl w-[90vw] max-h-[90vh] overflow-y-auto p-0">
                      <DialogHeader className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 px-8 py-6 border-b">
                        <DialogTitle className="text-2xl font-bold text-gray-900 flex items-center space-x-4">
                          <div className="p-3 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl shadow-sm">
                            <IconStar className="w-6 h-6 text-blue-600" />
                          </div>
                          <div>
                            <span>
                              Chi tiết đánh giá #{review.id.slice(-8)}
                            </span>
                            <p className="text-gray-600 mt-1 text-base">
                              Xem thông tin chi tiết đánh giá từ khách hàng
                            </p>
                          </div>
                        </DialogTitle>
                      </DialogHeader>
                      <div className="p-8">
                        <ReviewDetailDialog review={review} />
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredReviews.length === 0 && (
          <Card>
            <CardContent className="p-12">
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <IconStar className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {reviews.length === 0
                    ? "Chưa có đánh giá nào"
                    : "Không tìm thấy đánh giá"}
                </h3>
                <p className="text-gray-600">
                  {reviews.length === 0
                    ? "Khi có đánh giá mới từ khách hàng, chúng sẽ xuất hiện ở đây"
                    : "Thử điều chỉnh bộ lọc để tìm kiếm đánh giá khác"}
                </p>
                {reviews.length > 0 && (
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
