# Current → Target UI Matrix

| UI Element | Current Legacy Implementation | PC-08 Target Pattern |
|---|---|---|
| **Page Title & Actions** | Raw `div` with hardcoded flex, bg, neumorphic borders | `PageHeader` (`src/components/shared`) |
| **Search/Filter Bar** | Raw `input` with Lucide icons | `SearchInput` (`src/components/shared`) |
| **Data Tables** | Raw `<table>`, `<thead>`, `<tr>` with custom hover classes | `DataTable` (`src/components/shared`) |
| **Pagination Controls** | `Pagination` (`src/components/common`) | `AppPagination` (`src/components/shared`) |
| **Action Buttons** | Raw `<button>` with `bg-gradient-to-r` | `Button` (`src/components/ui/Button.tsx`) |
| **Status Labels** | Raw `span` with custom colors | `Badge` (`src/components/ui/Badge.tsx`) |
| **Confirmation** | `window.confirm()` | `ConfirmDialog` (`src/components/shared`) |
