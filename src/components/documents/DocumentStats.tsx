"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  IconFileText,
  IconCertificate,
  IconClipboardCheck,
  IconFile,
} from "@tabler/icons-react";
import { Document, DocumentType, DocumentCategory } from "@/types/Document";

interface DocumentStatsProps {
  documents: Document[];
}

export function DocumentStats({ documents }: DocumentStatsProps) {
  const getTypeStats = () => {
    const stats = {
      [DocumentType.CERTIFICATE]: 0,
      [DocumentType.INSPECTION_CERTIFICATE]: 0,
      [DocumentType.OTHER]: 0,
    };

    documents.forEach((doc) => {
      stats[doc.type]++;
    });

    return stats;
  };

  const getCategoryStats = () => {
    const stats = {
      [DocumentCategory.PRODUCT_CERTIFICATE]: 0,
      [DocumentCategory.INSPECTION_REPORT]: 0,
      [DocumentCategory.QUALITY_ASSURANCE]: 0,
      [DocumentCategory.SAFETY_CERTIFICATE]: 0,
      [DocumentCategory.COMPLIANCE_DOCUMENT]: 0,
      [DocumentCategory.OTHER]: 0,
    };

    documents.forEach((doc) => {
      stats[doc.category]++;
    });

    return stats;
  };

  const getTotalSize = () => {
    return documents.reduce((total, doc) => total + doc.size, 0);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const typeStats = getTypeStats();
  const categoryStats = getCategoryStats();
  const totalSize = getTotalSize();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Total Documents */}
      <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-blue-100">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-blue-900">
            Tổng Tài Liệu
          </CardTitle>
          <IconFileText className="h-5 w-5 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-blue-900">
            {documents.length}
          </div>
          <p className="text-xs text-blue-700 mt-1">
            Tất cả tài liệu đã upload
          </p>
        </CardContent>
      </Card>

      {/* Certificates */}
      <Card className="border-0 shadow-sm bg-gradient-to-br from-green-50 to-green-100">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-green-900">
            Chứng Chỉ
          </CardTitle>
          <IconCertificate className="h-5 w-5 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-green-900">
            {typeStats[DocumentType.CERTIFICATE]}
          </div>
          <p className="text-xs text-green-700 mt-1">Chứng chỉ sản phẩm</p>
        </CardContent>
      </Card>

      {/* Inspection Certificates */}
      <Card className="border-0 shadow-sm bg-gradient-to-br from-purple-50 to-purple-100">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-purple-900">
            Kiểm Định
          </CardTitle>
          <IconClipboardCheck className="h-5 w-5 text-purple-600" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-purple-900">
            {typeStats[DocumentType.INSPECTION_CERTIFICATE]}
          </div>
          <p className="text-xs text-purple-700 mt-1">
            Giấy xác nhận kiểm định
          </p>
        </CardContent>
      </Card>

      {/* Other Documents */}
      <Card className="border-0 shadow-sm bg-gradient-to-br from-gray-50 to-gray-100">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-900">
            Tài Liệu Khác
          </CardTitle>
          <IconFile className="h-5 w-5 text-gray-600" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-gray-900">
            {typeStats[DocumentType.OTHER]}
          </div>
          <p className="text-xs text-gray-700 mt-1">Tài liệu khác</p>
        </CardContent>
      </Card>

      {/* Total Size */}
      <Card className="md:col-span-2 lg:col-span-4 border-0 shadow-sm bg-gradient-to-r from-orange-50 to-orange-100">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-orange-900">
            Tổng Dung Lượng
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-orange-900">
            {formatFileSize(totalSize)}
          </div>
          <p className="text-xs text-orange-700 mt-1">
            Tổng dung lượng tất cả tài liệu
          </p>
        </CardContent>
      </Card>

      {/* Category Breakdown */}
      <Card className="md:col-span-2 lg:col-span-4 border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-gray-900">
            Phân Loại Theo Danh Mục
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {Object.entries(categoryStats).map(([category, count]) => (
              <Badge
                key={category}
                variant="secondary"
                className="flex items-center gap-2 px-3 py-1 text-sm font-medium"
              >
                {getCategoryLabel(category as DocumentCategory)}: {count}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function getCategoryLabel(category: DocumentCategory): string {
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
}
