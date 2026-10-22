# ADR-0001: Separation of Feature-Sliced Types, Removal of Circular Dependencies, and Explicit State Ownership

## Status
**ACCEPTED / IMPLEMENTED** (Phase 9)

## Context
During the Phase 9 Architecture and State audit of the Phone Service Platform frontend:
1. Bidirectional circular dependency cycles were identified between `RepairIntakePage.tsx` and its 6 intake step components (`CustomerStep`, `DeviceStep`, `ChecklistStep`, `EstimateStep`, `DepositStep`, `ReceiptStep`).
2. These cycles occurred because the step components inside `features/repairs/components/intake-steps/` imported the `IntakeState` and `IntakeCheckpoint` interfaces directly from the higher-level page (`../../pages/RepairIntakePage`).
3. This inverted the layer dependency hierarchy of Feature-Sliced Design (lower-level feature components depending on page-level orchestrators) and created cyclic imports in the ES module graph.
4. Additionally, audit of client state revealed potential ambiguity regarding server state versus client context, with utility proliferation (duplicate local `formatCurrency` functions) and unsafe `any` in Axios services.

## Decision
1. **Extract Feature Types**:
   - Created dedicated `src/frontend/src/features/repairs/types/intake.types.ts` containing `IntakeCheckpoint` and `IntakeState`.
   - Re-exported these types from `RepairIntakePage.tsx` for backwards compatibility.
   - Updated all 6 intake step components to import directly from `../../types/intake.types`.
2. **State Ownership Protocol**:
   - **Server State**: Managed exclusively by TanStack React Query. No business entities (products, orders, tickets) are stored in Zustand or local storage.
   - **Client Context**: Managed by lightweight Zustand stores (`authStore`, `branchStore`, `systemStore`, `themeStore`).
   - **Form / Ephemeral Workflow State**: Kept in local React `useState` within the workflow page and cleared upon completion.
3. **Utility Consolidation**:
   - Enhanced `src/utils/formatCurrency.ts` to handle nullish inputs (`amount?: number | null`) and eliminated duplicate local formatters across `DashboardPage`, `PurchaseOrderListPage`, and `PurchaseOrderDetailModal`.
4. **Service Type Hardening**:
   - Replaced unsafe `any` parameters and return types in `productService.ts`, `serviceService.ts`, and `auditLogService.ts` with strong DTO contracts (`AnonymousPagedResponse<T>`, `Partial<CreateProductCommand>`, etc.).

## Consequences
- **Positive**:
  - Total circular dependencies reduced from 6 to 0.
  - Total FSD layer violations reduced from 6 to 0.
  - Compile-time type safety enforced on all service update calls.
  - Zero divergence in currency formatting across pages.
  - Zero runtime regressions across all business flows.
- **Trade-offs**:
  - Requires developers to place new domain types in `features/[slice]/types/` rather than inline in page components.

## Verification
- Automated circular dependency scanner (`detect_circular_deps.cjs`): 0 cycles.
- Automated FSD layer violation scanner: 0 violations.
- Frontend build (`npm run build`): Succeeded with 0 errors.
- Backend build (`dotnet build`): Succeeded with 0 errors.
- Backend test suite: 90/90 passed.
- End-to-end regression suites across Phase 1 through Phase 8: 100% passed.
