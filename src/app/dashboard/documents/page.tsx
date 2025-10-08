"use client";

import React, { useState } from "react";
import Image from "next/image";
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
import {
  IconUpload,
  IconFile,
  IconX,
  IconRefresh,
  IconFileText,
  IconFileTypePdf,
  IconFileTypeDoc,
  IconFileSpreadsheet,
  IconFileZip,
} from "@tabler/icons-react";
import { DocumentTable } from "@/components/documents/DocumentTable";
import {
  DocumentType,
  DocumentCategory,
  DocumentUploadRequest,
} from "@/types/Document";
import { useDocumentData } from "@/hooks/useDocumentData";
import { documentService } from "@/services/documentService";
import { toast } from "sonner";

interface DocumentsPageProps {
  type?: DocumentType;
  category?: DocumentCategory;
}

export default function DocumentsPage({ type, category }: DocumentsPageProps) {
  const {
    documents,
    loading,
    loadDocuments,
    addDocument,
    removeDocument,
    getDocumentsByType,
  } = useDocumentData();

  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [documentType, setDocumentType] = useState<DocumentType>(
    type || DocumentType.OTHER
  );
  const [documentCategory, setDocumentCategory] = useState<DocumentCategory>(
    category || DocumentCategory.OTHER
  );
  const [description, setDescription] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
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
      "application/zip": [".zip"],
      "application/x-zip-compressed": [".zip"],
      "application/x-rar-compressed": [".rar"],
      "application/vnd.rar": [".rar"],
      "application/x-7z-compressed": [".7z"],
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

        // Create preview for images
        if (selectedFile.type.startsWith("image/")) {
          const reader = new FileReader();
          reader.onloadend = () => {
            setFilePreview(reader.result as string);
          };
          reader.readAsDataURL(selectedFile);
        } else {
          setFilePreview(null);
        }
      }
    },
  });

  const handleRefresh = () => {
    loadDocuments();
  };

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

    const maxSize = 10 * 1024 * 1024 * 1024; // 10GB
    if (file.size > maxSize) {
      setError("File quá lớn. Kích thước tối đa là 10GB");
      toast.error("File quá lớn. Kích thước tối đa là 10GB");
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setError("");

    try {
      const uploadRequest: DocumentUploadRequest = {
        file,
        name: name.trim(),
        type: documentType,
        category: documentCategory,
        description: description.trim() || undefined,
      };

      // Simulate progress (since we don't have real progress from the API)
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const result = await documentService.uploadDocument(uploadRequest);

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (result.success && result.document) {
        toast.success("Upload tài liệu thành công!");
        addDocument(result.document);

        // Reset form after a short delay
        setTimeout(() => {
          setFile(null);
          setFilePreview(null);
          setName("");
          setDescription("");
          setUploadProgress(0);
        }, 1000);
      } else {
        const errorMessage = result.error || "Upload thất bại";
        setError(errorMessage);
        toast.error(errorMessage);
        setUploadProgress(0);
      }
    } catch (error) {
      console.error("Upload error:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Có lỗi xảy ra khi upload tài liệu";
      setError(errorMessage);
      toast.error(errorMessage);
      setUploadProgress(0);
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

  const getFileIcon = (file: File) => {
    const fileType = file.type.toLowerCase();
    const fileName = file.name.toLowerCase();

    if (fileType.includes("pdf") || fileName.endsWith(".pdf")) {
      return <IconFileTypePdf className="h-16 w-16 text-red-500" />;
    } else if (
      fileType.includes("word") ||
      fileName.endsWith(".doc") ||
      fileName.endsWith(".docx")
    ) {
      return <IconFileTypeDoc className="h-16 w-16 text-blue-500" />;
    } else if (
      fileType.includes("sheet") ||
      fileType.includes("excel") ||
      fileName.endsWith(".xls") ||
      fileName.endsWith(".xlsx")
    ) {
      return <IconFileSpreadsheet className="h-16 w-16 text-green-600" />;
    } else if (
      fileType.includes("zip") ||
      fileType.includes("rar") ||
      fileType.includes("7z") ||
      fileName.endsWith(".zip") ||
      fileName.endsWith(".rar") ||
      fileName.endsWith(".7z")
    ) {
      return <IconFileZip className="h-16 w-16 text-orange-500" />;
    } else {
      return <IconFile className="h-16 w-16 text-gray-500" />;
    }
  };

  const displayDocuments = type ? getDocumentsByType(type) : documents;

  return (
    <div className="flex-1 p-6 space-y-6 overflow-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <IconFileText className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Quản Lý Tài Liệu
            </h1>
            <p className="text-sm text-gray-600">
              Upload và quản lý tài liệu, chứng chỉ
            </p>
          </div>
        </div>
        <Button variant="outline" onClick={handleRefresh} disabled={loading}>
          <IconRefresh className="h-4 w-4 mr-2" />
          Làm mới
        </Button>
      </div>

      {/* Upload Form */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Upload Tài Liệu</CardTitle>
          <CardDescription>
            Kéo thả file vào đây hoặc click để chọn file
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Drag & Drop Area */}
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragActive
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-300 hover:border-gray-400"
              }`}
            >
              <input {...getInputProps()} />
              {file ? (
                <div className="space-y-3">
                  {/* File Preview */}
                  {filePreview ? (
                    <div className="relative inline-block mx-auto">
                      <Image
                        src={filePreview}
                        alt="Preview"
                        width={256}
                        height={128}
                        className="mx-auto h-32 w-auto max-w-xs rounded-lg object-contain border-2 border-gray-200"
                        unoptimized
                      />
                    </div>
                  ) : (
                    <div className="flex justify-center">
                      {getFileIcon(file)}
                    </div>
                  )}

                  <div>
                    <p className="font-medium text-gray-900">{file.name}</p>
                    <p className="text-sm text-gray-500">
                      {formatFileSize(file.size)}
                    </p>
                  </div>

                  {/* Progress Bar */}
                  {uploading && (
                    <div className="w-full max-w-md mx-auto space-y-2">
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div
                          className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-600">
                        Đang tải lên... {uploadProgress}%
                      </p>
                    </div>
                  )}

                  {!uploading && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFile(null);
                        setFilePreview(null);
                        setName("");
                      }}
                    >
                      <IconX className="h-4 w-4 mr-2" />
                      Xóa file
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <IconUpload className="mx-auto h-12 w-12 text-gray-400" />
                  <div>
                    <p className="text-lg font-medium text-gray-900">
                      {isDragActive
                        ? "Thả file vào đây..."
                        : "Kéo thả file hoặc click để chọn"}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      Hỗ trợ: PDF, DOC, DOCX, XLS, XLSX, PNG, JPG, ZIP, RAR, 7Z
                      (Max: 10GB)
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

              <div className="space-y-2">
                <Label>Loại Tài Liệu</Label>
                <Select
                  value={documentType}
                  onValueChange={(value) =>
                    setDocumentType(value as DocumentType)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={DocumentType.CERTIFICATE}>
                      Chứng chỉ
                    </SelectItem>
                    <SelectItem value={DocumentType.INSPECTION_CERTIFICATE}>
                      Kiểm định
                    </SelectItem>
                    <SelectItem value={DocumentType.OTHER}>Khác</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Danh Mục</Label>
                <Select
                  value={documentCategory}
                  onValueChange={(value) =>
                    setDocumentCategory(value as DocumentCategory)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={DocumentCategory.PRODUCT_CERTIFICATE}>
                      Chứng chỉ sản phẩm
                    </SelectItem>
                    <SelectItem value={DocumentCategory.INSPECTION_REPORT}>
                      Báo cáo kinh doanh
                    </SelectItem>
                    <SelectItem value={DocumentCategory.QUALITY_ASSURANCE}>
                      Đảm bảo chất lượng
                    </SelectItem>
                    <SelectItem value={DocumentCategory.SAFETY_CERTIFICATE}>
                      Giấy kiểm định an toàn mỹ phẩm
                    </SelectItem>
                    <SelectItem value={DocumentCategory.COMPLIANCE_DOCUMENT}>
                      Tuân thủ và chính sách
                    </SelectItem>
                    <SelectItem value={DocumentCategory.OTHER}>Khác</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Mô Tả</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Mô tả tài liệu (tùy chọn)"
                  rows={1}
                />
              </div>
            </div>

            {/* Error Alert */}
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={!file || !name.trim() || uploading}
              className="w-full md:w-auto"
            >
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Đang upload...
                </>
              ) : (
                <>
                  <IconUpload className="h-4 w-4 mr-2" />
                  Upload Tài Liệu
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Document Table */}
      <DocumentTable
        documents={displayDocuments}
        onRefresh={handleRefresh}
        onDelete={removeDocument}
      />
    </div>
  );
}
