"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { IconPlus, IconUpload, IconRefresh } from "@tabler/icons-react";
import { DocumentUploadForm } from "@/components/documents/DocumentUploadForm";
import { DocumentTable } from "@/components/documents/DocumentTable";
import { DocumentStats } from "@/components/documents/DocumentStats";
import { Document, DocumentType, DocumentCategory } from "@/types/Document";
import { useDocumentData } from "@/hooks/useDocumentData";

interface DocumentsPageProps {
  type?: DocumentType;
  category?: DocumentCategory;
}

export default function DocumentsPage({ type, category }: DocumentsPageProps) {
  const [activeTab, setActiveTab] = useState("all");
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploadType, setUploadType] = useState<DocumentType | undefined>(
    type || undefined
  );
  const [uploadCategory, setUploadCategory] = useState<
    DocumentCategory | undefined
  >(category || undefined);

  const {
    documents,
    loading,
    loadDocuments,
    addDocument,
    removeDocument,
    getDocumentsByType,
  } = useDocumentData();

  // Set active tab based on props
  React.useEffect(() => {
    if (type === DocumentType.CERTIFICATE) {
      setActiveTab("certificates");
    } else if (type === DocumentType.INSPECTION_CERTIFICATE) {
      setActiveTab("inspection");
    } else if (type === DocumentType.OTHER) {
      setActiveTab("other");
    } else {
      setActiveTab("all");
    }
  }, [type]);

  const handleUploadSuccess = (newDocument: Document) => {
    addDocument(newDocument);
    setShowUploadForm(false);
    setUploadType(undefined);
    setUploadCategory(undefined);
  };

  const handleRefresh = () => {
    loadDocuments();
  };

  const handleQuickUpload = (
    type: DocumentType,
    category: DocumentCategory
  ) => {
    setUploadType(type);
    setUploadCategory(category);
    setShowUploadForm(true);
    setActiveTab("upload");
  };

  if (showUploadForm) {
    return (
      <div className="flex-1 p-6">
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => setShowUploadForm(false)}
            className="mb-4"
          >
            ← Quay lại
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">Upload Tài Liệu</h1>
        </div>
        <DocumentUploadForm
          onUploadSuccess={handleUploadSuccess}
          onCancel={() => setShowUploadForm(false)}
          defaultType={uploadType}
          defaultCategory={uploadCategory}
        />
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 space-y-6 overflow-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">
            {type === DocumentType.CERTIFICATE
              ? "Chứng Chỉ Sản Phẩm"
              : type === DocumentType.INSPECTION_CERTIFICATE
              ? "Giấy Xác Nhận Kiểm Định"
              : type === DocumentType.OTHER
              ? "Tài Liệu Khác"
              : "Quản Lý Tài Liệu"}
          </h1>
          <p className="text-gray-600 mt-1">
            {type === DocumentType.CERTIFICATE
              ? "Quản lý các chứng chỉ chất lượng và an toàn sản phẩm"
              : type === DocumentType.INSPECTION_CERTIFICATE
              ? "Quản lý giấy xác nhận kiểm định và báo cáo đánh giá"
              : type === DocumentType.OTHER
              ? "Quản lý các tài liệu khác"
              : "Quản lý chứng chỉ, giấy xác nhận kiểm định và tài liệu khác"}
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleRefresh} disabled={loading}>
            <IconRefresh className="h-4 w-4 mr-2" />
            Làm mới
          </Button>
          <Button onClick={() => setShowUploadForm(true)}>
            <IconPlus className="h-4 w-4 mr-2" />
            Upload Tài Liệu
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <DocumentStats documents={documents} />

      {/* Quick Actions */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">
            Thao Tác Nhanh
          </CardTitle>
          <CardDescription className="text-gray-600">
            Upload nhanh các loại tài liệu phổ biến
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Button
              variant="outline"
              className="h-auto p-6 flex flex-col items-center gap-3 border-2 border-green-200 hover:border-green-300 hover:bg-green-50 transition-all duration-200"
              onClick={() =>
                handleQuickUpload(
                  DocumentType.CERTIFICATE,
                  DocumentCategory.PRODUCT_CERTIFICATE
                )
              }
            >
              <div className="p-3 rounded-full bg-green-100">
                <IconUpload className="h-6 w-6 text-green-600" />
              </div>
              <div className="text-center">
                <div className="font-semibold text-gray-900">
                  Chứng Chỉ Sản Phẩm
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  Upload chứng chỉ chất lượng
                </div>
              </div>
            </Button>

            <Button
              variant="outline"
              className="h-auto p-6 flex flex-col items-center gap-3 border-2 border-purple-200 hover:border-purple-300 hover:bg-purple-50 transition-all duration-200"
              onClick={() =>
                handleQuickUpload(
                  DocumentType.INSPECTION_CERTIFICATE,
                  DocumentCategory.INSPECTION_REPORT
                )
              }
            >
              <div className="p-3 rounded-full bg-purple-100">
                <IconUpload className="h-6 w-6 text-purple-600" />
              </div>
              <div className="text-center">
                <div className="font-semibold text-gray-900">
                  Giấy Kiểm Định
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  Upload giấy xác nhận kiểm định
                </div>
              </div>
            </Button>

            <Button
              variant="outline"
              className="h-auto p-6 flex flex-col items-center gap-3 border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all duration-200"
              onClick={() =>
                handleQuickUpload(DocumentType.OTHER, DocumentCategory.OTHER)
              }
            >
              <div className="p-3 rounded-full bg-gray-100">
                <IconUpload className="h-6 w-6 text-gray-600" />
              </div>
              <div className="text-center">
                <div className="font-semibold text-gray-900">Tài Liệu Khác</div>
                <div className="text-sm text-gray-500 mt-1">
                  Upload tài liệu khác
                </div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      {!type ? (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">Tất Cả</TabsTrigger>
            <TabsTrigger value="certificates">Chứng Chỉ</TabsTrigger>
            <TabsTrigger value="inspection">Kiểm Định</TabsTrigger>
            <TabsTrigger value="other">Khác</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            <DocumentTable
              documents={documents}
              onRefresh={handleRefresh}
              onDelete={removeDocument}
            />
          </TabsContent>

          <TabsContent value="certificates" className="space-y-4">
            <DocumentTable
              documents={getDocumentsByType(DocumentType.CERTIFICATE)}
              onRefresh={handleRefresh}
              onDelete={removeDocument}
            />
          </TabsContent>

          <TabsContent value="inspection" className="space-y-4">
            <DocumentTable
              documents={getDocumentsByType(
                DocumentType.INSPECTION_CERTIFICATE
              )}
              onRefresh={handleRefresh}
              onDelete={removeDocument}
            />
          </TabsContent>

          <TabsContent value="other" className="space-y-4">
            <DocumentTable
              documents={getDocumentsByType(DocumentType.OTHER)}
              onRefresh={handleRefresh}
              onDelete={removeDocument}
            />
          </TabsContent>
        </Tabs>
      ) : (
        <DocumentTable
          documents={getDocumentsByType(type)}
          onRefresh={handleRefresh}
          onDelete={removeDocument}
        />
      )}
    </div>
  );
}
