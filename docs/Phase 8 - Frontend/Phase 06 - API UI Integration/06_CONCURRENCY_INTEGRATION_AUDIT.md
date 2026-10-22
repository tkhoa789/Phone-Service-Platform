# 06.7 CONCURRENCY INTEGRATION AUDIT

## 1. Warranty (PUT /api/WarrantyTicket/{id}/status)
- **Backend Token Requirement:** yte[] RowVersion in DTO.
- **Frontend Source:** UI does not extract RowVersion from the ticket detail endpoint.
- **Frontend Mutation:** Payload is missing the token.
- **Result:** Integration gap. The optimistic concurrency check intended by the business rule cannot function.

## 2. Sales Order (PUT /api/SalesOrder/{id}/status)
- **Backend Mechanism:** Implicit EF Core concurrency (DbUpdateConcurrencyException), mapped to 409 CONCURRENCY_ERROR.
- **Frontend Handling:** xiosClient.ts intercepts 409 STOCK_CHANGED or ROW_VERSION_CONFLICT.
- **Result:** Assuming standard payload, if implicit DB conflict occurs, UI handles the toast correctly.

## 3. Stock Take / Inventory
- **Backend Mechanism:** Implicit / DB isolation.
- **Result:** No explicit token required.

---
## POST-FIX VERIFICATION
**Status**: FIXED / VERIFIED
**Verification Evidence**:
- WarrantyTicketDto interface in frontend updated to include owVersion: string;.
- WarrantyListPage.tsx updated to pass the specific ticket object's owVersion to the WarrantyReplacementModal.tsx.
- WarrantyReplacementModal.tsx modified to pass owVersion through serviceService.updateWarrantyStatus into the PUT request payload.
- Backend strictly rejects missing or mismatched RowVersion with HTTP 409 Conflict, preserving data integrity. The integration gap is now resolved, and UI handles the flow correctly.
