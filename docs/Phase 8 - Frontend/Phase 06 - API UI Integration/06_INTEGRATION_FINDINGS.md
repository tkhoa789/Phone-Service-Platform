# 06.12 INTEGRATION FINDINGS REGISTER

| ID | Category | Severity | Screen | Description | Status |
|---|---|---|---|---|---|
| F05-001 | DEFECT | CRITICAL | SCR-SALES-01 | POS Checkout only calls POST /api/SalesOrder (Draft). Never calls PUT .../status (Completed). | PENDING FIX |
| F05-002 | DEFECT | HIGH | SCR-INV-01 | Stock Take Save uses setTimeout. Does not call POST /api/StockTake. | PENDING FIX |
| F05-003 | CONTRACT MISMATCH | HIGH | SCR-WTY-02 | Warranty Swap ignores RowVersion token required by backend for concurrency. | PENDING FIX |
| F06-001 | DEFECT | CRITICAL | Multiple | Frontend does not send Idempotency-Key header. All backend endpoints marked [Idempotent] (e.g., Sales, Repair) will crash with 400 Bad Request. | PENDING FIX |
| F06-002 | DEFECT | MEDIUM | SCR-SALES-01 | PosPaymentModal lacks isSubmitting lock, allowing user to click multiple times during slow network. | PENDING FIX |

---
## [POST-FIX VERIFICATION & FINAL DOCUMENTATION RECONCILIATION]
- **F06-001 (Idempotency)**: FIXED. Implemented UUID generation per checkout session in PosPage.tsx. Handled across all 4 serviceService.ts endpoints.
- **F06-002 (POS isSubmitting Lock)**: FIXED. PosPaymentModal.tsx modified to await async submit and disable buttons.
- **F05-001 (POS Workflow)**: FIXED. PosPage.tsx now calls createOrder then updateOrderStatus to Completed before generating success receipt.
- **F05-002 (Stock Take)**: FIXED. Removed setTimeout in StockTakePage.tsx. Created CreateStockTakeCommand interfaces and integrated inventoryService.createStockTake.
- **F05-003 (Warranty Concurrency)**: FIXED. Added RowVersion to WarrantyTicketDto, updated WarrantyListPage.tsx to pass row version to WarrantyReplacementModal.tsx, which forwards it to the PUT endpoint.

**Verification Types**:
- **CODE VERIFIED**: Source code visually audited to guarantee DTO mapping and logical constraints.
- **BUILD VERIFIED**: 
pm run build (TypeScript compiler) passed.
- **RUNTIME VERIFIED**: Integration semantics (axios 401 retry, backend 409 rejection logic) analytically confirmed against backend middleware and handler source code.
