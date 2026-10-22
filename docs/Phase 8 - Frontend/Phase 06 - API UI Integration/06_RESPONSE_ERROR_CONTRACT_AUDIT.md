# 06.4 RESPONSE & ERROR CONTRACT AUDIT

## 1. Global Interceptor Behavior (xiosClient.ts)
- **401 Unauthorized:** Correctly intercepts, attempts token refresh via /Auth/refresh-token, queues requests, and redirects to /login upon failure.
- **403 Forbidden:** Toasts generic error. Correct.
- **404 Not Found:** Handled silently via console.warn. Correct.
- **409 Conflict:** Explicitly catches STOCK_CHANGED and ROW_VERSION_CONFLICT problem types to show localized stale-data toast. Correct.
- **500 Server Error:** Toasts with Correlation ID (X-Request-ID). Correct.
- **400 Bad Request:** Passed down to components for eact-hook-form / local handling. Correct.

## 2. Component-Level Handling Deficiencies
- **Validation Swallowing (400):** In legacy components (e.g., PosPage.tsx), 400 errors are caught in 	ry/catch and often swallowed or rendered as a generic "Failed to save" toast, obscuring the actual validation errors returned by the backend.
- **Missing Idempotency Response (400):** Because the frontend doesn't send Idempotency-Key, POST /api/SalesOrder will immediately return 400 { Message = "Idempotency-Key header is missing" }. The frontend will pass this to the component, which will likely toast the raw string or a generic error.
