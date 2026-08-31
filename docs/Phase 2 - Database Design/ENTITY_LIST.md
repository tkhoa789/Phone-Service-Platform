# ENTITY_LIST

## Hệ thống quản lý chuỗi cửa hàng điện thoại tích hợp AI Assistant

**Version:** 1.0

---

# 1. Mục đích

Tài liệu này liệt kê toàn bộ Entity của hệ thống.

Đây là tài liệu đầu vào cho:

* ERD
* Database Dictionary
* Migration
* Repository
* Service
* API Design

---

# 2. Quy ước

| Thuộc tính     | Ý nghĩa                                             |
| -------------- | --------------------------------------------------- |
| Domain         | Domain sở hữu Entity                                |
| Aggregate Root | Entity gốc của Aggregate                            |
| Parent         | Entity cha (nếu có)                                 |
| Soft Delete    | Có sử dụng xóa mềm                                  |
| Audit          | Ghi nhận CreatedBy, UpdatedBy, CreatedAt, UpdatedAt |

---

# 3. Authentication Domain

| Entity       | Aggregate Root | Parent | Soft Delete | Audit | Mô tả             |
| ------------ | -------------- | ------ | ----------- | ----- | ----------------- |
| RefreshToken | User           | User   | No          | Yes   | Lưu Refresh Token |
| LoginHistory | User           | User   | No          | Yes   | Lịch sử đăng nhập |

---

# 4. Authorization Domain

| Entity         | Aggregate Root | Parent | Soft Delete | Audit | Mô tả                    |
| -------------- | -------------- | ------ | ----------- | ----- | ------------------------ |
| Role           | Role           | -      | Yes         | Yes   | Vai trò hệ thống         |
| Permission     | Permission     | -      | Yes         | Yes   | Quyền truy cập           |
| RolePermission | Role           | Role   | No          | Yes   | Ánh xạ Role - Permission |
| UserRole       | User           | User   | No          | Yes   | Ánh xạ User - Role       |

---

# 5. User Management Domain

| Entity | Aggregate Root | Parent | Soft Delete | Audit | Mô tả              |
| ------ | -------------- | ------ | ----------- | ----- | ------------------ |
| User   | User           | -      | Yes         | Yes   | Nhân viên hệ thống |

---

# 6. Branch Management Domain

| Entity | Aggregate Root | Parent | Soft Delete | Audit | Mô tả              |
| ------ | -------------- | ------ | ----------- | ----- | ------------------ |
| Branch | Branch         | -      | Yes         | Yes   | Chi nhánh cửa hàng |

---

# 7. Customer Management Domain

| Entity   | Aggregate Root | Parent | Soft Delete | Audit | Mô tả      |
| -------- | -------------- | ------ | ----------- | ----- | ---------- |
| Customer | Customer       | -      | Yes         | Yes   | Khách hàng |

---

# 8. Supplier Management Domain

| Entity                  | Aggregate Root | Parent   | Soft Delete | Audit | Mô tả                       |
| ----------------------- | -------------- | -------- | ----------- | ----- | --------------------------- |
| Supplier                | Supplier       | -        | Yes         | Yes   | Nhà cung cấp                |
| SupplierDebtTransaction | Supplier       | Supplier | No          | Yes   | Lịch sử công nợ nhà cung cấp |

---

# 9. Product Catalog Domain

| Entity         | Aggregate Root | Parent  | Soft Delete | Audit | Mô tả              |
| -------------- | -------------- | ------- | ----------- | ----- | ------------------ |
| Brand          | Brand          | -       | Yes         | Yes   | Thương hiệu        |
| Category       | Category       | -       | Yes         | Yes   | Danh mục sản phẩm  |
| Product        | Product        | -       | Yes         | Yes   | Dòng sản phẩm      |
| ProductVariant | Product        | Product | Yes         | Yes   | Phiên bản sản phẩm |

---

# 10. Inventory Management Domain

| Entity                | Aggregate Root    | Parent            | Soft Delete | Audit | Mô tả                 |
| --------------------- | ----------------- | ----------------- | ----------- | ----- | --------------------- |
| Warehouse             | Warehouse         | Branch            | Yes         | Yes   | Kho hàng              |
| Inventory             | Warehouse         | Warehouse         | No          | Yes   | Tồn kho               |
| InventoryTransaction  | Warehouse         | Warehouse         | No          | Yes   | Lịch sử nhập/xuất kho |
| WarehouseTransfer     | WarehouseTransfer | -                 | No          | Yes   | Phiếu chuyển kho      |
| WarehouseTransferItem | WarehouseTransfer | WarehouseTransfer | No          | Yes   | Chi tiết chuyển kho   |
| StockTake             | Warehouse         | Warehouse         | No          | Yes   | Phiếu kiểm kho        |
| StockTakeItem         | StockTake         | StockTake         | No          | Yes   | Chi tiết kiểm kho     |
| IMEI                  | ProductVariant    | ProductVariant    | No          | Yes   | Thiết bị theo IMEI    |

---

# 11. Purchase Management Domain

| Entity            | Aggregate Root | Parent        | Soft Delete | Audit | Mô tả               |
| ----------------- | -------------- | ------------- | ----------- | ----- | ------------------- |
| PurchaseOrder     | PurchaseOrder  | -             | No          | Yes   | Phiếu nhập hàng     |
| PurchaseOrderItem | PurchaseOrder  | PurchaseOrder | No          | Yes   | Chi tiết phiếu nhập |

---

# 12. Sales Management Domain

| Entity         | Aggregate Root | Parent     | Soft Delete | Audit | Mô tả             |
| -------------- | -------------- | ---------- | ----------- | ----- | ----------------- |
| SalesOrder     | SalesOrder     | -          | No          | Yes   | Đơn bán hàng      |
| SalesOrderItem | SalesOrder     | SalesOrder | No          | Yes   | Chi tiết đơn hàng |

---

# 13. Invoice Domain

| Entity      | Aggregate Root | Parent  | Soft Delete | Audit | Mô tả            |
| ----------- | -------------- | ------- | ----------- | ----- | ---------------- |
| Invoice     | Invoice        | -       | No          | Yes   | Hóa đơn          |
| InvoiceItem | Invoice        | Invoice | No          | Yes   | Chi tiết hóa đơn |

---

# 14. Payment Domain

| Entity        | Aggregate Root | Parent  | Soft Delete | Audit | Mô tả                  |
| ------------- | -------------- | ------- | ----------- | ----- | ---------------------- |
| Payment       | Payment        | Invoice | No          | Yes   | Thanh toán             |
| PaymentMethod | PaymentMethod  | -       | Yes         | Yes   | Phương thức thanh toán |

---

# 15. Promotion Domain

| Entity    | Aggregate Root | Parent    | Soft Delete | Audit | Mô tả                   |
| --------- | -------------- | --------- | ----------- | ----- | ----------------------- |
| Promotion | Promotion      | -         | Yes         | Yes   | Chương trình khuyến mãi |
| Voucher   | Voucher        | Promotion | Yes         | Yes   | Mã giảm giá             |

---

# 16. Warranty Domain

| Entity          | Aggregate Root | Parent         | Soft Delete | Audit | Mô tả            |
| --------------- | -------------- | -------------- | ----------- | ----- | ---------------- |
| WarrantyTicket  | WarrantyTicket | -              | No          | Yes   | Phiếu bảo hành   |
| WarrantyHistory | WarrantyTicket | WarrantyTicket | No          | Yes   | Lịch sử bảo hành |

---

# 17. Repair Domain

| Entity              | Aggregate Root | Parent       | Soft Delete | Audit | Mô tả                       |
| ------------------- | -------------- | ------------ | ----------- | ----- | --------------------------- |
| RepairTicket        | RepairTicket   | -            | No          | Yes   | Phiếu sửa chữa              |
| RepairPart          | RepairTicket   | RepairTicket | No          | Yes   | Linh kiện thay thế          |
| RepairStatusHistory | RepairTicket   | RepairTicket | No          | Yes   | Lịch sử trạng thái sửa chữa |
| RepairChecklist     | RepairTicket   | RepairTicket | No          | Yes   | Danh sách kiểm tra thiết bị |
| RepairChecklistItem | RepairTicket   | RepairChecklist | No       | Yes   | Chi tiết bước kiểm tra      |
| RepairDeposit       | RepairTicket   | RepairTicket | No          | Yes   | Quản lý tiền cọc            |

---

# 18. Notification Domain

| Entity       | Aggregate Root | Parent | Soft Delete | Audit | Mô tả              |
| ------------ | -------------- | ------ | ----------- | ----- | ------------------ |
| Notification | Notification   | -      | Yes         | Yes   | Thông báo hệ thống |

---

# 19. File Management Domain

| Entity         | Aggregate Root | Parent | Soft Delete | Audit | Mô tả        |
| -------------- | -------------- | ------ | ----------- | ----- | ------------ |
| FileAttachment | FileAttachment | -      | Yes         | Yes   | Tệp đính kèm |

---

# 20. Audit Domain

| Entity   | Aggregate Root | Parent | Soft Delete | Audit | Mô tả                     |
| -------- | -------------- | ------ | ----------- | ----- | ------------------------- |
| AuditLog | AuditLog       | -      | No          | Yes   | Nhật ký thao tác hệ thống |

---

# 21. AI Assistant Domain

| Entity              | Aggregate Root      | Parent              | Soft Delete | Audit | Mô tả                     |
| ------------------- | ------------------- | ------------------- | ----------- | ----- | ------------------------- |
| AIConversation      | AIConversation      | -                   | No          | Yes   | Phiên hội thoại AI        |
| AIMessage           | AIConversation      | AIConversation      | No          | Yes   | Tin nhắn hội thoại        |
| AIToolCall          | AIConversation      | AIConversation      | No          | Yes   | Lịch sử Tool Calling      |
| AIKnowledgeDocument | AIKnowledgeDocument | -                   | Yes         | Yes   | Tài liệu tri thức cho RAG |
| AIEmbedding         | AIKnowledgeDocument | AIKnowledgeDocument | No          | Yes   | Vector Embedding          |

---

# 21. Idempotency Domain

| Entity            | Aggregate Root | Parent | Soft Delete | Audit | Mô tả                              |
| ----------------- | -------------- | ------ | ----------- | ----- | ---------------------------------- |
| IdempotencyRecord | -              | -      | No          | Yes   | Chống trùng lặp request API (CQRS) |

---

# 22. Thống kê Entity

| Domain               | Số Entity |
| -------------------- | --------: |
| Authentication       |         2 |
| Authorization        |         4 |
| User Management      |         1 |
| Branch Management    |         1 |
| Customer Management  |         1 |
| Supplier Management  |         2 |
| Product Catalog      |         4 |
| Inventory Management |         8 |
| Purchase Management  |         2 |
| Sales Management     |         2 |
| Invoice Domain       |         2 |
| Payment Domain       |         2 |
| Promotion Domain     |         2 |
| Warranty Domain      |         2 |
| Repair Domain        |         6 |
| Notification Domain  |         1 |
| File Management      |         1 |
| Audit Domain         |         1 |
| Idempotency Domain   |         1 |
| AI Assistant Domain  |         5 |

**Tổng cộng: 49 Entity**

---

# 23. Phân loại Entity

## Master Data

* User
* Role
* Permission
* Branch
* Customer
* Supplier
* Brand
* Category
* Product
* ProductVariant
* Warehouse
* PaymentMethod
* Promotion
* Voucher

---

## Transaction Data

* PurchaseOrder
* PurchaseOrderItem
* SalesOrder
* SalesOrderItem
* Invoice
* InvoiceItem
* Payment
* WarrantyTicket
* WarrantyHistory
* RepairTicket
* RepairPart
* RepairStatusHistory
* RepairChecklist
* RepairChecklistItem
* RepairDeposit
* WarehouseTransfer
* WarehouseTransferItem
* InventoryTransaction
* StockTake
* StockTakeItem
* SupplierDebtTransaction

---

## System Data

* RefreshToken
* LoginHistory
* UserRole
* RolePermission
* Notification
* FileAttachment
* AuditLog
* IdempotencyRecord
* AIConversation
* AIMessage
* AIToolCall
* AIKnowledgeDocument
* AIEmbedding

---

# 24. Kết luận

Danh sách Entity trong tài liệu này là cơ sở để thiết kế **ERD**, xác định khóa chính/khóa ngoại, xây dựng `DATABASE_DICTIONARY.md` và lập kế hoạch Migration. Mỗi Entity sẽ được mô tả chi tiết về cấu trúc cột và ràng buộc ở các tài liệu tiếp theo.
