# 06.3 API-UI CONTRACT MATRIX

> **Audit Scope:** So khớp DTO Backend và Frontend

## 1. Sales Order Complete (PUT /api/SalesOrder/{id}/status)
- **Backend Expected Payload:** UpdateSalesOrderStatusCommand { id: Guid, status: string }
- **Frontend Provided Payload:** Frontend salesService.updateOrderStatus accepts (id, status) and sends { id, status }.
- **Match Status:** MATCH. (However, the UI component PosPage NEVER calls it).

## 2. Warranty Swap (PUT /api/WarrantyTicket/{id}/status)
- **Backend Expected Payload:** UpdateWarrantyStatusCommand { warrantyTicketId: Guid, status: string, replacementImei?: string, rowVersion: byte[] }
- **Frontend Provided Payload:** (id, status, replacementImei). Sends { warrantyTicketId: id, status, replacementImei }.
- **Match Status:** MISMATCH (Missing RowVersion).

## 3. Idempotency Token ([Idempotent])
- **Backend Expected:** Idempotency-Key header (string).
- **Frontend Provided:** None. xiosClient.ts does not inject it, and no service passes it.
- **Match Status:** MISMATCH.

## 4. Response Envelopes
- **Backend Expected:** ApiResponse<T> { success, message, data, errors } or Pagination  { success, message, data, pagination }
- **Frontend Handling:** esponse.data.data is hardcoded in most legacy services. For pagination (e.g., getRepairs), the frontend manually handles esponse.data?.data || response.data?.items due to structural mismatch.
- **Match Status:** PARTIAL / FRAGILE.
