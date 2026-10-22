# PC-09C Discovery: Critical Invariants

## 1. Idempotency Key Lifecycle (P0)
- **Constraint**: `createRepairTicket` and `collectRepairDeposit` require an Idempotency-Key to prevent duplicate transactions.
- **Current implementation**: `DepositStep.tsx` correctly generates crypto.randomUUID() and passes it to the service.
- **Rebuild Invariant**: The migration to React Query MUST preserve the frontend UUID generation for these two specific calls. Do NOT strip the idempotency headers.

## 2. Multi-Step Intake Integrity (P1)
- **Constraint**: A Repair Ticket is a compound entity requiring a Ticket, a Checklist, and optionally a Deposit.
- **Current implementation**: `RepairIntakePage` sequences these 3 API calls successfully.
- **Rebuild Invariant**: The new UI must preserve this sequence. Do NOT simplify this into a single fake API call. The backend relies on these discrete endpoints.

## 3. Frontend Mock Eradication (P1)
- **Constraint**: `RepairListPage.tsx`'s legacy fake create function (Date.now) must be deleted. All creations must route to `RepairIntakePage`.
