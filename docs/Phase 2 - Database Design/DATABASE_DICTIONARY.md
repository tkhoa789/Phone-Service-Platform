# DATABASE DICTIONARY

## Hệ thống quản lý chuỗi cửa hàng điện thoại tích hợp AI Assistant

**Version:** 1.0
**Database System:** Microsoft SQL Server 2022 (EF Core 10, T-SQL) & Qdrant 1.12.0 (Vector DB)
**Phase:** 2 - Database Design

---

## 1. Authentication & Authorization Domain

### 1.1 Bảng `roles` (Vai trò)
Lưu thông tin các vai trò trong hệ thống (e.g. OWNER, ADMIN, MANAGER, SALES, INVENTORY, TECHNICIAN, WARRANTY - 7 Canonical Roles).

| Tên cột | Kiểu dữ liệu | Nullable | Khóa | Mặc định | Mô tả |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | UUID | NO | PK | `uuid_generate_v4()` | Khóa chính |
| `name` | VARCHAR(50) | NO | UK | - | Tên vai trò (viết hoa, duy nhất) |
| `description` | VARCHAR(255) | YES | - | - | Mô tả vai trò |
| `is_deleted` | BOOLEAN | NO | - | `false` | Đánh dấu xóa mềm |
| `created_at` | TIMESTAMP | NO | - | `CURRENT_TIMESTAMP` | Thời gian tạo |
| `updated_at` | TIMESTAMP | NO | - | `CURRENT_TIMESTAMP` | Thời gian cập nhật |

### 1.2 Bảng `permissions` (Quyền hạn)
Lưu trữ chi tiết các quyền hạn thao tác (e.g. `USER_CREATE`, `SALES_CREATE`, `INVENTORY_VIEW`).

| Tên cột | Kiểu dữ liệu | Nullable | Khóa | Mặc định | Mô tả |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | UUID | NO | PK | `uuid_generate_v4()` | Khóa chính |
| `code` | VARCHAR(50) | NO | UK | - | Mã quyền hạn (duy nhất) |
| `name` | VARCHAR(100) | NO | - | - | Tên quyền hiển thị |
| `module` | VARCHAR(50) | NO | - | - | Phân nhóm chức năng (module) |
| `is_deleted` | BOOLEAN | NO | - | `false` | Đánh dấu xóa mềm |
| `created_at` | TIMESTAMP | NO | - | `CURRENT_TIMESTAMP` | Thời gian tạo |
| `updated_at` | TIMESTAMP | NO | - | `CURRENT_TIMESTAMP` | Thời gian cập nhật |

### 1.3 Bảng `role_permissions` (Ánh xạ Vai trò - Quyền)
Liên kết n-n giữa bảng `roles` và `permissions`.

| Tên cột | Kiểu dữ liệu | Nullable | Khóa | Mặc định | Mô tả |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `role_id` | UUID | NO | PK, FK | - | Liên kết tới `roles(id)` |
| `permission_id` | UUID | NO | PK, FK | - | Liên kết tới `permissions(id)` |
| `created_at` | TIMESTAMP | NO | - | `CURRENT_TIMESTAMP` | Thời gian gán quyền |

### 1.4 Bảng `user_roles` (Ánh xạ Nhân viên - Vai trò)
Liên kết n-n giữa bảng `users` và `roles`.

| Tên cột | Kiểu dữ liệu | Nullable | Khóa | Mặc định | Mô tả |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `user_id` | UUID | NO | PK, FK | - | Liên kết tới `users(id)` |
| `role_id` | UUID | NO | PK, FK | - | Liên kết tới `roles(id)` |
| `created_at` | TIMESTAMP | NO | - | `CURRENT_TIMESTAMP` | Thời gian gán vai trò |

### 1.5 Bảng `refresh_tokens` (Refresh Token bảo mật)
Quản lý vòng đời Refresh Token để cấp lại JWT.

| Tên cột | Kiểu dữ liệu | Nullable | Khóa | Mặc định | Mô tả |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | UUID | NO | PK | `uuid_generate_v4()` | Khóa chính |
| `user_id` | UUID | NO | FK | - | Liên kết tới `users(id)` |
| `token` | VARCHAR(255) | NO | UK | - | Mã token duy nhất |
| `expiry_date` | TIMESTAMP | NO | - | - | Thời gian hết hạn |
| `revoked` | BOOLEAN | NO | - | `false` | Trạng thái bị vô hiệu hóa |
| `created_at` | TIMESTAMP | NO | - | `CURRENT_TIMESTAMP` | Thời gian phát hành |

### 1.6 Bảng `login_histories` (Lịch sử đăng nhập)
Theo dõi nhật ký đăng nhập của nhân sự phục vụ bảo mật hệ thống.

| Tên cột | Kiểu dữ liệu | Nullable | Khóa | Mặc định | Mô tả |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | UUID | NO | PK | `uuid_generate_v4()` | Khóa chính |
| `user_id` | UUID | NO | FK | - | Liên kết tới `users(id)` |
| `ip_address` | VARCHAR(45) | YES | - | - | Địa chỉ IP (hỗ trợ IPv4/IPv6) |
| `user_agent` | VARCHAR(255) | YES | - | - | Thông tin trình duyệt/OS |
| `status` | VARCHAR(20) | NO | - | - | Trạng thái (SUCCESS, FAILED) |
| `created_at` | TIMESTAMP | NO | - | `CURRENT_TIMESTAMP` | Thời gian đăng nhập |

---

## 2. User & Branch Management Domain

### 2.1 Bảng `branches` (Chi nhánh cửa hàng)
Lưu thông tin các chi nhánh trong chuỗi cửa hàng điện thoại.

| Tên cột | Kiểu dữ liệu | Nullable | Khóa | Mặc định | Mô tả |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | UUID | NO | PK | `uuid_generate_v4()` | Khóa chính |
| `code` | VARCHAR(30) | NO | UK | - | Mã chi nhánh (duy nhất) |
| `name` | VARCHAR(100) | NO | - | - | Tên chi nhánh |
| `address` | VARCHAR(255) | NO | - | - | Địa chỉ chi nhánh |
| `phone` | VARCHAR(15) | NO | - | - | Số điện thoại liên hệ |
| `email` | VARCHAR(100) | YES | - | - | Email chi nhánh |
| `status` | VARCHAR(20) | NO | - | `'ACTIVE'` | Trạng thái hoạt động |
| `is_deleted` | BOOLEAN | NO | - | `false` | Đánh dấu xóa mềm |
| `created_at` | TIMESTAMP | NO | - | `CURRENT_TIMESTAMP` | Thời gian tạo |
| `updated_at` | TIMESTAMP | NO | - | `CURRENT_TIMESTAMP` | Thời gian cập nhật |

### 2.2 Bảng `users` (Nhân viên hệ thống)
Lưu thông tin hồ sơ của nhân sự, thuộc một chi nhánh cụ thể.

| Tên cột | Kiểu dữ liệu | Nullable | Khóa | Mặc định | Mô tả |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | UUID | NO | PK | `uuid_generate_v4()` | Khóa chính |
| `branch_id` | UUID | NO | FK | - | Chi nhánh làm việc chính, link `branches(id)` |
| `username` | VARCHAR(50) | NO | UK | - | Tên đăng nhập |
| `password` | VARCHAR(100) | NO | - | - | Mật khẩu (đã mã hóa) |
| `full_name` | VARCHAR(100) | NO | - | - | Họ và tên nhân viên |
| `email` | VARCHAR(100) | NO | UK | - | Email cá nhân |
| `phone` | VARCHAR(15) | NO | UK | - | Số điện thoại |
| `status` | VARCHAR(20) | NO | - | `'ACTIVE'` | Trạng thái tài khoản (ACTIVE, LOCKED) |
| `is_deleted` | BOOLEAN | NO | - | `false` | Đánh dấu xóa mềm |
| `created_at` | TIMESTAMP | NO | - | `CURRENT_TIMESTAMP` | Thời gian tạo |
| `updated_at` | TIMESTAMP | NO | - | `CURRENT_TIMESTAMP` | Thời gian cập nhật |

---

## 3. Product Catalog Domain

### 3.1 Bảng `brands` (Thương hiệu)
Lưu thông tin thương hiệu điện thoại (e.g. Apple, Samsung, Xiaomi).

| Tên cột | Kiểu dữ liệu | Nullable | Khóa | Mặc định | Mô tả |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | UUID | NO | PK | `uuid_generate_v4()` | Khóa chính |
| `code` | VARCHAR(30) | NO | UK | - | Mã hãng sản xuất (duy nhất) |
| `name` | VARCHAR(100) | NO | - | - | Tên hãng thương hiệu |
| `is_deleted` | BOOLEAN | NO | - | `false` | Đánh dấu xóa mềm |
| `created_at` | TIMESTAMP | NO | - | `CURRENT_TIMESTAMP` | Thời gian tạo |
| `updated_at` | TIMESTAMP | NO | - | `CURRENT_TIMESTAMP` | Thời gian cập nhật |

### 3.2 Bảng `categories` (Danh mục)
Lưu phân nhóm sản phẩm (hỗ trợ phân cấp cha-con, e.g. SmartPhone, Phụ kiện -> Sạc cáp).

| Tên cột | Kiểu dữ liệu | Nullable | Khóa | Mặc định | Mô tả |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | UUID | NO | PK | `uuid_generate_v4()` | Khóa chính |
| `code` | VARCHAR(30) | NO | UK | - | Mã danh mục (duy nhất) |
| `name` | VARCHAR(100) | NO | - | - | Tên danh mục |
| `parent_id` | UUID | YES | FK | - | Danh mục cha, tự liên kết tới `categories(id)` |
| `is_deleted` | BOOLEAN | NO | - | `false` | Đánh dấu xóa mềm |
| `created_at` | TIMESTAMP | NO | - | `CURRENT_TIMESTAMP` | Thời gian tạo |
| `updated_at` | TIMESTAMP | NO | - | `CURRENT_TIMESTAMP` | Thời gian cập nhật |

### 3.3 Bảng `products` (Dòng sản phẩm)
Khái niệm chung về dòng sản phẩm (e.g. iPhone 15 Pro Max, Samsung Galaxy S24 Ultra).

| Tên cột | Kiểu dữ liệu | Nullable | Khóa | Mặc định | Mô tả |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | UUID | NO | PK | `uuid_generate_v4()` | Khóa chính |
| `category_id` | UUID | NO | FK | - | Nhóm sản phẩm, liên kết `categories(id)` |
| `brand_id` | UUID | NO | FK | - | Hãng thương hiệu, liên kết `brands(id)` |
| `code` | VARCHAR(50) | NO | UK | - | Mã sản phẩm (duy nhất) |
| `name` | VARCHAR(150) | NO | - | - | Tên dòng sản phẩm |
| `description` | TEXT | YES | - | - | Thông tin chi tiết/thông số kỹ thuật |
| `is_deleted` | BOOLEAN | NO | - | `false` | Đánh dấu xóa mềm |
| `created_at` | TIMESTAMP | NO | - | `CURRENT_TIMESTAMP` | Thời gian tạo |
| `updated_at` | TIMESTAMP | NO | - | `CURRENT_TIMESTAMP` | Thời gian cập nhật |

### 3.4 Bảng `product_variants` (Biến thể sản phẩm)
Chi tiết cấu hình màu sắc, dung lượng và giá bán của biến thể sản phẩm (e.g. iPhone 15 Pro Max - 256GB - Titan Tự nhiên).

| Tên cột | Kiểu dữ liệu | Nullable | Khóa | Mặc định | Mô tả |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | UUID | NO | PK | `uuid_generate_v4()` | Khóa chính |
| `product_id` | UUID | NO | FK | - | Dòng sản phẩm cha, liên kết `products(id)` |
| `sku` | VARCHAR(50) | NO | UK | - | Mã Stock Keeping Unit (duy nhất) |
| `name` | VARCHAR(255) | NO | - | - | Tên biến thể đầy đủ |
| `color` | VARCHAR(50) | YES | - | - | Màu sắc sản phẩm |
| `capacity` | VARCHAR(30) | YES | - | - | Dung lượng bộ nhớ (e.g. 128GB, 256GB) |
| `cost_price` | DECIMAL(15,2) | NO | - | `0.00` | Giá nhập gốc |
| `sale_price` | DECIMAL(15,2) | NO | - | `0.00` | Giá bán lẻ niêm yết |
| `is_deleted` | BOOLEAN | NO | - | `false` | Đánh dấu xóa mềm |
| `created_at` | TIMESTAMP | NO | - | `CURRENT_TIMESTAMP` | Thời gian tạo |
| `updated_at` | TIMESTAMP | NO | - | `CURRENT_TIMESTAMP` | Thời gian cập nhật |

---

## 4. Inventory Management Domain

### 4.1 Bảng `warehouses` (Kho hàng)
Địa điểm lưu trữ hàng hóa vật lý thuộc về một chi nhánh cửa hàng.

| Tên cột | Kiểu dữ liệu | Nullable | Khóa | Mặc định | Mô tả |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | UUID | NO | PK | `uuid_generate_v4()` | Khóa chính |
| `branch_id` | UUID | NO | FK | - | Thuộc chi nhánh nào, liên kết `branches(id)` |
| `code` | VARCHAR(30) | NO | UK | - | Mã kho hàng (duy nhất) |
| `name` | VARCHAR(100) | NO | - | - | Tên kho hàng |
| `is_deleted` | BOOLEAN | NO | - | `false` | Đánh dấu xóa mềm |
| `created_at` | TIMESTAMP | NO | - | `CURRENT_TIMESTAMP` | Thời gian tạo |
| `updated_at` | TIMESTAMP | NO | - | `CURRENT_TIMESTAMP` | Thời gian cập nhật |

### 4.2 Bảng `inventories` (Số lượng tồn kho)
Thống kê số lượng tồn kho khả dụng của biến thể sản phẩm tại từng kho.

| Tên cột | Kiểu dữ liệu | Nullable | Khóa | Mặc định | Mô tả |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | UUID | NO | PK | `uuid_generate_v4()` | Khóa chính |
| `warehouse_id` | UUID | NO | FK | - | Liên kết tới `warehouses(id)` |
| `product_variant_id` | UUID | NO | FK | - | Liên kết tới `product_variants(id)` |
| `quantity` | INTEGER | NO | - | `0` | Số lượng tồn kho hiện tại (không âm) |
| `minimum_stock` | INTEGER | NO | - | `5` | Định mức tồn kho tối thiểu để cảnh báo |
| `updated_at` | TIMESTAMP | NO | - | `CURRENT_TIMESTAMP` | Thời gian cập nhật cuối |

### 4.3 Bảng `inventory_transactions` (Lịch sử giao dịch kho)
Nhật ký chi tiết các lần thay đổi số lượng tồn kho (nhập, xuất, kiểm kho, hoàn trả).

| Tên cột | Kiểu dữ liệu | Nullable | Khóa | Mặc định | Mô tả |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | UUID | NO | PK | `uuid_generate_v4()` | Khóa chính |
| `warehouse_id` | UUID | NO | FK | - | Liên kết tới `warehouses(id)` |
| `product_variant_id` | UUID | NO | FK | - | Liên kết tới `product_variants(id)` |
| `transaction_type` | VARCHAR(20) | NO | - | - | Loại thay đổi (IMPORT, EXPORT, TRANSFER, ADJUST) |
| `reference_id` | UUID | YES | - | - | Khóa ngoại của chứng từ phát sinh (e.g. hóa đơn, phiếu nhập) |
| `quantity_changed` | INTEGER | NO | - | - | Số lượng thay đổi (dương khi nhập, âm khi xuất) |
| `note` | VARCHAR(255) | YES | - | - | Ghi chú thêm |
| `created_at` | TIMESTAMP | NO | - | `CURRENT_TIMESTAMP` | Thời gian thực hiện |

### 4.4 Bảng `warehouse_transfers` (Phiếu chuyển kho)
Yêu cầu điều chuyển hàng hóa giữa các kho trong cùng hệ thống.

| Tên cột | Kiểu dữ liệu | Nullable | Khóa | Mặc định | Mô tả |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | UUID | NO | PK | `uuid_generate_v4()` | Khóa chính |
| `from_warehouse_id` | UUID | NO | FK | - | Kho nguồn, liên kết `warehouses(id)` |
| `to_warehouse_id` | UUID | NO | FK | - | Kho đích, liên kết `warehouses(id)` |
| `code` | VARCHAR(50) | NO | UK | - | Mã chuyển kho duy nhất |
| `status` | VARCHAR(20) | NO | - | `'PENDING'` | Trạng thái (PENDING, SHIPPING, COMPLETED, CANCELLED) |
| `created_at` | TIMESTAMP | NO | - | `CURRENT_TIMESTAMP` | Thời gian lập phiếu |
| `updated_at` | TIMESTAMP | NO | - | `CURRENT_TIMESTAMP` | Thời gian cập nhật trạng thái |

### 4.5 Bảng `warehouse_transfer_items` (Chi tiết chuyển kho)
Danh sách số lượng các sản phẩm cần điều chuyển trong một phiếu.

| Tên cột | Kiểu dữ liệu | Nullable | Khóa | Mặc định | Mô tả |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | UUID | NO | PK | `uuid_generate_v4()` | Khóa chính |
| `transfer_id` | UUID | NO | FK | - | Phiếu điều chuyển cha, link `warehouse_transfers(id)` |
| `product_variant_id` | UUID | NO | FK | - | Sản phẩm điều chuyển, link `product_variants(id)` |
| `quantity` | INTEGER | NO | - | - | Số lượng cần chuyển (bắt buộc > 0) |

### 4.6 Bảng `stock_takes` (Phiếu kiểm kho)
Yêu cầu kiểm tra, đối chiếu số liệu kho thực tế và trên phần mềm.

| Tên cột | Kiểu dữ liệu | Nullable | Khóa | Mặc định | Mô tả |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | UUID | NO | PK | `uuid_generate_v4()` | Khóa chính |
| `warehouse_id` | UUID | NO | FK | - | Kiểm tra tại kho nào, liên kết `warehouses(id)` |
| `code` | VARCHAR(50) | NO | UK | - | Mã phiếu kiểm kho duy nhất |
| `status` | VARCHAR(20) | NO | - | `'DRAFT'` | Trạng thái (DRAFT, CONFIRMED, ADJUSTED) |
| `created_at` | TIMESTAMP | NO | - | `CURRENT_TIMESTAMP` | Thời gian lập phiếu |
| `updated_at` | TIMESTAMP | NO | - | `CURRENT_TIMESTAMP` | Thời gian cân bằng kho |

### 4.7 Bảng `stock_take_items` (Chi tiết kiểm kho)
Chi tiết đối chiếu số lượng của từng mặt hàng khi kiểm kho.

| Tên cột | Kiểu dữ liệu | Nullable | Khóa | Mặc định | Mô tả |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | UUID | NO | PK | `uuid_generate_v4()` | Khóa chính |
| `stock_take_id` | UUID | NO | FK | - | Lớp cha, liên kết `stock_takes(id)` |
| `product_variant_id` | UUID | NO | FK | - | Biến thể được kiểm, liên kết `product_variants(id)` |
| `system_quantity` | INTEGER | NO | - | - | Số lượng tồn trên phần mềm |
| `actual_quantity` | INTEGER | NO | - | - | Số lượng thực tế đo đếm |
| `difference` | INTEGER | NO | - | - | Chênh lệch (Số thực tế - Số phần mềm) |
| `note` | VARCHAR(255) | YES | - | - | Lý do chênh lệch hoặc tình trạng chất lượng sản phẩm |

### 4.8 Bảng `imeis` (Danh sách định danh IMEI điện thoại)
Lưu vết số định danh của từng thiết bị cụ thể. Mỗi thiết bị là duy nhất.

| Tên cột | Kiểu dữ liệu | Nullable | Khóa | Mặc định | Mô tả |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `imei` | VARCHAR(18) | NO | PK | - | Mã số IMEI (định danh vật lý duy nhất) |
| `product_variant_id` | UUID | NO | FK | - | Phiên bản dòng máy, liên kết `product_variants(id)` |
| `warehouse_id` | UUID | NO | FK | - | Vị trí kho lưu trữ hiện tại, liên kết `warehouses(id)` |
| `status` | VARCHAR(20) | NO | - | `'IN_STOCK'` | Trạng thái (IN_STOCK, SOLD, REPAIRING, WARRANTY_HOLD) |
| `created_at` | TIMESTAMP | NO | - | `CURRENT_TIMESTAMP` | Ngày khai báo hoặc nhập kho |
| `updated_at` | TIMESTAMP | NO | - | `CURRENT_TIMESTAMP` | Ngày cập nhật trạng thái gần nhất |

---

## 5. Supplier & Purchase Management Domain

### 5.1 Bảng `suppliers` (Nhà cung cấp)
Lưu thông tin các đơn vị cung cấp thiết bị và linh kiện.

| Tên cột | Kiểu dữ liệu | Nullable | Khóa | Mặc định | Mô tả |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | UUID | NO | PK | `uuid_generate_v4()` | Khóa chính |
| `code` | VARCHAR(30) | NO | UK | - | Mã nhà cung cấp (duy nhất) |
| `name` | VARCHAR(150) | NO | - | - | Tên nhà cung cấp |
| `phone` | VARCHAR(15) | NO | - | - | Điện thoại |
| `email` | VARCHAR(100) | YES | - | - | Email liên lạc |
| `address` | VARCHAR(255) | YES | - | - | Địa chỉ trụ sở |
| `tax_code` | VARCHAR(50) | YES | - | - | Mã số thuế công ty |
| `debt_amount` | DECIMAL(18,2) | NO | - | `0.00` | Số tiền nợ phải trả hiện tại |
| `credit_limit` | DECIMAL(18,2) | NO | - | `500000000.00` | Hạn mức nợ tối đa được nợ |
| `payment_terms_days` | INTEGER | NO | - | `30` | Thời hạn nợ thanh toán (số ngày) |
| `is_deleted` | BOOLEAN | NO | - | `false` | Đánh dấu xóa mềm |
| `created_at` | TIMESTAMP | NO | - | `CURRENT_TIMESTAMP` | Thời gian tạo |
| `updated_at` | TIMESTAMP | NO | - | `CURRENT_TIMESTAMP` | Thời gian cập nhật |

### 5.2 Bảng `purchase_orders` (Đơn nhập hàng)
Phiếu nhập hàng hóa từ nhà cung cấp về một kho của hệ thống.

| Tên cột | Kiểu dữ liệu | Nullable | Khóa | Mặc định | Mô tả |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | UUID | NO | PK | `uuid_generate_v4()` | Khóa chính |
| `supplier_id` | UUID | NO | FK | - | Nhà cung cấp xuất hàng, liên kết `suppliers(id)` |
| `warehouse_id` | UUID | NO | FK | - | Kho tiếp nhận hàng, liên kết `warehouses(id)` |
| `code` | VARCHAR(50) | NO | UK | - | Mã phiếu nhập hàng (duy nhất) |
| `status` | VARCHAR(20) | NO | - | `'PENDING'` | Trạng thái (PENDING, APPROVED, COMPLETED, CANCELLED) |
| `total_amount` | DECIMAL(15,2) | NO | - | `0.00` | Tổng giá trị của phiếu nhập hàng |
| `created_at` | TIMESTAMP | NO | - | `CURRENT_TIMESTAMP` | Ngày lập phiếu |
| `updated_at` | TIMESTAMP | NO | - | `CURRENT_TIMESTAMP` | Ngày cập nhật |

### 5.3 Bảng `purchase_order_items` (Chi tiết đơn nhập hàng)
Chi tiết số lượng và giá nhập của các mặt hàng trong đơn nhập hàng.

| Tên cột | Kiểu dữ liệu | Nullable | Khóa | Mặc định | Mô tả |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | UUID | NO | PK | `uuid_generate_v4()` | Khóa chính |
| `purchase_order_id` | UUID | NO | FK | - | Lớp cha, liên kết `purchase_orders(id)` |
| `product_variant_id` | UUID | NO | FK | - | Biến thể sản phẩm, liên kết `product_variants(id)` |
| `quantity` | INTEGER | NO | - | - | Số lượng nhập khẩu |
| `unit_price` | DECIMAL(15,2) | NO | - | - | Giá trị nhập một sản phẩm |

### 5.4 Bảng `supplier_debt_transactions` (Sổ nhật ký giao dịch công nợ Nhà cung cấp)
Ghi nhận toàn bộ biến động tăng/giảm công nợ AP của từng Nhà cung cấp.

| Tên cột | Kiểu dữ liệu | Nullable | Khóa | Mặc định | Mô tả |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | UUID | NO | PK | `uuid_generate_v4()` | Khóa chính |
| `supplier_id` | UUID | NO | FK | - | Thuộc Nhà cung cấp nào, liên kết `suppliers(id)` |
| `transaction_type` | VARCHAR(30) | NO | - | `'PAYMENT'` | Loại giao dịch (`INVOICE`, `PAYMENT`, `DEBIT_NOTE`) |
| `amount` | DECIMAL(18,2) | NO | - | `0.00` | Số tiền phát sinh (tăng hoặc giảm nợ) |
| `balance_after` | DECIMAL(18,2) | NO | - | `0.00` | Số dư nợ dồn lũy kế ngay sau giao dịch |
| `reference_no` | VARCHAR(50) | YES | - | - | Mã số chứng từ đối ứng (GRN-XXXX, PAY-XXXX) |
| `payment_method` | VARCHAR(30) | YES | - | - | Phương thức thanh toán (CASH, VIETQR, BANK_TRANSFER) |
| `note` | VARCHAR(500) | YES | - | - | Ghi chú nội dung chi / lý do trừ nợ |
| `created_at` | TIMESTAMP | NO | - | `CURRENT_TIMESTAMP` | Thời điểm phát sinh giao dịch |

---

## 6. Customer & Sales Management Domain

### 6.1 Bảng `customers` (Khách hàng)
Hồ sơ thông tin khách hàng mua sản phẩm hoặc yêu cầu dịch vụ bảo hành/sửa chữa.

| Tên cột | Kiểu dữ liệu | Nullable | Khóa | Mặc định | Mô tả |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | UUID | NO | PK | `uuid_generate_v4()` | Khóa chính |
| `code` | VARCHAR(30) | NO | UK | - | Mã khách hàng tự sinh (duy nhất) |
| `full_name` | VARCHAR(100) | NO | - | - | Họ và tên khách hàng |
| `phone` | VARCHAR(15) | NO | UK | - | Số điện thoại liên lạc chính (định danh duy nhất) |
| `email` | VARCHAR(100) | YES | - | - | Địa chỉ email |
| `address` | VARCHAR(255) | YES | - | - | Địa chỉ liên lạc |
| `reward_points` | INTEGER | NO | - | `0` | Tổng điểm thưởng CRM tích lũy |
| `total_spent` | DECIMAL(15,2) | NO | - | `0.00` | Tổng doanh số chi tiêu tích lũy của khách hàng |
| `member_tier` | VARCHAR(20) | NO | - | `'BRONZE'` | Hạng thành viên (BRONZE, SILVER, GOLD, DIAMOND) |
| `is_deleted` | BOOLEAN | NO | - | `false` | Đánh dấu xóa mềm |
| `created_at` | TIMESTAMP | NO | - | `CURRENT_TIMESTAMP` | Thời gian tạo hồ sơ |
| `updated_at` | TIMESTAMP | NO | - | `CURRENT_TIMESTAMP` | Thời gian cập nhật |

### 6.2 Bảng `sales_orders` (Đơn hàng bán lẻ)
Thông tin giao dịch bán lẻ lập tại quầy hoặc thông qua POS.

| Tên cột | Kiểu dữ liệu | Nullable | Khóa | Mặc định | Mô tả |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | UUID | NO | PK | `uuid_generate_v4()` | Khóa chính |
| `customer_id` | UUID | NO | FK | - | Khách hàng mua hàng, liên kết `customers(id)` |
| `user_id` | UUID | NO | FK | - | Nhân viên thực hiện giao dịch, liên kết `users(id)` |
| `branch_id` | UUID | NO | FK | - | Nơi phát sinh giao dịch, liên kết `branches(id)` |
| `voucher_id` | UUID | YES | FK | - | Mã giảm giá áp dụng, liên kết `vouchers(id)` |
| `code` | VARCHAR(50) | NO | UK | - | Mã giao dịch bán hàng (duy nhất) |
| `status` | VARCHAR(20) | NO | - | `'PENDING'` | Trạng thái (PENDING, PAID, CANCELLED) |
| `subtotal` | DECIMAL(15,2) | NO | - | `0.00` | Tổng giá bán gốc trước chiết khấu |
| `discount` | DECIMAL(15,2) | NO | - | `0.00` | Số tiền được giảm giá |
| `total` | DECIMAL(15,2) | NO | - | `0.00` | Số tiền thực thu của đơn hàng |
| `created_at` | TIMESTAMP | NO | - | `CURRENT_TIMESTAMP` | Thời gian tạo giao dịch |
| `updated_at` | TIMESTAMP | NO | - | `CURRENT_TIMESTAMP` | Thời gian cập nhật trạng thái |

### 6.3 Bảng `sales_order_items` (Chi tiết đơn hàng)
Danh sách các dòng sản phẩm và cụ thể các mã IMEI được bán ra.

| Tên cột | Kiểu dữ liệu | Nullable | Khóa | Mặc định | Mô tả |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | UUID | NO | PK | `uuid_generate_v4()` | Khóa chính |
| `sales_order_id` | UUID | NO | FK | - | Thuộc đơn hàng nào, liên kết `sales_orders(id)` |
| `product_variant_id` | UUID | NO | FK | - | Bản máy sản phẩm, liên kết `product_variants(id)` |
| `imei` | VARCHAR(18) | YES | FK | - | Gắn với IMEI máy nếu là điện thoại, link `imeis(imei)` |
| `quantity` | INTEGER | NO | - | `1` | Số lượng hàng bán (bắt buộc > 0) |
| `unit_price` | DECIMAL(15,2) | NO | - | - | Giá bán thực tế tại thời điểm giao dịch |
| `discount` | DECIMAL(15,2) | NO | - | `0.00` | Chiết khấu trực tiếp trên sản phẩm |

---

## 7. Invoice & Payment Domain

### 7.1 Bảng `invoices` (Hóa đơn tài chính)
Chứng từ hóa đơn pháp lý ghi nhận sau khi đơn hàng được bán.

| Tên cột | Kiểu dữ liệu | Nullable | Khóa | Mặc định | Mô tả |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | UUID | NO | PK | `uuid_generate_v4()` | Khóa chính |
| `sales_order_id` | UUID | YES | FK | - | Liên kết đơn hàng nguồn, `sales_orders(id)` |
| `repair_ticket_id` | UUID | YES | FK | - | Liên kết phiếu sửa chữa nguồn, `repair_tickets(id)` |
| `code` | VARCHAR(50) | NO | UK | - | Số hóa đơn tài chính (duy nhất) |
| `status` | VARCHAR(20) | NO | - | `'UNPAID'` | Trạng thái thanh toán (UNPAID, PAID, REFUNDED) |
| `amount` | DECIMAL(15,2) | NO | - | `0.00` | Tổng giá trị thanh toán hóa đơn |
| `created_at` | TIMESTAMP | NO | - | `CURRENT_TIMESTAMP` | Ngày tạo hóa đơn |
| `updated_at` | TIMESTAMP | NO | - | `CURRENT_TIMESTAMP` | Ngày cập nhật |

### 7.2 Bảng `invoice_items` (Chi tiết hóa đơn)
Lưu thông tin kê khai chi tiết các mặt hàng để in hóa đơn giao cho khách.

| Tên cột | Kiểu dữ liệu | Nullable | Khóa | Mặc định | Mô tả |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | UUID | NO | PK | `uuid_generate_v4()` | Khóa chính |
| `invoice_id` | UUID | NO | FK | - | Thuộc hóa đơn nào, liên kết `invoices(id)` |
| `product_variant_id` | UUID | NO | FK | - | Biến thể sản phẩm, liên kết `product_variants(id)` |
| `quantity` | INTEGER | NO | - | - | Số lượng |
| `unit_price` | DECIMAL(15,2) | NO | - | - | Đơn giá in hóa đơn |

### 7.3 Bảng `payment_methods` (Phương thức thanh toán)
Các phương án hỗ trợ trả tiền (CASH, BANK_TRANSFER, CREDIT_CARD, MOMO).

| Tên cột | Kiểu dữ liệu | Nullable | Khóa | Mặc định | Mô tả |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | UUID | NO | PK | `uuid_generate_v4()` | Khóa chính |
| `code` | VARCHAR(20) | NO | UK | - | Mã phương thức (duy nhất) |
| `name` | VARCHAR(100) | NO | - | - | Tên hiển thị phương thức |
| `is_active` | BOOLEAN | NO | - | `true` | Trạng thái khả dụng |
| `created_at` | TIMESTAMP | NO | - | `CURRENT_TIMESTAMP` | Thời gian tạo |
| `updated_at` | TIMESTAMP | NO | - | `CURRENT_TIMESTAMP` | Thời gian cập nhật |

### 7.4 Bảng `payments` (Lịch sử thanh toán thực tế)
Nhật ký chi tiết các lần nạp/chuyển tiền của khách để thanh toán hóa đơn (hỗ trợ chia nhỏ trả nhiều lần).

| Tên cột | Kiểu dữ liệu | Nullable | Khóa | Mặc định | Mô tả |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | UUID | NO | PK | `uuid_generate_v4()` | Khóa chính |
| `invoice_id` | UUID | NO | FK | - | Thuộc hóa đơn nào, liên kết `invoices(id)` |
| `payment_method_id` | UUID | NO | FK | - | Kênh thanh toán, liên kết `payment_methods(id)` |
| `code` | VARCHAR(50) | NO | UK | - | Mã giao dịch thanh toán duy nhất |
| `amount` | DECIMAL(15,2) | NO | - | `0.00` | Số tiền giao dịch |
| `status` | VARCHAR(20) | NO | - | `'PENDING'` | Trạng thái (PENDING, COMPLETED, FAILED) |
| `payment_date` | TIMESTAMP | NO | - | `CURRENT_TIMESTAMP` | Thời điểm thực hiện thanh toán |

---

## 8. Promotion Domain

### 8.1 Bảng `promotions` (Chương trình khuyến mãi)
Các sự kiện giảm giá chung chạy theo chiến dịch Marketing.

| Tên cột | Kiểu dữ liệu | Nullable | Khóa | Mặc định | Mô tả |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | UUID | NO | PK | `uuid_generate_v4()` | Khóa chính |
| `code` | VARCHAR(30) | NO | UK | - | Mã khuyến mãi (duy nhất) |
| `name` | VARCHAR(150) | NO | - | - | Tên chương trình |
| `type` | VARCHAR(20) | NO | - | - | Loại giảm giá (PERCENTAGE, DIRECT_VALUE) |
| `value` | DECIMAL(15,2) | NO | - | `0.00` | Giá trị chiết khấu (phần trăm hoặc tiền mặt) |
| `start_date` | TIMESTAMP | NO | - | - | Thời gian bắt đầu có hiệu lực |
| `end_date` | TIMESTAMP | NO | - | - | Thời gian kết thúc sự kiện |
| `is_active` | BOOLEAN | NO | - | `true` | Trạng thái thủ công kích hoạt |
| `is_deleted` | BOOLEAN | NO | - | `false` | Đánh dấu xóa mềm |
| `created_at` | TIMESTAMP | NO | - | `CURRENT_TIMESTAMP` | Thời gian tạo |
| `updated_at` | TIMESTAMP | NO | - | `CURRENT_TIMESTAMP` | Thời gian cập nhật |

### 8.2 Bảng `vouchers` (Mã giảm giá cá nhân)
Các mã coupon cụ thể được phát hành gắn với chiến dịch khuyến mãi để người mua áp dụng.

| Tên cột | Kiểu dữ liệu | Nullable | Khóa | Mặc định | Mô tả |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | UUID | NO | PK | `uuid_generate_v4()` | Khóa chính |
| `promotion_id` | UUID | NO | FK | - | Liên kết tới chiến dịch cha, `promotions(id)` |
| `code` | VARCHAR(30) | NO | UK | - | Mã voucher nhập lúc mua (e.g. VIP100K) |
| `status` | VARCHAR(20) | NO | - | `'ACTIVE'` | Trạng thái (ACTIVE, EXPIRED, OUT_OF_STOCK) |
| `discount_amount` | DECIMAL(15,2) | NO | - | `0.00` | Mức chiết khấu bằng tiền |
| `min_order_value` | DECIMAL(15,2) | NO | - | `0.00` | Giá trị đơn hàng tối thiểu để áp dụng |
| `expiry_date` | TIMESTAMP | NO | - | - | Hạn chót sử dụng |
| `usage_limit` | INTEGER | NO | - | `1` | Số lượng tối đa được phát |
| `usage_count` | INTEGER | NO | - | `0` | Số lượt đã sử dụng thực tế |
| `created_at` | TIMESTAMP | NO | - | `CURRENT_TIMESTAMP` | Thời gian tạo |
| `updated_at` | TIMESTAMP | NO | - | `CURRENT_TIMESTAMP` | Thời gian cập nhật |

---

## 9. Warranty & Repair Domain

### 9.1 Bảng `warranty_tickets` (Phiếu tiếp nhận bảo hành)
Quản lý các yêu cầu bảo hành thiết bị di động của khách hàng.

| Tên cột | Kiểu dữ liệu | Nullable | Khóa | Mặc định | Mô tả |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | UUID | NO | PK | `uuid_generate_v4()` | Khóa chính |
| `customer_id` | UUID | NO | FK | - | Khách hàng yêu cầu, link `customers(id)` |
| `sales_order_id` | UUID | NO | FK | - | Đơn hàng mua thiết bị này, link `sales_orders(id)` |
| `product_variant_id` | UUID | NO | FK | - | Bản máy cần bảo hành, link `product_variants(id)` |
| `imei` | VARCHAR(18) | NO | FK | - | Số IMEI máy cần bảo hành, link `imeis(imei)` |
| `code` | VARCHAR(50) | NO | UK | - | Mã phiếu bảo hành (duy nhất) |
| `status` | VARCHAR(20) | NO | - | `'RECEIVED'` | Trạng thái (RECEIVED, PROCESSING, COMPLETED, RETURNED) |
| `start_date` | TIMESTAMP | NO | - | `CURRENT_TIMESTAMP` | Ngày kích hoạt tiếp nhận bảo hành |
| `end_date` | TIMESTAMP | YES | - | - | Ngày hoàn thành bảo hành trả khách |
| `note` | VARCHAR(255) | YES | - | - | Ghi nhận tình trạng lỗi bên ngoài |
| `created_at` | TIMESTAMP | NO | - | `CURRENT_TIMESTAMP` | Thời gian lập phiếu |
| `updated_at` | TIMESTAMP | NO | - | `CURRENT_TIMESTAMP` | Thời gian cập nhật |

### 9.2 Bảng `warranty_histories` (Lịch sử bảo hành)
Ghi nhận tiến độ và các giai đoạn xử lý phiếu bảo hành.

| Tên cột | Kiểu dữ liệu | Nullable | Khóa | Mặc định | Mô tả |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | UUID | NO | PK | `uuid_generate_v4()` | Khóa chính |
| `warranty_ticket_id` | UUID | NO | FK | - | Phiếu bảo hành cha, link `warranty_tickets(id)` |
| `action` | VARCHAR(50) | NO | - | - | Thao tác xử lý (e.g. gửi trung tâm hãng, đổi máy mới) |
| `status` | VARCHAR(20) | NO | - | - | Trạng thái cập nhật |
| `description` | VARCHAR(255) | YES | - | - | Mô tả giải trình chi tiết |
| `created_at` | TIMESTAMP | NO | - | `CURRENT_TIMESTAMP` | Thời điểm ghi nhận |

### 9.3 Bảng `repair_tickets` (Phiếu dịch vụ sửa chữa)
Chứng từ ghi nhận thông tin nhận thiết bị của khách hàng mang tới sửa.

| Tên cột | Kiểu dữ liệu | Nullable | Khóa | Mặc định | Mô tả |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | UUID | NO | PK | `uuid_generate_v4()` | Khóa chính |
| `customer_id` | UUID | NO | FK | - | Khách hàng mang máy sửa, link `customers(id)` |
| `product_variant_id` | UUID | NO | FK | - | Bản máy sửa chữa, link `product_variants(id)` |
| `imei` | VARCHAR(18) | YES | FK | - | Số IMEI nếu có của máy khách, link `imeis(imei)` |
| `received_by` | UUID | NO | FK | - | Người tiếp nhận máy, link `users(id)` |
| `technician_id` | UUID | YES | FK | - | Kỹ thuật viên phụ trách sửa, link `users(id)` |
| `code` | VARCHAR(50) | NO | UK | - | Mã phiếu sửa chữa (duy nhất) |
| `status` | VARCHAR(20) | NO | - | `'RECEIVED'` | Trạng thái (RECEIVED, INSPECTED, REPAIRING, DONE, RETURNED) |
| `problem_description` | TEXT | NO | - | - | Mô tả lỗi máy của khách hàng báo |
| `estimated_cost` | DECIMAL(15,2) | NO | - | `0.00` | Báo giá dự kiến ban đầu |
| `actual_cost` | DECIMAL(15,2) | NO | - | `0.00` | Chi phí thực tế cuối cùng |
| `received_date` | TIMESTAMP | NO | - | `CURRENT_TIMESTAMP` | Ngày tiếp nhận |
| `completed_date` | TIMESTAMP | YES | - | - | Ngày hoàn thành bàn giao |
| `created_at` | TIMESTAMP | NO | - | `CURRENT_TIMESTAMP` | Thời gian lập phiếu |
| `updated_at` | TIMESTAMP | NO | - | `CURRENT_TIMESTAMP` | Thời gian cập nhật |

### 9.4 Bảng `repair_parts` (Linh kiện thay thế khi sửa)
Linh kiện vật tư kho lấy ra sử dụng sửa chữa cho thiết bị.

| Tên cột | Kiểu dữ liệu | Nullable | Khóa | Mặc định | Mô tả |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | UUID | NO | PK | `uuid_generate_v4()` | Khóa chính |
| `repair_ticket_id` | UUID | NO | FK | - | Phiếu sửa chữa cha, link `repair_tickets(id)` |
| `product_variant_id` | UUID | NO | FK | - | Mã linh kiện từ biến thể kho, link `product_variants(id)` |
| `quantity` | INTEGER | NO | - | `1` | Số lượng linh kiện sử dụng |
| `unit_price` | DECIMAL(15,2) | NO | - | - | Đơn giá linh kiện thay thế tính cho khách |

### 9.5 Bảng `repair_status_histories` (Lịch sử trạng thái sửa chữa)
Ghi nhận tiến độ cập nhật của phiếu sửa chữa qua các bộ phận.

| Tên cột | Kiểu dữ liệu | Nullable | Khóa | Mặc định | Mô tả |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | UUID | NO | PK | `uuid_generate_v4()` | Khóa chính |
| `repair_ticket_id` | UUID | NO | FK | - | Phiếu sửa chữa cha, link `repair_tickets(id)` |
| `status` | VARCHAR(20) | NO | - | - | Trạng thái chuyển đổi |
| `note` | VARCHAR(255) | YES | - | - | Ghi chú lý do hoặc kết quả kiểm tra |
| `created_at` | TIMESTAMP | NO | - | `CURRENT_TIMESTAMP` | Ngày cập nhật tiến độ |

---

## 10. Platform Domain

### 10.1 Bảng `notifications` (Thông báo nội bộ)
Thông báo công việc điều hành nội bộ cho nhân viên hệ thống.

| Tên cột | Kiểu dữ liệu | Nullable | Khóa | Mặc định | Mô tả |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | UUID | NO | PK | `uuid_generate_v4()` | Khóa chính |
| `user_id` | UUID | NO | FK | - | Người nhận thông báo, link `users(id)` |
| `title` | VARCHAR(150) | NO | - | - | Tiêu đề thông báo |
| `content` | TEXT | NO | - | - | Nội dung chi tiết thông báo |
| `is_read` | BOOLEAN | NO | - | `false` | Đánh dấu đã đọc hay chưa |
| `created_at` | TIMESTAMP | NO | - | `CURRENT_TIMESTAMP` | Thời gian phát thông báo |

### 10.2 Bảng `file_attachments` (Quản lý tệp đính kèm)
Hệ thống lưu trữ ảnh sản phẩm, file hóa đơn PDF, chứng từ hoặc biên bản sửa chữa.

| Tên cột | Kiểu dữ liệu | Nullable | Khóa | Mặc định | Mô tả |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | UUID | NO | PK | `uuid_generate_v4()` | Khóa chính |
| `entity_name` | VARCHAR(50) | NO | - | - | Tên thực thể liên kết (e.g. Products, RepairTickets) |
| `entity_id` | UUID | NO | - | - | Khóa chính của thực thể được liên kết đính kèm |
| `file_path` | VARCHAR(255) | NO | - | - | Đường dẫn tuyệt đối lưu trữ file (MinIO/Local Storage) |
| `file_type` | VARCHAR(100) | NO | - | - | Định dạng file (e.g. image/png, application/pdf) |
| `file_size` | INTEGER | NO | - | - | Kích thước dung lượng file (Bytes) |
| `created_at` | TIMESTAMP | NO | - | `CURRENT_TIMESTAMP` | Ngày tải lên |

### 10.3 Bảng `audit_logs` (Nhật ký thao tác nghiệp vụ)
Nhật ký bảo mật lưu vết các hành động nhạy cảm để kiểm tra chéo.

| Tên cột | Kiểu dữ liệu | Nullable | Khóa | Mặc định | Mô tả |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | UUID | NO | PK | `uuid_generate_v4()` | Khóa chính |
| `user_id` | UUID | NO | FK | - | Nhân viên thực hiện, link `users(id)` |
| `action` | VARCHAR(50) | NO | - | - | Hành động thực hiện (e.g. UPDATE_PRICE, GRANT_ROLE) |
| `entity_name` | VARCHAR(50) | NO | - | - | Bảng dữ liệu chịu ảnh hưởng |
| `entity_id` | UUID | NO | - | - | Khóa chính của bản ghi bị thay đổi |
| `old_value` | TEXT | YES | - | - | Trạng thái dữ liệu cũ (JSON format) |
| `new_value` | TEXT | YES | - | - | Trạng thái dữ liệu mới sau sửa (JSON format) |
| `created_at` | TIMESTAMP | NO | - | `CURRENT_TIMESTAMP` | Ngày thao tác |

---

## 11. AI Assistant Domain

### 11.1 Bảng `ai_conversations` (Phiên hội thoại AI)
Phiên làm việc chat giữa nhân viên và Trợ lý AI Assistant.

| Tên cột | Kiểu dữ liệu | Nullable | Khóa | Mặc định | Mô tả |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | UUID | NO | PK | `uuid_generate_v4()` | Khóa chính |
| `user_id` | UUID | NO | FK | - | Nhân viên sử dụng AI, liên kết `users(id)` |
| `title` | VARCHAR(150) | YES | - | - | Tiêu đề cuộc hội thoại |
| `created_at` | TIMESTAMP | NO | - | `CURRENT_TIMESTAMP` | Thời gian tạo |
| `updated_at` | TIMESTAMP | NO | - | `CURRENT_TIMESTAMP` | Thời gian tương tác cuối |

### 11.2 Bảng `ai_messages` (Nội dung tin nhắn AI)
Lưu chi tiết các tin nhắn trao đổi hai chiều trong phiên chat.

| Tên cột | Kiểu dữ liệu | Nullable | Khóa | Mặc định | Mô tả |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | UUID | NO | PK | `uuid_generate_v4()` | Khóa chính |
| `conversation_id` | UUID | NO | FK | - | Thuộc phiên hội thoại nào, link `ai_conversations(id)` |
| `role` | VARCHAR(20) | NO | - | - | Vai trò gửi tin (USER, ASSISTANT, SYSTEM) |
| `content` | TEXT | NO | - | - | Văn bản nội dung cuộc hội thoại |
| `created_at` | TIMESTAMP | NO | - | `CURRENT_TIMESTAMP` | Thời gian gửi tin |

### 11.3 Bảng `ai_tool_calls` (Nhật ký gọi công cụ AI)
Lịch sử Tool Calling khi AI gọi các API nội bộ để tra cứu và xử lý dữ liệu.

| Tên cột | Kiểu dữ liệu | Nullable | Khóa | Mặc định | Mô tả |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | UUID | NO | PK | `uuid_generate_v4()` | Khóa chính |
| `conversation_id` | UUID | NO | FK | - | Liên kết phiên làm việc chat, link `ai_conversations(id)` |
| `tool_name` | VARCHAR(100) | NO | - | - | Tên hàm/công cụ nội bộ được gọi |
| `arguments` | TEXT | NO | - | - | Tham số đầu vào truyền cho tool (JSON format) |
| `response` | TEXT | YES | - | - | Kết quả trả về của API cho AI (JSON format) |
| `created_at` | TIMESTAMP | NO | - | `CURRENT_TIMESTAMP` | Ngày thực thi gọi tool |

### 11.4 Bảng `ai_knowledge_documents` (Tài liệu tri thức RAG)
Lưu trữ tài liệu, quy chế, business rules để làm ngữ cảnh đầu vào cho RAG.

| Tên cột | Kiểu dữ liệu | Nullable | Khóa | Mặc định | Mô tả |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | UUID | NO | PK | `uuid_generate_v4()` | Khóa chính |
| `title` | VARCHAR(150) | NO | - | - | Tiêu đề văn bản tri thức |
| `content` | TEXT | NO | - | - | Nội dung chi tiết văn bản tri thức |
| `source_type` | VARCHAR(50) | NO | - | - | Nguồn gốc tài liệu (e.g. PDF, URL, MANUAL) |
| `source_url` | VARCHAR(255) | YES | - | - | Liên kết lưu file gốc |
| `is_deleted` | BOOLEAN | NO | - | `false` | Đánh dấu xóa mềm |
| `created_at` | TIMESTAMP | NO | - | `CURRENT_TIMESTAMP` | Ngày tạo |
| `updated_at` | TIMESTAMP | NO | - | `CURRENT_TIMESTAMP` | Ngày sửa đổi |

### 11.5 Bảng `ai_embeddings` (Vector Embedding của tri thức)
Lưu trữ tọa độ vector hóa của tài liệu tri thức phục vụ tìm kiếm ngữ nghĩa RAG (Semantic Search).

| Tên cột | Kiểu dữ liệu | Nullable | Khóa | Mặc định | Mô tả |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `document_id` | UUID | NO | PK, FK | - | Khóa ngoại kiêm khóa chính, link `ai_knowledge_documents(id)` |
| `vector_data` | VECTOR(1536) | NO | - | - | Dữ liệu Vector (mặc định 1536 chiều cho OpenAI/Qwen) |
| `created_at` | TIMESTAMP | NO | - | `CURRENT_TIMESTAMP` | Ngày tạo vector |
