# Quản Lý Tài Liệu

## Tổng Quan

Tính năng Quản Lý Tài Liệu cho phép admin upload, quản lý và tổ chức các tài liệu quan trọng như chứng chỉ sản phẩm, giấy xác nhận kiểm định và các tài liệu khác.

## Tính Năng Chính

### 1. Upload Tài Liệu

- **Drag & Drop**: Kéo thả file trực tiếp vào khu vực upload
- **Hỗ trợ định dạng**: PDF, DOC, DOCX, XLS, XLSX, PNG, JPG, JPEG, GIF, WEBP
- **Phân loại tự động**: Chọn loại và danh mục tài liệu
- **Thêm mô tả và tags**: Tổ chức tài liệu dễ dàng

### 2. Phân Loại Tài Liệu

#### Loại Tài Liệu (Document Type)

- **Chứng chỉ sản phẩm**: Các chứng chỉ chất lượng, an toàn
- **Giấy xác nhận kiểm định**: Báo cáo kiểm định, đánh giá
- **Tài liệu khác**: Các tài liệu không thuộc 2 loại trên

#### Danh Mục (Document Category)

- **Chứng chỉ sản phẩm**: Chứng chỉ chất lượng sản phẩm
- **Báo cáo kiểm định**: Báo cáo kiểm tra, đánh giá
- **Đảm bảo chất lượng**: Tài liệu QA/QC
- **Chứng chỉ an toàn**: Tài liệu về an toàn sản phẩm
- **Tài liệu tuân thủ**: Tài liệu tuân thủ quy định
- **Khác**: Tài liệu không thuộc các danh mục trên

### 3. Quản Lý Tài Liệu

- **Xem danh sách**: Hiển thị tất cả tài liệu với bộ lọc
- **Tìm kiếm**: Tìm kiếm theo tên, mô tả, tags
- **Lọc theo loại/danh mục**: Lọc nhanh theo phân loại
- **Xem trước**: Xem tài liệu trực tiếp trên trình duyệt
- **Tải xuống**: Tải tài liệu về máy
- **Xóa**: Xóa tài liệu khỏi hệ thống

### 4. Thống Kê

- **Tổng số tài liệu**: Số lượng tài liệu đã upload
- **Phân loại theo loại**: Thống kê theo từng loại tài liệu
- **Tổng dung lượng**: Dung lượng lưu trữ đã sử dụng
- **Phân loại theo danh mục**: Thống kê chi tiết theo danh mục

## Cách Sử Dụng

### Upload Tài Liệu

1. **Truy cập**: Vào menu "Quản lý tài liệu" trong sidebar
2. **Chọn Upload**: Click nút "Upload Tài Liệu" hoặc sử dụng "Thao tác nhanh"
3. **Chọn file**: Kéo thả file hoặc click để chọn file
4. **Điền thông tin**:
   - Tên tài liệu (bắt buộc)
   - Loại tài liệu
   - Danh mục
   - Mô tả (tùy chọn)
   - Tags (tùy chọn)
5. **Upload**: Click "Upload Tài Liệu" để hoàn tất

### Quản Lý Tài Liệu

1. **Xem danh sách**: Tài liệu hiển thị trong bảng với thông tin chi tiết
2. **Tìm kiếm**: Sử dụng ô tìm kiếm để tìm tài liệu
3. **Lọc**: Sử dụng dropdown để lọc theo loại/danh mục
4. **Thao tác**:
   - **Xem**: Click icon mắt để xem tài liệu
   - **Tải xuống**: Click icon download để tải về
   - **Xóa**: Click icon thùng rác để xóa (có xác nhận)

### Thao Tác Nhanh

- **Chứng chỉ sản phẩm**: Upload nhanh chứng chỉ chất lượng
- **Giấy kiểm định**: Upload nhanh giấy xác nhận kiểm định
- **Tài liệu khác**: Upload tài liệu không thuộc 2 loại trên

## Lưu Trữ

Tài liệu được lưu trữ trên [Pixeldrain](https://pixeldrain.com) - một dịch vụ lưu trữ file miễn phí và đáng tin cậy.

### Ưu Điểm

- **Miễn phí**: Không giới hạn dung lượng
- **Bảo mật**: API key riêng cho từng tài khoản
- **Tốc độ**: Tải lên và tải xuống nhanh
- **Ổn định**: Dịch vụ ổn định, ít downtime

### API Key

- **Key hiện tại**: `9f9660df-c95c-4e1d-846f-9acc1bd9090c`
- **Quản lý**: Có thể thay đổi key trong file `src/services/pixeldrainService.ts`

## Cấu Trúc Code

### Files Chính

```
src/
├── types/Document.ts                    # Định nghĩa types
├── services/
│   ├── pixeldrainService.ts            # Service tích hợp Pixeldrain
│   └── documentService.ts              # Service quản lý tài liệu
├── hooks/useDocumentData.ts            # Hook quản lý state
├── components/documents/
│   ├── DocumentUploadForm.tsx          # Form upload tài liệu
│   ├── DocumentTable.tsx               # Bảng hiển thị tài liệu
│   └── DocumentStats.tsx               # Component thống kê
└── app/dashboard/documents/page.tsx    # Trang chính
```

### Database Schema

Tài liệu được lưu trữ trong Firebase Realtime Database với cấu trúc:

```json
{
  "documents": {
    "documentId1": {
      "name": "Tên tài liệu",
      "type": "certificate",
      "category": "product_certificate",
      "pixeldrainId": "abc123",
      "pixeldrainUrl": "https://pixeldrain.com/api/file/abc123",
      "thumbnailUrl": "https://pixeldrain.com/api/file/abc123/thumbnail",
      "size": 1024000,
      "mimeType": "application/pdf",
      "description": "Mô tả tài liệu",
      "productId": null,
      "brandId": null,
      "uploadedBy": "user-id",
      "uploadedAt": "2024-01-01T00:00:00.000Z",
      "lastModified": "2024-01-01T00:00:00.000Z",
      "isActive": true,
      "tags": ["tag1", "tag2"]
    }
  }
}
```

**Interface TypeScript:**

```typescript
interface Document {
  id: string; // ID duy nhất (key trong Realtime Database)
  name: string; // Tên tài liệu
  type: DocumentType; // Loại tài liệu
  category: DocumentCategory; // Danh mục
  pixeldrainId: string; // ID trên Pixeldrain
  pixeldrainUrl: string; // URL tải xuống
  thumbnailUrl?: string; // URL thumbnail
  size: number; // Kích thước file (bytes)
  mimeType: string; // Loại MIME
  description?: string; // Mô tả
  productId?: string; // ID sản phẩm liên kết
  brandId?: string; // ID thương hiệu liên kết
  uploadedBy: string; // ID người upload
  uploadedAt: Date; // Ngày upload
  lastModified: Date; // Ngày sửa đổi cuối
  isActive: boolean; // Trạng thái hoạt động
  tags?: string[]; // Tags
}
```

## Bảo Mật

- **API Key**: Được lưu trữ an toàn trong code
- **Xác thực**: Chỉ admin mới có thể upload/xóa tài liệu
- **Quyền truy cập**: Tài liệu chỉ có thể truy cập qua API key
- **Xóa an toàn**: Xóa cả trên Pixeldrain và database

## Troubleshooting

### Lỗi Upload

- **File quá lớn**: Kiểm tra giới hạn dung lượng
- **Định dạng không hỗ trợ**: Chỉ hỗ trợ các định dạng được liệt kê
- **Lỗi mạng**: Kiểm tra kết nối internet

### Lỗi Hiển Thị

- **Tài liệu không hiển thị**: Kiểm tra kết nối database
- **Thumbnail không load**: Có thể file không hỗ trợ thumbnail

### Lỗi Xóa

- **Không xóa được**: Kiểm tra quyền truy cập API key
- **Xóa một phần**: Tài liệu có thể bị xóa khỏi database nhưng vẫn còn trên Pixeldrain

## Phát Triển Tương Lai

- [ ] Liên kết tài liệu với sản phẩm cụ thể
- [ ] Liên kết tài liệu với thương hiệu
- [ ] Tự động tạo thumbnail cho file PDF
- [ ] Hỗ trợ versioning tài liệu
- [ ] Tích hợp OCR để tìm kiếm nội dung
- [ ] Backup tự động
- [ ] Phân quyền chi tiết cho từng loại tài liệu
