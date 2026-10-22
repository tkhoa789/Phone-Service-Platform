# 06.5 WORKFLOW INTEGRATION TRACE

## A. Sales Order
1. **Action:** User clicks "Confirm Payment" in POS.
2. **Frontend:** PosPage.tsx calls salesService.createOrder (synchronously closing the modal).
3. **HTTP:** POST /api/SalesOrder (Without Idempotency-Key).
4. **Backend:** Rejects with 400 Bad Request (Idempotency missing).
5. **Expected Backend (if fixed):** CreateSalesOrderCommand ➔ SalesOrderEntity (Draft).
6. **Defect:** Frontend stops here and shows "Paid successfully". It NEVER calls PUT /api/SalesOrder/{id}/status ➔ Completed. Thus, inventory is never deducted.

## B. Warranty Swap
1. **Action:** User enters Replacement IMEI and submits.
2. **Frontend:** WarrantyReplacementModal.tsx calls updateWarrantyStatus(id, 'Completed', imei).
3. **HTTP:** PUT /api/WarrantyTicket/{id}/status. Missing RowVersion.
4. **Backend:** Backend rejects the request with HTTP 409 when RowVersion is missing. Therefore the UI cannot complete the Swap operation until the concurrency token is supplied.
5. **Defect:** Optimistic Concurrency protection is bypassed or broken by the UI.

## C. Stock Take
1. **Action:** User clicks "Save Audit".
2. **Frontend:** StockTakePage.tsx calls setTimeout fake API.
3. **HTTP:** None.
4. **Backend:** Capability exists (POST /api/StockTake), but is unexercised.
5. **Defect:** Complete frontend integration mock.

## D. Repair (New Discovery)
1. **Action:** User submits Repair Intake form.
2. **Frontend:** RepairIntakePage.tsx calls serviceService.createRepairTicket.
3. **HTTP:** POST /api/RepairTicket. Missing Idempotency-Key.
4. **Backend:** Rejects with 400 Bad Request.

---
## POST-FIX VERIFICATION
- **POS Workflow**: FIXED. PosPage.tsx now orchestrates createOrder -> receives orderId -> calls updateOrderStatus('Completed') to ensure inventory deduction before declaring success.
- **Warranty Concurrency**: FIXED. WarrantyReplacementModal.tsx now extracts and sends the RowVersion token, allowing successful swaps without triggering 409 validation failures.
