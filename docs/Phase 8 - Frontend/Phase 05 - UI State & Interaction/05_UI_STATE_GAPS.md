# 05.7 UI STATE GAPS & FINDINGS

## F05-001: POS Checkout Creates Draft, Not Completed
- **Category:** DEFECT
- **Screen:** SCR-SALES-01
- **Finding:** The UI "Payment Modal" only calls createOrder (which creates a Draft order). It falsely reports "Order paid successfully" and prints a receipt without ever calling updateOrderStatus to transition the order to Completed and deduct inventory.
- **Expected Behavior:** handleConfirmPayment should call createOrder, retrieve the ID, and then call updateOrderStatus(id, 'Completed').
- **Impact:** Severe. Inventory is not deducted, revenue is not recognized, orders remain stuck in Draft.
- **Owner Phase:** Phase 06 (API Integration)
- **Implementation:** DEFERRED

## F05-002: Stock Take Execution is Mocked
- **Category:** DEFECT
- **Screen:** SCR-INV-01
- **Finding:** handleBulkSave in StockTakePage.tsx uses a setTimeout to fake a delay and does NOT call POST /api/StockTake.
- **Expected Behavior:** Must integrate with inventoryService.createStockTake.
- **Impact:** Stock takes are not saved to the backend.
- **Owner Phase:** Phase 06 (API Integration)
- **Implementation:** DEFERRED

## F05-003: Warranty Swap Ignores Concurrency Token
- **Category:** DEFECT
- **Screen:** SCR-WTY-02
- **Finding:** WarrantyReplacementModal.tsx calls updateWarrantyStatus without providing RowVersion.
- **Expected Behavior:** Must pass RowVersion to satisfy EF Core concurrency protection defined in Phase 03/04.
- **Impact:** 
  - Request may fail validation/concurrency requirements.
  - The intended optimistic concurrency protection is not correctly exercised by the UI.
  - Exact runtime behavior must be verified in Phase 06.
- **Owner Phase:** Phase 06 (API Integration)
- **Implementation:** DEFERRED
