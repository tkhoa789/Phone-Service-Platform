# SRS (Software Requirement Specification)

## Hệ thống quản lý chuỗi cửa hàng điện thoại tích hợp AI Assistant

**Version:** 1.0

---

# 1. Giới thiệu

## 1.1 Mục đích

Tài liệu này mô tả toàn bộ yêu cầu phần mềm của hệ thống quản lý chuỗi cửa hàng điện thoại tích hợp AI Assistant.

Đây là tài liệu đầu vào cho:

* Database Design
* System Architecture
* API Design
* UI Design
* AI Design
* Development
* Testing

---

## 1.2 Phạm vi

Hệ thống hỗ trợ quản lý:

* Chuỗi cửa hàng
* Người dùng
* Phân quyền
* Khách hàng
* Sản phẩm
* Kho
* Bán hàng
* Bảo hành
* Sửa chữa
* Dashboard
* AI Assistant

---

## 1.3 Đối tượng sử dụng

* Owner
* Branch Manager
* Sales Staff
* Warehouse Staff
* Technician
* Warranty Staff
* AI Assistant

---

# 2. Functional Requirements

## FR-01 Authentication

### FR-01.01

Hệ thống cho phép người dùng đăng nhập bằng tài khoản và mật khẩu.

### FR-01.02

Hệ thống hỗ trợ JWT Authentication.

### FR-01.03

Hệ thống hỗ trợ Refresh Token.

### FR-01.04

Hệ thống cho phép đổi mật khẩu.

### FR-01.05

Hệ thống cho phép Admin khóa hoặc mở khóa tài khoản.

---

## FR-02 Authorization

### FR-02.01

Hệ thống phân quyền theo Role.

### FR-02.02

Hệ thống kiểm tra quyền ở tất cả API.

### FR-02.03

Menu hiển thị theo quyền người dùng.

### FR-02.04

Người dùng không được truy cập chức năng ngoài quyền hạn.

---

## FR-03 User Management

Hệ thống phải cho phép:

* Tạo nhân viên
* Cập nhật nhân viên
* Khóa tài khoản
* Gán Role
* Gán Branch
* Tìm kiếm nhân viên

---

## FR-04 Branch Management

Hệ thống phải cho phép:

* CRUD chi nhánh
* Quản lý địa chỉ
* Quản lý trạng thái
* Gán quản lý

---

## FR-05 Customer Management

Hệ thống phải cho phép:

* CRUD khách hàng
* Tìm kiếm theo tên
* Tìm kiếm theo số điện thoại
* Xem lịch sử mua hàng
* Xem lịch sử sửa chữa
* Xem lịch sử bảo hành

---

## FR-06 Product Management

Hệ thống phải cho phép:

* CRUD sản phẩm
* CRUD Brand
* CRUD Category
* CRUD Model
* CRUD Variant
* Quản lý IMEI
* Quản lý giá nhập
* Quản lý giá bán
* Quản lý trạng thái

---

## FR-07 Inventory Management

Hệ thống phải hỗ trợ:

* Nhập kho
* Xuất kho
* Chuyển kho
* Kiểm kho
* Điều chỉnh kho
* Tra cứu tồn kho
* Theo dõi IMEI
* Lịch sử nhập xuất

---

## FR-08 Purchase Management

Hệ thống phải cho phép:

* Tạo phiếu nhập
* Quản lý nhà cung cấp
* Quản lý giá nhập
* Cập nhật tồn kho

---

## FR-09 Sales Management

Hệ thống phải hỗ trợ:

* POS
* Tạo đơn hàng
* Chọn khách hàng
* Chọn sản phẩm
* Thanh toán
* Áp dụng Voucher
* In hóa đơn

---

## FR-10 Invoice Management

Hệ thống phải cho phép:

* Sinh hóa đơn
* Xem hóa đơn
* In hóa đơn
* Tra cứu hóa đơn

---

## FR-11 Payment Management

Hệ thống hỗ trợ:

* Tiền mặt
* Chuyển khoản
* Thanh toán nhiều phương thức
* Ghi nhận trạng thái thanh toán

---

## FR-12 Promotion Management

Hệ thống phải cho phép:

* CRUD Voucher
* CRUD Promotion
* Thiết lập điều kiện áp dụng
* Quản lý thời gian hiệu lực

---

## FR-13 Warranty Management

Hệ thống phải hỗ trợ:

* Kiểm tra bảo hành
* Tạo phiếu bảo hành
* Gia hạn bảo hành
* Đổi máy
* Theo dõi trạng thái
* Tra cứu lịch sử

---

## FR-14 Repair Management

Hệ thống phải hỗ trợ:

* Tiếp nhận máy
* Ghi nhận lỗi
* Chẩn đoán
* Báo giá
* Cập nhật tiến độ
* Hoàn tất sửa chữa
* Bàn giao máy

---

## FR-15 Return / Exchange

Hệ thống phải hỗ trợ:

* Đổi hàng
* Trả hàng
* Kiểm tra điều kiện đổi trả
* Cập nhật tồn kho

---

## FR-16 Dashboard

Dashboard phải hiển thị:

* Doanh thu
* Lợi nhuận
* Tồn kho
* Top sản phẩm
* KPI nhân viên
* Tình trạng sửa chữa
* Tình trạng bảo hành

---

## FR-17 Notification

Hệ thống phải gửi thông báo:

* Đơn hàng
* Bảo hành
* Sửa chữa
* Tồn kho thấp
* Cảnh báo hệ thống

---

## FR-18 File Management

Hệ thống phải cho phép:

* Upload hình ảnh
* Upload chứng từ
* Quản lý file

---

## FR-19 Audit Log

Hệ thống phải ghi nhận:

* Đăng nhập
* Thay đổi dữ liệu
* Xóa dữ liệu
* Thay đổi quyền
* Hoạt động AI

---

## FR-20 AI Assistant

AI Assistant phải hỗ trợ:

* Chat với người dùng
* Tra cứu khách hàng
* Tra cứu sản phẩm
* Tra cứu hóa đơn
* Tra cứu tồn kho
* Tra cứu bảo hành
* Tra cứu sửa chữa
* Sinh báo cáo
* Giải thích nghiệp vụ
* Gợi ý nhập hàng
* Phân tích doanh thu
* Trả lời theo quyền của người dùng

---

# 3. Non Functional Requirements

## NFR-01 Performance

* Thời gian phản hồi API thông thường nhỏ hơn 2 giây.
* Dashboard tải dưới 5 giây.
* Hỗ trợ tối thiểu 300 người dùng đồng thời.
* Hệ thống có khả năng mở rộng khi số lượng chi nhánh tăng.

---

## NFR-02 Availability

* Thời gian hoạt động đạt tối thiểu 99%.
* Có cơ chế backup dữ liệu.
* Có khả năng phục hồi sau sự cố.

---

## NFR-03 Security

* JWT Authentication.
* RBAC.
* Mã hóa mật khẩu bằng BCrypt.
* Chống SQL Injection.
* Chống XSS.
* Kiểm tra quyền ở mọi API.
* Audit Log cho thao tác quan trọng.

---

## NFR-04 Reliability

* Dữ liệu giao dịch phải đảm bảo tính toàn vẹn.
* Không mất dữ liệu khi xảy ra lỗi giao dịch.
* Hỗ trợ rollback transaction.

---

## NFR-05 Scalability

Hệ thống phải hỗ trợ:

* Nhiều chi nhánh
* Nhiều kho
* Nhiều người dùng
* Dễ bổ sung module mới

---

## NFR-06 Maintainability

* Tuân thủ Clean Architecture.
* Code module hóa.
* Có tài liệu đầy đủ.
* Dễ kiểm thử và mở rộng.

---

## NFR-07 Compatibility

Hệ thống hoạt động trên:

* Windows
* Linux
* Docker

Hỗ trợ:

* Chrome
* Edge
* Firefox

---

## NFR-08 Database

* Microsoft SQL Server 2022 Enterprise.
* Chuẩn hóa dữ liệu.
* Có Index.
* Có Migration.
* Có Backup.

---

## NFR-09 AI

AI phải:

* Chỉ truy cập dữ liệu theo quyền.
* Áp dụng RAG để giảm hallucination.
* Hỗ trợ Tool Calling.
* Ghi log các phiên làm việc.
* Có thể thay đổi mô hình AI mà không ảnh hưởng nghiệp vụ.

---

## NFR-10 Logging & Monitoring

* Ghi log hệ thống.
* Ghi log lỗi.
* Theo dõi trạng thái dịch vụ.
* Theo dõi AI Service.
* Theo dõi Database.
* Theo dõi Redis.

---

## NFR-11 Deployment

Hệ thống phải triển khai được bằng Docker Compose, bao gồm:

* Backend (.NET 10 Web API)
* Frontend (React 19 SPA)
* Microsoft SQL Server 2022
* Redis 7
* Ollama
* Qdrant 1.12.0

Chỉ cần thực hiện lệnh:

```bash
docker compose up
```

là toàn bộ hệ thống có thể khởi động.

---

# 4. Deliverable

Sau khi hoàn thành SRS, các tài liệu tiếp theo sẽ được xây dựng dựa trên nội dung này:

* BUSINESS_RULE.md
* USER_STORY.md
* USE_CASE_LIST.md
* PERMISSION_MATRIX.md
* WORKFLOW.md
