"use client";

import { useState, useEffect, useCallback } from "react";
import { Document, DocumentType, DocumentCategory } from "@/types/Document";
import { documentService } from "@/services/documentService";

export function useDocumentData() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDocuments = useCallback(
    async (
      type?: DocumentType,
      category?: DocumentCategory,
      productId?: string,
      brandId?: string
    ) => {
      try {
        setLoading(true);
        setError(null);
        const docs = await documentService.getDocuments(
          type,
          category,
          productId,
          brandId
        );
        setDocuments(docs);
      } catch (err) {
        console.error("Load documents error:", err);
        setError(
          err instanceof Error ? err.message : "Có lỗi xảy ra khi tải tài liệu"
        );
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const addDocument = useCallback((document: Document) => {
    setDocuments((prev) => [document, ...prev]);
  }, []);

  const updateDocument = useCallback(
    (id: string, updates: Partial<Document>) => {
      setDocuments((prev) =>
        prev.map((doc) => (doc.id === id ? { ...doc, ...updates } : doc))
      );
    },
    []
  );

  const removeDocument = useCallback((id: string) => {
    setDocuments((prev) => prev.filter((doc) => doc.id !== id));
  }, []);

  const getDocumentsByType = useCallback(
    (type: DocumentType) => {
      return documents.filter((doc) => doc.type === type);
    },
    [documents]
  );

  const getDocumentsByCategory = useCallback(
    (category: DocumentCategory) => {
      return documents.filter((doc) => doc.category === category);
    },
    [documents]
  );

  const getDocumentsByProduct = useCallback(
    (productId: string) => {
      return documents.filter((doc) => doc.productId === productId);
    },
    [documents]
  );

  const getDocumentsByBrand = useCallback(
    (brandId: string) => {
      return documents.filter((doc) => doc.brandId === brandId);
    },
    [documents]
  );

  const getStats = useCallback(() => {
    const typeStats = {
      [DocumentType.CERTIFICATE]: 0,
      [DocumentType.INSPECTION_CERTIFICATE]: 0,
      [DocumentType.OTHER]: 0,
    };

    const categoryStats = {
      [DocumentCategory.PRODUCT_CERTIFICATE]: 0,
      [DocumentCategory.INSPECTION_REPORT]: 0,
      [DocumentCategory.QUALITY_ASSURANCE]: 0,
      [DocumentCategory.SAFETY_CERTIFICATE]: 0,
      [DocumentCategory.COMPLIANCE_DOCUMENT]: 0,
      [DocumentCategory.OTHER]: 0,
    };

    documents.forEach((doc) => {
      typeStats[doc.type]++;
      categoryStats[doc.category]++;
    });

    return { typeStats, categoryStats };
  }, [documents]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  return {
    documents,
    loading,
    error,
    loadDocuments,
    addDocument,
    updateDocument,
    removeDocument,
    getDocumentsByType,
    getDocumentsByCategory,
    getDocumentsByProduct,
    getDocumentsByBrand,
    getStats,
  };
}
