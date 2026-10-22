# 03.1 BUSINESS ACTORS

## Master Actor Inventory

| Technical Role | Business Persona | CONFIRMED Scope | Evidence Source |
|---|---|---|---|
| **Owner** | Chủ doanh nghiệp (INFERRED) | Global access, bypasses BranchId isolation (IsGlobalAdmin = true). | CurrentUserService.cs:L28, [Authorize(Roles="Owner...")] |
| **Admin** | Quản trị IT (INFERRED) | Global access, bypasses BranchId isolation (IsGlobalAdmin = true). | CurrentUserService.cs:L28, [Authorize(Roles="Admin...")] |
| **Manager** | Quản lý chi nhánh (INFERRED) | Branch-scoped operations (Sales, Repair, Inventory, Warehouse). | *CommandHandlers.cs (_currentUserService.BranchId checks), [Authorize(Roles="...Manager...")] |
| **Sales** | Nhân viên bán hàng (INFERRED) | Branch-scoped Sales Order creation, Warranty operations. | SalesOrderController.cs, WarrantyTicketController.cs |
| **Receptionist** | Lễ tân / Thu ngân (INFERRED) | Branch-scoped Repair Ticket deposits, Invoices. | RepairTicketController.cs, InvoiceController.cs |
| **Technician** | Kỹ thuật viên (INFERRED) | Branch-scoped Repair updates, checklists, parts. | RepairTicketController.cs:L44 |

## Technical Implementation vs Business Intent
- **Technical Fact (CONFIRMED):** The application relies on ClaimTypes.Role and a custom "BranchId" claim.
- **Contextual Execution (OBSERVED):** For the six audited modules, branch-context checks were identified in the relevant handlers (ICurrentUserService.BranchId), with IsGlobalAdmin providing the observed Admin/Owner bypass.
- **Domain Identity (UNKNOWN):** There is no explicit User aggregate acting directly inside Domain models. Instead, domain models record Guid ActorId or Guid CreatedBy statically.
