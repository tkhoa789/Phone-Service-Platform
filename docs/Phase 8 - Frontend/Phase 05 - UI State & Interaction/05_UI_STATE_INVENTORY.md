# 05.1b UI STATE INVENTORY

## Screen Inventory (Observed in Frontend)

| Screen Module | Phase 04 Status | Existing Frontend Component | Notes |
|---|---|---|---|
| Sales (POS) | SCR-SALES-01 | src/pages/sales/PosPage.tsx | Legacy useState architecture. |
| Sales (POS Modal) | SCR-SALES-02 | src/components/pos/PosPaymentModal.tsx | Found as a modal inside PosPage. |
| Warranty (Intake) | SCR-WTY-01 | src/pages/warranties/WarrantyListPage.tsx | Handled via modals from the list page. |
| Warranty (Processing) | SCR-WTY-02 | src/components/warranties/WarrantyReplacementModal.tsx | Handles swap operation. |
| Inventory (Stock Take) | SCR-INV-01 | src/pages/inventory/StockTakePage.tsx | Legacy architecture, fake API call. |

## Undocumented Screens (Found in Frontend)
The frontend contains several screens that were marked as GAPs in Phase 04, as well as totally new screens.

| Module | Screen Component | Phase 04 Status | Backend Capability Mapping |
|---|---|---|---|
| Repair | RepairIntakePage.tsx, RepairListPage.tsx | GAP (GAP-SCR-01) | OBSERVED (Phase 03) |
| Procurement | PurchaseOrderListPage.tsx, PurchaseOrderFormModal.tsx | GAP (GAP-SCR-02) | OBSERVED (Phase 03) |
| Warehouse | WarehouseTransferModal.tsx | GAP (GAP-SCR-03) | OBSERVED (Phase 03) |
| AI | AiChatPage.tsx | NOT ESTABLISHED | TBD (Risk of Scope Creep) |
| System | SystemSettingsPage.tsx, AuditLogPage.tsx | NOT ESTABLISHED | TBD |
