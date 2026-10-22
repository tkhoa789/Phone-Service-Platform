# PC-07 ACCESSIBILITY REQUIREMENTS

## 1. Headings
- The Dashboard must have exactly one `<h1>` tag (The hero banner title). Sub-sections (Branch Performance, System Status) should use `<h2>` or `<h3>`.

## 2. Interactive Elements
- The Date Range `<Select>` must have an explicit `aria-label` since it lacks a visible `<label>`.
- The Refresh button should set `aria-disabled="true"` during the loading state, and the spinner should have `aria-hidden="true"`.

## 3. Keyboard Navigation
- All `<Button>` components naturally support Tab indexing. Verify order flows left-to-right, top-to-bottom.
