# Legacy & Technical Debt Register

| Issue | Description | Impact | Action in PC-08 |
|---|---|---|---|
| **TD-MD-01** | `UserListPage` completely bypasses React Query | Medium | Migrate to `useUsers` hook (if it exists) or create one. |
| **TD-MD-02** | `UserFormModal` uses `useState` instead of `zod` | High (UX inconsistency) | Refactor to `react-hook-form` + `zod`. |
| **TD-MD-03** | `UserListPage` violates FSD | Low (File org) | Move `src/components/users` to `src/features/users`. |
| **TD-MD-04** | Client-side `.slice()` for Branch/Supplier | Performance | **Do nothing.** Backend API limitation. Preserve slice logic. |
| **TD-MD-05** | `window.confirm()` used for deletions | UX/UI mismatch | Replace with `ConfirmDialog` from shared components. |
