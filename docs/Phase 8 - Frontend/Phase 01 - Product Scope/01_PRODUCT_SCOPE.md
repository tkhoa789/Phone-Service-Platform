> **Baseline Revision Note:**
> This Phase 01 document represents the initial scope extraction.
> Later phases (02, 03, Foundation) contain deeper verified evidence that supersedes initial INFERRED/UNKNOWN findings.
> When conflicts occur, apply the Source-of-Truth Hierarchy.
# 01. PRODUCT SCOPE

## Evidence Policy
This document distinguishes findings by confidence:
- **CONFIRMED** â€” directly verified from source code/configuration.
- **INFERRED** â€” reasonably derived from multiple backend artifacts but not explicitly stated.
- **UNKNOWN** â€” insufficient evidence.
- **CONTRADICTION** â€” conflicting evidence found.

---

## 1. Product
Phone Store Chain Management System integrated with Local AI Assistant.

## 2. Product Purpose
Há»‡ thá»‘ng ERP/POS quáº£n trá»‹ chuá»—i cá»­a hÃ ng bÃ¡n láº» vÃ  sá»­a chá»¯a thiáº¿t bá»‹ di Ä‘á»™ng, táº­p trung vÃ o nghiá»‡p vá»¥ ná»™i bá»™ (Back-office & POS) vÃ  há»— trá»£ váº­n hÃ nh báº±ng AI.

## 3. Modules & Features
* **Authentication**: Login, Token management.
* **Administration**: User, Branch, System Settings, Audit Logs.
* **Catalog**: Category, Brand, Product.
* **Customer**: Customer profile, Loyalty.
* **Purchase**: Supplier, Purchase Order.
* **Inventory**: Warehouse, Transfer, Stock Take, Inventory tracking.
* **Sales**: Sales Order, Promotion, Voucher.
* **Billing**: Invoice.
* **After-sales**: Repair Ticket, Warranty Ticket.
* **AI**: Internal RAG & Assistant capabilities.
* **Shared**: Dashboard, File Attachment, Notification.

## 4. Controller Inventory
25 business/API controllers were identified.

| # | Controller | Module | Primary Responsibility | Status |
|---|---|---|---|---|
| 1 | `AuthController` | Authentication | Authentication & Tokens | CONFIRMED |
| 2 | `UserController` | Administration | User management | CONFIRMED |
| 3 | `BranchController` | Administration | Branch management | CONFIRMED |
| 4 | `SystemSettingsController`| Administration | Global settings | CONFIRMED |
| 5 | `AuditLogController` | Administration | System audit logs | CONFIRMED |
| 6 | `CategoryController` | Catalog | Category management | CONFIRMED |
| 7 | `BrandController` | Catalog | Brand management | CONFIRMED |
| 8 | `ProductController` | Catalog | Product & Variant management | CONFIRMED |
| 9 | `CustomerController` | Customer | Customer & Loyalty | CONFIRMED |
| 10 | `SupplierController` | Purchase | Supplier & Debt management | CONFIRMED |
| 11 | `PurchaseOrderController` | Purchase | PO creation & approval | CONFIRMED |
| 12 | `WarehouseController` | Inventory | Warehouse definition | CONFIRMED |
| 13 | `InventoryController` | Inventory | Stock tracking | CONFIRMED |
| 14 | `WarehouseTransferController`| Inventory | Inter-branch transfers | CONFIRMED |
| 15 | `StockTakeController` | Inventory | Stock taking | CONFIRMED |
| 16 | `SalesOrderController` | Sales | POS Sales Orders | CONFIRMED |
| 17 | `PromotionController` | Sales | Promotion campaigns | CONFIRMED |
| 18 | `VoucherController` | Sales | Voucher issuance | CONFIRMED |
| 19 | `InvoiceController` | Billing | Financial invoices | CONFIRMED |
| 20 | `RepairTicketController`| After-sales | Repair workflow | CONFIRMED |
| 21 | `WarrantyTicketController`| After-sales | Warranty workflow | CONFIRMED |
| 22 | `AIController` | AI | Chatbot & Tool Calling | CONFIRMED |
| 23 | `DashboardController` | Shared | Statistics reporting | CONFIRMED |
| 24 | `FileAttachmentController`| Shared | File uploads | CONFIRMED |
| 25 | `NotificationController`| Shared | System notifications | CONFIRMED |

### Core / Infrastructure Controllers
- `BaseApiController` â€” shared controller base implementation.

## 5. Actors
| Role | Evidence | Confidence |
|---|---|---|
| Owner | `[Authorize(Roles="Owner...")]` in Controllers | CONFIRMED |
| Admin | `[Authorize(Roles="Admin...")]` in Controllers | CONFIRMED |
| Manager | `[Authorize(Roles="Manager...")]` in Controllers | CONFIRMED |
| Sales | `[Authorize(Roles="...Sales...")]` in Controllers | CONFIRMED |
| Receptionist | `[Authorize(Roles="...Receptionist...")]` in Controllers | CONFIRMED |
| Technician | `[Authorize(Roles="...Technician...")]` in Controllers | CONFIRMED |

## 6. Authorization Model
The backend uses ASP.NET Core authorization mechanisms.
Role and permission enforcement must be verified from:
- `[Authorize]` attributes in Controllers.
- Role claims and policies (to be verified in next phases).
- Application-level business authorization checks in CQRS Handlers.

## 7. Core Entities
`User`, `Role`, `Branch`, `Product`, `ProductVariant`, `Supplier`, `Customer`, `PurchaseOrder`, `SalesOrder`, `Invoice`, `WarehouseTransfer`, `RepairTicket`, `WarrantyTicket`, `AuditLog`, `IdempotencyRecord`, `Notification`, `AIConversation`.

## 8. Preliminary Domain Relationship Summary
These relationships are preliminary findings from the initial scope pass. They MUST be validated against entity navigation properties, EF Core configurations, foreign keys, and database schema in the Domain Analysis phase.

- Product â†’ ProductVariant
- Branch â†’ Warehouse
- Customer â†’ SalesOrder
- SalesOrder â†’ Invoice
- RepairTicket â†’ Invoice
- ProductVariant â†’ Inventory

## 9. Backend Product Capabilities
### CAP-REPAIR-001
- **Capability:** Assign technician to repair ticket.
- **Source:** `RepairTicketController`
- **Evidence:** `PUT /api/RepairTickets/{id}/assign-technician` (INFERRED based on standard routes, to be confirmed in Phase 02/03)
- **Confidence:** INFERRED
- **Frontend implication:** Candidate UI capability only. Status: PENDING CONFIRMATION. Must be confirmed before becoming a mandatory frontend requirement.

### CAP-SALES-001
- **Capability:** Create POS Sales Order.
- **Source:** `SalesOrderController`
- **Evidence:** `SalesOrderController` contains a `POST` action mapped to `/api/SalesOrder`.
- **Request:** `<CreateSalesOrderCommand>` (to be fully verified)
- **Response:** `<Guid>` or `<SalesOrderDto>`
- **Authorization:** UNKNOWN
- **Confidence:** CONFIRMED
- **Frontend implication:** Need a POS screen to select variants and create orders.

## 10. Technical Capabilities
- REST API implementation.
- CQRS via MediatR.
- Global Exception Handling.
- Concurrency Control (RowVersion).
- Idempotency handling.
- Soft Delete.
- JWT Bearer Token Security.

## 11. Out of Scope
### B2C E-commerce
- **Status:** CONFIRMED
- **Evidence:** No customer-facing storefront/order API was identified among the current controller/API inventory.
- **Implication:** Frontend should not implement public e-commerce checkout unless explicitly requested as a new requirement.

### HR / Payroll
- **Status:** CONFIRMED
- **Evidence:** No endpoints for salary, attendance, or timesheets.
- **Implication:** Frontend should not build HR modules.

## 12. Unknowns
- **Payment Gateway:** How are external payments (VNPay, Momo) processed? Are there webhooks? (UNKNOWN)
- **Promotion Stacking:** Can multiple vouchers/promotions be applied to one SalesOrder? (UNKNOWN)
- **AI Tool Execution:** Does the AI backend execute internal API calls automatically or does it return tool_call instructions for the Frontend to execute? (UNKNOWN)
- **Notification Delivery:** Does the system push SMS/Email directly, or just in-app alerts? (UNKNOWN)
- **Warranty Eligibility:** How is the exact warranty expiration calculated mathematically in the handler? (UNKNOWN)

## 13. Contradictions
### Current Status
No contradictions have been identified during the current scope extraction pass.

This does NOT imply that the backend is contradiction-free.
Contradictions must be continuously checked during API analysis, Domain analysis, Workflow analysis, and Database analysis. Any contradiction discovered later MUST be recorded here.

## 14. Source-of-Truth Hierarchy
When information conflicts, use the following precedence:
1. Verified runtime behavior in the target environment (If runtime behavior is affected by environment-specific configuration, the configuration MUST be recorded as evidence).
2. Backend source code
3. Database schema / constraints
4. API contracts / DTOs
5. Authorization configuration
6. Existing automated tests
7. Existing documentation
8. Student inference
9. AI inference

AI MUST NOT treat inference as confirmed business behavior. When higher and lower levels conflict, record a CONTRADICTION and request clarification where necessary.

## 15. Frontend Implications
Based on the currently confirmed backend capabilities, the frontend is expected to provide interfaces for:
- Authentication & System administration
- Catalog & Customer management
- Supplier & Purchase management
- Inventory & Stock management
- Sales/POS & Billing
- Repair and Warranty processing
- AI Chat assistant
- Dashboard and Notifications

The exact screen list MUST be derived in `04_SCREEN_MAP.md`.
**No screen should be created solely because a backend entity exists. Each screen must have a defined user/business purpose.**

### Frontend Derivation Rule
Frontend requirements MUST be derived from backend capabilities, business workflows, authorization rules, and user/business purposes.

The frontend MUST NOT:
- invent unsupported backend capabilities;
- assume undocumented business rules;
- expose unauthorized actions;
- create screens solely from database entities;
- treat inferred behavior as confirmed requirements.

## 16. Scope Coverage
| Area | Expected | Discovered | Status |
|---|---:|---:|---|
| Business Controllers | 25 | 25 | PASS |
| Business Modules | 11 | 11 | PASS |
| Actors | 6 | 6 | PASS |
| Core Entities | TBD | TBD | IN PROGRESS |
| API Endpoints | TBD | TBD | IN PROGRESS |
| Workflows | TBD | TBD | IN PROGRESS |

## 17. Open Questions
### Q-001 â€” Payment Processing
- **Question:** Does the system support external payment gateways?
- **Evidence:** No confirmed gateway integration found during scope pass.
- **Impact:** Affects Sales / Invoice UI and payment workflow.
- **Owner:** Business / Senior
- **Status:** OPEN

