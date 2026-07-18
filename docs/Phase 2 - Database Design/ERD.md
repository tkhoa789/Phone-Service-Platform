# ENTITY RELATIONSHIP DIAGRAM (ERD)

## Hệ thống quản lý chuỗi cửa hàng điện thoại tích hợp AI Assistant

**Version:** 1.0
**Phase:** 2 - Database Design

---

## 1. Tổng quan
Tài liệu này mô tả chi tiết quan hệ giữa các thực thể (Entity) trong hệ thống thông qua các sơ đồ thực thể liên kết (ERD) bằng ngôn ngữ Mermaid. Để đảm bảo tính trực quan và khả năng theo dõi, ERD được chia thành 5 Bounded Context chính:
1. **Identity & Authorization Context** (Authentication, Authorization, User, Audit Log)
2. **Product Catalog & Inventory Context** (Product, Brand, Category, Warehouse, Inventory, IMEI, Purchase)
3. **Sales & Invoice Context** (Sales Order, Invoice, Payment, Promotion, Voucher)
4. **Service & Repair Context** (Warranty, Repair, File Attachment, Notification)
5. **AI Assistant Context** (Conversation, Message, Tool Call, Knowledge, Embedding)

---

## 2. Quy ước ký hiệu (Crow's Foot Notation)
* `||--o{` : Quan hệ 1 - Nhiều (1 bên bắt buộc, bên nhiều có thể không có)
* `||--|{` : Quan hệ 1 - Nhiều (Cả hai bên đều bắt buộc)
* `|o--o{` : Quan hệ 1 - Nhiều không bắt buộc
* `||--||` : Quan hệ 1 - 1 bắt buộc

---

## 3. Các sơ đồ ERD theo Bounded Context

### 3.1 Identity & Authorization Context
Sơ đồ này quản lý thông tin Nhân viên (`User`), Chi nhánh (`Branch`), Phân quyền (`Role`, `Permission`) và thông tin bảo mật, lịch sử hệ thống.

```mermaid
erDiagram
    Branch ||--o{ User : "thuoc_ve"
    User ||--o{ UserRole : "co"
    Role ||--o{ UserRole : "duoc_gan"
    Role ||--o{ RolePermission : "co"
    Permission ||--o{ RolePermission : "thuoc_ve"
    User ||--o{ RefreshToken : "so_huu"
    User ||--o{ LoginHistory : "ghi_nhan"
    User ||--o{ AuditLog : "thao_tac"

    Branch {
        uuid id PK
        string code UK
        string name
        string address
        string phone
        string email
        string status
        boolean is_deleted
        timestamp created_at
        timestamp updated_at
    }

    User {
        uuid id PK
        uuid branch_id FK
        string username UK
        string password
        string full_name
        string email UK
        string phone UK
        string status
        boolean is_deleted
        timestamp created_at
        timestamp updated_at
    }

    Role {
        uuid id PK
        string name UK
        string description
        boolean is_deleted
        timestamp created_at
        timestamp updated_at
    }

    Permission {
        uuid id PK
        string code UK
        string name
        string module
        boolean is_deleted
        timestamp created_at
        timestamp updated_at
    }

    UserRole {
        uuid user_id PK, FK
        uuid role_id PK, FK
        timestamp created_at
    }

    RolePermission {
        uuid role_id PK, FK
        uuid permission_id PK, FK
        timestamp created_at
    }

    RefreshToken {
        uuid id PK
        uuid user_id FK
        string token UK
        timestamp expiry_date
        boolean revoked
        timestamp created_at
    }

    LoginHistory {
        uuid id PK
        uuid user_id FK
        string ip_address
        string user_agent
        string status
        timestamp created_at
    }

    AuditLog {
        uuid id PK
        uuid user_id FK
        string action
        string entity_name
        uuid entity_id
        text old_value
        text new_value
        timestamp created_at
    }
```

---

### 3.2 Product Catalog & Inventory Context
Quản lý thông tin Danh mục (`Category`), Thương hiệu (`Brand`), Phiên bản sản phẩm (`ProductVariant`), Kho hàng (`Warehouse`), Tồn kho (`Inventory`), Mã IMEI thiết bị (`IMEI`) và phiếu Nhập hàng (`PurchaseOrder`).

```mermaid
erDiagram
    Category ||--o{ Product : "chua"
    Brand ||--o{ Product : "so_huu"
    Product ||--|{ ProductVariant : "co_bien_the"
    Branch ||--o{ Warehouse : "co"
    Warehouse ||--o{ Inventory : "chua"
    ProductVariant ||--o{ Inventory : "co_so_luong"
    ProductVariant ||--o{ IMEI : "dinh_danh"
    Warehouse ||--o{ IMEI : "chua"
    Supplier ||--o{ PurchaseOrder : "cung_cap"
    Warehouse ||--o{ PurchaseOrder : "nhap_vao"
    PurchaseOrder ||--|{ PurchaseOrderItem : "co_chi_tiet"
    ProductVariant ||--o{ PurchaseOrderItem : "nhap_so_luong"
    
    Warehouse ||--o{ WarehouseTransfer : "xuat_tu"
    Warehouse ||--o{ WarehouseTransfer : "nhap_vao"
    WarehouseTransfer ||--|{ WarehouseTransferItem : "co_chi_tiet"
    ProductVariant ||--o{ WarehouseTransferItem : "chuyen_so_luong"

    Warehouse ||--o{ StockTake : "kiem_tai"
    StockTake ||--|{ StockTakeItem : "co_chi_tiet"
    ProductVariant ||--o{ StockTakeItem : "kiem_so_luong"

    Category {
        uuid id PK
        string code UK
        string name
        uuid parent_id FK
        boolean is_deleted
        timestamp created_at
        timestamp updated_at
    }

    Brand {
        uuid id PK
        string code UK
        string name
        boolean is_deleted
        timestamp created_at
        timestamp updated_at
    }

    Product {
        uuid id PK
        uuid category_id FK
        uuid brand_id FK
        string code UK
        string name
        text description
        boolean is_deleted
        timestamp created_at
        timestamp updated_at
    }

    ProductVariant {
        uuid id PK
        uuid product_id FK
        string sku UK
        string name
        string color
        string capacity
        decimal cost_price
        decimal sale_price
        boolean is_deleted
        timestamp created_at
        timestamp updated_at
    }

    Warehouse {
        uuid id PK
        uuid branch_id FK
        string code UK
        string name
        boolean is_deleted
        timestamp created_at
        timestamp updated_at
    }

    Inventory {
        uuid id PK
        uuid warehouse_id FK
        uuid product_variant_id FK
        integer quantity
        integer minimum_stock
        timestamp updated_at
    }

    IMEI {
        string imei PK
        uuid product_variant_id FK
        uuid warehouse_id FK
        string status
        timestamp created_at
        timestamp updated_at
    }

    Supplier {
        uuid id PK
        string code UK
        string name
        string phone
        string email
        string address
        boolean is_deleted
        timestamp created_at
        timestamp updated_at
    }

    PurchaseOrder {
        uuid id PK
        uuid supplier_id FK
        uuid warehouse_id FK
        string code UK
        string status
        decimal total_amount
        timestamp created_at
        timestamp updated_at
    }

    PurchaseOrderItem {
        uuid id PK
        uuid purchase_order_id FK
        uuid product_variant_id FK
        integer quantity
        decimal unit_price
    }

    WarehouseTransfer {
        uuid id PK
        uuid from_warehouse_id FK
        uuid to_warehouse_id FK
        string code UK
        string status
        timestamp created_at
        timestamp updated_at
    }

    WarehouseTransferItem {
        uuid id PK
        uuid transfer_id FK
        uuid product_variant_id FK
        integer quantity
    }

    StockTake {
        uuid id PK
        uuid warehouse_id FK
        string code UK
        string status
        timestamp created_at
        timestamp updated_at
    }

    StockTakeItem {
        uuid id PK
        uuid stock_take_id FK
        uuid product_variant_id FK
        integer system_quantity
        integer actual_quantity
        integer difference
        string note
    }
```

---

### 3.3 Sales & Invoice Context
Quản lý quy trình Bán hàng (`SalesOrder`), Hóa đơn (`Invoice`), Thanh toán (`Payment`) và các chương trình khuyến mãi (`Promotion`, `Voucher`).

```mermaid
erDiagram
    Customer ||--o{ SalesOrder : "dat_hang"
    User ||--o{ SalesOrder : "tao_don"
    Branch ||--o{ SalesOrder : "phat_sinh_tai"
    SalesOrder ||--|{ SalesOrderItem : "co_chi_tiet"
    ProductVariant ||--o{ SalesOrderItem : "duoc_ban"
    IMEI ||--o{ SalesOrderItem : "gan_cho"
    
    Promotion ||--o{ Voucher : "thuoc_ve"
    Voucher ||--o{ SalesOrder : "ap_dung"

    SalesOrder ||--|| Invoice : "xuat_hoa_don"
    Invoice ||--|{ InvoiceItem : "co_chi_tiet"
    Invoice ||--|{ Payment : "thanh_toan"
    PaymentMethod ||--o{ Payment : "qua_phuong_thuc"

    Customer {
        uuid id PK
        string code UK
        string full_name
        string phone UK
        string email
        string address
        boolean is_deleted
        timestamp created_at
        timestamp updated_at
    }

    Promotion {
        uuid id PK
        string code UK
        string name
        string type
        decimal value
        timestamp start_date
        timestamp end_date
        boolean is_active
        timestamp created_at
        timestamp updated_at
    }

    Voucher {
        uuid id PK
        uuid promotion_id FK
        string code UK
        string status
        decimal discount_amount
        decimal min_order_value
        timestamp expiry_date
        integer usage_limit
        integer usage_count
        timestamp created_at
        timestamp updated_at
    }

    SalesOrder {
        uuid id PK
        uuid customer_id FK
        uuid user_id FK
        uuid branch_id FK
        uuid voucher_id FK
        string code UK
        string status
        decimal subtotal
        decimal discount
        decimal total
        timestamp created_at
        timestamp updated_at
    }

    SalesOrderItem {
        uuid id PK
        uuid sales_order_id FK
        uuid product_variant_id FK
        string imei FK
        integer quantity
        decimal unit_price
        decimal discount
    }

    Invoice {
        uuid id PK
        uuid sales_order_id FK
        string code UK
        string status
        decimal amount
        timestamp created_at
        timestamp updated_at
    }

    InvoiceItem {
        uuid id PK
        uuid invoice_id FK
        uuid product_variant_id FK
        integer quantity
        decimal unit_price
    }

    PaymentMethod {
        uuid id PK
        string code UK
        string name
        boolean is_active
        timestamp created_at
        timestamp updated_at
    }

    Payment {
        uuid id PK
        uuid invoice_id FK
        uuid payment_method_id FK
        string code UK
        decimal amount
        string status
        timestamp payment_date
    }
```

---

### 3.4 Service & Repair Context
Quản lý quy trình hậu mãi gồm Bảo hành (`WarrantyTicket`) và Sửa chữa (`RepairTicket`), cùng các dữ liệu bổ trợ như Tệp đính kèm (`FileAttachment`) và Thông báo (`Notification`).

```mermaid
erDiagram
    Customer ||--o{ WarrantyTicket : "yeu_cau"
    SalesOrder ||--o{ WarrantyTicket : "tu_don_hang"
    ProductVariant ||--o{ WarrantyTicket : "bao_hanh_may"
    IMEI ||--o{ WarrantyTicket : "xac_dinh_qua"
    WarrantyTicket ||--|{ WarrantyHistory : "co_lich_su"

    Customer ||--o{ RepairTicket : "yeu_cau_sua"
    ProductVariant ||--o{ RepairTicket : "sua_may"
    IMEI ||--o{ RepairTicket : "xac_dinh_qua"
    User ||--o{ RepairTicket : "tiep_nhan_boi"
    User ||--o{ RepairTicket : "sua_boi"
    RepairTicket ||--|{ RepairPart : "thay_the"
    ProductVariant ||--o{ RepairPart : "dung_linh_kien"
    RepairTicket ||--|{ RepairStatusHistory : "co_lich_su"

    User ||--o{ Notification : "nhan"

    WarrantyTicket {
        uuid id PK
        uuid customer_id FK
        uuid sales_order_id FK
        uuid product_variant_id FK
        string imei FK
        string code UK
        string status
        timestamp start_date
        timestamp end_date
        string note
        timestamp created_at
        timestamp updated_at
    }

    WarrantyHistory {
        uuid id PK
        uuid warranty_ticket_id FK
        string action
        string status
        string description
        timestamp created_at
    }

    RepairTicket {
        uuid id PK
        uuid customer_id FK
        uuid product_variant_id FK
        string imei FK
        uuid received_by FK
        uuid technician_id FK
        string code UK
        string status
        string problem_description
        decimal estimated_cost
        decimal actual_cost
        timestamp received_date
        timestamp completed_date
        timestamp created_at
        timestamp updated_at
    }

    RepairPart {
        uuid id PK
        uuid repair_ticket_id FK
        uuid product_variant_id FK
        integer quantity
        decimal unit_price
    }

    RepairStatusHistory {
        uuid id PK
        uuid repair_ticket_id FK
        string status
        string note
        timestamp created_at
    }

    Notification {
        uuid id PK
        uuid user_id FK
        string title
        text content
        boolean is_read
        timestamp created_at
    }

    FileAttachment {
        uuid id PK
        string entity_name
        uuid entity_id
        string file_path
        string file_type
        integer file_size
        timestamp created_at
    }
```

---

### 3.5 AI Assistant Context
Phân hệ quản lý hội thoại của Trợ lý AI (`AIConversation`, `AIMessage`), lịch sử sử dụng công cụ (`AIToolCall`) và dữ liệu tri thức hỗ trợ RAG (`AIKnowledgeDocument`, `AIEmbedding`).

```mermaid
erDiagram
    User ||--o{ AIConversation : "bat_dau"
    AIConversation ||--|{ AIMessage : "chua"
    AIConversation ||--o{ AIToolCall : "thuc_hien"
    AIKnowledgeDocument ||--|| AIEmbedding : "bieu_dien"

    AIConversation {
        uuid id PK
        uuid user_id FK
        string title
        timestamp created_at
        timestamp updated_at
    }

    AIMessage {
        uuid id PK
        uuid conversation_id FK
        string role
        text content
        timestamp created_at
    }

    AIToolCall {
        uuid id PK
        uuid conversation_id FK
        string tool_name
        text arguments
        text response
        timestamp created_at
    }

    AIKnowledgeDocument {
        uuid id PK
        string title
        text content
        string source_type
        string source_url
        boolean is_deleted
        timestamp created_at
        timestamp updated_at
    }

    AIEmbedding {
        uuid document_id PK, FK
        vector vector_data
        timestamp created_at
    }
```

---

## 4. Ràng buộc toàn vẹn cơ sở dữ liệu
* **Xóa mềm (Soft Delete):** Áp dụng cho các thực thể Master Data như `User`, `Branch`, `Customer`, `Product`, `Warehouse`, `Category`, `Brand`, `Supplier`, `AIKnowledgeDocument` bằng trường `is_deleted = true/false`.
* **Ràng buộc khóa ngoại (Foreign Key Constraints):** Mọi bảng con phải có khóa ngoại chỉ đến bảng cha. Khi xóa mềm thực thể cha, thực thể con không bị xóa vật lý nhưng nghiệp vụ truy vấn cần lọc bỏ các thực thể có cha đã bị xóa mềm.
* **Mã định danh (Unique Code):** Các trường như `code`, `imei`, `sku`, `username`, `email`, `phone` bắt buộc phải có thuộc tính `UNIQUE` để tránh trùng lặp thông tin và phục vụ định danh nhanh.
* **IMEI Lifecycle:** Trạng thái IMEI (`status`) chỉ được mang các giá trị hợp lệ: `IN_STOCK` (Trong kho), `SOLD` (Đã bán), `REPAIRING` (Đang sửa), `WARRANTY_HOLD` (Đang giữ bảo hành), `DISPOSED` (Đã thanh lý/đổi máy).
