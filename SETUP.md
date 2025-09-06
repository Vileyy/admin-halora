# Hướng dẫn cấu hình Halora Admin

## Cấu hình Firebase

1. Tạo project Firebase tại https://console.firebase.google.com/
2. Kích hoạt Realtime Database
3. Tạo file `.env.local` trong thư mục gốc với nội dung:

```
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://your_project_id-default-rtdb.firebaseio.com/

# Cloudinary Configuration (Optional - for real media uploads)
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

## Cấu hình Cloudinary (Tùy chọn)

Nếu không cấu hình Cloudinary, hệ thống sẽ sử dụng placeholder images để test.

Để cấu hình Cloudinary thật:
1. Tạo account tại https://cloudinary.com/
2. Lấy Cloud Name, API Key, API Secret từ Dashboard
3. Thêm vào file `.env.local`

## Chạy ứng dụng

```bash
npm install
npm run dev
```

Ứng dụng sẽ chạy tại http://localhost:3000

## Các tính năng

- ✅ Quản lý sản phẩm với biến thể
- ✅ Upload 2-5 media (ảnh/video) 
- ✅ Tính toán lợi nhuận tự động
- ✅ Cảnh báo tồn kho thấp
- ✅ Tìm kiếm và lọc sản phẩm
- ✅ Cập nhật số lượng trực tiếp
- ✅ Mock upload khi chưa có Cloudinary
