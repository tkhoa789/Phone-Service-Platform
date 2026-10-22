# PC-03 ACCESSIBILITY (A11Y) STANDARD

## 1. Keyboard Navigation
- **Focus Rings:** All interactive elements (`Button`, `Input`, `a`, `summary`) must have a highly visible focus ring when navigated via keyboard. This is enforced via `focus-visible:ring-2`.
- **Tab Order:** Rely on natural DOM flow. Do not use `tabIndex` greater than 0. Use `tabIndex={-1}` only for elements that should be skipped (e.g., decorative icons).
- **Escape Key:** All Modals, Dialogs, and Drawers must close when the `Escape` key is pressed.

## 2. Semantic HTML
- **Buttons vs Links:** Use `<button>` for actions that change data or UI state. Use `<a>` (via React Router `<Link>`) for navigating to a new URL. Do not use `onClick` on `<div>` or `<span>` unless `role="button"` and `tabIndex={0}` are provided.
- **Forms:** Inputs must be tied to a `<label>` using `id` and `htmlFor`.
- **Headings:** Ensure `h1` through `h6` represent a logical document outline.

## 3. ARIA Attributes
- `aria-invalid`: Apply `aria-invalid="true"` to inputs when validation fails.
- `aria-describedby`: Link inputs to their error message `<span>` IDs.
- `aria-hidden`: Apply `aria-hidden="true"` to purely decorative icons (Lucide icons).
- `aria-expanded`: Apply to accordion headers and dropdown triggers.
