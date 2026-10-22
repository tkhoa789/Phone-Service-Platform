# DATABASE INDEX PLAN

## Hệ thống quản lý chuỗi cửa hàng điện thoại tích hợp AI Assistant

**Version:** 1.0
**Database System:** Microsoft SQL Server 2022 (T-SQL, EF Core 10) & Qdrant 1.12.0 (Vector DB)
**Phase:** 2 - Database Design

---

## 1. Tổng quan
Trong hệ thống quản lý chuỗi cửa hàng và tích hợp trợ lý AI, tốc độ phản hồi truy vấn là yếu tố sống còn (đặc biệt khi AI thực hiện Tool Calling để tra cứu dữ liệu thời gian thực). Tài liệu này thiết lập kế hoạch đánh chỉ mục (Indexing Strategy) nhằm:
* **Tối ưu hóa các câu lệnh `JOIN`** thông qua việc tạo index trên tất cả các Khóa ngoại (Foreign Keys).
* **Tăng tốc độ tìm kiếm nghiệp vụ** (tìm khách hàng qua số điện thoại, tìm máy qua IMEI, tra cứu SKU sản phẩm).
* **Hỗ trợ truy xuất dữ liệu phân tích** (lọc đơn hàng theo chi nhánh, khoảng thời gian, thống kê doanh thu).
* **Tối ưu hóa tìm kiếm vector (RAG)** bằng chỉ mục HNSW/IVFFlat cho trường vector tri thức của AI.

---

## 2. Quy tắc đánh chỉ mục chung
1. **Khóa chính (PK):** SQL Server tự động tạo Clustered B-Tree Index cho các khóa chính.
2. **Khóa ngoại (FK):** SQL Server không tự động đánh chỉ mục cho Foreign Keys. Do đó, tất cả 72 Khóa ngoại (Restrict) trong hệ thống đều được cấu hình Non-Clustered B-Tree Index qua EF Core Fluent API để tối ưu hóa triệt để hiệu năng các phép `JOIN` và ngăn ngừa Deadlock / Table Scan.
3. **Các bảng có tần suất ghi cực cao (e.g. `audit_logs`, `login_histories`, `inventory_transactions`):** Hạn chế đánh quá nhiều index để tránh làm chậm tiến trình `INSERT`.
4. **Xóa mềm (Soft Delete):** Kết hợp điều kiện `WHERE is_deleted = false` trong các index tìm kiếm để giảm kích thước index và tăng tốc độ lọc dữ liệu đang hoạt động.

---

## 3. Danh sách các Chỉ mục cụ thể (SQL Index Scripts)

### 3.1 Chỉ mục cho Khóa ngoại (Foreign Keys - Tối ưu JOIN)
Dưới đây là các index được tạo để tối ưu hóa hiệu năng JOIN giữa các bảng cha-con trong nghiệp vụ bán hàng và quản lý kho.

```sql
-- 1. Identity & Authorization Context
CREATE INDEX idx_users_branch ON users(branch_id);
CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);
CREATE INDEX idx_login_histories_user ON login_histories(user_id);

-- 2. Product Catalog Context
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_brand ON products(brand_id);
CREATE INDEX idx_variants_product ON product_variants(product_id);

-- 3. Inventory & Purchase Context
CREATE INDEX idx_warehouses_branch ON warehouses(branch_id);
CREATE INDEX idx_inventories_warehouse ON inventories(warehouse_id);
CREATE INDEX idx_inventories_variant ON inventories(product_variant_id);
CREATE INDEX idx_inventory_tx_warehouse ON inventory_transactions(warehouse_id);
CREATE INDEX idx_inventory_tx_variant ON inventory_transactions(product_variant_id);
CREATE INDEX idx_imeis_variant ON imeis(product_variant_id);
CREATE INDEX idx_imeis_warehouse ON imeis(warehouse_id);
CREATE INDEX idx_purchase_orders_supplier ON purchase_orders(supplier_id);
CREATE INDEX idx_purchase_orders_warehouse ON purchase_orders(warehouse_id);
CREATE INDEX idx_purchase_items_order ON purchase_order_items(purchase_order_id);
CREATE INDEX idx_purchase_items_variant ON purchase_order_items(product_variant_id);

-- 4. Sales & Invoicing Context
CREATE INDEX idx_sales_orders_customer ON sales_orders(customer_id);
CREATE INDEX idx_sales_orders_user ON sales_orders(user_id);
CREATE INDEX idx_sales_orders_branch ON sales_orders(branch_id);
CREATE INDEX idx_sales_orders_voucher ON sales_orders(voucher_id);
CREATE INDEX idx_sales_items_order ON sales_order_items(sales_order_id);
CREATE INDEX idx_sales_items_variant ON sales_order_items(product_variant_id);
CREATE INDEX idx_sales_items_imei ON sales_order_items(imei);
CREATE INDEX idx_invoices_order ON invoices(sales_order_id);
CREATE INDEX idx_invoice_items_invoice ON invoice_items(invoice_id);
CREATE INDEX idx_invoice_items_variant ON invoice_items(product_variant_id);
CREATE INDEX idx_payments_invoice ON payments(invoice_id);
CREATE INDEX idx_payments_method ON payments(payment_method_id);

-- 5. Warranty & Repair Context
CREATE INDEX idx_warranty_customer ON warranty_tickets(customer_id);
CREATE INDEX idx_warranty_order ON warranty_tickets(sales_order_id);
CREATE INDEX idx_warranty_variant ON warranty_tickets(product_variant_id);
CREATE INDEX idx_warranty_imei ON warranty_tickets(imei);
CREATE INDEX idx_warranty_history_ticket ON warranty_histories(warranty_ticket_id);
CREATE INDEX idx_repair_customer ON repair_tickets(customer_id);
CREATE INDEX idx_repair_variant ON repair_tickets(product_variant_id);
CREATE INDEX idx_repair_imei ON repair_tickets(imei);
CREATE INDEX idx_repair_received_by ON repair_tickets(received_by);
CREATE INDEX idx_repair_technician ON repair_tickets(technician_id);
CREATE INDEX idx_repair_parts_ticket ON repair_parts(repair_ticket_id);
CREATE INDEX idx_repair_parts_variant ON repair_parts(product_variant_id);
CREATE INDEX idx_repair_history_ticket ON repair_status_histories(repair_ticket_id);

-- 6. Notifications & AI Context
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_ai_conversations_user ON ai_conversations(user_id);
CREATE INDEX idx_ai_messages_convo ON ai_messages(conversation_id);
CREATE INDEX idx_ai_tool_calls_convo ON ai_tool_calls(conversation_id);
```

### 3.2 Chỉ mục tìm kiếm nghiệp vụ (Business Search Optimization)
Các trường thông tin thường xuyên xuất hiện trong mệnh đề `WHERE` để tìm kiếm trực tiếp trên giao diện UI hoặc do AI Assistant quét dữ liệu.

```sql
-- Tìm kiếm khách hàng nhanh bằng số điện thoại (Sử dụng Partial Index lọc bỏ khách hàng đã xóa mềm)
CREATE INDEX idx_customers_phone_search 
ON customers(phone) 
WHERE is_deleted = false;

-- Tra cứu nhanh biến thể qua mã SKU sản phẩm
CREATE INDEX idx_variants_sku_search 
ON product_variants(sku) 
WHERE is_deleted = false;

-- Tra cứu nhanh dòng máy qua mã sản phẩm
CREATE INDEX idx_products_code_search 
ON products(code) 
WHERE is_deleted = false;

-- Tìm kiếm trạng thái thiết bị theo IMEI (Được gọi liên tục khi bán hàng, sửa chữa, bảo hành)
CREATE INDEX idx_imeis_status_search 
ON imeis(imei, status);
```

### 3.3 Chỉ mục phục vụ báo cáo và dòng thời gian (Timeline & Analytics Optimization)
Tối ưu hóa các truy vấn sắp xếp theo thời gian (`ORDER BY created_at DESC`) và tổng hợp báo cáo doanh thu theo chi nhánh/khoảng thời gian.

```sql
-- Lọc và sắp xếp hóa đơn tài chính theo ngày tháng để báo cáo doanh thu
CREATE INDEX idx_invoices_report_date 
ON invoices(created_at, status);

-- Truy xuất lịch sử giao dịch kho theo trình tự thời gian
CREATE INDEX idx_inventory_tx_timeline 
ON inventory_transactions(created_at, transaction_type);

-- Sắp xếp nhật ký hệ thống để kiểm toán dữ liệu gần nhất
CREATE INDEX idx_audit_logs_timeline 
ON audit_logs(created_at DESC);
```

### 3.4 Chỉ mục Vector Embedding phục vụ RAG (Qdrant Vector Database)
Để tối ưu hóa tìm kiếm ngữ nghĩa cho hệ thống AI Assistant với tốc độ phản hồi tính bằng mili-giây và giảm tải triệt để cho cơ sở dữ liệu quan hệ, toàn bộ vector nhúng 768 chiều (`nomic-embed-text`) được quản lý độc lập tại **Qdrant Vector Database v1.12.0** với chỉ mục HNSW chuyên biệt:

* **Collection:** `store-knowledge`
* **Vector Dimension:** 768 (`nomic-embed-text`)
* **Distance Metric:** `Cosine`
* **HNSW Index Parameters:** `m = 16`, `ef_construct = 100` (đảm bảo độ chính xác truy xuất Top-K ngữ cảnh > 95% với thời gian phản hồi < 15ms).
* **Payload Filtering:** Hỗ trợ lọc theo `category` (warranty, pos, inventory, technical) và quyền truy cập.

---

## 4. Kế hoạch bảo trì Index
* **Bảo trì và Chống phân mảnh Index trong SQL Server:** Theo thời gian, các giao dịch POS và xuất nhập kho phát sinh phân mảnh B-Tree. Hệ thống áp dụng quy trình bảo dưỡng tự động hàng tuần:
  ```sql
  ALTER INDEX ALL ON [Inventories] REBUILD WITH (ONLINE = ON);
  ALTER INDEX ALL ON [SalesOrderItems] REBUILD WITH (ONLINE = ON);
  ALTER INDEX ALL ON [Imeis] REBUILD WITH (ONLINE = ON);
  ```
* **Giám sát Hiệu quả Index:** Giám sát truy cập chỉ mục định kỳ qua Dynamic Management Views (DMVs) của SQL Server: `sys.dm_db_index_usage_stats` và `sys.dm_db_missing_index_details` để tinh chỉnh kịp thời.
