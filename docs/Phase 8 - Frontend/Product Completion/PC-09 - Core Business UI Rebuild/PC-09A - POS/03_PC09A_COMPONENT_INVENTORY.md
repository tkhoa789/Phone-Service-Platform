# PC-09A POS Component Inventory

## Existing Components to Refactor
- `PosPage` -> Needs to be moved to `src/features/pos/pages/PosPage.tsx` (or `features/sales`).
- `PosPaymentModal` -> Migrate to PC-03 `Dialog` & `react-hook-form`.
- `PosK80Receipt` -> Refactor raw CSS to Tailwind if necessary, but carefully preserve `@media print` directives to not break physical printing.

## Shared Patterns to Adopt
- `SearchInput` for product search.
- `Badge` for category selection.
- `Card` for layout panes.
- `Button` for POS actions.
- `DataTable` (or custom list if cart requires dense vertical layout).