# USER_STORY

## Hệ thống quản lý chuỗi cửa hàng điện thoại tích hợp AI Assistant

**Version:** 1.0

---

# 1. Mục đích

Tài liệu này mô tả các User Story của hệ thống theo góc nhìn của người sử dụng.

Mỗi User Story gồm:

* Vai trò (Role)
* Nhu cầu (Need)
* Mục đích (Benefit)
* Độ ưu tiên (Priority)
* Tiêu chí chấp nhận (Acceptance Criteria)

---

# 2. Vai trò người dùng

| Mã         | Vai trò            |
| ---------- | ------------------ |
| OWNER      | Chủ hệ thống       |
| MANAGER    | Quản lý chi nhánh  |
| SALES      | Nhân viên bán hàng |
| WAREHOUSE  | Nhân viên kho      |
| TECHNICIAN | Kỹ thuật viên      |
| WARRANTY   | Nhân viên bảo hành |
| AI         | AI Assistant       |

---

# 3. Authentication

### US-001

**As an** User

**I want** đăng nhập vào hệ thống

**So that** tôi có thể sử dụng các chức năng được cấp quyền.

**Priority**

Must Have

**Acceptance Criteria**

* Đăng nhập thành công với tài khoản hợp lệ.
* Sai mật khẩu hiển thị thông báo lỗi.
* Tài khoản bị khóa không được đăng nhập.

---

### US-002

**As an** User

**I want** đổi mật khẩu

**So that** tài khoản được bảo mật hơn.

---

# 4. User Management

### US-101

**As an** Owner

**I want** tạo tài khoản nhân viên

**So that** nhân viên có thể sử dụng hệ thống.

---

### US-102

**As an** Owner

**I want** phân quyền cho nhân viên

**So that** mỗi người chỉ sử dụng đúng chức năng được phép.

---

### US-103

**As an** Owner

**I want** khóa tài khoản nhân viên

**So that** nhân viên nghỉ việc không còn truy cập hệ thống.

---

# 5. Branch Management

### US-201

**As an** Owner

**I want** tạo chi nhánh mới

**So that** có thể quản lý nhiều cửa hàng trong cùng hệ thống.

---

### US-202

**As a** Manager

**I want** xem dữ liệu của chi nhánh mình

**So that** quản lý hoạt động kinh doanh hiệu quả.

---

# 6. Customer Management

### US-301

**As a** Sales Staff

**I want** tạo khách hàng mới

**So that** lưu thông tin phục vụ bán hàng.

---

### US-302

**As a** Sales Staff

**I want** tìm kiếm khách hàng bằng số điện thoại

**So that** thao tác bán hàng nhanh hơn.

---

### US-303

**As a** Sales Staff

**I want** xem lịch sử mua hàng

**So that** tư vấn phù hợp với khách hàng.

---

### US-304

**As a** Warranty Staff

**I want** xem lịch sử bảo hành

**So that** xử lý yêu cầu chính xác.

---

# 7. Product Management

### US-401

**As a** Manager

**I want** thêm sản phẩm mới

**So that** sản phẩm có thể được bán trong hệ thống.

---

### US-402

**As a** Warehouse Staff

**I want** nhập IMEI

**So that** quản lý từng thiết bị riêng biệt.

---

### US-403

**As a** Sales Staff

**I want** tìm kiếm sản phẩm theo tên hoặc IMEI

**So that** phục vụ khách hàng nhanh chóng.

---

# 8. Inventory Management

### US-501

**As a** Warehouse Staff

**I want** nhập hàng vào kho

**So that** cập nhật tồn kho chính xác.

---

### US-502

**As a** Warehouse Staff

**I want** chuyển hàng giữa các chi nhánh

**So that** cân đối tồn kho.

---

### US-503

**As a** Warehouse Staff

**I want** kiểm kho

**So that** phát hiện chênh lệch tồn kho.

---

### US-504

**As a** Manager

**I want** xem tồn kho theo chi nhánh

**So that** đưa ra quyết định nhập hàng.

---

# 9. Sales Management

### US-601

**As a** Sales Staff

**I want** tạo hóa đơn bán hàng

**So that** hoàn tất giao dịch với khách.

---

### US-602

**As a** Sales Staff

**I want** áp dụng voucher

**So that** khách hàng nhận được ưu đãi.

---

### US-603

**As a** Sales Staff

**I want** in hóa đơn

**So that** giao cho khách hàng.

---

### US-604

**As a** Sales Staff

**I want** thanh toán bằng nhiều phương thức

**So that** đáp ứng nhu cầu của khách hàng.

---

# 10. Warranty Management

### US-701

**As a** Warranty Staff

**I want** kiểm tra thời hạn bảo hành

**So that** xác định sản phẩm còn được bảo hành hay không.

---

### US-702

**As a** Warranty Staff

**I want** tạo phiếu bảo hành

**So that** theo dõi quá trình xử lý.

---

### US-703

**As a** Warranty Staff

**I want** cập nhật trạng thái bảo hành

**So that** khách hàng biết tiến độ.

---

# 11. Repair Management

### US-801

**As a** Technician

**I want** tiếp nhận máy sửa chữa

**So that** bắt đầu quy trình sửa chữa.

---

### US-802

**As a** Technician

**I want** ghi nhận lỗi thiết bị

**So that** lưu thông tin phục vụ sửa chữa.

---

### US-803

**As a** Technician

**I want** cập nhật tiến độ sửa chữa

**So that** khách hàng và nhân viên theo dõi được.

---

### US-804

**As a** Technician

**I want** hoàn tất phiếu sửa chữa

**So that** có thể bàn giao máy cho khách.

---

# 12. Dashboard

### US-901

**As an** Owner

**I want** xem doanh thu toàn hệ thống

**So that** đánh giá hiệu quả kinh doanh.

---

### US-902

**As a** Manager

**I want** xem doanh thu chi nhánh

**So that** quản lý cửa hàng của mình.

---

### US-903

**As an** Owner

**I want** xem sản phẩm bán chạy

**So that** xây dựng kế hoạch nhập hàng.

---

### US-904

**As a** Manager

**I want** xem KPI nhân viên

**So that** đánh giá hiệu suất làm việc.

---

# 13. AI Assistant

### US-1001

**As a** User

**I want** hỏi AI về sản phẩm

**So that** tìm thông tin nhanh mà không cần tìm thủ công.

---

### US-1002

**As a** Sales Staff

**I want** hỏi AI tồn kho

**So that** biết còn hàng hay không.

---

### US-1003

**As a** Manager

**I want** yêu cầu AI phân tích doanh thu

**So that** hỗ trợ ra quyết định kinh doanh.

---

### US-1004

**As a** Technician

**I want** hỏi AI về lịch sử sửa chữa

**So that** tham khảo các lần xử lý trước.

---

### US-1005

**As an** Owner

**I want** AI tạo báo cáo tự động

**So that** tiết kiệm thời gian tổng hợp dữ liệu.

---

### US-1006

**As a** User

**I want** AI chỉ truy cập dữ liệu trong phạm vi quyền của tôi

**So that** đảm bảo bảo mật thông tin.

---

# 14. Notification

### US-1101

**As a** User

**I want** nhận thông báo khi trạng thái sửa chữa thay đổi

**So that** theo dõi tiến độ xử lý.

---

### US-1102

**As a** Manager

**I want** nhận cảnh báo tồn kho thấp

**So that** chủ động nhập hàng.

---

### US-1103

**As an** Owner

**I want** nhận cảnh báo khi hệ thống có lỗi nghiêm trọng

**So that** xử lý kịp thời.

---

# 15. Audit Log

### US-1201

**As an** Owner

**I want** xem lịch sử thao tác của người dùng

**So that** truy vết khi có sự cố.

---

### US-1202

**As an** Admin

**I want** xem lịch sử đăng nhập

**So that** phát hiện truy cập bất thường.

---

# 16. Tổng hợp User Story theo Module

| Module               | Số lượng User Story |
| -------------------- | ------------------: |
| Authentication       |                   2 |
| User Management      |                   3 |
| Branch Management    |                   2 |
| Customer Management  |                   4 |
| Product Management   |                   3 |
| Inventory Management |                   4 |
| Sales Management     |                   4 |
| Warranty Management  |                   3 |
| Repair Management    |                   4 |
| Dashboard            |                   4 |
| AI Assistant         |                   6 |
| Notification         |                   3 |
| Audit Log            |                   2 |

**Tổng cộng:** **44 User Story**

---

# 17. Mức độ ưu tiên

## Must Have (MVP)

* Authentication
* Authorization
* User Management
* Branch Management
* Customer Management
* Product Management
* Inventory Management
* Sales Management
* Warranty Management
* Repair Management
* Dashboard

## Should Have

* Notification
* Promotion
* Audit Log
* File Management

## Could Have

* AI Assistant phân tích nâng cao
* Dự báo nhập hàng
* Gợi ý bán chéo sản phẩm
* Báo cáo thông minh

---

# 18. Kết luận

Các User Story trong tài liệu này phản ánh nhu cầu của từng vai trò trong hệ thống và là cơ sở để xây dựng **Use Case**, **Workflow**, **Test Case** và **API Design**. Mỗi User Story sẽ được ánh xạ tới các yêu cầu chức năng trong `SRS.md` và được kiểm chứng thông qua tiêu chí chấp nhận trong giai đoạn kiểm thử.
