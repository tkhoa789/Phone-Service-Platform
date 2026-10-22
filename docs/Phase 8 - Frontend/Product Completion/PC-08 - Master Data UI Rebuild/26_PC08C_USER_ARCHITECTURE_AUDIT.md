# PC-08C User Architecture Audit

## 1. Domain Location
- **Current Location:** `src/components/users/` (Modals) and `src/pages/users/` (Views).
- **Target Location:** `src/features/users/` (for hooks, schemas, types, and domain components).

## 2. Form Management
- **Current State:** `UserFormModal.tsx` appears to be a legacy implementation (likely using raw `useState` or a mix of `useState` and raw Axios).
- **Target State:** Migrate to `react-hook-form` + `zodResolver` using `ControlledInput`, following the PC-02 standard.

## 3. Data Fetching & State
- **Current State:** `UserListPage` fetches users via a manual `loadUsers` function and uses local component state for `users` and `loading`.
- **Target State:** Migrate to React Query (`useUsers`, `useCreateUser`, `useUpdateUser`, `useDeleteUser`).

## 4. UI Components & Design System
- **Current State:** Highly manual markup, inline styles (`style={{ background: 'linear-gradient(...)' }}`), and direct usage of `--neu-` CSS variables.
- **Target State:** Migrate to PC-06 shared patterns: `PageHeader`, `DataTable`, `AppPagination`, `SearchInput`, and `ConfirmDialog`. Use PC-03 `Dialog`, `Button`, `Badge`, `Card`.

## 5. Pagination
- **Current State:** The API likely returns an unbounded array, which is filtered by `searchTerm` and sliced by `currentPage` (`paginatedUsers = filteredUsers.slice(...)`).
- **Target State:** Maintain the `.slice()` client-side logic to preserve the API contract constraint, but encapsulate it cleanly before passing to `DataTable`.

## 6. Execution Plan
1. Create `src/features/users/types/user.types.ts`.
2. Create `src/features/users/schemas/user.schema.ts` (using existing Zod semantics).
3. Create `src/features/users/hooks/useUsers.ts` (React Query wrappers over existing `axiosClient` calls).
4. Migrate `UserFormModal.tsx` to `src/features/users/components/UserFormModal.tsx`.
5. Rewrite `UserListPage.tsx` using PC-06 patterns.
6. Verify no lingering references to `src/components/users/` and delete it.
7. Perform verification build and runtime tests.
