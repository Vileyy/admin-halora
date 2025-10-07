"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  IconDownload,
  IconEye,
  IconTrash,
  IconSearch,
  IconFile,
  IconCalendar,
} from "@tabler/icons-react";
import { Document, DocumentType, DocumentCategory } from "@/types/Document";
import { documentService } from "@/services/documentService";
import { pixeldrainService } from "@/services/pixeldrainService";
import { toast } from "sonner";

interface DocumentTableProps {
  documents: Document[];
  onRefresh?: () => void;
  onEdit?: (document: Document) => void;
  onDelete?: (id: string) => void;
}

export function DocumentTable({ documents, onDelete }: DocumentTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<DocumentType | "all">("all");
  const [categoryFilter, setCategoryFilter] = useState<
    DocumentCategory | "all"
  >("all");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch =
      doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.tags?.some((tag) =>
        tag.toLowerCase().includes(searchTerm.toLowerCase())
      );
    const matchesType = typeFilter === "all" || doc.type === typeFilter;
    const matchesCategory =
      categoryFilter === "all" || doc.category === categoryFilter;

    return matchesSearch && matchesType && matchesCategory;
  });

  const handleDelete = async (documentId: string) => {
    try {
      setDeletingId(documentId);
      await documentService.deleteDocument(documentId);
      toast.success("Xóa tài liệu thành công!");
      onDelete?.(documentId);
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Có lỗi xảy ra khi xóa tài liệu");
    } finally {
      setDeletingId(null);
    }
  };

  const handleDownload = (document: Document) => {
    const downloadUrl = pixeldrainService.getFileUrl(
      document.pixeldrainId,
      true
    );
    window.open(downloadUrl, "_blank");
  };

  const handleView = (document: Document) => {
    const viewUrl = pixeldrainService.getPublicUrl(document.pixeldrainId);
    window.open(viewUrl, "_blank");
  };

  const getTypeLabel = (type: DocumentType) => {
    switch (type) {
      case DocumentType.CERTIFICATE:
        return "Chứng chỉ";
      case DocumentType.INSPECTION_CERTIFICATE:
        return "Kiểm định";
      case DocumentType.OTHER:
        return "Khác";
      default:
        return type;
    }
  };

  const getCategoryLabel = (category: DocumentCategory) => {
    switch (category) {
      case DocumentCategory.PRODUCT_CERTIFICATE:
        return "Chứng chỉ SP";
      case DocumentCategory.INSPECTION_REPORT:
        return "Báo cáo KD";
      case DocumentCategory.QUALITY_ASSURANCE:
        return "Đảm bảo CL";
      case DocumentCategory.SAFETY_CERTIFICATE:
        return "An toàn";
      case DocumentCategory.COMPLIANCE_DOCUMENT:
        return "Tuân thủ";
      case DocumentCategory.OTHER:
        return "Khác";
      default:
        return category;
    }
  };

  const getTypeColor = (type: DocumentType) => {
    switch (type) {
      case DocumentType.CERTIFICATE:
        return "bg-green-100 text-green-800";
      case DocumentType.INSPECTION_CERTIFICATE:
        return "bg-blue-100 text-blue-800";
      case DocumentType.OTHER:
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="bg-gray-50/50">
        <CardTitle className="flex items-center gap-2 text-gray-900">
          <IconFile className="h-5 w-5 text-blue-600" />
          Danh Sách Tài Liệu
        </CardTitle>
        <CardDescription className="text-gray-600">
          Quản lý và xem tất cả tài liệu đã upload
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Tìm kiếm tài liệu..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select
            value={typeFilter}
            onValueChange={(value) =>
              setTypeFilter(value as DocumentType | "all")
            }
          >
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Loại tài liệu" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả loại</SelectItem>
              <SelectItem value={DocumentType.CERTIFICATE}>
                Chứng chỉ
              </SelectItem>
              <SelectItem value={DocumentType.INSPECTION_CERTIFICATE}>
                Kiểm định
              </SelectItem>
              <SelectItem value={DocumentType.OTHER}>Khác</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={categoryFilter}
            onValueChange={(value) =>
              setCategoryFilter(value as DocumentCategory | "all")
            }
          >
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Danh mục" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả danh mục</SelectItem>
              <SelectItem value={DocumentCategory.PRODUCT_CERTIFICATE}>
                Chứng chỉ SP
              </SelectItem>
              <SelectItem value={DocumentCategory.INSPECTION_REPORT}>
                Báo cáo KD
              </SelectItem>
              <SelectItem value={DocumentCategory.QUALITY_ASSURANCE}>
                Đảm bảo CL
              </SelectItem>
              <SelectItem value={DocumentCategory.SAFETY_CERTIFICATE}>
                An toàn
              </SelectItem>
              <SelectItem value={DocumentCategory.COMPLIANCE_DOCUMENT}>
                Tuân thủ
              </SelectItem>
              <SelectItem value={DocumentCategory.OTHER}>Khác</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="rounded-lg border border-gray-200 overflow-hidden">
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow className="border-gray-200">
                <TableHead className="font-semibold text-gray-900">
                  Tên Tài Liệu
                </TableHead>
                <TableHead className="font-semibold text-gray-900">
                  Loại
                </TableHead>
                <TableHead className="font-semibold text-gray-900">
                  Danh Mục
                </TableHead>
                <TableHead className="font-semibold text-gray-900">
                  Kích Thước
                </TableHead>
                <TableHead className="font-semibold text-gray-900">
                  Ngày Upload
                </TableHead>
                <TableHead className="font-semibold text-gray-900">
                  Tags
                </TableHead>
                <TableHead className="text-right font-semibold text-gray-900">
                  Thao Tác
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDocuments.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center py-12 text-gray-500"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <IconFile className="h-12 w-12 text-gray-300" />
                      <p className="text-lg font-medium">
                        Không có tài liệu nào
                      </p>
                      <p className="text-sm">
                        Hãy upload tài liệu đầu tiên của bạn
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredDocuments.map((document) => (
                  <TableRow key={document.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">{document.name}</div>
                        {document.description && (
                          <div className="text-sm text-gray-500 line-clamp-2">
                            {document.description}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getTypeColor(document.type)}>
                        {getTypeLabel(document.type)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {getCategoryLabel(document.category)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {formatFileSize(document.size)}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <IconCalendar className="h-3 w-3" />
                        {formatDate(document.uploadedAt)}
                      </div>
                    </TableCell>
                    <TableCell>
                      {document.tags && document.tags.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {document.tags.slice(0, 2).map((tag) => (
                            <Badge
                              key={tag}
                              variant="secondary"
                              className="text-xs"
                            >
                              {tag}
                            </Badge>
                          ))}
                          {document.tags.length > 2 && (
                            <Badge variant="secondary" className="text-xs">
                              +{document.tags.length - 2}
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleView(document)}
                          title="Xem tài liệu"
                        >
                          <IconEye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownload(document)}
                          title="Tải xuống"
                        >
                          <IconDownload className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={deletingId === document.id}
                              title="Xóa tài liệu"
                            >
                              <IconTrash className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
                              <AlertDialogDescription>
                                Bạn có chắc chắn muốn xóa tài liệu &ldquo;
                                {document.name}&rdquo;? Hành động này không thể
                                hoàn tác.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Hủy</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(document.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Xóa
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Summary */}
        <div className="mt-4 text-sm text-gray-600">
          Hiển thị {filteredDocuments.length} trong tổng số {documents.length}{" "}
          tài liệu
        </div>
      </CardContent>
    </Card>
  );
}
