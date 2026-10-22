# PC-10 Discovery: Responsive Audit

## 1. Viewport Testing
Automated and manual audits were conducted across:
- **Desktop**: 1280x800, 1440x900, 1920x1080
- **Tablet**: 768x1024, 1024x768
- **Mobile**: 375x812, 390x844

## 2. Findings

### Tables (P1 — High)
Data-heavy lists (Customer, Product, Supplier, User, Branch, Repair, Warehouse) render standard HTML `<table>` elements inside standard `<Card>` components. 
- **Defect**: These tables lack an `overflow-x-auto` wrapper.
- **Impact**: On mobile devices (< 768px), the tables force horizontal scrolling on the entire page or clip data entirely, breaking the layout container. 
- **Remediation**: Wrap `<table>` in `<div className="overflow-x-auto">`.

### Dialogs / Modals (P2 — Medium)
- Dialogs utilize `max-w-md` to `max-w-4xl`. On mobile, they correctly scale down to `w-[95vw]`.
- However, complex nested components (like the Payment Modal grid) may experience vertical crowding.
- `SupplierDebtLedgerModal` contains an internal table which must also be wrapped in `overflow-x-auto`.

### Navigation (PASS)
- The Sidebar successfully collapses into a mobile drawer behind a hamburger menu.
- The Header utilizes flex layout safely.