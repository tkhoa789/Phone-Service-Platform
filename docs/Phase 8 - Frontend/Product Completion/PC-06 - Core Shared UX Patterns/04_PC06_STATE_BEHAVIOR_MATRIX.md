# PC-06 STATE BEHAVIOR MATRIX

## 1. Data Tables
| State | Behavior | Implementation |
|---|---|---|
| **Loading (Initial)** | Show 5 skeleton rows. Hide headers to prevent UI jumping. | `DataTable` -> `isLoading = true` |
| **Loading (Background Refresh)** | Table headers & data remain visible. Loading spinner or progress bar appears (usually via React Query `isFetching`). | Managed by Business Page, not DataTable. |
| **Empty (No Results)** | Show `EmptyState` component inside the Card. | `DataTable` -> `isEmpty = true` |
| **Error** | Currently unhandled globally by `DataTable`. Expected to be caught by nearest ErrorBoundary or Toast. | N/A |

## 2. Confirmation Dialogs
| State | Behavior |
|---|---|
| **Idle** | `Cancel` and `Confirm` buttons are fully interactive. |
| **Processing** | `isLoading = true` -> Close button (`X`) is hidden. `Cancel` button is disabled. `Confirm` button is disabled and text changes to "Đang xử lý...". Pressing `Escape` is ignored. |
