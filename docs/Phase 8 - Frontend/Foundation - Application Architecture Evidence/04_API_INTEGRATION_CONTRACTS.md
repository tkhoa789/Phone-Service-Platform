# 04.5 API INTEGRATION CONTRACTS

> **Evidence Level Taxonomy:**
> - **CONFIRMED:** Derived directly from ApiResponse.cs, Controllers, and Middlewares.
> - **OBSERVED:** Implementation capability / behavior directly observed.
> - **PROPOSED:** Standardized practices for the Frontend HTTP Client.

## 1. Standard Response Envelope (CONFIRMED)
Within the audited controller scope, standard responses were observed to use ApiResponse<T>, with identified exceptions such as paginated WarrantyTicket responses.

**Success Response (ApiResponse.Success)**
`json
{
  "code": "SUCCESS",
  "message": "Thành công",
  "data": { ... }, // Can be primitive (Guid/bool) or Object
  "traceId": null
}
`

**Error Response (ApiResponse.Fail from GlobalExceptionMiddleware)**
`json
{
  "code": "VALIDATION_ERROR", // Dynamic based on exception type
  "message": "Chi tiết lỗi...",
  "data": null,
  "traceId": "unique-request-id"
}
`

## 2. Pagination Response Structure (OBSERVED)
The audited codebase breaks the standard ApiResponse<T> envelope for paginated endpoints (e.g., GET /api/WarrantyTicket in WarrantyTicketController.cs:L61).

**Paginated Response**
`json
{
  "success": true,
  "message": "Lấy danh sách thành công",
  "data": [ { ... } ], // Array of items
  "pagination": {
    "pageIndex": 1,
    "pageSize": 10,
    "totalCount": 100
  }
}
`
*Frontend Requirement (PROPOSED):* The HTTP client layer should handle this dual-shape response format.

## 3. Required Headers (CONFIRMED & OBSERVED)
1. **Authorization: Bearer <token>**:
   - **CONFIRMED:** Endpoints decorated with [Authorize] require an authenticated authorization context.
   - **OBSERVED:** JWT Bearer authentication format is used in the audited API configuration.
2. **X-Correlation-ID (OBSERVED):** Supported by CorrelationIdMiddleware.cs. If sent, the backend preserves it in logs and response headers.
3. **Idempotency-Key**:
   - **Backend Requirement (CONFIRMED):** Mandatory specifically for endpoints decorated with [Idempotent] (e.g., POST /api/SalesOrder). The middleware rejects requests missing this header for those specific endpoints.
   - **Frontend Generation Strategy (PROPOSED):** Generate a unique UUID per logical submission attempt in the frontend API client for endpoints that require it.

## 4. Frontend HTTP Client Implementation (PROPOSED)
The frontend API client (e.g., Axios instance) should be configured as follows:
- **Request Interceptor:** Automatically attach Authorization, generate X-Correlation-ID, and generate Idempotency-Key for targeted [Idempotent] mutations.
- **Response Interceptor:**
  - If HTTP 200: Extract .data for standard envelopes. For paginated endpoints, extract .data and .pagination.
  - If HTTP 400: Map code (e.g., VALIDATION_ERROR) to UI error states.
  - If HTTP 401: Trigger token refresh logic or logout.
  - If HTTP 409: Inspect Error Code (CONCURRENCY_ERROR vs CONFLICT) to trigger appropriate UI recovery.
