# 05.8 CROSS-PHASE UNKNOWNS & BASELINE MISMATCHES

## Active Contradictions
- **0 CONTRADICTIONS IDENTIFIED.** 

## Baseline Mismatches
- **C-F05-01 (Screen Inventory vs Reality):** Phase 04 mapped 3 GAP screens (Repair, PurchaseOrder, WarehouseTransfer). The frontend currently **HAS** implementation for these screens in src/pages and src/components. This means the frontend is ahead of the Phase 04 baseline inventory.
  - **Category:** BASELINE MISMATCH / CROSS-PHASE DISCOVERY
  - **Resolution:** These screens exist but their UX/UI states are undocumented in the Phase 04 baseline. They should be audited and mapped in Phase 06.

## Unknowns
- **U-F05-01 (Unsaved Changes):** It is UNKNOWN if the new src/features/ architecture plans to introduce eact-router transition blockers for dirty forms, as they are not currently implemented globally.
