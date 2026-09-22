# EMR Care — Hệ thống quản lý hồ sơ bệnh án điện tử phục vụ khám bệnh, chữa bệnh ngoại trú

EMR Care là đồ án ngành Công nghệ thông tin với đề tài **“Xây dựng hệ thống quản lý hồ sơ bệnh án điện tử phục vụ khám bệnh, chữa bệnh ngoại trú”**. Ứng dụng Web hỗ trợ nhân viên y tế phối hợp từ tiếp nhận, đo sinh hiệu, khám và chẩn đoán đến xét nghiệm, kê đơn và tra cứu lịch sử trên cùng một hồ sơ bệnh nhân.

**Bản demo:** [emr-care.site](https://emr-care.site) (chỉ truy cập được khi máy chủ demo và Cloudflare Tunnel đang hoạt động).

> **Phạm vi sử dụng:** Đây là sản phẩm học tập sử dụng dữ liệu giả lập. Hệ thống chưa được đánh giá để vận hành với dữ liệu y tế thật hoặc thay thế hồ sơ bệnh án theo quy định hiện hành.

## 1. Bài toán, mục tiêu và phạm vi

Trong quy trình khám bệnh, chữa bệnh ngoại trú, thông tin của một bệnh nhân đi qua nhiều bộ phận. Khi dữ liệu được quản lý rời rạc, nhân viên khó theo dõi trạng thái xử lý, tra cứu lịch sử và xác định ai đã thực hiện thao tác.

Đồ án hướng tới một luồng xử lý thống nhất:

```text
Tiếp nhận → Đo sinh hiệu → Khám bác sĩ → Xét nghiệm (nếu có) / Kê đơn → Hoàn tất → Tra cứu lịch sử
```

Hệ thống quản lý bệnh nhân, hồ sơ bệnh án điện tử, lần đến khám, lượt khám theo chuyên khoa, sinh hiệu, chẩn đoán, đơn thuốc, chỉ định xét nghiệm, tệp đính kèm và nhật ký thao tác. Phạm vi hiện tại là **khám bệnh, chữa bệnh ngoại trú** với năm vai trò nhân viên; chưa có cổng dành cho bệnh nhân.

## 2. Chức năng theo vai trò

| Vai trò | Chức năng chính |
| --- | --- |
| Quản trị viên | Quản lý tài khoản và hồ sơ nhân viên, khoa/phòng, thuốc, danh mục xét nghiệm; xem báo cáo ngoại trú và nhật ký thao tác. |
| Nhân viên tiếp nhận | Tìm hoặc tạo bệnh nhân, tạo lần đến khám và lượt khám ban đầu. |
| Điều dưỡng | Theo dõi hàng đợi đo sinh hiệu, nhập hoặc cập nhật sinh hiệu. |
| Bác sĩ | Theo dõi hàng đợi khám, xem bệnh án, khám và chẩn đoán, chỉ định xét nghiệm, kê đơn, chuyển chuyên khoa, quản lý tài liệu của lượt khám. |
| Nhân viên xét nghiệm | Tiếp nhận chỉ định, cập nhật tiến độ, nhập kết quả và tải tệp kết quả. |

Giao diện chỉ hiển thị các màn hình phù hợp với vai trò. Backend kiểm tra quyền trên API và kiểm tra trạng thái nghiệp vụ trước những thao tác quan trọng.

## 3. Thiết kế và công nghệ

```text
React + React Router + Vite
          │ REST API / JWT
          ▼
Django REST Framework ─── MySQL
          │
          └── Tệp đính kèm qua Django FileField (lưu tại backend/media khi chạy local)
```

| Thành phần | Công nghệ trong repository |
| --- | --- |
| Giao diện | React 19, React Router 7, Vite 8, CSS, JavaScript/JSX |
| API | Python, Django 6, Django REST Framework 3.17 |
| Cơ sở dữ liệu | MySQL 8, PyMySQL |
| Xác thực | JWT qua `djangorestframework-simplejwt`, hỗ trợ làm mới access token |
| Tài liệu API | `drf-yasg`, Swagger UI, ReDoc |
| Demo | Máy chủ cá nhân và Cloudflare Tunnel |

**Các điểm triển khai chính:**

- Ba hàng đợi đo sinh hiệu, khám và xét nghiệm được suy ra từ dữ liệu/trạng thái trong MySQL; giao diện cập nhật bằng polling mỗi 15 giây.
- Các thao tác chuyển trạng thái quan trọng dùng transaction và `select_for_update()` để hạn chế xử lý trùng khi có yêu cầu đồng thời.
- Tệp đính kèm được tải qua API có kiểm tra quyền. Bác sĩ quản lý tài liệu của lượt khám mình phụ trách; nhân viên xét nghiệm quản lý tệp của chỉ định đang xử lý.
- Nhật ký thao tác ghi nhận người thực hiện, hành động, đối tượng và thời điểm.
- Script seed tạo dữ liệu giả lập để trình diễn luồng nghiệp vụ.

## 4. Cấu trúc mã nguồn

```text
EMR/
├── backend/
│   ├── config/              # Django settings và URL gốc
│   ├── emrapi/
│   │   ├── models.py        # Mô hình dữ liệu
│   │   ├── serializers/     # Kiểm tra và chuyển đổi dữ liệu API
│   │   ├── views/           # API theo nghiệp vụ
│   │   ├── permission.py    # Phân quyền
│   │   └── tests.py         # Kiểm thử API
│   ├── seed.py              # Dữ liệu trình diễn
│   ├── manage.py
│   └── requirements.txt
├── frontend/
│   ├── src/api/             # REST client và endpoint
│   ├── src/auth/            # Trạng thái đăng nhập, bảo vệ route
│   ├── src/components/      # Thành phần giao diện
│   ├── src/pages/           # Màn hình theo vai trò
│   └── package.json
└── README.md
```

Các thực thể chính gồm `Patient`, `MedicalRecord`, `Visit`, `Encounter`, `VitalSign`, `Prescription`, `LabTest`, `MedicalAttachment`, `StaffProfile` và `AuditLog`. Mã nguồn mô hình nằm tại `backend/emrapi/models.py`.

## 5. Cài đặt và chạy trên máy local

### Yêu cầu

- Git, Python 3.12 trở lên, Node.js 20.19 trở lên hoặc 22.12 trở lên, MySQL 8.
- Các lệnh dưới đây dùng PowerShell trên Windows. Có thể dùng lệnh tương đương trên macOS/Linux.
- Không cần Docker cho cấu hình local hiện tại.

### Bước 1 — Lấy mã nguồn và tạo database

```powershell
git clone https://github.com/vinhhungpug745/EMR.git
cd EMR
```

Chạy trong MySQL bằng tài khoản có quyền tạo database:

```sql
CREATE DATABASE emr_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### Bước 2 — Cấu hình và chạy backend

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
```

Tạo `backend/.env` với thông tin MySQL của máy bạn:

```dotenv
DEBUG=True
SECRET_KEY=thay-bang-chuoi-ngau-nhien-du-dai
DB_ENGINE=django.db.backends.mysql
DB_NAME=emr_db
DB_USER=root
DB_PASSWORD=mat-khau-mysql-cua-ban
DB_HOST=127.0.0.1
DB_PORT=3306
```

`SECRET_KEY` và các thông số `DB_*` được đọc từ biến môi trường trong `backend/config/settings.py`. Không đưa `backend/.env` lên Git. Nếu PowerShell chặn script kích hoạt, có thể chạy `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass` rồi kích hoạt lại môi trường ảo.

```powershell
python manage.py migrate
python seed.py
python manage.py runserver 8000
```

Backend chạy tại `http://127.0.0.1:8000`. `python seed.py` là bước tùy chọn dành cho **database trình diễn**: script tạo/cập nhật dữ liệu mẫu và đặt lại mật khẩu các tài khoản nhân viên mẫu. Không chạy script này trên database có dữ liệu cần giữ nguyên.

### Bước 3 — Chạy frontend

Mở một terminal mới tại thư mục gốc repository:

```powershell
cd frontend
npm ci
npm run dev
```

Mở `http://localhost:3000`. Trong môi trường local, Vite chuyển `/api` tới backend tại `http://localhost:8000`; không cần file môi trường cho frontend. Nếu frontend truy cập một backend khác, tạo `frontend/.env` với `VITE_API_BASE_URL=https://dia-chi-backend-cua-ban` rồi khởi động lại Vite. Khi dùng cấu hình này, backend cần chấp nhận origin của frontend theo cấu hình triển khai tương ứng.

## 6. Tài khoản và kịch bản demo

Sau khi chạy `python seed.py`, có thể đăng nhập bằng các tài khoản sau. Tất cả dùng mật khẩu mẫu `Emr@123456`.

| Vai trò | Tên đăng nhập |
| --- | --- |
| Quản trị viên | `admin_emr` |
| Tiếp nhận | `tiepnhan.mai` |
| Điều dưỡng | `dieuduong.lan` |
| Bác sĩ | `bacsi.an` |
| Xét nghiệm | `xetnghiem.hai` |

Chỉ dùng các tài khoản trên với dữ liệu giả lập ở môi trường trình diễn.

1. Đăng nhập vai trò tiếp nhận, tìm hoặc tạo bệnh nhân và tạo lần đến khám.
2. Đăng nhập điều dưỡng, chọn bệnh nhân trong hàng đợi và ghi sinh hiệu.
3. Đăng nhập bác sĩ, mở lượt khám, nhập thông tin khám và chẩn đoán.
4. Kê đơn hoặc tạo chỉ định xét nghiệm; nếu có xét nghiệm, đăng nhập nhân viên xét nghiệm để xử lý và nhập/tải kết quả.
5. Quay lại vai trò bác sĩ để xem kết quả, hoàn tất lượt khám và tra cứu bệnh án.
6. Đăng nhập quản trị viên để xem báo cáo và nhật ký thao tác.

## 7. Kiểm thử và tài liệu API

Repository hiện có **26 bài kiểm thử API và 1 bài kiểm thử Django Admin** trong `backend/emrapi/tests.py`. Các bài kiểm thử API bao phủ phân quyền, khóa hồ sơ nhân viên, luồng tiếp nhận, sinh hiệu, khám, xét nghiệm, đơn thuốc, chuyển chuyên khoa, tệp đính kèm và nhật ký thao tác. Chạy kiểm thử bằng một database MySQL thử nghiệm riêng; tài khoản MySQL phải có quyền tạo database kiểm thử do Django khởi tạo.

```powershell
cd backend
python manage.py check
python manage.py test emrapi -v 2
```

Kiểm tra frontend:

```powershell
cd ..\frontend
npm run lint
npm run build
```

Khi backend đang chạy, xem API tại [Swagger UI](http://127.0.0.1:8000/swagger/) hoặc [ReDoc](http://127.0.0.1:8000/redoc/). Trang [Django Admin](http://127.0.0.1:8000/admin/) cũng được cấu hình.

## 8. Giới hạn và hướng phát triển

- Demo phụ thuộc vào máy chủ cá nhân và Cloudflare Tunnel; URL chỉ hoạt động khi các thành phần này đang chạy.
- Hàng đợi dùng polling, chưa có WebSocket hoặc Server-Sent Events.
- Tệp tải lên dùng bộ lưu trữ của Django trên máy chạy backend; chưa có giải pháp lưu trữ tệp dùng chung và sao lưu tự động cho nhiều máy chủ.
- Chưa hỗ trợ đặt lịch online, cổng bệnh nhân, nội trú, viện phí, bảo hiểm hoặc thanh toán.
- Chưa tích hợp chữ ký số hoặc liên thông với HIS/LIS và các nền tảng y tế khác.
- Chưa đánh giá đầy đủ các yêu cầu vận hành thực tế như bảo mật chuyên sâu, giám sát và tính sẵn sàng cao.

Các hướng mở rộng phù hợp gồm cập nhật hàng đợi theo thời gian thực, triển khai lưu trữ tệp và sao lưu, bổ sung kiểm thử hiệu năng/bảo mật, cùng tích hợp với hệ thống y tế khác khi có tiêu chuẩn và môi trường phù hợp.

## Tác giả và bản quyền

**vinhhungpug745** — Full-stack Developer. [GitHub](https://github.com/vinhhungpug745) · [Email](mailto:vinhhungpug745@gmail.com).
