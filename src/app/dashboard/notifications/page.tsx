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
import { Textarea } from "@/components/ui/textarea";
import { database } from "@/lib/firebase";
import { ref, onValue, push, set, remove, update } from "firebase/database";
import { toast } from "sonner";
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconEye,
  IconBell,
  IconBellRinging,
  IconCalendar,
  IconLayoutGrid,
  IconList,
  IconSearch,
  IconFilter,
  IconStar,
  IconStarOff,
} from "@tabler/icons-react";

interface Notification {
  id: string;
  title: string;
  content: string;
  important: boolean;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
  updatedAt?: string;
}

function NotificationForm({
  onSubmit,
  loading,
  initialData,
}: {
  onSubmit: (
    data: Omit<
      Notification,
      "id" | "createdAt" | "updatedAt" | "isRead" | "readAt"
    >
  ) => void;
  loading?: boolean;
  initialData?: Partial<
    Omit<Notification, "id" | "createdAt" | "updatedAt" | "isRead" | "readAt">
  >;
}) {
  const [title, setTitle] = useState(initialData?.title || "");
  const [content, setContent] = useState(initialData?.content || "");
  const [important, setImportant] = useState(initialData?.important ?? false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ title, content, important });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="title" className="text-sm font-medium">
            Tiêu đề thông báo
          </Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Nhập tiêu đề thông báo"
            required
            className="mt-2"
          />
        </div>

        <div>
          <Label htmlFor="content" className="text-sm font-medium">
            Nội dung thông báo
          </Label>
          <Textarea
            id="content"
            value={content}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              setContent(e.target.value)
            }
            placeholder="Nhập nội dung thông báo..."
            required
            className="mt-2 min-h-[120px] resize-none"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Hỗ trợ xuống dòng và emoji
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-3 p-4 bg-muted/50 rounded-lg">
        <Switch
          id="important"
          checked={important}
          onCheckedChange={setImportant}
        />
        <div>
          <Label htmlFor="important" className="text-sm font-medium">
            Thông báo quan trọng
          </Label>
          <p className="text-xs text-muted-foreground">
            Thông báo sẽ được đánh dấu là quan trọng và hiển thị nổi bật
          </p>
        </div>
      </div>

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "Đang lưu..." : "Gửi thông báo"}
      </Button>
    </form>
  );
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
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
    "all" | "important" | "normal"
  >("all");

  useEffect(() => {
    const notificationsRef = ref(database, "notifications");
    const unsubscribe = onValue(notificationsRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) return setNotifications([]);
      const notificationsArray = Object.entries(data)
        .map(([id, value]: [string, unknown]) => {
          if (
            typeof value === "object" &&
            value !== null &&
            "title" in value &&
            "content" in value
          ) {
            const v = value as {
              title: string;
              content: string;
              important: boolean;
              isRead: boolean;
              readAt?: string;
              createdAt: string;
              updatedAt?: string;
            };
            return {
              id,
              ...v,
            };
          }
          return null;
        })
        .filter((item): item is Notification => item !== null);
      setNotifications(notificationsArray);
    });
    return () => unsubscribe();
  }, []);

  const filteredNotifications = notifications.filter((notification) => {
    const matchesSearch =
      notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter =
      filterStatus === "all" ||
      (filterStatus === "important" && notification.important) ||
      (filterStatus === "normal" && !notification.important);
    return matchesSearch && matchesFilter;
  });

  const handleAddNotification = async (
    data: Omit<
      Notification,
      "id" | "createdAt" | "updatedAt" | "isRead" | "readAt"
    >
  ) => {
    try {
      setLoading(true);
      const notificationsRef = ref(database, "notifications");
      const now = new Date().toISOString();
      await push(notificationsRef, {
        ...data,
        isRead: false,
        createdAt: now,
        updatedAt: now,
      });
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setLoading(false);
      setOpen(false);
      toast.success("Gửi thông báo thành công!");
    } catch (error) {
      setLoading(false);
      toast.error("Có lỗi xảy ra khi gửi thông báo!");
    }
  };

  const handleEditNotification = async (
    notificationId: string,
    data: Omit<
      Notification,
      "id" | "createdAt" | "updatedAt" | "isRead" | "readAt"
    >
  ) => {
    try {
      setLoading(true);
      await update(ref(database, `notifications/${notificationId}`), {
        ...data,
        updatedAt: new Date().toISOString(),
      });
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setLoading(false);
      setEditDialogOpen(null);
      toast.success("Cập nhật thông báo thành công!");
    } catch (error) {
      setLoading(false);
      toast.error("Có lỗi xảy ra khi cập nhật!");
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    try {
      setLoading(true);
      await remove(ref(database, `notifications/${notificationId}`));
      setLoading(false);
      setDeleteDialogOpen(null);
      toast.success("Xóa thông báo thành công!");
    } catch (error) {
      setLoading(false);
      toast.error("Có lỗi xảy ra khi xóa thông báo!");
    }
  };

  const handleToggleImportant = async (
    notificationId: string,
    important: boolean
  ) => {
    try {
      await update(ref(database, `notifications/${notificationId}`), {
        important: !important,
        updatedAt: new Date().toISOString(),
      });
      toast.success(
        important ? "Bỏ đánh dấu quan trọng!" : "Đánh dấu quan trọng!"
      );
    } catch (error) {
      toast.error("Có lỗi xảy ra khi thay đổi trạng thái!");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const stats = {
    total: notifications.length,
    important: notifications.filter((n) => n.important).length,
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Quản lý Thông báo
            </h1>
            <p className="text-muted-foreground">
              Quản lý các thông báo gửi đến người dùng
            </p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setOpen(true)} className="gap-2">
                <IconPlus size={16} />
                Gửi thông báo
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg w-full">
              <DialogHeader>
                <DialogTitle>Gửi thông báo mới</DialogTitle>
              </DialogHeader>
              <NotificationForm
                onSubmit={handleAddNotification}
                loading={loading}
              />
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-700">
                    Tổng số thông báo
                  </p>
                  <p className="text-2xl font-bold text-blue-900">
                    {stats.total}
                  </p>
                </div>
                <div className="p-2 bg-blue-200 rounded-lg">
                  <IconBell className="h-6 w-6 text-blue-700" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-700">
                    Quan trọng
                  </p>
                  <p className="text-2xl font-bold text-orange-900">
                    {stats.important}
                  </p>
                </div>
                <div className="p-2 bg-orange-200 rounded-lg">
                  <IconStar className="h-6 w-6 text-orange-700" />
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
                  placeholder="Tìm kiếm thông báo..."
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
                      e.target.value as "all" | "important" | "normal"
                    )
                  }
                  className="text-sm border rounded-md px-3 py-1"
                >
                  <option value="all">Tất cả</option>
                  <option value="important">Quan trọng</option>
                  <option value="normal">Thường</option>
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

      {/* Notifications Grid/List */}
      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredNotifications.map((notification) => (
            <Card
              key={notification.id}
              className={`group hover:shadow-xl transition-all duration-300 overflow-hidden border-0 shadow-lg ${
                notification.important ? "ring-2 ring-orange-200" : ""
              }`}
            >
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3
                        className="font-semibold text-lg line-clamp-2 mb-2"
                        title={notification.title}
                      >
                        {notification.title}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-3 whitespace-pre-wrap">
                        {notification.content}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 ml-2">
                      {notification.important && (
                        <IconStar className="h-4 w-4 text-orange-500" />
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <IconCalendar size={14} />
                      <span>{formatDate(notification.createdAt)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant={notification.important ? "outline" : "default"}
                        onClick={() =>
                          handleToggleImportant(
                            notification.id,
                            notification.important
                          )
                        }
                        className={`h-8 px-3 transition-all duration-200 ${
                          notification.important
                            ? "border-orange-200 text-orange-700 hover:bg-orange-50 hover:border-orange-300"
                            : "bg-orange-600 text-white hover:bg-orange-700"
                        }`}
                      >
                        <div className="flex items-center gap-1">
                          {notification.important ? (
                            <IconStarOff size={14} />
                          ) : (
                            <IconStar size={14} />
                          )}
                          <span className="text-xs font-medium">
                            {notification.important ? "Bỏ" : "Quan trọng"}
                          </span>
                        </div>
                      </Button>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 gap-1"
                      onClick={() => setPreviewDialogOpen(notification.id)}
                    >
                      <IconEye size={14} />
                      Xem
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 gap-1"
                      onClick={() => setEditDialogOpen(notification.id)}
                    >
                      <IconEdit size={14} />
                      Sửa
                    </Button>

                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => setDeleteDialogOpen(notification.id)}
                      className="gap-1"
                    >
                      <IconTrash size={14} />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredNotifications.map((notification) => (
            <Card
              key={notification.id}
              className={`hover:shadow-md transition-shadow ${
                notification.important ? "ring-1 ring-orange-200" : ""
              }`}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-lg mb-1">
                        {notification.title}
                      </h3>
                      <div className="flex items-center gap-1 ml-2">
                        {notification.important && (
                          <IconStar className="h-4 w-4 text-orange-500" />
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3 whitespace-pre-wrap line-clamp-2">
                      {notification.content}
                    </p>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <IconCalendar size={14} />
                      <span>Tạo: {formatDate(notification.createdAt)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setPreviewDialogOpen(notification.id)}
                    >
                      <IconEye size={16} />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditDialogOpen(notification.id)}
                    >
                      <IconEdit size={16} />
                    </Button>
                    <Button
                      size="sm"
                      variant={notification.important ? "outline" : "default"}
                      onClick={() =>
                        handleToggleImportant(
                          notification.id,
                          notification.important
                        )
                      }
                      className={
                        notification.important
                          ? "border-orange-200 text-orange-700"
                          : ""
                      }
                    >
                      {notification.important ? (
                        <IconStarOff size={16} />
                      ) : (
                        <IconStar size={16} />
                      )}
                    </Button>

                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => setDeleteDialogOpen(notification.id)}
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

      {filteredNotifications.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <IconBell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              Không có thông báo nào
            </h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || filterStatus !== "all"
                ? "Không tìm thấy thông báo phù hợp với bộ lọc"
                : "Bắt đầu bằng cách gửi thông báo đầu tiên"}
            </p>
            {!searchTerm && filterStatus === "all" && (
              <Button onClick={() => setOpen(true)} className="gap-2">
                <IconPlus size={16} />
                Gửi thông báo đầu tiên
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
              <DialogTitle>Sửa thông báo</DialogTitle>
            </DialogHeader>
            <NotificationForm
              onSubmit={(data) => handleEditNotification(editDialogOpen, data)}
              loading={loading}
              initialData={notifications.find((n) => n.id === editDialogOpen)}
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
              <DialogTitle>Xác nhận xóa thông báo</DialogTitle>
            </DialogHeader>
            <div className="p-4">
              <p className="mb-4">
                Bạn có chắc chắn muốn xóa thông báo &quot;
                {notifications.find((n) => n.id === deleteDialogOpen)?.title}
                &quot; không?
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
                  onClick={() => handleDeleteNotification(deleteDialogOpen)}
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
              <DialogTitle>Xem chi tiết thông báo</DialogTitle>
            </DialogHeader>
            <div className="p-4">
              {(() => {
                const notification = notifications.find(
                  (n) => n.id === previewDialogOpen
                );
                if (!notification) return null;
                return (
                  <div className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <h3 className="font-semibold text-xl">
                          {notification.title}
                        </h3>
                        <div className="flex items-center gap-2">
                          {notification.important && (
                            <Badge
                              variant="secondary"
                              className="bg-orange-100 text-orange-700"
                            >
                              <IconStar size={14} className="mr-1" />
                              Quan trọng
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="bg-muted/50 p-4 rounded-lg">
                        <p className="whitespace-pre-wrap text-sm leading-relaxed">
                          {notification.content}
                        </p>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <IconCalendar size={16} />
                          <span>Tạo: {formatDate(notification.createdAt)}</span>
                        </div>
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
