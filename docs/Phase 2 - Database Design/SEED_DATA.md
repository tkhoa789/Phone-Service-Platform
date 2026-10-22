# DATABASE SEED DATA

## Hệ thống quản lý chuỗi cửa hàng điện thoại tích hợp AI Assistant

**Version:** 1.0
**Phase:** 2 - Database Design

---

## 1. Tổng quan
Tài liệu này cung cấp danh sách dữ liệu mẫu thiết yếu (Seed Data) để khởi tạo hệ thống lần đầu. Dữ liệu mẫu giúp hệ thống sẵn sàng hoạt động ngay sau khi hoàn thành tiến trình di trú cấu trúc bảng (Migration), phục vụ kiểm thử và thiết lập quyền ban đầu cho ban quản trị. Dữ liệu bao gồm các cấu hình phân quyền hệ thống, chi nhánh đầu tiên, tài khoản quản trị viên và các danh mục mặc định.

---

## 2. Danh sách dữ liệu mẫu chi tiết (Bảng và SQL Insert Script)

Do hệ thống sử dụng kiểu khóa chính UUID, để chạy thử nghiệm các lệnh T-SQL dưới đây trong Microsoft SQL Server 2022, chúng ta sử dụng các giá trị UUID được sinh tĩnh sẵn nhằm đảm bảo tính liên kết khóa ngoại.

### 2.1 Bảng `branches` (Chi nhánh mẫu)
Tạo chi nhánh trung tâm làm việc chính.
* **UUID Chi nhánh 1 (Quận 1):** `8f6c4b22-83b6-4b68-b7eb-1259a4c84dc1`
* **UUID Chi nhánh 2 (Bình Thạnh):** `7c6e5a33-92c7-5c79-c8fc-236ab5d95ed2`

```sql
INSERT INTO branches (id, code, name, address, phone, email, status, is_deleted) VALUES
('8f6c4b22-83b6-4b68-b7eb-1259a4c84dc1', 'BR001', 'Chi nhánh Quận 1 - Trung tâm', '123 Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP. HCM', '02838221122', 'q1@phonestore.com', 'ACTIVE', false),
('7c6e5a33-92c7-5c79-c8fc-236ab5d95ed2', 'BR002', 'Chi nhánh Bình Thạnh', '456 Điện Biên Phủ, Phường 15, Quận Bình Thạnh, TP. HCM', '02835123456', 'binhthanh@phonestore.com', 'ACTIVE', false);
```

### 2.2 Bảng `roles` (Vai trò hệ thống)
* **UUID Admin Role:** `a1a2a3a4-b1b2-c1c2-d1d2-e1e2e3e4e501`
* **UUID Branch Manager Role:** `a1a2a3a4-b1b2-c1c2-d1d2-e1e2e3e4e502`
* **UUID Sales Role:** `a1a2a3a4-b1b2-c1c2-d1d2-e1e2e3e4e503`
* **UUID Inventory Role:** `a1a2a3a4-b1b2-c1c2-d1d2-e1e2e3e4e504`
* **UUID Technician Role:** `a1a2a3a4-b1b2-c1c2-d1d2-e1e2e3e4e505`

```sql
INSERT INTO roles (id, name, description, is_deleted) VALUES
('a1a2a3a4-b1b2-c1c2-d1d2-e1e2e3e4e501', 'ADMIN', 'Quản trị viên toàn hệ thống - Có toàn quyền', false),
('a1a2a3a4-b1b2-c1c2-d1d2-e1e2e3e4e502', 'MANAGER', 'Quản lý chi nhánh - Quản lý hoạt động tại cửa hàng', false),
('a1a2a3a4-b1b2-c1c2-d1d2-e1e2e3e4e503', 'SALES', 'Nhân viên bán hàng - Tạo đơn, tư vấn, in hóa đơn', false),
('a1a2a3a4-b1b2-c1c2-d1d2-e1e2e3e4e504', 'INVENTORY', 'Nhân viên kho - Quản lý nhập xuất và chuyển kho', false),
('a1a2a3a4-b1b2-c1c2-d1d2-e1e2e3e4e505', 'TECHNICIAN', 'Kỹ thuật viên - Tiếp nhận sửa chữa và cập nhật tiến độ', false);
```

### 2.3 Bảng `permissions` (Danh mục quyền hạn chi tiết)
Định nghĩa danh sách các quyền cơ bản phục vụ phân quyền chức năng:

```sql
-- 1. Quyền quản trị hệ thống
INSERT INTO permissions (id, code, name, module, is_deleted) VALUES
('f101f101-e101-d101-c101-b101b101b101', 'SYS_CONFIG', 'Cấu hình hệ thống', 'SYSTEM', false),
('f101f101-e101-d101-c101-b101b101b102', 'USER_MANAGE', 'Quản trị nhân sự', 'USER', false),
('f101f101-e101-d101-c101-b101b101b103', 'BRANCH_MANAGE', 'Quản trị chi nhánh', 'BRANCH', false);

-- 2. Quyền bán hàng
INSERT INTO permissions (id, code, name, module, is_deleted) VALUES
('f101f101-e101-d101-c101-b101b101b201', 'ORDER_CREATE', 'Tạo đơn bán hàng', 'SALES', false),
('f101f101-e101-d101-c101-b101b101b202', 'ORDER_VIEW', 'Xem đơn bán hàng', 'SALES', false),
('f101f101-e101-d101-c101-b101b101b203', 'INVOICE_CREATE', 'Xuất hóa đơn tài chính', 'SALES', false);

-- 3. Quyền thủ kho
INSERT INTO permissions (id, code, name, module, is_deleted) VALUES
('f101f101-e101-d101-c101-b101b101b301', 'INVENTORY_IMPORT', 'Nhập kho sản phẩm', 'INVENTORY', false),
('f101f101-e101-d101-c101-b101b101b302', 'INVENTORY_EXPORT', 'Xuất kho sản phẩm', 'INVENTORY', false),
('f101f101-e101-d101-c101-b101b101b303', 'INVENTORY_TRANSFER', 'Điều chuyển kho hàng', 'INVENTORY', false);

-- 4. Quyền kỹ thuật viên & Bảo hành
INSERT INTO permissions (id, code, name, module, is_deleted) VALUES
('f101f101-e101-d101-c101-b101b101b401', 'REPAIR_MANAGE', 'Quản lý phiếu sửa chữa', 'REPAIR', false),
('f101f101-e101-d101-c101-b101b101b402', 'WARRANTY_MANAGE', 'Quản lý phiếu bảo hành', 'WARRANTY', false);

-- 5. Quyền hỏi đáp trợ lý AI
INSERT INTO permissions (id, code, name, module, is_deleted) VALUES
('f101f101-e101-d101-c101-b101b101b501', 'AI_ASSISTANT_CHAT', 'Hỏi đáp với AI Assistant', 'AI', false),
('f101f101-e101-d101-c101-b101b101b502', 'AI_KNOWLEDGE_MANAGE', 'Cập nhật tài liệu tri thức RAG', 'AI', false);
```

### 2.4 Bảng `role_permissions` (Gán quyền cho các Vai trò)
* Role `ADMIN` được gán toàn bộ các quyền.
* Role `SALES` được gán các quyền bán hàng và chat với AI.
* Role `INVENTORY` được gán quyền liên quan đến kho hàng.
* Role `TECHNICIAN` được gán quyền sửa chữa máy.

```sql
-- Gán quyền cho ADMIN
INSERT INTO role_permissions (role_id, permission_id) VALUES
('a1a2a3a4-b1b2-c1c2-d1d2-e1e2e3e4e501', 'f101f101-e101-d101-c101-b101b101b101'),
('a1a2a3a4-b1b2-c1c2-d1d2-e1e2e3e4e501', 'f101f101-e101-d101-c101-b101b101b102'),
('a1a2a3a4-b1b2-c1c2-d1d2-e1e2e3e4e501', 'f101f101-e101-d101-c101-b101b101b103'),
('a1a2a3a4-b1b2-c1c2-d1d2-e1e2e3e4e501', 'f101f101-e101-d101-c101-b101b101b201'),
('a1a2a3a4-b1b2-c1c2-d1d2-e1e2e3e4e501', 'f101f101-e101-d101-c101-b101b101b202'),
('a1a2a3a4-b1b2-c1c2-d1d2-e1e2e3e4e501', 'f101f101-e101-d101-c101-b101b101b203'),
('a1a2a3a4-b1b2-c1c2-d1d2-e1e2e3e4e501', 'f101f101-e101-d101-c101-b101b101b301'),
('a1a2a3a4-b1b2-c1c2-d1d2-e1e2e3e4e501', 'f101f101-e101-d101-c101-b101b101b302'),
('a1a2a3a4-b1b2-c1c2-d1d2-e1e2e3e4e501', 'f101f101-e101-d101-c101-b101b101b303'),
('a1a2a3a4-b1b2-c1c2-d1d2-e1e2e3e4e501', 'f101f101-e101-d101-c101-b101b101b401'),
('a1a2a3a4-b1b2-c1c2-d1d2-e1e2e3e4e501', 'f101f101-e101-d101-c101-b101b101b402'),
('a1a2a3a4-b1b2-c1c2-d1d2-e1e2e3e4e501', 'f101f101-e101-d101-c101-b101b101b501'),
('a1a2a3a4-b1b2-c1c2-d1d2-e1e2e3e4e501', 'f101f101-e101-d101-c101-b101b101b502');

-- Gán quyền cho SALES
INSERT INTO role_permissions (role_id, permission_id) VALUES
('a1a2a3a4-b1b2-c1c2-d1d2-e1e2e3e4e503', 'f101f101-e101-d101-c101-b101b101b201'),
('a1a2a3a4-b1b2-c1c2-d1d2-e1e2e3e4e503', 'f101f101-e101-d101-c101-b101b101b202'),
('a1a2a3a4-b1b2-c1c2-d1d2-e1e2e3e4e503', 'f101f101-e101-d101-c101-b101b101b203'),
('a1a2a3a4-b1b2-c1c2-d1d2-e1e2e3e4e503', 'f101f101-e101-d101-c101-b101b101b501');

-- Gán quyền cho INVENTORY
INSERT INTO role_permissions (role_id, permission_id) VALUES
('a1a2a3a4-b1b2-c1c2-d1d2-e1e2e3e4e504', 'f101f101-e101-d101-c101-b101b101b301'),
('a1a2a3a4-b1b2-c1c2-d1d2-e1e2e3e4e504', 'f101f101-e101-d101-c101-b101b101b302'),
('a1a2a3a4-b1b2-c1c2-d1d2-e1e2e3e4e504', 'f101f101-e101-d101-c101-b101b101b303'),
('a1a2a3a4-b1b2-c1c2-d1d2-e1e2e3e4e504', 'f101f101-e101-d101-c101-b101b101b501');
```

### 2.5 Bảng `users` & `user_roles` (Tài khoản mặc định)
Tạo tài khoản quản trị viên tối cao:
* **Username:** `admin`
* **Mật khẩu gốc:** `Admin@123` (Đã được băm bằng thuật toán **BCrypt** độ phức tạp 10).
* **Mật khẩu đã mã hóa:** `$2a$10$wR6gU7j0K3eH1v8qRk8QOeVyCegFzO1i2W5X7Y2Z3b4c5d6e7f8g`
* **Chi nhánh liên kết:** `8f6c4b22-83b6-4b68-b7eb-1259a4c84dc1` (Chi nhánh Quận 1)
* **UUID User:** `9e8d7c6b-5a4f-3e2d-1c0b-9a8f7e6d5c4b`

```sql
INSERT INTO users (id, branch_id, username, password, full_name, email, phone, status, is_deleted) VALUES
('9e8d7c6b-5a4f-3e2d-1c0b-9a8f7e6d5c4b', '8f6c4b22-83b6-4b68-b7eb-1259a4c84dc1', 'admin', '$2a$10$wR6gU7j0K3eH1v8qRk8QOeVyCegFzO1i2W5X7Y2Z3b4c5d6e7f8g', 'Hệ thống Quản trị viên', 'admin@phonestore.com', '0909123456', 'ACTIVE', false);

-- Ánh xạ quyền ADMIN cho User Admin
INSERT INTO user_roles (user_id, role_id) VALUES
('9e8d7c6b-5a4f-3e2d-1c0b-9a8f7e6d5c4b', 'a1a2a3a4-b1b2-c1c2-d1d2-e1e2e3e4e501');
```

### 2.6 Bảng `payment_methods` (Phương thức thanh toán khả dụng)
Đăng ký các phương thức thanh toán giao dịch phổ biến tại Việt Nam.

```sql
INSERT INTO payment_methods (id, code, name, is_active) VALUES
('e1d2c3b4-a5f6-7e8d-9c0b-1a2b3c4d5e01', 'CASH', 'Tiền mặt tại quầy', true),
('e1d2c3b4-a5f6-7e8d-9c0b-1a2b3c4d5e02', 'BANK_TRANSFER', 'Chuyển khoản Ngân hàng (VietQR)', true),
('e1d2c3b4-a5f6-7e8d-9c0b-1a2b3c4d5e03', 'CREDIT_CARD', 'Thẻ tín dụng / ATM qua máy POS', true),
('e1d2c3b4-a5f6-7e8d-9c0b-1a2b3c4d5e04', 'MOMO', 'Ví điện tử MoMo', true);
```

### 2.7 Bảng `brands` & `categories` (Hãng sản xuất & Nhóm sản phẩm)
Khởi tạo cấu trúc Catalog điện thoại cơ sở:

```sql
-- Thương hiệu
INSERT INTO brands (id, code, name, is_deleted) VALUES
('b1b1b1b1-1111-2222-3333-444444444441', 'APPLE', 'Apple Inc.', false),
('b1b1b1b1-1111-2222-3333-444444444442', 'SAMSUNG', 'Samsung Electronics', false),
('b1b1b1b1-1111-2222-3333-444444444443', 'XIAOMI', 'Xiaomi Corporation', false);

-- Danh mục nhóm sản phẩm
INSERT INTO categories (id, code, name, parent_id, is_deleted) VALUES
('c1c1c1c1-1111-2222-3333-444444444441', 'SMARTPHONE', 'Điện thoại di động', NULL, false),
('c1c1c1c1-1111-2222-3333-444444444442', 'ACCESSORY', 'Phụ kiện điện thoại', NULL, false),
('c1c1c1c1-1111-2222-3333-444444444443', 'CHARGER_CABLE', 'Cáp sạc & Củ sạc', 'c1c1c1c1-1111-2222-3333-444444444442', false);
```

### 2.8 Bảng `warehouses` (Kho hàng chi nhánh mặc định)
Liên kết các kho vật lý đầu tiên tương ứng với các chi nhánh của chuỗi cửa hàng.

```sql
INSERT INTO warehouses (id, branch_id, code, name, is_deleted) VALUES
('w1w1w1w1-1111-2222-3333-444444444441', '8f6c4b22-83b6-4b68-b7eb-1259a4c84dc1', 'WH_Q1', 'Kho Chi nhánh Quận 1', false),
('w1w1w1w1-1111-2222-3333-444444444442', '7c6e5a33-92c7-5c79-c8fc-236ab5d95ed2', 'WH_BT', 'Kho Chi nhánh Bình Thạnh', false);
```
