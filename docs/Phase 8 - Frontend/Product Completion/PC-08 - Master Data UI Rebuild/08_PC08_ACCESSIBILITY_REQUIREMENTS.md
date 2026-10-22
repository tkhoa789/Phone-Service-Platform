# Accessibility Requirements

1. **Focus Management**: Modals (`Dialog`) must trap focus.
2. **Keyboard Navigation**: Tables must be navigable. `AppPagination` must support `Enter` to change pages.
3. **ARIA Labels**: Action buttons inside table rows (Edit, Delete) must have `aria-label`.
4. **Contrast**: Eliminate the low-contrast legacy neumorphic colors (e.g., slate-400 on dark backgrounds) in favor of PC-03 text scales (`var(--neu-text-sub)`).
