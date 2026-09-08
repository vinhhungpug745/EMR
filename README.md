# EMR Care

EMR Care là hệ thống quản lý bệnh án điện tử phục vụ quy trình khám ngoại trú tại cơ sở y tế quy mô vừa và nhỏ. Hệ thống liên kết dữ liệu từ khâu tiếp nhận bệnh nhân, đo sinh hiệu, khám bệnh, chỉ định xét nghiệm, kê đơn thuốc đến khi hoàn tất lượt khám.

> Đây là sản phẩm phục vụ học tập, kiểm thử và trình diễn đồ án. Hệ thống chưa được đánh giá để thay thế bệnh án giấy hoặc sử dụng với dữ liệu y tế thật.

## Chức năng chính

- Đăng nhập bằng JWT và phân quyền theo vai trò.
- Quản lý tài khoản, hồ sơ nhân viên và khoa chuyên môn.
- Quản lý bệnh nhân, hồ sơ bệnh án, lần đến khám và lượt khám.
- Tiếp nhận bệnh nhân vào quy trình khám ngoại trú.
- Hàng đợi đo sinh hiệu, hàng đợi khám và hàng đợi xét nghiệm.
- Ghi nhận sinh hiệu, nội dung khám, chẩn đoán và hướng điều trị.
- Chỉ định xét nghiệm, tiếp nhận và trả kết quả xét nghiệm.
- Kê đơn thuốc và quản lý danh mục thuốc.
- Chuyển bệnh nhân sang chuyên khoa khác trong cùng lần đến khám.
- Thống kê hoạt động khám ngoại trú và theo dõi nhật ký hệ thống.

## Vai trò người dùng

| Vai trò | Phạm vi chính |
|---|---|
| Quản trị viên | Quản lý người dùng, nhân viên, khoa, danh mục, báo cáo và nhật ký |
| Nhân viên tiếp nhận | Tra cứu bệnh nhân, tạo hồ sơ và tiếp nhận lượt đến khám |
| Điều dưỡng | Xem hàng đợi và ghi nhận dấu hiệu sinh tồn |
| Bác sĩ | Khám bệnh, xem bệnh án, chỉ định xét nghiệm, kê đơn và chuyển khoa |
| Nhân viên xét nghiệm | Tiếp nhận chỉ định, nhập kết quả và cập nhật trạng thái xét nghiệm |

## Công nghệ sử dụng

- Backend: Python, Django 6, Django REST Framework.
- Frontend: React 19, React Router, Vite 8.
- Cơ sở dữ liệu: MySQL.
- Xác thực: JSON Web Token với Simple JWT.
- Tài liệu API: Swagger và ReDoc.
- Triển khai trình diễn: Cloudflare Tunnel và tên miền `emr-care.site`.

## Cấu trúc thư mục

```text
EMR/
├── backend/          # Django REST API, migrations, test và dữ liệu mẫu
├── frontend/         # Ứng dụng React/Vite
├── doc/              # Nội dung các chương báo cáo
├── .gitignore
└── README.md
```

## Yêu cầu môi trường

Máy chạy dự án cần có:

- Git.
- Python 3.12 trở lên.
- Node.js 20.19 trở lên hoặc Node.js 22.12 trở lên.
- MySQL 8.

Docker không bắt buộc đối với phiên bản hiện tại của dự án.

## Cài đặt lần đầu

### 1. Clone repository

```powershell
git clone https://github.com/vinhhungpug745/EMR.git
cd EMR
```

### 2. Tạo cơ sở dữ liệu MySQL

Đăng nhập MySQL và tạo một cơ sở dữ liệu rỗng:

```sql
CREATE DATABASE emr_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
```

Có thể thay `emr_db` bằng tên khác, nhưng tên trong file cấu hình backend phải giống tên đã tạo.

### 3. Cài đặt backend

Trong PowerShell, từ thư mục gốc của dự án:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
```

Nếu PowerShell chặn script kích hoạt môi trường ảo, chạy lệnh sau trong đúng cửa sổ PowerShell hiện tại rồi kích hoạt lại:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```

Tạo file `backend/.env` với nội dung:

```dotenv
DEBUG=True
SECRET_KEY=thay-bang-mot-chuoi-bi-mat-dai-va-ngau-nhien
DB_ENGINE=django.db.backends.mysql
DB_NAME=emr_db
DB_USER=root
DB_PASSWORD=mat-khau-mysql-cua-ban
DB_HOST=127.0.0.1
DB_PORT=3306
```

Không commit file `.env` hoặc mật khẩu thật lên GitHub.

Khởi tạo cấu trúc cơ sở dữ liệu:

```powershell
python manage.py migrate
```

Nạp dữ liệu mẫu nếu cần trình diễn:

```powershell
python seed.py
```

Lệnh seed có thể chạy lại và sẽ cập nhật dữ liệu mẫu theo các mã định danh đã khai báo. Không chạy lệnh này trên cơ sở dữ liệu chứa dữ liệu thật.

Khởi động backend:

```powershell
python manage.py runserver 8000
```

Backend chạy tại `http://127.0.0.1:8000`.

### 4. Cài đặt frontend

Mở một cửa sổ PowerShell mới, từ thư mục gốc của dự án:

```powershell
cd frontend
npm install
npm run dev
```

Frontend chạy tại `http://localhost:3000`. Trong môi trường phát triển, Vite tự chuyển tiếp các yêu cầu `/api` đến backend ở cổng `8000`, vì vậy không cần tạo file `.env` cho frontend khi chạy local theo cấu hình mặc định.

Nếu frontend và backend được phục vụ qua hai địa chỉ khác nhau, tạo file `frontend/.env`:

```dotenv
VITE_API_BASE_URL=https://dia-chi-backend-cua-ban
```

Sau khi sửa biến bắt đầu bằng `VITE_`, cần khởi động lại Vite hoặc build lại frontend.

## Tài khoản dữ liệu mẫu

Sau khi chạy `python seed.py`, có thể đăng nhập bằng các tài khoản sau. Mật khẩu chung là `Emr@123456`.

| Vai trò | Tên đăng nhập |
|---|---|
| Quản trị viên | `admin_emr` |
| Nhân viên tiếp nhận | `tiepnhan.mai` |
| Điều dưỡng | `dieuduong.lan` |
| Bác sĩ | `bacsi.an` |
| Nhân viên xét nghiệm | `xetnghiem.hai` |

Các tài khoản này chỉ dành cho dữ liệu mẫu. Hãy đổi hoặc vô hiệu hóa chúng nếu triển khai hệ thống ra Internet.

## Chạy dự án sau khi đã cài đặt

Mỗi lần làm việc, mở hai cửa sổ terminal.

Terminal backend:

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
python manage.py runserver 8000
```

Terminal frontend:

```powershell
cd frontend
npm run dev
```

MySQL phải đang chạy trước khi khởi động backend.

## Kiểm tra chất lượng mã nguồn

Kiểm tra cấu hình và test backend:

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
python manage.py check
python manage.py test
```

Kiểm tra và build frontend:

```powershell
cd frontend
npm run lint
npm run build
```

Thư mục `frontend/dist` được tạo sau khi build và không được đưa lên Git.

## Tài liệu API

Khi backend đang chạy:

- Swagger UI: `http://127.0.0.1:8000/swagger/`
- ReDoc: `http://127.0.0.1:8000/redoc/`
- Django Admin: `http://127.0.0.1:8000/admin/`

Các API nghiệp vụ được backend cung cấp ở đường dẫn gốc. Khi frontend chạy bằng Vite, yêu cầu có tiền tố `/api` sẽ được proxy và bỏ tiền tố trước khi gửi đến Django.

## Quy trình nghiệp vụ trình diễn

Để trình diễn một luồng khám đầy đủ:

1. Nhân viên tiếp nhận tìm hoặc tạo bệnh nhân và tạo lần đến khám.
2. Điều dưỡng mở hàng đợi, chọn bệnh nhân và ghi nhận sinh hiệu.
3. Bác sĩ mở hàng đợi khám, nhập thông tin khám và chẩn đoán.
4. Bác sĩ có thể kê đơn, chỉ định xét nghiệm hoặc chuyển chuyên khoa.
5. Nhân viên xét nghiệm tiếp nhận chỉ định và nhập kết quả.
6. Bác sĩ xem kết quả và hoàn tất lượt khám.
7. Quản trị viên xem báo cáo và nhật ký hoạt động.

Các hàng đợi hiện được lấy từ cơ sở dữ liệu theo trạng thái nghiệp vụ và thứ tự thời gian. Phiên bản hiện tại chưa sử dụng WebSocket; người dùng cần tải lại dữ liệu để nhận thay đổi mới nhất.

## Triển khai trình diễn

Hệ thống từng được công bố thử nghiệm tại `https://emr-care.site` bằng Cloudflare Tunnel, ánh xạ frontend và backend đang chạy trên máy triển khai ra tên miền công khai. Domain chỉ cung cấp địa chỉ truy cập; máy chạy frontend, backend, MySQL và Cloudflare Tunnel vẫn phải hoạt động.

Cách triển khai này phù hợp cho kiểm thử và bảo vệ đồ án, chưa phải kiến trúc production có tính sẵn sàng cao. Khi triển khai thực tế cần bổ sung tối thiểu HTTPS ở reverse proxy, cấu hình bảo mật Django, máy chủ ứng dụng, phục vụ static file, sao lưu cơ sở dữ liệu, giám sát và chính sách bảo vệ dữ liệu y tế.

## Phạm vi đề tài

Phiên bản hiện tại tập trung vào quy trình khám ngoại trú nội bộ. Các chức năng ngoài phạm vi gồm cổng bệnh nhân, đặt lịch trực tuyến, viện phí và thanh toán, nội trú, bảo hiểm y tế, ký số hoàn chỉnh, liên thông HIS/LIS và khả năng thay thế bệnh án giấy theo quy định pháp luật.

## Tác giả

- Repository: <https://github.com/vinhhungpug745/EMR>
- Website trình diễn: <https://emr-care.site>
