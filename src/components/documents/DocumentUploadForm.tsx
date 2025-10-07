"use client";

import React, { useState } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { IconUpload, IconFile, IconX, IconCheck } from "@tabler/icons-react";
import {
  DocumentType,
  DocumentCategory,
  DocumentUploadRequest,
  Document,
} from "@/types/Document";
import { documentService } from "@/services/documentService";
import { toast } from "sonner";

interface DocumentUploadFormProps {
  onUploadSuccess?: (document: Document) => void;
  onCancel?: () => void;
  defaultType?: DocumentType;
  defaultCategory?: DocumentCategory;
  productId?: string;
  brandId?: string;
}

export function DocumentUploadForm({
  onUploadSuccess,
  onCancel,
  defaultType,
  defaultCategory,
  productId,
  brandId,
}: DocumentUploadFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [type, setType] = useState<DocumentType>(
    defaultType || DocumentType.OTHER
  );
  const [category, setCategory] = useState<DocumentCategory>(
    defaultCategory || DocumentCategory.OTHER
  );
  const [description, setDescription] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      "application/pdf": [".pdf"],
      "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp"],
      "application/msword": [".doc"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        [".docx"],
      "application/vnd.ms-excel": [".xls"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
        ".xlsx",
      ],
    },
    maxFiles: 1,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        const selectedFile = acceptedFiles[0];
        setFile(selectedFile);
        if (!name) {
          setName(selectedFile.name);
        }
        setError("");
      }
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      setError("Vui lòng chọn file để upload");
      toast.error("Vui lòng chọn file để upload");
      return;
    }

    if (!name.trim()) {
      setError("Vui lòng nhập tên tài liệu");
      toast.error("Vui lòng nhập tên tài liệu");
      return;
    }

    // Validate file size (max 500MB)
    const maxSize = 500 * 1024 * 1024; // 500MB in bytes
    if (file.size > maxSize) {
      setError("File quá lớn. Kích thước tối đa là 500MB");
      toast.error("File quá lớn. Kích thước tối đa là 500MB");
      return;
    }

    setUploading(true);
    setError("");

    try {
      const uploadRequest: DocumentUploadRequest = {
        file,
        name: name.trim(),
        type,
        category,
        description: description.trim() || undefined,
        productId,
        brandId,
      };

      console.log("Starting document upload...", {
        fileName: file.name,
        fileSize: file.size,
        type,
        category,
      });

      const result = await documentService.uploadDocument(uploadRequest);

      if (result.success && result.document) {
        toast.success("Upload tài liệu thành công!");
        onUploadSuccess?.(result.document);
        // Reset form
        setFile(null);
        setName("");
        setDescription("");
      } else {
        const errorMessage = result.error || "Upload thất bại";
        setError(errorMessage);
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error("Upload error:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Có lỗi xảy ra khi upload tài liệu";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Upload Tài Liệu</CardTitle>
        <CardDescription>
          Tải lên chứng chỉ, giấy xác nhận kiểm định hoặc tài liệu khác
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* File Upload */}
          <div className="space-y-2">
            <Label>File Tài Liệu</Label>
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                isDragActive
                  ? "border-primary bg-primary/5"
                  : "border-gray-300 hover:border-gray-400"
              }`}
            >
              <input {...getInputProps()} />
              {file ? (
                <div className="space-y-2">
                  <IconFile className="mx-auto h-12 w-12 text-green-500" />
                  <div>
                    <p className="font-medium">{file.name}</p>
                    <p className="text-sm text-gray-500">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                    }}
                  >
                    <IconX className="h-4 w-4 mr-2" />
                    Xóa
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <IconUpload className="mx-auto h-12 w-12 text-gray-400" />
                  <div>
                    <p className="text-lg font-medium">
                      {isDragActive
                        ? "Thả file vào đây"
                        : "Kéo thả file hoặc click để chọn"}
                    </p>
                    <p className="text-sm text-gray-500">
                      Hỗ trợ: PDF, DOC, DOCX, XLS, XLSX, PNG, JPG, JPEG, GIF,
                      WEBP
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Document Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Tên Tài Liệu *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nhập tên tài liệu"
              required
            />
          </div>

          {/* Document Type */}
          <div className="space-y-2">
            <Label>Loại Tài Liệu</Label>
            <Select
              value={type}
              onValueChange={(value) => setType(value as DocumentType)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={DocumentType.CERTIFICATE}>
                  Chứng chỉ sản phẩm
                </SelectItem>
                <SelectItem value={DocumentType.INSPECTION_CERTIFICATE}>
                  Giấy xác nhận kiểm định
                </SelectItem>
                <SelectItem value={DocumentType.OTHER}>
                  Tài liệu khác
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Document Category */}
          <div className="space-y-2">
            <Label>Danh Mục</Label>
            <Select
              value={category}
              onValueChange={(value) => setCategory(value as DocumentCategory)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={DocumentCategory.PRODUCT_CERTIFICATE}>
                  Chứng chỉ sản phẩm
                </SelectItem>
                <SelectItem value={DocumentCategory.INSPECTION_REPORT}>
                  Báo cáo kiểm định
                </SelectItem>
                <SelectItem value={DocumentCategory.QUALITY_ASSURANCE}>
                  Đảm bảo chất lượng
                </SelectItem>
                <SelectItem value={DocumentCategory.SAFETY_CERTIFICATE}>
                  Chứng chỉ an toàn
                </SelectItem>
                <SelectItem value={DocumentCategory.COMPLIANCE_DOCUMENT}>
                  Tài liệu tuân thủ
                </SelectItem>
                <SelectItem value={DocumentCategory.OTHER}>Khác</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Mô Tả</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mô tả về tài liệu (tùy chọn)"
              rows={3}
            />
          </div>

          {/* Error Message */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={!file || !name.trim() || uploading}
              className="flex-1"
            >
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Đang upload...
                </>
              ) : (
                <>
                  <IconCheck className="h-4 w-4 mr-2" />
                  Upload Tài Liệu
                </>
              )}
            </Button>
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Hủy
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
