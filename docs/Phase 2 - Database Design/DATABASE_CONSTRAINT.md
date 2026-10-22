# DATABASE CONSTRAINT

## Hệ thống quản lý chuỗi cửa hàng điện thoại tích hợp AI Assistant

**Version:** 1.0
**Database System:** Microsoft SQL Server 2022 (EF Core 10, T-SQL)
**Phase:** 2 - Database Design

---

## 1. Tổng quan
Tài liệu này xác định các ràng buộc (Constraints) ở mức cơ sở dữ liệu (Database level) nhằm đảm bảo tính toàn vẹn dữ liệu (Data Integrity), ngăn ngừa sai lệch số liệu và tối ưu hóa logic nghiệp vụ. Các loại ràng buộc bao gồm:
* **Khóa chính (Primary Key - PK)**
* **Khóa ngoại (Foreign Key - FK)**
* **Ràng buộc duy nhất (Unique Constraint - UC/UK)**
* **Ràng buộc kiểm tra (Check Constraint - CK)**
* **Ràng buộc mặc định (Default Constraint - DF)**
* **Quy trình xử lý Xóa mềm (Soft Delete & Cascade)**

---

## 2. Ràng buộc Khóa chính & Khóa ngoại (PK & FK Constraints)

Để đảm bảo hiệu năng và tính bảo mật toàn cục, hệ thống sử dụng UUID làm khóa chính thay cho số tự tăng (ID serial), ngoại trừ các bảng ánh xạ n-n (composite key) và khóa định danh vật lý như IMEI.

### 2.1 Cấu hình hành vi Khóa ngoại (Referential Actions)
Hệ thống sử dụng các quy tắc sau khi xử lý khóa ngoại:
* `ON DELETE RESTRICT` (Mặc định): Không được xóa dữ liệu cha nếu đã có dữ liệu con liên kết. (Đặc biệt bắt buộc đối với dữ liệu giao dịch: hóa đơn, đơn hàng, bảo hành, kho).
* `ON DELETE CASCADE`: Khi xóa dữ liệu cha thì dữ liệu con tự động bị xóa theo (Chỉ áp dụng cho các thực thể phụ thuộc hoàn toàn vào thực thể cha như: `sales_order_items` phụ thuộc `sales_orders`, `purchase_order_items` phụ thuộc `purchase_orders`, `ai_messages` phụ thuộc `ai_conversations`).
* `ON DELETE SET NULL`: Khi xóa bản ghi cha thì trường liên kết ở bản ghi con đặt thành `NULL` (Dùng cho thông tin bổ trợ không bắt buộc).

### 2.2 Chi tiết Khóa ngoại quan trọng

| Bảng con | Khóa ngoại | Bảng cha | Hành vi xóa (ON DELETE) | Mô tả |
| :--- | :--- | :--- | :--- | :--- |
| `users` | `branch_id` | `branches` | `RESTRICT` | Không được xóa chi nhánh khi đang có nhân viên trực thuộc. |
| `user_roles` | `user_id` | `users` | `CASCADE` | Xóa liên kết vai trò khi tài khoản bị xóa vật lý. |
| `user_roles` | `role_id` | `roles` | `RESTRICT` | Không được xóa vai trò hệ thống nếu đang có nhân viên sử dụng. |
| `role_permissions` | `role_id` | `roles` | `CASCADE` | Tự động giải phóng quyền khi xóa vai trò. |
| `role_permissions` | `permission_id` | `permissions` | `RESTRICT` | Không xóa quyền khi đang được gắn vào vai trò. |
| `products` | `category_id` | `categories` | `RESTRICT` | Không xóa danh mục khi có sản phẩm đang thuộc nhóm đó. |
| `products` | `brand_id` | `brands` | `RESTRICT` | Không xóa hãng sản xuất khi đang có sản phẩm thuộc hãng. |
| `product_variants` | `product_id` | `products` | `CASCADE` | Xóa các biến thể nếu xóa dòng máy cha (ở chế độ phát triển). |
| `inventories` | `warehouse_id` | `warehouses` | `RESTRICT` | Không xóa kho khi có dữ liệu tồn kho. |
| `inventories` | `product_variant_id`| `product_variants` | `RESTRICT` | Không xóa sản phẩm khi đang có tồn kho. |
| `imeis` | `product_variant_id`| `product_variants` | `RESTRICT` | Không xóa sản phẩm khi có IMEI thiết bị đăng ký. |
| `imeis` | `warehouse_id` | `warehouses` | `RESTRICT` | Không xóa kho khi đang chứa thiết bị IMEI. |
| `sales_orders` | `customer_id` | `customers` | `RESTRICT` | Không xóa khách hàng nếu đã phát sinh đơn mua hàng. |
| `sales_order_items`| `sales_order_id`| `sales_orders` | `CASCADE` | Xóa chi tiết đơn hàng khi đơn hàng bị xóa vật lý. |
| `sales_order_items`| `imei` | `imeis` | `RESTRICT` | Không xóa IMEI nếu đã bán cho khách. |
| `invoices` | `sales_order_id` | `sales_orders` | `RESTRICT` | Không xóa đơn hàng nếu hóa đơn tài chính đã được xuất. |
| `invoice_items` | `invoice_id` | `invoices` | `CASCADE` | Xóa chi tiết hóa đơn khi hóa đơn bị xóa. |
| `payments` | `invoice_id` | `invoices` | `RESTRICT` | Không xóa hóa đơn khi đã ghi nhận lịch sử thanh toán tiền. |
| `warranty_tickets` | `customer_id` | `customers` | `RESTRICT` | Không xóa khách hàng khi có phiếu bảo hành hoạt động. |
| `warranty_tickets` | `imei` | `imeis` | `RESTRICT` | Không xóa IMEI khi máy đang nằm trong quy trình bảo hành. |
| `repair_tickets` | `customer_id` | `customers` | `RESTRICT` | Không xóa khách khi máy đang được sửa. |
| `repair_parts` | `repair_ticket_id`| `repair_tickets` | `CASCADE` | Xóa chi tiết linh kiện khi hủy phiếu sửa chữa. |

---

## 3. Ràng buộc kiểm tra (Check Constraints - CK)

Ràng buộc kiểm tra (Check Constraint) được cài đặt trực tiếp trong SQL Schema để ngăn chặn dữ liệu bất hợp lý (ví dụ: số lượng âm, giá bán thấp hơn giá vốn, hoặc định dạng mã sai lệch).

### 3.1 Ràng buộc về Tiền tệ và Số lượng

```sql
-- Bảng product_variants: Giá bán lẻ phải lớn hơn hoặc bằng giá nhập gốc và đều phải >= 0
ALTER TABLE product_variants ADD CONSTRAINT chk_variant_prices 
    CHECK (cost_price >= 0 AND sale_price >= 0 AND sale_price >= cost_price);

-- Bảng inventories: Số lượng tồn kho và định mức tối thiểu không được âm
ALTER TABLE inventories ADD CONSTRAINT chk_inventory_quantities 
    CHECK (quantity >= 0 AND minimum_stock >= 0);

-- Bảng inventory_transactions: Số lượng thay đổi không được bằng 0
ALTER TABLE inventory_transactions ADD CONSTRAINT chk_transaction_quantity_non_zero 
    CHECK (quantity_changed <> 0);

-- Bảng purchase_order_items: Số lượng nhập phải > 0 và giá nhập phải > 0
ALTER TABLE purchase_order_items ADD CONSTRAINT chk_purchase_item_values 
    CHECK (quantity > 0 AND unit_price > 0);

-- Bảng sales_order_items: Số lượng bán phải > 0, giá bán và giảm giá không được âm
ALTER TABLE sales_order_items ADD CONSTRAINT chk_sales_item_values 
    CHECK (quantity > 0 AND unit_price >= 0 AND discount >= 0 AND unit_price >= discount);

-- Bảng sales_orders: Giá trị đơn hàng không được âm
ALTER TABLE sales_orders ADD CONSTRAINT chk_order_totals 
    CHECK (subtotal >= 0 AND discount >= 0 AND total >= 0 AND total = (subtotal - discount));

-- Bảng payments: Số tiền thanh toán thực tế phải > 0
ALTER TABLE payments ADD CONSTRAINT chk_payment_amount 
    CHECK (amount > 0);

-- Bảng repair_tickets: Chi phí sửa chữa dự kiến và thực tế phải >= 0
ALTER TABLE repair_tickets ADD CONSTRAINT chk_repair_costs 
    CHECK (estimated_cost >= 0 AND actual_cost >= 0);

-- Bảng repair_parts: Số lượng linh kiện thay thế > 0 và đơn giá >= 0
ALTER TABLE repair_parts ADD CONSTRAINT chk_repair_part_values 
    CHECK (quantity > 0 AND unit_price >= 0);
```

### 3.2 Ràng buộc về Trạng thái và Danh mục hợp lệ (ENUM / Value Ranges)

```sql
-- Bảng users: Trạng thái nhân sự
ALTER TABLE users ADD CONSTRAINT chk_user_status 
    CHECK (status IN ('ACTIVE', 'LOCKED'));

-- Bảng branches: Trạng thái chi nhánh
ALTER TABLE branches ADD CONSTRAINT chk_branch_status 
    CHECK (status IN ('ACTIVE', 'INACTIVE'));

-- Bảng imeis: Trạng thái hoạt động của thiết bị định danh
ALTER TABLE imeis ADD CONSTRAINT chk_imei_status 
    CHECK (status IN ('IN_STOCK', 'SOLD', 'REPAIRING', 'WARRANTY_HOLD', 'DISPOSED'));

-- Bảng sales_orders: Tiến độ đơn hàng
ALTER TABLE sales_orders ADD CONSTRAINT chk_order_status 
    CHECK (status IN ('PENDING', 'PAID', 'CANCELLED'));

-- Bảng invoices: Trạng thái hóa đơn
ALTER TABLE invoices ADD CONSTRAINT chk_invoice_status 
    CHECK (status IN ('UNPAID', 'PAID', 'REFUNDED'));

-- Bảng payments: Trạng thái thanh toán giao dịch
ALTER TABLE payments ADD CONSTRAINT chk_payment_status 
    CHECK (status IN ('PENDING', 'COMPLETED', 'FAILED'));

-- Bảng warranty_tickets: Trạng thái bảo hành
ALTER TABLE warranty_tickets ADD CONSTRAINT chk_warranty_status 
    CHECK (status IN ('RECEIVED', 'PROCESSING', 'COMPLETED', 'RETURNED'));

-- Bảng repair_tickets: Trạng thái sửa chữa máy
ALTER TABLE repair_tickets ADD CONSTRAINT chk_repair_status 
    CHECK (status IN ('RECEIVED', 'INSPECTED', 'REPAIRING', 'DONE', 'RETURNED'));
```

### 3.3 Ràng buộc về Thời gian (Logical Date Constraints)

```sql
-- Bảng promotions: Ngày kết thúc sự kiện phải sau ngày bắt đầu
ALTER TABLE promotions ADD CONSTRAINT chk_promotion_dates 
    CHECK (end_date > start_date);

-- Bảng warranty_tickets: Ngày trả khách hàng bảo hành phải sau ngày tiếp nhận
ALTER TABLE warranty_tickets ADD CONSTRAINT chk_warranty_dates 
    CHECK (end_date IS NULL OR end_date >= start_date);

-- Bảng repair_tickets: Ngày sửa xong phải sau hoặc bằng ngày tiếp nhận máy
ALTER TABLE repair_tickets ADD CONSTRAINT chk_repair_dates 
    CHECK (completed_date IS NULL OR completed_date >= received_date);
```

---

## 4. Ràng buộc duy nhất (Unique Constraints - UK/UC)

Được áp dụng để đảm bảo tính định danh toàn cục, tránh việc nhập dữ liệu trùng lặp ở các cột định danh.

* Bảng `users`: `username`, `email`, `phone` phải là duy nhất.
* Bảng `branches`: `code` phải duy nhất.
* Bảng `customers`: `phone` phải duy nhất (định danh khách hàng).
* Bảng `suppliers`: `code` phải duy nhất.
* Bảng `brands` & `categories`: `code` phải duy nhất.
* Bảng `products`: `code` phải duy nhất.
* Bảng `product_variants`: `sku` phải duy nhất.
* Bảng `imeis`: `imei` là khóa chính (bản chất là duy nhất toàn hệ thống).
* Bảng `sales_orders`, `purchase_orders`, `invoices`, `repair_tickets`, `warranty_tickets`: `code` bắt buộc phải là duy nhất để phục vụ tra cứu hành chính.

---

## 5. Ràng buộc Xóa mềm (Soft Delete Constraints)

Để giữ gìn lịch sử giao dịch và tuân thủ BR-002, hệ thống sử dụng cơ chế xóa mềm:
1. Thêm cột `is_deleted` (BOOLEAN, mặc định `false`) vào tất cả các bảng Master Data.
2. Khi thực hiện xóa, ứng dụng sẽ gọi lệnh `UPDATE table SET is_deleted = true WHERE id = ?`.
3. Để đảm bảo ràng buộc duy nhất (Unique Constraint) vẫn hoạt động khi có bản ghi bị xóa mềm (ví dụ: thêm lại sản phẩm có mã `Code` đã xóa trước đó), chúng ta sử dụng **Filtered Unique Index** trong Microsoft SQL Server 2022 (được cấu hình chuẩn hóa qua EF Core Fluent API với `.HasFilter("[IsDeleted] = 0")`):

```sql
-- Cấu hình Filtered Unique Index cho sản phẩm: Chỉ ràng buộc duy nhất trên các bản ghi CHƯA bị xóa mềm
CREATE UNIQUE NONCLUSTERED INDEX [UK_Products_Code_Active] 
ON [Products] ([Code]) 
WHERE [IsDeleted] = 0;

-- Tương tự cho biến thể sản phẩm (SKU)
CREATE UNIQUE NONCLUSTERED INDEX [UK_ProductVariants_Sku_Active] 
ON [ProductVariants] ([Sku]) 
WHERE [IsDeleted] = 0;

-- Ràng buộc số điện thoại khách hàng đang hoạt động
CREATE UNIQUE NONCLUSTERED INDEX [UK_Customers_Phone_Active] 
ON [Customers] ([Phone]) 
WHERE [IsDeleted] = 0;
```
Cơ chế này cho phép người dùng xóa mềm một khách hàng cũ và đăng ký lại khách hàng mới sử dụng đúng số điện thoại đó mà không gặp lỗi vi phạm ràng buộc duy nhất tại cơ sở dữ liệu.
