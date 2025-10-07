import {
  Document,
  DocumentType,
  DocumentCategory,
  DocumentUploadRequest,
  DocumentUploadResponse,
} from "@/types/Document";
import { pixeldrainService } from "./pixeldrainService";
import { database } from "@/lib/firebase";
import { ref, push, get, update, remove } from "firebase/database";

class DocumentService {
  private collectionName = "documents";

  async uploadDocument(
    request: DocumentUploadRequest
  ): Promise<DocumentUploadResponse> {
    try {
      // Upload file to Pixeldrain
      const pixeldrainResponse = await pixeldrainService.uploadFileWithName(
        request.file,
        request.name
      );

      if (!pixeldrainResponse.id) {
        throw new Error("Failed to upload file to Pixeldrain");
      }

      // Get file info from Pixeldrain
      const fileInfo = await pixeldrainService.getFileInfo(
        pixeldrainResponse.id
      );

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const documentData: Record<string, any> = {
        name: request.name,
        type: request.type,
        category: request.category,
        pixeldrainId: pixeldrainResponse.id,
        pixeldrainUrl: pixeldrainService.getFileUrl(pixeldrainResponse.id),
        size: fileInfo.size,
        mimeType: fileInfo.mime_type,
        uploadedBy: "current-user-id",
        uploadedAt: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        isActive: true,
        tags: request.tags || [],
      };

      // Add optional fields only if they have values
      if (fileInfo.thumbnail_href) {
        documentData.thumbnailUrl = pixeldrainService.getThumbnailUrl(
          pixeldrainResponse.id
        );
      }
      if (request.description) {
        documentData.description = request.description;
      }
      if (request.productId) {
        documentData.productId = request.productId;
      }
      if (request.brandId) {
        documentData.brandId = request.brandId;
      }

      const docRef = ref(database, `${this.collectionName}`);
      const newDocRef = push(docRef, documentData);

      if (!newDocRef.key) {
        throw new Error("Failed to create document reference");
      }

      const document: Document = {
        id: newDocRef.key,
        name: documentData.name,
        type: documentData.type,
        category: documentData.category,
        pixeldrainId: documentData.pixeldrainId,
        pixeldrainUrl: documentData.pixeldrainUrl,
        thumbnailUrl: documentData.thumbnailUrl,
        size: documentData.size,
        mimeType: documentData.mimeType,
        description: documentData.description,
        productId: documentData.productId,
        brandId: documentData.brandId,
        uploadedBy: documentData.uploadedBy,
        uploadedAt: new Date(documentData.uploadedAt),
        lastModified: new Date(documentData.lastModified),
        isActive: documentData.isActive,
        tags: documentData.tags,
      };

      return {
        success: true,
        document,
      };
    } catch (error) {
      console.error("Document upload error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Upload failed",
      };
    }
  }

  async getDocuments(
    type?: DocumentType,
    category?: DocumentCategory,
    productId?: string,
    brandId?: string
  ): Promise<Document[]> {
    try {
      const docRef = ref(database, this.collectionName);
      const snapshot = await get(docRef);

      if (!snapshot.exists()) {
        return [];
      }

      const data = snapshot.val();
      const documents: Document[] = [];

      Object.keys(data).forEach((key) => {
        const doc = data[key];
        const document: Document = {
          id: key,
          name: doc.name,
          type: doc.type,
          category: doc.category,
          pixeldrainId: doc.pixeldrainId,
          pixeldrainUrl: doc.pixeldrainUrl,
          thumbnailUrl: doc.thumbnailUrl || undefined,
          size: doc.size,
          mimeType: doc.mimeType,
          description: doc.description || undefined,
          productId: doc.productId || undefined,
          brandId: doc.brandId || undefined,
          uploadedBy: doc.uploadedBy,
          uploadedAt: new Date(doc.uploadedAt),
          lastModified: new Date(doc.lastModified),
          isActive: doc.isActive,
          tags: doc.tags || [],
        };

        // Apply filters
        let shouldInclude = true;

        if (type && document.type !== type) {
          shouldInclude = false;
        }
        if (category && document.category !== category) {
          shouldInclude = false;
        }
        if (productId && document.productId !== productId) {
          shouldInclude = false;
        }
        if (brandId && document.brandId !== brandId) {
          shouldInclude = false;
        }

        if (shouldInclude) {
          documents.push(document);
        }
      });

      // Sort by uploadedAt descending
      documents.sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime());

      return documents;
    } catch (error) {
      console.error("Get documents error:", error);
      throw error;
    }
  }

  async getDocumentById(id: string): Promise<Document | null> {
    try {
      const docRef = ref(database, `${this.collectionName}/${id}`);
      const snapshot = await get(docRef);

      if (!snapshot.exists()) {
        return null;
      }

      const data = snapshot.val();
      return {
        id,
        name: data.name,
        type: data.type,
        category: data.category,
        pixeldrainId: data.pixeldrainId,
        pixeldrainUrl: data.pixeldrainUrl,
        thumbnailUrl: data.thumbnailUrl || undefined,
        size: data.size,
        mimeType: data.mimeType,
        description: data.description || undefined,
        productId: data.productId || undefined,
        brandId: data.brandId || undefined,
        uploadedBy: data.uploadedBy,
        uploadedAt: new Date(data.uploadedAt),
        lastModified: new Date(data.lastModified),
        isActive: data.isActive,
        tags: data.tags || [],
      } as Document;
    } catch (error) {
      console.error("Get document by ID error:", error);
      throw error;
    }
  }

  async updateDocument(id: string, updates: Partial<Document>): Promise<void> {
    try {
      const docRef = ref(database, `${this.collectionName}/${id}`);
      const updateData = {
        ...updates,
        lastModified: new Date().toISOString(),
      };

      await update(docRef, updateData);
    } catch (error) {
      console.error("Update document error:", error);
      throw error;
    }
  }

  async deleteDocument(id: string): Promise<void> {
    try {
      // Get document first to get Pixeldrain ID
      const document = await this.getDocumentById(id);
      if (!document) {
        throw new Error("Document not found");
      }

      // Delete from Pixeldrain
      await pixeldrainService.deleteFile(document.pixeldrainId);

      // Delete from Firebase Realtime Database
      const docRef = ref(database, `${this.collectionName}/${id}`);
      await remove(docRef);
    } catch (error) {
      console.error("Delete document error:", error);
      throw error;
    }
  }

  async getDocumentsByProduct(productId: string): Promise<Document[]> {
    return this.getDocuments(undefined, undefined, productId);
  }

  async getDocumentsByBrand(brandId: string): Promise<Document[]> {
    return this.getDocuments(undefined, undefined, undefined, brandId);
  }

  async getDocumentsByType(type: DocumentType): Promise<Document[]> {
    return this.getDocuments(type);
  }

  async getDocumentsByCategory(
    category: DocumentCategory
  ): Promise<Document[]> {
    return this.getDocuments(undefined, category);
  }
}

export const documentService = new DocumentService();
