# PC-09C Discovery: Architecture Audit

## 1. Current State
The Repair Management domain is currently scattered and contains duplicated logic.
- **Pages**: `src/pages/repairs/RepairIntakePage.tsx` (Multi-step wizard) and `src/pages/repairs/RepairListPage.tsx` (List view).
- **Components**: `src/components/repairs/` containing Modals (`AddRepairPartModal`, `RepairChecklistModal`, `RepairK80ReceiptModal`).
- **Services**: `src/services/serviceService.ts` handling HTTP calls for `/RepairTicket` and `/WarrantyTicket`.

## 2. Identified Deficiencies
- **Duplicated Entry Points**: `RepairListPage.tsx` contains a legacy mock form for creating repair tickets using `Date.now().toString()`, which bypasses the real API workflow implemented in `RepairIntakePage.tsx`.
- **Styling**: Extensive use of legacy Neumorphism CSS variables (`var(--neu-bg-base)`, `var(--neu-shadow-button)`).
- **State Management**: Uses raw useState and manual API calls instead of React Query.

## 3. FSD Target Architecture
The domain will be migrated to `src/features/repairs/` and `src/features/warranties/` (if warranties are split).
For Repairs:
- `src/features/repairs/api/`: React Query hooks (`useRepairs`, `useCreateRepairTicket`, `useUpdateRepairStatus`).
- `src/features/repairs/components/`: Modals, Forms, StatusBadges, IntakeSteps.
- `src/features/repairs/pages/`: `RepairListPage.tsx`, `RepairIntakePage.tsx`.
