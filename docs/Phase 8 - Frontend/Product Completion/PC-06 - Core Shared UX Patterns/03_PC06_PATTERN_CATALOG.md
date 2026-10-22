# PC-06 PATTERN CATALOG

## 1. PageHeader
- **Props:** `title`, `description`, `icon`, `actions`, `className`
- **Usage:** Placed at the very top of a Business Page, right under the Breadcrumb. Groups the main title with primary CRUD actions (like "Thêm mới").

## 2. SearchInput
- **Props:** Extends standard `InputProps`.
- **Usage:** Placed in the toolbar above data tables. Features a built-in search icon for consistent visuals.

## 3. DataTable
- **Props:** `isLoading`, `isEmpty`, `emptyTitle`, `emptyDescription`, `emptyAction`, `children`
- **Usage:** A wrapper card. If `isLoading` is true, renders Skeleton rows. If `isEmpty` is true, renders a centralized `EmptyState`. Otherwise, renders the raw `Table` children.

## 4. AppPagination
- **Props:** `currentPage`, `totalItems`, `pageSize`, `onPageChange`
- **Usage:** Appears at the bottom of lists. Uses standard `Button` primitives rather than custom shadowed HTML buttons.

## 5. ConfirmDialog
- **Props:** `isOpen`, `onClose`, `onConfirm`, `title`, `description`, `variant`, `isLoading`
- **Usage:** Replaces `window.confirm`. Supports `danger` (Red icon) and `warning` (Amber icon). Disables buttons when `isLoading` is true.
