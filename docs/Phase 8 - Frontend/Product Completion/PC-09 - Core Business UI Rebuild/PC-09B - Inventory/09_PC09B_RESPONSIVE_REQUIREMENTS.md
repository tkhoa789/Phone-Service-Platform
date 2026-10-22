# PC-09B Responsive Requirements

## Viewports
- **1280x800**: Full DataTable rendering. Action buttons inline.
- **768x1024 (Tablet)**: DataTable should enable horizontal scrolling (`overflow-x-auto`) if columns exceed width.
- **375x812 (Mobile)**: Modals (`WarehouseTransferModal`, `StockAuditModal`) must fill screen or scroll correctly without breaking bounds. The main data table will scroll horizontally. Filters stack vertically.
