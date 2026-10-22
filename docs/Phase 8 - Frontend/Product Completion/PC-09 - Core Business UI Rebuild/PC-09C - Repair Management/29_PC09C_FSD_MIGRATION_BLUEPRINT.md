# PC-09C Discovery: FSD Migration Blueprint

## Phase C Execution Strategy

### Step 1: Scaffold FSD
- Create `src/features/repairs/` structure.
- Build React Query hooks for all `serviceService.ts` repair endpoints.

### Step 2: Migrate Intake Workflow (`RepairIntakePage`)
- Convert the 6 steps into PC-03 styled components.
- Connect to React Query mutations.
- Ensure Idempotency Keys are preserved.

### Step 3: Rebuild Repair List (`RepairListPage`)
- Delete the legacy mock form.
- Implement PC-03 `DataTable` and `PageHeader`.
- Replace the hardcoded 3-state buttons with a robust Status Transition dropdown supporting all 10 states.

### Step 4: Rebuild Modals
- Migrate `RepairChecklistModal`, `AddRepairPartModal`, `RepairK80ReceiptModal` to `Dialog` components from PC-03.

## Approval Request
The Discovery Phase is complete. 
We await authorization for **PC-09C EXECUTION**.
