# 06.8 IDEMPOTENCY & DUPLICATE SUBMISSION AUDIT

## 1. Backend Implementation ([Idempotent])
The backend uses IdempotencyMiddleware.cs which requires the Idempotency-Key HTTP header. If missing, it immediately rejects the request with HTTP 400.
**Decorated Endpoints:**
- POST /api/SalesOrder
- POST /api/RepairTicket
- POST /api/RepairTicket/part
- PUT /api/RepairTicket/{id}/status
- POST /api/RepairTicket/{id}/deposit

## 2. Frontend Implementation
- **Header Injection:** xiosClient.ts does NOT inject Idempotency-Key (it only injects X-Request-ID for correlation).
- **Service Payloads:** No frontend service passes an idempotency key.
- **UI Duplicate Lock:** Legacy modals (e.g., PosPaymentModal) lack an isSubmitting lock, which makes them highly vulnerable to duplicate submissions if idempotency were missing. However, because idempotency *is* strictly enforced by the backend, all these endpoints currently **crash with 400 Bad Request** before any duplicate submission can occur.

## 3. Conclusion
The frontend currently fails to satisfy the backend's explicit Idempotency contract. This is a Critical Defect affecting Sales and Repair capabilities.

---
## POST-FIX VERIFICATION
**Status**: FIXED / VERIFIED

**Verified Scope (5 Endpoints):**
1. POST /api/SalesOrder (Create) - Verified via salesService.createOrder
2. POST /api/RepairTicket (Create) - Verified via serviceService.createRepairTicket
3. POST /api/RepairTicket/{id}/part (AddPart) - Verified via serviceService.addRepairPart
4. PUT /api/RepairTicket/{id}/status (UpdateStatus) - Verified via serviceService.updateRepairStatus
5. POST /api/RepairTicket/{id}/deposit (CreateDeposit) - Verified via serviceService.collectRepairDeposit

**Idempotency-Key Lifecycle Verification**:
- Keys are generated logically per-operation (e.g., idempotencyKeyRef.current = crypto.randomUUID() in PosPage.tsx and DepositStep.tsx) upon component mount or checkout restart.
- Because the key is passed as an argument down to xiosClient headers, any internal xiosClient network retries or 401 Unauthorized token-rotation replays will preserve the **exact same UUID**, strictly honoring backend idempotency semantics.
- For unrelated subsequent logical operations (e.g., clearing cart and checking out again), a new UUID is correctly generated.
