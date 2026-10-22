# PC-09A POS Screen Inventory

## Main Screens
1. **POS Dashboard (PosPage.tsx)**
   - Left Pane: Product Catalog, Category Filters, Search, Barcode Scanner.
   - Right Pane: Shopping Cart, Customer Selection, Voucher Input, Subtotal/Total Summary.

## Modals & Overlays
2. **Payment Modal (PosPaymentModal.tsx)**
   - Inputs for Cash/Bank Transfer.
   - Cash calculation (amount given vs change required).
   - Confirmation trigger for the API transaction.

3. **Receipt Modal (PosK80Receipt.tsx)**
   - Specialized 80mm thermal printer layout.
   - Hidden from standard viewport, triggers browser `window.print()`.