# 05.2 UI STATE MATRIX

> **Evidence Level Taxonomy:**
> - **OBSERVED:** State handling exists in the current frontend code.
> - **INFERRED:** State handling logically assumed based on global layout (e.g. Suspense).
> - **UNKNOWN:** Not found in current code.
> - **GAP:** Required by backend but missing in frontend.

## Matrix by Audited Screen

| Screen | Initial Load | Loading Spinner | Empty State | Editing / Dirty | Submitting | Success | Error | Unauthorized | Forbidden |
|---|---|---|---|---|---|---|---|---|---|
| SCR-SALES-01 (POS) | OBSERVED | OBSERVED | OBSERVED (Cart) | OBSERVED | GAP | OBSERVED | OBSERVED | INFERRED | INFERRED |
| SCR-WTY-02 (Swap) | OBSERVED | OBSERVED | UNKNOWN | OBSERVED | OBSERVED | OBSERVED | OBSERVED | INFERRED | INFERRED |
| SCR-INV-01 (Stock Take)| OBSERVED | OBSERVED | UNKNOWN | OBSERVED | OBSERVED | OBSERVED | OBSERVED | INFERRED | INFERRED |

### Notes on Findings
- **Initial Load:** Handled by useState(true) in legacy components, or React.Suspense / PageSkeleton globally.
- **Submitting:** SCR-SALES-01 (POS) misses a local isSubmitting lock during the payment confirmation flow.
- **Unauthorized / Forbidden:** Globally handled by ProtectedRoute.tsx (redirects to /login or <AccessDeniedScreen>).
