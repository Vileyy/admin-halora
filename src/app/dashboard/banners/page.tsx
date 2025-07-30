"use client";
import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { database } from "@/lib/firebase";
import { ref, onValue, push, set, remove, update } from "firebase/database";
import { toast } from "sonner";
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconEye,
  IconLink,
  IconPhoto,
  IconCalendar,
  IconToggleRight,
  IconToggleLeft,
  IconLayoutGrid,
  IconList,
  IconSearch,
  IconFilter,
  IconSortAscending,
} from "@tabler/icons-react";

interface Banner {
  id: string;
  title: string;
  imageUrl: string;
  linkUrl: string;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}

function BannerForm({
  onSubmit,
  loading,
  initialData,
}: {
  onSubmit: (data: Omit<Banner, "id" | "createdAt" | "updatedAt">) => void;
  loading?: boolean;
  initialData?: Partial<Omit<Banner, "id" | "createdAt" | "updatedAt">>;
}) {
  const [title, setTitle] = useState(initialData?.title || "");
  const [imageUrl, setImageUrl] = useState(initialData?.imageUrl || "");
  const [linkUrl, setLinkUrl] = useState(initialData?.linkUrl || "");
  const [isActive, setIsActive] = useState(initialData?.isActive ?? true);
  const [uploading, setUploading] = useState(false);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      setImageUrl(data.secure_url || data.url || "");
    } catch (error) {
      toast.error("Lỗi upload ảnh!");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ title, imageUrl, linkUrl, isActive });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="title" className="text-sm font-medium">
            Tiêu đề banner
          </Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Nhập tiêu đề banner"
            required
            className="mt-2"
          />
        </div>

        <div>
          <Label htmlFor="linkUrl" className="text-sm font-medium">
            Link URL (tùy chọn)
          </Label>
          <Input
            id="linkUrl"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="https://example.com"
            className="mt-2"
          />
        </div>
      </div>

      <div className="space-y-4">
        <Label className="text-sm font-medium">Hình ảnh banner</Label>
        {imageUrl && (
          <div className="relative group">
            <img
              src={imageUrl}
              alt="Banner preview"
              className="w-full h-40 object-cover rounded-lg border-2 border-dashed border-gray-200 hover:border-gray-300 transition-colors"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded-lg" />
          </div>
        )}
        <div className="relative">
          <Input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="cursor-pointer"
          />
          {uploading && (
            <div className="absolute inset-0 bg-background/80 flex items-center justify-center rounded-md">
              <div className="flex items-center gap-2 text-sm">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                Đang upload ảnh...
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center space-x-3 p-4 bg-muted/50 rounded-lg">
        <Switch
          id="isActive"
          checked={isActive}
          onCheckedChange={setIsActive}
        />
        <div>
          <Label htmlFor="isActive" className="text-sm font-medium">
            Hiển thị banner
          </Label>
          <p className="text-xs text-muted-foreground">
            Banner sẽ được hiển thị trên trang chủ
          </p>
        </div>
      </div>

      <Button type="submit" disabled={loading || uploading} className="w-full">
        {loading ? "Đang lưu..." : "Lưu banner"}
      </Button>
    </form>
  );
}

export default function BannersPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<string | null>(null);
  const [previewDialogOpen, setPreviewDialogOpen] = useState<string | null>(
    null
  );
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<
    "all" | "active" | "inactive"
  >("all");

  useEffect(() => {
    const bannersRef = ref(database, "banners");
    const unsubscribe = onValue(bannersRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) return setBanners([]);
      const bannersArray = Object.entries(data)
        .map(([id, value]: [string, unknown]) => {
          if (
            typeof value === "object" &&
            value !== null &&
            "title" in value &&
            "imageUrl" in value
          ) {
            const v = value as {
              title: string;
              imageUrl: string;
              linkUrl: string;
              isActive: boolean;
              createdAt: number;
              updatedAt: number;
            };
            return {
              id,
              ...v,
            };
          }
          return null;
        })
        .filter((item): item is Banner => item !== null);
      setBanners(bannersArray);
    });
    return () => unsubscribe();
  }, []);

  const filteredBanners = banners.filter((banner) => {
    const matchesSearch = banner.title
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesFilter =
      filterStatus === "all" ||
      (filterStatus === "active" && banner.isActive) ||
      (filterStatus === "inactive" && !banner.isActive);
    return matchesSearch && matchesFilter;
  });

  const handleAddBanner = async (
    data: Omit<Banner, "id" | "createdAt" | "updatedAt">
  ) => {
    try {
      setLoading(true);
      const bannersRef = ref(database, "banners");
      const now = Date.now();
      await push(bannersRef, {
        ...data,
        createdAt: now,
        updatedAt: now,
      });
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setLoading(false);
      setOpen(false);
      toast.success("Thêm banner thành công!");
    } catch (error) {
      setLoading(false);
      toast.error("Có lỗi xảy ra khi thêm banner!");
    }
  };

  const handleEditBanner = async (
    bannerId: string,
    data: Omit<Banner, "id" | "createdAt" | "updatedAt">
  ) => {
    try {
      setLoading(true);
      await update(ref(database, `banners/${bannerId}`), {
        ...data,
        updatedAt: Date.now(),
      });
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setLoading(false);
      setEditDialogOpen(null);
      toast.success("Cập nhật banner thành công!");
    } catch (error) {
      setLoading(false);
      toast.error("Có lỗi xảy ra khi cập nhật!");
    }
  };

  const handleDeleteBanner = async (bannerId: string) => {
    try {
      setLoading(true);
      await remove(ref(database, `banners/${bannerId}`));
      setLoading(false);
      setDeleteDialogOpen(null);
      toast.success("Xóa banner thành công!");
    } catch (error) {
      setLoading(false);
      toast.error("Có lỗi xảy ra khi xóa banner!");
    }
  };

  const handleToggleActive = async (bannerId: string, isActive: boolean) => {
    try {
      await update(ref(database, `banners/${bannerId}`), {
        isActive: !isActive,
        updatedAt: Date.now(),
      });
      toast.success(
        isActive ? "Ẩn banner thành công!" : "Hiển thị banner thành công!"
      );
    } catch (error) {
      toast.error("Có lỗi xảy ra khi thay đổi trạng thái!");
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const stats = {
    total: banners.length,
    active: banners.filter((b) => b.isActive).length,
    inactive: banners.filter((b) => !b.isActive).length,
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Quản lý Banner
            </h1>
            <p className="text-muted-foreground">
              Quản lý các banner hiển thị trên trang chủ
            </p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setOpen(true)} className="gap-2">
                <IconPlus size={16} />
                Thêm banner
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg w-full">
              <DialogHeader>
                <DialogTitle>Thêm banner mới</DialogTitle>
              </DialogHeader>
              <BannerForm onSubmit={handleAddBanner} loading={loading} />
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-700">
                    Tổng số banner
                  </p>
                  <p className="text-2xl font-bold text-blue-900">
                    {stats.total}
                  </p>
                </div>
                <div className="p-2 bg-blue-200 rounded-lg">
                  <IconPhoto className="h-6 w-6 text-blue-700" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-700">
                    Đang hiển thị
                  </p>
                  <p className="text-2xl font-bold text-green-900">
                    {stats.active}
                  </p>
                </div>
                <div className="p-2 bg-green-200 rounded-lg">
                  <IconToggleRight className="h-6 w-6 text-green-700" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">Đã ẩn</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.inactive}
                  </p>
                </div>
                <div className="p-2 bg-gray-200 rounded-lg">
                  <IconToggleLeft className="h-6 w-6 text-gray-700" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Controls Section */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex items-center gap-4 flex-1">
              <div className="relative flex-1 max-w-sm">
                <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Tìm kiếm banner..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex items-center gap-2">
                <IconFilter className="h-4 w-4 text-muted-foreground" />
                <select
                  value={filterStatus}
                  onChange={(e) =>
                    setFilterStatus(
                      e.target.value as "all" | "active" | "inactive"
                    )
                  }
                  className="text-sm border rounded-md px-3 py-1"
                >
                  <option value="all">Tất cả</option>
                  <option value="active">Đang hiển thị</option>
                  <option value="inactive">Đã ẩn</option>
                </select>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === "grid" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("grid")}
              >
                <IconLayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("list")}
              >
                <IconList className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Banners Grid/List */}
      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredBanners.map((banner) => (
            <Card
              key={banner.id}
              className="group hover:shadow-xl transition-all duration-300 overflow-hidden border-0 shadow-lg"
            >
              <div className="relative">
                <img
                  src={banner.imageUrl}
                  alt={banner.title}
                  className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute top-3 right-3">
                  <Badge
                    variant="secondary"
                    className="backdrop-blur-sm bg-background/80"
                  >
                    {banner.isActive ? "Đang hiển thị" : "Đã ẩn"}
                  </Badge>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute bottom-0 left-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      className="flex-1 bg-background/90 backdrop-blur-sm"
                      onClick={() => setPreviewDialogOpen(banner.id)}
                    >
                      <IconEye size={14} />
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="flex-1 bg-background/90 backdrop-blur-sm"
                      onClick={() => setEditDialogOpen(banner.id)}
                    >
                      <IconEdit size={14} />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="bg-destructive/90 backdrop-blur-sm"
                      onClick={() => setDeleteDialogOpen(banner.id)}
                    >
                      <IconTrash size={14} />
                    </Button>
                  </div>
                </div>
              </div>

              <CardContent className="p-4">
                <div className="space-y-3">
                  <div>
                    <h3
                      className="font-semibold text-lg line-clamp-1 mb-2"
                      title={banner.title}
                    >
                      {banner.title}
                    </h3>
                    {banner.linkUrl && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <IconLink size={14} />
                        <span className="line-clamp-1">{banner.linkUrl}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <IconCalendar size={14} />
                      <span>{formatDate(banner.updatedAt)}</span>
                    </div>
                    <Button
                      size="sm"
                      variant={banner.isActive ? "outline" : "default"}
                      onClick={() =>
                        handleToggleActive(banner.id, banner.isActive)
                      }
                      className={`h-8 px-3 transition-all duration-200 ${
                        banner.isActive
                          ? "border-green-200 text-green-700 hover:bg-green-50 hover:border-green-300"
                          : "bg-blue-600 text-white hover:bg-blue-700"
                      }`}
                    >
                      <div className="flex items-center gap-1">
                        {banner.isActive ? (
                          <IconToggleLeft size={14} />
                        ) : (
                          <IconToggleRight size={14} />
                        )}
                        <span className="text-xs font-medium">
                          {banner.isActive ? "Ẩn" : "Hiện"}
                        </span>
                      </div>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBanners.map((banner) => (
            <Card key={banner.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <img
                      src={banner.imageUrl}
                      alt={banner.title}
                      className="w-24 h-16 object-cover rounded-lg"
                    />
                    <Badge
                      variant="secondary"
                      className="absolute -top-2 -right-2 text-xs"
                    >
                      {banner.isActive ? "Hiển thị" : "Ẩn"}
                    </Badge>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg mb-1">
                      {banner.title}
                    </h3>
                    {banner.linkUrl && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                        <IconLink size={14} />
                        <span className="line-clamp-1">{banner.linkUrl}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <IconCalendar size={14} />
                      <span>Cập nhật: {formatDate(banner.updatedAt)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setPreviewDialogOpen(banner.id)}
                    >
                      <IconEye size={16} />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditDialogOpen(banner.id)}
                    >
                      <IconEdit size={16} />
                    </Button>
                    <Button
                      size="sm"
                      variant={banner.isActive ? "outline" : "default"}
                      onClick={() =>
                        handleToggleActive(banner.id, banner.isActive)
                      }
                      className={`transition-all duration-200 ${
                        banner.isActive
                          ? "border-green-200 text-green-700 hover:bg-green-50 hover:border-green-300"
                          : "bg-blue-600 text-white hover:bg-blue-700"
                      }`}
                    >
                      <div className="flex items-center gap-1">
                        {banner.isActive ? (
                          <IconToggleLeft size={14} />
                        ) : (
                          <IconToggleRight size={14} />
                        )}
                        <span className="text-xs font-medium">
                          {banner.isActive ? "Ẩn" : "Hiện"}
                        </span>
                      </div>
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => setDeleteDialogOpen(banner.id)}
                    >
                      <IconTrash size={16} />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {filteredBanners.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <IconPhoto className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Không có banner nào</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || filterStatus !== "all"
                ? "Không tìm thấy banner phù hợp với bộ lọc"
                : "Bắt đầu bằng cách thêm banner đầu tiên"}
            </p>
            {!searchTerm && filterStatus === "all" && (
              <Button onClick={() => setOpen(true)} className="gap-2">
                <IconPlus size={16} />
                Thêm banner đầu tiên
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Edit Dialog */}
      {editDialogOpen && (
        <Dialog
          open={editDialogOpen === editDialogOpen}
          onOpenChange={(open) =>
            setEditDialogOpen(open ? editDialogOpen : null)
          }
        >
          <DialogContent className="max-w-lg w-full">
            <DialogHeader>
              <DialogTitle>Sửa banner</DialogTitle>
            </DialogHeader>
            <BannerForm
              onSubmit={(data) => handleEditBanner(editDialogOpen, data)}
              loading={loading}
              initialData={banners.find((b) => b.id === editDialogOpen)}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Dialog */}
      {deleteDialogOpen && (
        <Dialog
          open={deleteDialogOpen === deleteDialogOpen}
          onOpenChange={(open) =>
            setDeleteDialogOpen(open ? deleteDialogOpen : null)
          }
        >
          <DialogContent className="max-w-md w-full">
            <DialogHeader>
              <DialogTitle>Xác nhận xóa banner</DialogTitle>
            </DialogHeader>
            <div className="p-4">
              <p className="mb-4">
                Bạn có chắc chắn muốn xóa banner &quot;
                {banners.find((b) => b.id === deleteDialogOpen)?.title}&quot;
                không?
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                Hành động này không thể hoàn tác.
              </p>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setDeleteDialogOpen(null)}
                  disabled={loading}
                >
                  Hủy
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleDeleteBanner(deleteDialogOpen)}
                  disabled={loading}
                >
                  {loading ? "Đang xóa..." : "Xóa"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Preview Dialog */}
      {previewDialogOpen && (
        <Dialog
          open={previewDialogOpen === previewDialogOpen}
          onOpenChange={(open) =>
            setPreviewDialogOpen(open ? previewDialogOpen : null)
          }
        >
          <DialogContent className="max-w-2xl w-full">
            <DialogHeader>
              <DialogTitle>Xem trước banner</DialogTitle>
            </DialogHeader>
            <div className="p-4">
              {(() => {
                const banner = banners.find((b) => b.id === previewDialogOpen);
                if (!banner) return null;
                return (
                  <div className="space-y-4">
                    <div className="relative">
                      <img
                        src={banner.imageUrl}
                        alt={banner.title}
                        className="w-full h-64 object-cover rounded-lg shadow-lg"
                      />
                      <div className="absolute top-4 right-4">
                        <Badge
                          variant="secondary"
                          className="backdrop-blur-sm bg-background/80"
                        >
                          {banner.isActive ? "Đang hiển thị" : "Đã ẩn"}
                        </Badge>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <h3 className="font-semibold text-xl">{banner.title}</h3>
                      {banner.linkUrl && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <IconLink size={16} />
                          <span className="break-all">{banner.linkUrl}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <IconCalendar size={16} />
                        <span>Cập nhật: {formatDate(banner.updatedAt)}</span>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
