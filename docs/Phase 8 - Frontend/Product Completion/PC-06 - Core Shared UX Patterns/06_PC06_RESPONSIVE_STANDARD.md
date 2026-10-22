# PC-06 RESPONSIVE STANDARD

## 1. PageHeader
- **Desktop:** Icon, Title, and Actions are aligned in a single horizontal row (`flex-row`, `items-center`, `justify-between`).
- **Mobile (<768px):** Stacks vertically (`flex-col`). The actions wrap to the next line (`flex-wrap`).

## 2. DataTable
- **Desktop:** Renders full table columns.
- **Mobile:** The `DataTable` wrapper has `overflow-x-auto`, allowing the raw `Table` to scroll horizontally within the card.

## 3. AppPagination
- **Desktop:** Flexes horizontally, with text status on the left and buttons on the right.
- **Mobile (<640px):** Stacks vertically (`flex-col sm:flex-row`), centering the buttons below the text status to avoid cramped tap targets.

## 4. ConfirmDialog
- **Desktop:** `max-w-md` fixed width, centered on screen.
- **Mobile:** The `ui/Dialog` primitive expands to the screen bounds minus margins, ensuring it remains fully readable.
