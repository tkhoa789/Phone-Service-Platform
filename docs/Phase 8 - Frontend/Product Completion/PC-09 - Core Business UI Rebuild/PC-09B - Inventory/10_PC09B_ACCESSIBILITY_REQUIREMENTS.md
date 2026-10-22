# PC-09B Accessibility Requirements

- **Dialog Focus Trap**: PC-03 `Dialog` handles this automatically.
- **Form Labels**: Ensure all inputs in `WarehouseTransferModal` and `StockAuditModal` have associated labels or `aria-label`.
- **Status Badges**: Low stock badges should communicate semantic warning state, not just color.
- **Grid Navigation**: `StockTakePage` input grids should allow sequential `Tab` navigation down the column of inputs.
