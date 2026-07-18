# USE_CASE_LIST

## Hệ thống quản lý chuỗi cửa hàng điện thoại tích hợp AI Assistant

**Version:** 1.0

---

# 1. Mục đích

Tài liệu này liệt kê toàn bộ Use Case của hệ thống.

Mỗi Use Case đại diện cho một chức năng mà người dùng hoặc AI Assistant có thể thực hiện.

Đây là tài liệu đầu vào cho:

* Workflow
* API Design
* UI Design
* Test Case
* AI Tool Calling

---

# 2. Danh sách Actor

| Mã         | Actor              |
| ---------- | ------------------ |
| OWNER      | Chủ hệ thống       |
| MANAGER    | Quản lý chi nhánh  |
| SALES      | Nhân viên bán hàng |
| WAREHOUSE  | Nhân viên kho      |
| TECHNICIAN | Kỹ thuật viên      |
| WARRANTY   | Nhân viên bảo hành |
| ADMIN      | Quản trị hệ thống  |
| AI         | AI Assistant       |

---

# 3. Authentication

| ID     | Use Case                 | Actor    |
| ------ | ------------------------ | -------- |
| UC-001 | Đăng nhập                | Tất cả   |
| UC-002 | Đăng xuất                | Tất cả   |
| UC-003 | Đổi mật khẩu             | Tất cả   |
| UC-004 | Làm mới Access Token     | Hệ thống |
| UC-005 | Khóa / mở khóa tài khoản | ADMIN    |

---

# 4. User Management

| ID     | Use Case            | Actor        |
| ------ | ------------------- | ------------ |
| UC-101 | Tạo người dùng      | OWNER, ADMIN |
| UC-102 | Cập nhật người dùng | OWNER, ADMIN |
| UC-103 | Xóa mềm người dùng  | OWNER        |
| UC-104 | Gán Role            | OWNER        |
| UC-105 | Gán Branch          | OWNER        |
| UC-106 | Tra cứu người dùng  | OWNER, ADMIN |

---

# 5. Branch Management

| ID     | Use Case                  | Actor          |
| ------ | ------------------------- | -------------- |
| UC-201 | Tạo chi nhánh             | OWNER          |
| UC-202 | Cập nhật chi nhánh        | OWNER          |
| UC-203 | Ngừng hoạt động chi nhánh | OWNER          |
| UC-204 | Xem danh sách chi nhánh   | OWNER, MANAGER |

---

# 6. Customer Management

| ID     | Use Case             | Actor      |
| ------ | -------------------- | ---------- |
| UC-301 | Tạo khách hàng       | SALES      |
| UC-302 | Cập nhật khách hàng  | SALES      |
| UC-303 | Tra cứu khách hàng   | SALES      |
| UC-304 | Xem lịch sử mua hàng | SALES      |
| UC-305 | Xem lịch sử bảo hành | WARRANTY   |
| UC-306 | Xem lịch sử sửa chữa | TECHNICIAN |

---

# 7. Product Management

| ID     | Use Case          | Actor     |
| ------ | ----------------- | --------- |
| UC-401 | Tạo sản phẩm      | MANAGER   |
| UC-402 | Cập nhật sản phẩm | MANAGER   |
| UC-403 | Quản lý Brand     | MANAGER   |
| UC-404 | Quản lý Category  | MANAGER   |
| UC-405 | Quản lý Model     | MANAGER   |
| UC-406 | Quản lý Variant   | MANAGER   |
| UC-407 | Quản lý IMEI      | WAREHOUSE |
| UC-408 | Tra cứu sản phẩm  | SALES     |

---

# 8. Inventory Management

| ID     | Use Case        | Actor          |
| ------ | --------------- | -------------- |
| UC-501 | Nhập kho        | WAREHOUSE      |
| UC-502 | Xuất kho        | WAREHOUSE      |
| UC-503 | Chuyển kho      | WAREHOUSE      |
| UC-504 | Kiểm kho        | WAREHOUSE      |
| UC-505 | Điều chỉnh kho  | MANAGER        |
| UC-506 | Tra cứu tồn kho | SALES, MANAGER |

---

# 9. Purchase Management

| ID     | Use Case              | Actor     |
| ------ | --------------------- | --------- |
| UC-601 | Tạo phiếu nhập        | WAREHOUSE |
| UC-602 | Cập nhật phiếu nhập   | WAREHOUSE |
| UC-603 | Quản lý nhà cung cấp  | MANAGER   |
| UC-604 | Xem lịch sử nhập hàng | MANAGER   |

---

# 10. Sales Management

| ID     | Use Case              | Actor |
| ------ | --------------------- | ----- |
| UC-701 | Tạo đơn bán hàng      | SALES |
| UC-702 | Chọn khách hàng       | SALES |
| UC-703 | Thêm sản phẩm vào đơn | SALES |
| UC-704 | Áp dụng Voucher       | SALES |
| UC-705 | Thanh toán            | SALES |
| UC-706 | In hóa đơn            | SALES |

---

# 11. Invoice Management

| ID     | Use Case                 | Actor   |
| ------ | ------------------------ | ------- |
| UC-801 | Xem hóa đơn              | SALES   |
| UC-802 | Tra cứu hóa đơn          | SALES   |
| UC-803 | In lại hóa đơn           | SALES   |
| UC-804 | Hủy hóa đơn (theo quyền) | MANAGER |

---

# 12. Warranty Management

| ID     | Use Case                     | Actor    |
| ------ | ---------------------------- | -------- |
| UC-901 | Kiểm tra bảo hành            | WARRANTY |
| UC-902 | Tạo phiếu bảo hành           | WARRANTY |
| UC-903 | Cập nhật trạng thái bảo hành | WARRANTY |
| UC-904 | Đổi máy bảo hành             | WARRANTY |

---

# 13. Repair Management

| ID      | Use Case          | Actor      |
| ------- | ----------------- | ---------- |
| UC-1001 | Tiếp nhận máy     | TECHNICIAN |
| UC-1002 | Chẩn đoán lỗi     | TECHNICIAN |
| UC-1003 | Báo giá sửa chữa  | TECHNICIAN |
| UC-1004 | Cập nhật tiến độ  | TECHNICIAN |
| UC-1005 | Hoàn tất sửa chữa | TECHNICIAN |
| UC-1006 | Bàn giao máy      | TECHNICIAN |

---

# 14. Dashboard

| ID      | Use Case              | Actor          |
| ------- | --------------------- | -------------- |
| UC-1101 | Xem doanh thu         | OWNER, MANAGER |
| UC-1102 | Xem lợi nhuận         | OWNER          |
| UC-1103 | Xem tồn kho           | MANAGER        |
| UC-1104 | Xem KPI nhân viên     | MANAGER        |
| UC-1105 | Xem sản phẩm bán chạy | OWNER          |

---

# 15. AI Assistant

| ID      | Use Case            | Actor  |
| ------- | ------------------- | ------ |
| UC-1201 | Chat với AI         | Tất cả |
| UC-1202 | Tra cứu khách hàng  | AI     |
| UC-1203 | Tra cứu sản phẩm    | AI     |
| UC-1204 | Tra cứu tồn kho     | AI     |
| UC-1205 | Tra cứu hóa đơn     | AI     |
| UC-1206 | Tra cứu bảo hành    | AI     |
| UC-1207 | Tra cứu sửa chữa    | AI     |
| UC-1208 | Sinh báo cáo        | AI     |
| UC-1209 | Phân tích doanh thu | AI     |
| UC-1210 | Gợi ý nhập hàng     | AI     |
| UC-1211 | Gọi Tool nội bộ     | AI     |

---

# 16. Notification

| ID      | Use Case               | Actor  |
| ------- | ---------------------- | ------ |
| UC-1301 | Xem thông báo          | Tất cả |
| UC-1302 | Đánh dấu đã đọc        | Tất cả |
| UC-1303 | Gửi thông báo hệ thống | ADMIN  |

---

# 17. Audit Log

| ID      | Use Case                 | Actor |
| ------- | ------------------------ | ----- |
| UC-1401 | Xem Audit Log            | OWNER |
| UC-1402 | Tra cứu lịch sử thao tác | OWNER |
| UC-1403 | Xem lịch sử AI           | OWNER |

---

# 18. File Management

| ID      | Use Case   | Actor               |
| ------- | ---------- | ------------------- |
| UC-1501 | Upload tệp | Tất cả (theo quyền) |
| UC-1502 | Xem tệp    | Tất cả (theo quyền) |
| UC-1503 | Xóa tệp    | OWNER, MANAGER      |

---

# 19. Thống kê Use Case

| Module               | Số Use Case |
| -------------------- | ----------: |
| Authentication       |           5 |
| User Management      |           6 |
| Branch Management    |           4 |
| Customer Management  |           6 |
| Product Management   |           8 |
| Inventory Management |           6 |
| Purchase Management  |           4 |
| Sales Management     |           6 |
| Invoice Management   |           4 |
| Warranty Management  |           4 |
| Repair Management    |           6 |
| Dashboard            |           5 |
| AI Assistant         |          11 |
| Notification         |           3 |
| Audit Log            |           3 |
| File Management      |           3 |

**Tổng cộng: 84 Use Case**

---

# 20. Quan hệ với các tài liệu khác

* `SRS.md`: Mỗi Use Case được ánh xạ tới một hoặc nhiều Functional Requirement.
* `USER_STORY.md`: Mỗi User Story có thể bao gồm một hoặc nhiều Use Case.
* `PERMISSION_MATRIX.md`: Quy định Actor nào được thực hiện từng Use Case.
* `WORKFLOW.md`: Mô tả chi tiết trình tự thực hiện của các Use Case quan trọng.
* `API_CONTRACT.yaml`: Mỗi Use Case sẽ tương ứng với một hoặc nhiều API.
* `TEST_CASE.md`: Mỗi Use Case sẽ có bộ Test Case kiểm thử tương ứng.

---

# 21. Kết luận

Danh sách Use Case này là danh mục chức năng chính của hệ thống. Đây là cầu nối giữa yêu cầu nghiệp vụ (Business Analysis) và thiết kế kỹ thuật (Database, API, UI và AI), đồng thời là cơ sở để xây dựng Workflow và Test Case trong các giai đoạn tiếp theo.
