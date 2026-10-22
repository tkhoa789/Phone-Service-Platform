# 05.6 ERROR, LOADING, & AUTH STATE AUDIT

## 1. Error States (OBSERVED)
Error handling is centralized in utils/axiosClient.ts:
- **401 Unauthorized:** Transparently intercepts, calls /Auth/refresh-token, updates local storage, and replays failed requests (ailedQueue). If refresh fails, redirects to /login.
- **403 Forbidden:** Toasts "Bn khA'ng cA3 quy?n...".
- **404 Not Found:** Handled silently via console.warn to allow local UI empty states.
- **409 Conflict:** Explicitly catches STOCK_CHANGED and ROW_VERSION_CONFLICT to show a localized stale-data toast.
- **500 Server Error:** Shows toast with Correlation ID.
- **400 Bad Request:** Passed down to components.

## 2. Concurrency / Stale State (GAP)
While xiosClient.ts perfectly handles 409 Concurrency responses from the backend, the **frontend mutations** fail to provide the necessary concurrency tokens!
- **Warranty Swap:** Does not pass RowVersion to the API.

## 3. Global Loading State (OBSERVED)
- Page transitions are wrapped in React.Suspense with <PageSkeleton />.
