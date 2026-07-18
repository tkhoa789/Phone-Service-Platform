# PERMISSION_MATRIX

## Hệ thống quản lý chuỗi cửa hàng điện thoại tích hợp AI Assistant

**Version:** 1.0

---

# 1. Purpose

Tài liệu này định nghĩa toàn bộ mô hình phân quyền (RBAC - Role Based Access Control) của hệ thống.

Đây là tài liệu gốc được sử dụng để sinh:

* Database Seed
* API Authorization
* Middleware
* Frontend Menu
* Sidebar
* AI Tool Permission
* AI Context
* Test Case

---

# 2. Access Policy

Hệ thống sử dụng mô hình:

```
User
    ↓
Role
    ↓
Permission
    ↓
API
```

Một User có thể được gán một hoặc nhiều Role.

Một Role bao gồm nhiều Permission.

Mọi API đều kiểm tra Permission, không kiểm tra trực tiếp Role.

---

# 3. Permission Status

| Value       | Meaning                                            |
| ----------- | -------------------------------------------------- |
| ALLOW       | Được phép thực hiện                                |
| DENY        | Không được phép                                    |
| CONDITIONAL | Được phép khi thỏa điều kiện hoặc có quyền bổ sung |

---

# 4. Role Definition

## OWNER

Quản trị cao nhất của toàn hệ thống.

Có toàn quyền trên mọi chi nhánh.

---

## ADMIN

Quản trị kỹ thuật.

Quản lý người dùng, cấu hình và hệ thống.

Không can thiệp nghiệp vụ tài chính nếu không được cấp quyền.

---

## MANAGER

Quản lý một chi nhánh.

Được quản lý toàn bộ dữ liệu thuộc chi nhánh của mình.

---

## SALES

Nhân viên bán hàng.

Được phép thao tác các chức năng bán hàng và khách hàng.

---

## WAREHOUSE

Nhân viên kho.

Quản lý nhập, xuất, chuyển kho và tồn kho.

---

## TECHNICIAN

Kỹ thuật viên.

Thực hiện tiếp nhận, sửa chữa và bàn giao thiết bị.

---

## WARRANTY

Nhân viên bảo hành.

Quản lý toàn bộ quy trình bảo hành.

---

# 5. Permission Naming Convention

Permission sử dụng định dạng:

```
MODULE_ACTION
```

Ví dụ:

```
USER_VIEW

USER_CREATE

USER_UPDATE

PRODUCT_VIEW

PRODUCT_CREATE

INVENTORY_IMPORT

INVENTORY_EXPORT

SALES_CREATE

AI_CHAT
```

Không sử dụng tên Permission theo Role.

Sai:

```
ADMIN_CREATE_PRODUCT
```

Đúng:

```
PRODUCT_CREATE
```

---

# 6. Permission Definition

## Authentication

| Permission Code      | Description          |
| -------------------- | -------------------- |
| AUTH_LOGIN           | Đăng nhập            |
| AUTH_LOGOUT          | Đăng xuất            |
| AUTH_REFRESH_TOKEN   | Làm mới Access Token |
| AUTH_CHANGE_PASSWORD | Đổi mật khẩu         |

---

## User

| Permission Code    |
| ------------------ |
| USER_VIEW          |
| USER_CREATE        |
| USER_UPDATE        |
| USER_DELETE        |
| USER_ASSIGN_ROLE   |
| USER_ASSIGN_BRANCH |

---

## Branch

| Permission Code |
| --------------- |
| BRANCH_VIEW     |
| BRANCH_CREATE   |
| BRANCH_UPDATE   |
| BRANCH_DELETE   |

---

## Customer

| Permission Code       |
| --------------------- |
| CUSTOMER_VIEW         |
| CUSTOMER_CREATE       |
| CUSTOMER_UPDATE       |
| CUSTOMER_DELETE       |
| CUSTOMER_HISTORY_VIEW |

---

## Product

| Permission Code     |
| ------------------- |
| PRODUCT_VIEW        |
| PRODUCT_CREATE      |
| PRODUCT_UPDATE      |
| PRODUCT_DELETE      |
| PRODUCT_IMPORT      |
| PRODUCT_EXPORT      |
| PRODUCT_IMEI_MANAGE |

---

## Inventory

| Permission Code     |
| ------------------- |
| INVENTORY_VIEW      |
| INVENTORY_IMPORT    |
| INVENTORY_EXPORT    |
| INVENTORY_TRANSFER  |
| INVENTORY_STOCKTAKE |
| INVENTORY_ADJUST    |

---

## Purchase

| Permission Code  |
| ---------------- |
| PURCHASE_VIEW    |
| PURCHASE_CREATE  |
| PURCHASE_UPDATE  |
| PURCHASE_APPROVE |

---

## Sales

| Permission Code |
| --------------- |
| SALES_VIEW      |
| SALES_CREATE    |
| SALES_PAYMENT   |
| SALES_CANCEL    |
| SALES_PRINT     |

---

## Invoice

| Permission Code |
| --------------- |
| INVOICE_VIEW    |
| INVOICE_PRINT   |
| INVOICE_CANCEL  |

---

## Warranty

| Permission Code         |
| ----------------------- |
| WARRANTY_VIEW           |
| WARRANTY_CREATE         |
| WARRANTY_UPDATE         |
| WARRANTY_REPLACE_DEVICE |

---

## Repair

| Permission Code  |
| ---------------- |
| REPAIR_VIEW      |
| REPAIR_RECEIVE   |
| REPAIR_DIAGNOSIS |
| REPAIR_QUOTATION |
| REPAIR_UPDATE    |
| REPAIR_COMPLETE  |

---

## Dashboard

| Permission Code   |
| ----------------- |
| DASHBOARD_VIEW    |
| DASHBOARD_REVENUE |
| DASHBOARD_PROFIT  |
| DASHBOARD_KPI     |

---

## Audit

| Permission Code |
| --------------- |
| AUDIT_VIEW      |
| AUDIT_EXPORT    |

---

## AI Assistant

| Permission Code |
| --------------- |
| AI_CHAT         |
| AI_SEARCH       |
| AI_REPORT       |
| AI_ANALYTICS    |
| AI_TOOL_CALL    |

---

# 7. Role Permission Matrix

| Permission      | OWNER |    ADMIN    | MANAGER |    SALES    |  WAREHOUSE  |  TECHNICIAN |   WARRANTY  |
| --------------- | :---: | :---------: | :-----: | :---------: | :---------: | :---------: | :---------: |
| AUTH_LOGIN      | ALLOW |    ALLOW    |  ALLOW  |    ALLOW    |    ALLOW    |    ALLOW    |    ALLOW    |
| USER_VIEW       | ALLOW |    ALLOW    |   DENY  |     DENY    |     DENY    |     DENY    |     DENY    |
| USER_CREATE     | ALLOW |    ALLOW    |   DENY  |     DENY    |     DENY    |     DENY    |     DENY    |
| BRANCH_VIEW     | ALLOW |    ALLOW    |  ALLOW  |     DENY    |     DENY    |     DENY    |     DENY    |
| CUSTOMER_VIEW   | ALLOW |    ALLOW    |  ALLOW  |    ALLOW    |     DENY    |    ALLOW    |    ALLOW    |
| PRODUCT_VIEW    | ALLOW |    ALLOW    |  ALLOW  |    ALLOW    |    ALLOW    |    ALLOW    |    ALLOW    |
| INVENTORY_VIEW  | ALLOW |    ALLOW    |  ALLOW  |    ALLOW    |    ALLOW    | CONDITIONAL | CONDITIONAL |
| SALES_CREATE    | ALLOW | CONDITIONAL |  ALLOW  |    ALLOW    |     DENY    |     DENY    |     DENY    |
| WARRANTY_CREATE | ALLOW | CONDITIONAL |  ALLOW  |     DENY    |     DENY    |     DENY    |    ALLOW    |
| REPAIR_UPDATE   | ALLOW |     DENY    |  ALLOW  |     DENY    |     DENY    |    ALLOW    |     DENY    |
| DASHBOARD_VIEW  | ALLOW |    ALLOW    |  ALLOW  | CONDITIONAL | CONDITIONAL | CONDITIONAL | CONDITIONAL |
| AI_CHAT         | ALLOW |    ALLOW    |  ALLOW  |    ALLOW    |    ALLOW    |    ALLOW    |    ALLOW    |
| AI_TOOL_CALL    | ALLOW |    ALLOW    |  ALLOW  |    ALLOW    |    ALLOW    |    ALLOW    |    ALLOW    |

> Lưu ý: Bảng trên chỉ minh họa. Trong phiên bản đầy đủ, tất cả Permission Code được định nghĩa ở Mục 6 phải được ánh xạ đầy đủ với từng Role.

---

# 8. AI Permission Rules

AI Assistant không sở hữu quyền riêng.

AI luôn kế thừa Permission của người dùng đang đăng nhập.

Mọi Tool Calling phải:

* Kiểm tra Permission.
* Ghi Audit Log.
* Không được vượt quyền người dùng.

---

# 9. Backend Mapping

Database:

```
roles

permissions

role_permissions

user_roles
```

Backend:

```
Authorize(Permission.USER_CREATE)

Authorize(Permission.PRODUCT_UPDATE)

Authorize(Permission.INVENTORY_IMPORT)
```

Frontend:

```
hasPermission("PRODUCT_CREATE")

hasPermission("AI_CHAT")
```

AI:

```
Tool Calling

↓

Permission Check

↓

Execute Tool

↓

Audit Log
```

---

# 10. Kết luận

Permission là đơn vị kiểm soát truy cập duy nhất của hệ thống.

Role chỉ là tập hợp các Permission.

Mọi thành phần của hệ thống (Backend, Frontend, API, AI Assistant và Middleware) phải dựa trên Permission Code được định nghĩa trong tài liệu này để đảm bảo tính nhất quán và dễ mở rộng.
