export interface Document {
  id: string;
  name: string;
  type: DocumentType;
  category: DocumentCategory;
  pixeldrainId: string;
  pixeldrainUrl: string;
  thumbnailUrl?: string;
  size: number;
  mimeType: string;
  description?: string;
  productId?: string; 
  brandId?: string;
  uploadedBy: string; 
  uploadedAt: Date;
  lastModified: Date;
  isActive: boolean;
  tags?: string[];
}

export enum DocumentType {
  CERTIFICATE = "certificate",
  INSPECTION_CERTIFICATE = "inspection_certificate",
  OTHER = "other",
}

export enum DocumentCategory {
  PRODUCT_CERTIFICATE = "product_certificate",
  INSPECTION_REPORT = "inspection_report",
  QUALITY_ASSURANCE = "quality_assurance",
  SAFETY_CERTIFICATE = "safety_certificate",
  COMPLIANCE_DOCUMENT = "compliance_document",
  OTHER = "other",
}

export interface DocumentUploadRequest {
  file: File;
  name: string;
  type: DocumentType;
  category: DocumentCategory;
  description?: string;
  productId?: string;
  brandId?: string;
  tags?: string[];
}

export interface DocumentUploadResponse {
  success: boolean;
  document?: Document;
  error?: string;
}

export interface PixeldrainUploadResponse {
  id: string;
  success?: boolean;
  message?: string;
}

export interface PixeldrainFileInfo {
  id: string;
  name: string;
  size: number;
  date_upload: string;
  date_last_view: string;
  mime_type: string;
  views: number;
  downloads: number;
  bandwidth_used: number;
  thumbnail_href?: string;
  hash_sha256: string;
  can_edit: boolean;
}
