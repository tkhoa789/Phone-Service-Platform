# PC-06 ACCESSIBILITY STANDARD

## 1. Focus Management
- `ConfirmDialog` automatically traps focus when opened via the `ui/Dialog` primitive.
- When `isLoading` is active in `ConfirmDialog`, all buttons are disabled (`disabled` attribute), and `hideCloseButton` prevents screen readers from focusing a useless "X" button.
- `SearchInput` delegates props down to standard `ui/Input`, which supports `aria-label` and `aria-describedby`.

## 2. Keyboard Navigation
- **Escape Key:** Standard `ui/Dialog` captures the `Escape` key to trigger `onOpenChange(false)`. However, if `isLoading` is true, the `ConfirmDialog` overrides this to ensure a transaction isn't interrupted accidentally.
- **Tab Key:** Focus is trapped inside the `Dialog` when open. `AppPagination` uses real `<button>` elements (via `<Button>`), ensuring natural Tab indexing.

## 3. Semantic HTML
- `PageHeader` uses `<h1>` for its title, enforcing a single main heading per view.
- `AppPagination` wraps its structure logically, ensuring the "1 of 10" status is adjacent to the navigational buttons.
