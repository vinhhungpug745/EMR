# EMR Care Frontend

Ứng dụng React dành cho năm vai trò trong quy trình khám ngoại trú của EMR Care. Frontend sử dụng React Router để bảo vệ route theo vai trò và một lớp REST client hỗ trợ JWT, tự làm mới access token và tải tệp có xác thực.

Hướng dẫn cài đặt, tài khoản demo, kiến trúc và kịch bản chạy đầy đủ nằm trong [README của repository](../README.md).

## Lệnh phát triển

```powershell
npm install
npm run dev
npm run lint
npm run build
```

Vite chạy tại `http://localhost:3000` và chuyển tiếp `/api` tới Django tại `http://localhost:8000` trong môi trường local.
