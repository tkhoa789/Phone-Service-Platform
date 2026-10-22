# PC-01 TECHNICAL DEBT REGISTER

## Preliminary Findings

| ID | Area | Finding | Severity | Evidence | Recommendation |
|---|---|---|---|---|---|
| **PC-001** | Architecture | **Half-Migrated Feature-Sliced Design.** | P1 - High | `src/features` has 6 domains. `src/components` has 7+ domains. `src/services` overlaps with `src/features/*/api`. | Migrate remaining domains (POS, Repair, Warranty, Inventory) into `src/features/`. |
| **PC-002** | UI / Styling | **Bypassed Design System.** | P1 - High | `ProductListPage.tsx` and `RepairListPage.tsx` contain raw HTML `<button>` and `<input>` tags with 10+ tailwind classes instead of using `components/ui`. | Replace raw HTML with `components/ui/Button` and `Input`. |
| **PC-003** | Architecture | **God Type File.** | P2 - Medium | `src/types/api.types.ts` is 541 lines long and contains DTOs for the entire monolithic application. | Split `api.types.ts` into domain-specific types inside `features/*/types/`. |
| **PC-004** | Dead Code | **Orphaned Component Folders.** | P2 - Medium | `components/products/` contains exact duplicates of `ProductFormModal.tsx` and `BarcodePrintModal.tsx`. `grep` shows 0 imports. | Delete `components/products/` entirely. |
| **PC-005** | Form Handling | **Inconsistent State Management.** | P2 - Medium | Modern domains use `react-hook-form` + `zod`. Legacy domains use manual `useState` objects (`formData`). | Standardize all forms to `react-hook-form`. |
| **PC-006** | UI Primitives | **Duplicate Modal Concepts.** | P3 - Low | Both `components/ui/Modal.tsx` and `components/ui/Dialog.tsx` exist. `Modal` has 0 usages. | Delete `Modal.tsx` and standardize on `Dialog.tsx`. |
