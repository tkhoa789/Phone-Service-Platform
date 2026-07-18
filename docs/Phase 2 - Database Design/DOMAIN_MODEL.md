# DOMAIN_MODEL

## Hệ thống quản lý chuỗi cửa hàng điện thoại tích hợp AI Assistant

**Version:** 1.0

---

# 1. Mục đích

Tài liệu này xác định Domain Model của hệ thống.

Domain Model là cầu nối giữa Business Analysis và Database Design.

Mục tiêu:

* Phân chia nghiệp vụ theo Domain.
* Xác định ranh giới (Bounded Context) của từng Module.
* Xác định Entity thuộc từng Domain.
* Làm cơ sở cho ERD, Database và Clean Architecture.

---

# 2. Nguyên tắc thiết kế

Hệ thống được chia theo các Domain độc lập.

Mỗi Domain:

* Có trách nhiệm rõ ràng.
* Quản lý dữ liệu riêng.
* Có Service riêng.
* Có Repository riêng.
* Có API riêng.
* Có Workflow riêng.

Các Domain giao tiếp với nhau thông qua Service hoặc Event, không truy cập trực tiếp dữ liệu nội bộ của nhau.

---

# 3. Domain Map

```text
Authentication
        │
        ▼
User Management
        │
        ▼
Branch Management
        │
        ├─────────────┐
        ▼             ▼
Customer         Product Catalog
        │             │
        │             ▼
        │       Inventory Management
        │             │
        └──────┬──────┘
               ▼
        Sales Management
        │      │
        │      ├─────────────┐
        ▼                    ▼
Warranty Management   Repair Management
        │                    │
        └────────────┬───────┘
                     ▼
              Notification
                     │
                     ▼
              Dashboard & Report
                     │
                     ▼
               AI Assistant
```

---

# 4. Domain Overview

| Domain               | Mục đích                   |
| -------------------- | -------------------------- |
| Authentication       | Xác thực người dùng        |
| Authorization        | Quản lý Role và Permission |
| User Management      | Quản lý nhân viên          |
| Branch Management    | Quản lý chuỗi cửa hàng     |
| Customer Management  | Quản lý khách hàng         |
| Supplier Management  | Quản lý nhà cung cấp       |
| Product Catalog      | Quản lý danh mục sản phẩm  |
| Inventory Management | Quản lý kho và IMEI        |
| Purchase Management  | Quản lý nhập hàng          |
| Sales Management     | Quản lý bán hàng           |
| Invoice Management   | Quản lý hóa đơn            |
| Payment Management   | Quản lý thanh toán         |
| Promotion Management | Quản lý khuyến mãi         |
| Warranty Management  | Quản lý bảo hành           |
| Repair Management    | Quản lý sửa chữa           |
| Dashboard & Report   | Thống kê và báo cáo        |
| Notification         | Thông báo                  |
| File Management      | Quản lý tệp đính kèm       |
| Audit Log            | Nhật ký hệ thống           |
| AI Assistant         | Trợ lý AI                  |

---

# 5. Domain Detail

## 5.1 Authentication Domain

### Trách nhiệm

* Đăng nhập.
* Đăng xuất.
* JWT.
* Refresh Token.
* Đổi mật khẩu.

### Entity

* RefreshToken
* LoginHistory

### Không quản lý

* User Profile
* Permission

---

## 5.2 Authorization Domain

### Trách nhiệm

* Role
* Permission
* Role Permission
* User Role

### Entity

* Role
* Permission
* RolePermission
* UserRole

---

## 5.3 User Management Domain

### Trách nhiệm

* Nhân viên
* Hồ sơ
* Trạng thái

### Entity

* User

---

## 5.4 Branch Management Domain

### Trách nhiệm

* Chi nhánh
* Địa chỉ
* Quản lý chi nhánh

### Entity

* Branch

---

## 5.5 Customer Management Domain

### Trách nhiệm

* Hồ sơ khách hàng
* Lịch sử giao dịch
* Lịch sử bảo hành
* Lịch sử sửa chữa

### Entity

* Customer

---

## 5.6 Supplier Management Domain

### Trách nhiệm

* Nhà cung cấp
* Thông tin liên hệ

### Entity

* Supplier

---

## 5.7 Product Catalog Domain

### Trách nhiệm

* Danh mục sản phẩm
* Brand
* Category
* Model
* Variant

### Entity

* Brand
* Category
* Product
* ProductVariant

---

## 5.8 Inventory Management Domain

### Trách nhiệm

* Kho
* IMEI
* Tồn kho
* Kiểm kho
* Điều chuyển

### Entity

* Warehouse
* WarehouseTransfer
* Inventory
* InventoryTransaction
* IMEI
* StockTake

---

## 5.9 Purchase Management Domain

### Trách nhiệm

* Nhập hàng
* Phiếu nhập

### Entity

* PurchaseOrder
* PurchaseOrderItem

---

## 5.10 Sales Management Domain

### Trách nhiệm

* Bán hàng
* POS
* Đơn hàng

### Entity

* SalesOrder
* SalesOrderItem

---

## 5.11 Invoice Domain

### Trách nhiệm

* Hóa đơn

### Entity

* Invoice
* InvoiceItem

---

## 5.12 Payment Domain

### Trách nhiệm

* Thanh toán

### Entity

* Payment
* PaymentMethod

---

## 5.13 Promotion Domain

### Trách nhiệm

* Voucher
* Khuyến mãi

### Entity

* Promotion
* Voucher

---

## 5.14 Warranty Domain

### Trách nhiệm

* Bảo hành
* Đổi máy

### Entity

* WarrantyTicket
* WarrantyHistory

---

## 5.15 Repair Domain

### Trách nhiệm

* Tiếp nhận
* Báo giá
* Sửa chữa
* Bàn giao

### Entity

* RepairTicket
* RepairStatusHistory
* RepairPart

---

## 5.16 Dashboard Domain

### Trách nhiệm

* KPI
* Dashboard
* Report

### Entity

Không có Entity riêng.

Dữ liệu được tổng hợp từ nhiều Domain.

---

## 5.17 Notification Domain

### Trách nhiệm

* Gửi thông báo
* Quản lý trạng thái đọc

### Entity

* Notification

---

## 5.18 File Management Domain

### Trách nhiệm

* Upload
* Quản lý tệp

### Entity

* FileAttachment

---

## 5.19 Audit Domain

### Trách nhiệm

* Nhật ký hệ thống

### Entity

* AuditLog

---

## 5.20 AI Assistant Domain

### Trách nhiệm

* Chat
* Tool Calling
* AI Session
* AI Memory
* RAG

### Entity

* AIConversation
* AIMessage
* AIToolCall
* AIKnowledgeDocument
* AIEmbedding

---

# 6. Domain Dependency

```text
Authentication
        │
Authorization
        │
User
        │
Branch
        │
 ├──────────────┐
 ▼              ▼
Customer     Product
                 │
                 ▼
            Inventory
                 │
      ┌──────────┴──────────┐
      ▼                     ▼
 Purchase                Sales
                              │
            ┌─────────────────┼────────────────┐
            ▼                 ▼                ▼
        Invoice          Warranty         Repair
                              │
                              ▼
                        Dashboard
                              │
                              ▼
                       AI Assistant
```

---

# 7. Bounded Context

| Domain       | Bounded Context                       |
| ------------ | ------------------------------------- |
| Identity     | Authentication + Authorization + User |
| Organization | Branch                                |
| CRM          | Customer                              |
| Catalog      | Product                               |
| Inventory    | Warehouse + Inventory + IMEI          |
| Purchasing   | Purchase                              |
| Sales        | Sales + Invoice + Payment             |
| Service      | Warranty + Repair                     |
| Platform     | Notification + File + Audit           |
| Intelligence | Dashboard + AI Assistant              |

---

# 8. Nguyên tắc giao tiếp giữa Domain

* Không truy cập trực tiếp Repository của Domain khác.
* Chỉ giao tiếp thông qua Service hoặc Event.
* Entity chỉ thuộc một Domain duy nhất.
* Mỗi Domain có Database Model riêng trong tầng Infrastructure.
* Không để Business Logic trải rộng qua nhiều Domain.

---

# 9. Mapping sang Clean Architecture

```text
Domain
│
├── Entities
├── Value Objects
├── Repository Interfaces
├── Domain Services
└── Domain Events

Application
│
├── Use Cases
├── Commands
├── Queries
└── DTO

Infrastructure
│
├── Database
├── Repository
├── External Services
└── AI Integration

Presentation
│
├── REST API
├── WebSocket
└── AI Gateway
```

---

# 10. Kết luận

Domain Model là nền tảng của toàn bộ thiết kế cơ sở dữ liệu và kiến trúc hệ thống. Tất cả Entity, Relationship, Migration, API, Service và AI Tool Calling trong các giai đoạn tiếp theo phải tuân thủ ranh giới Domain được xác định trong tài liệu này.

Tài liệu tiếp theo là **ENTITY_LIST.md**, trong đó sẽ liệt kê đầy đủ tất cả Entity của từng Domain cùng vai trò của chúng trước khi thiết kế ERD.
