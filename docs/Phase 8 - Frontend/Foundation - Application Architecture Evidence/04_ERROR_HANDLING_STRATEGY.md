# 04.3 ERROR HANDLING STRATEGY

> **Evidence Level Taxonomy:**
> - **CONFIRMED:** Direct code evidence exists in GlobalExceptionMiddleware.cs or domain exception classes.
> - **OBSERVED:** Middleware configuration or controller behavior observed.
> - **INFERRED:** Architectural interpretation.
> - **PROPOSED:** Frontend UI handling recommendation.

## 1. HTTP Status Code Mapping (CONFIRMED)
The backend intercepts exceptions via GlobalExceptionMiddleware and maps them to HTTP Status Codes. The response body wraps the error in the standard ApiResponse<T> shape, except for early-middleware errors (like missing Idempotency-Key).

### Error Classification Table
| HTTP Status | Backend Error Code (Body) | Exception Class | Frontend Recovery Action (PROPOSED) |
|---|---|---|---|
| **400** | VALIDATION_ERROR | ValidationException | Display inline form field errors based on message. |
| **400** | Custom (e.g., INVENTORY_NOT_ENOUGH) | BusinessException | Show modal/toast explaining the business rule violation. |
| **401** | UNAUTHORIZED | UnauthorizedException | Redirect to login screen / trigger token refresh. |
| **403** | FORBIDDEN | ForbiddenException | Show "Access Denied" component. Do not auto-redirect to login. |
| **404** | NOT_FOUND | NotFoundException | Show 404 Empty State component for the resource. |
| **409** | CONCURRENCY_ERROR | DbUpdateConcurrencyException | **(Sales Context):** Show Concurrency Conflict modal ("Data changed by another user"). Allow reload/merge. |
| **409** | CONFLICT | ConflictException | **(Warranty Context):** Inspect message. Currently used for concurrency pre-flight checks, but UI interpretation depends on returned error code/message. |
| **500** | INTERNAL_SERVER_ERROR | Unhandled Exception | Show generic "Something went wrong" banner. |

> **Important Architecture Note (INFERRED):** Do not equate HTTP 409 Conflict universally with concurrency. Concurrency-specific UI recovery must only be attached where the error code (CONCURRENCY_ERROR or CONFLICT) and backend evidence establish concurrency semantics.

## 2. Early Middleware Errors (OBSERVED)
- **Missing Idempotency-Key:** If an endpoint has [Idempotent] (e.g., POST /api/SalesOrder) but lacks the Idempotency-Key header, IdempotencyMiddleware returns 400 Bad Request with raw payload {"Message": "Idempotency-Key header is missing"}. It does NOT use ApiResponse<T>.

## 3. Concurrency Strategy (PROPOSED)
When the UI receives a 409 mapped to a concurrency semantic (e.g., CONCURRENCY_ERROR from DbUpdateConcurrencyException):
1. The UI intercepts the 409 globally via Axios/Fetch interceptor.
2. The UI preserves the user's unsaved input in local React/Vue state.
3. The UI presents a modal: *"Dữ liệu đã bị thay đổi bởi người dùng khác. Vui lòng tải lại trang."*
4. The user decides to Merge / Reload / Cancel.

## 4. Authorization Enforcement (CONFIRMED via Phase 02)
- Frontend UI should use Role-based visibility (UX only) to hide/show navigation menus based on token roles.
- Backend enforces [Authorize(Roles="...")] and contextual ICurrentUserService.BranchId checks.
- If a user bypasses the UI, the backend ForbiddenException (403) acts as the enforcement boundary.
