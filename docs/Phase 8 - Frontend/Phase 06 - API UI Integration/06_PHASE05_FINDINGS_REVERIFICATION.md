# 06.6 PHASE 05 FINDINGS RE-VERIFICATION

## 1. F05-001: POS Checkout Creates Draft, Not Completed
- **Status:** **RE-VERIFIED & EXPANDED**.
- **Evidence:** PosPage.tsx:handleConfirmPayment only calls salesService.createOrder. It also fails to send Idempotency-Key, causing the Draft creation itself to fail with 400 Bad Request, compounding the defect.

## 2. F05-002: Stock Take Execution is Mocked
- **Status:** **RE-VERIFIED**.
- **Evidence:** StockTakePage.tsx:handleBulkSave contains wait new Promise(r => setTimeout(r, 1500));. POST /api/StockTake is never called.

## 3. F05-003: Warranty Swap Ignores Concurrency Token
- **Status:** **RE-VERIFIED**.
- **Evidence:** WarrantyReplacementModal.tsx and serviceService.ts do not extract or send RowVersion to PUT /api/WarrantyTicket/{id}/status.
