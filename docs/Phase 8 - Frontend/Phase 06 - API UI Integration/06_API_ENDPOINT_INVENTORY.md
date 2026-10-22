# 06.1 API ENDPOINT INVENTORY

> **Audit Scope:** Backend API Controllers identified in PSP.API/Controllers

## Core Mapped Endpoints

| Controller | Method | Route | Auth | Request DTO | Response | Validations / Modifiers |
|---|---|---|---|---|---|---|
| SalesOrder | POST | /api/SalesOrder | Roles=Owner,Admin,Manager,Sales | CreateSalesOrderCommand | ApiResponse<Guid> | [Idempotent] |
| SalesOrder | PUT | /api/SalesOrder/{id}/status | Standard Branch Context | UpdateSalesOrderStatusCommand | ApiResponse<bool> | EF Concurrency (Implicit) |
| WarrantyTicket | POST | /api/WarrantyTicket | Roles=...,Technician | CreateWarrantyTicketCommand | ApiResponse<Guid> | BR-901, BR-902 |
| WarrantyTicket | PUT | /api/WarrantyTicket/{id}/status | Roles=... | UpdateWarrantyStatusCommand | ApiResponse<bool> | Explicit RowVersion pre-flight |
| StockTake | POST | /api/StockTake | Roles=Manager,Admin,Owner | CreateStockTakeCommand | ApiResponse<Guid> | - |
| RepairTicket | POST | /api/RepairTicket | Roles=...,Technician | CreateRepairTicketCommand | ApiResponse<Guid> | [Idempotent] |
| RepairTicket | PUT | /api/RepairTicket/{id}/status | Roles=... | UpdateRepairStatusCommand | ApiResponse<bool> | [Idempotent] |
| RepairTicket | POST | /api/RepairTicket/part | Roles=... | AddRepairPartCommand | ApiResponse<Guid> | [Idempotent] |
| PurchaseOrder | POST | /api/PurchaseOrder | Roles=Owner,Admin,Manager | CreatePurchaseOrderCommand| ApiResponse<Guid> | - |

*Note: There are 26 controllers in total. This table highlights the critical business workflows mapped in previous phases.*
