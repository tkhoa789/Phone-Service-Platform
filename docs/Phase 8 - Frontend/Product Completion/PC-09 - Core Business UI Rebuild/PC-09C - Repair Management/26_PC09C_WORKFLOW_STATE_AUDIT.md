# PC-09C Discovery: Workflow & State Machine Audit

## 1. The Real Backend State Machine
The `RepairTicketStatus` defined in `api.types.ts` expects a strict 10-state machine:
1. Received (Check-in)
2. Diagnosing
3. WaitingApproval (Cost estimate pending customer approval)
4. WaitingForParts
5. Repairing
6. WaitingQC (Quality Control)
7. Completed
8. WaitingPickup
9. Delivered (Check-out)
10. Cancelled

## 2. Frontend Defect (Critical)
The current `RepairListPage.tsx` makes completely wrong assumptions about the workflow. It hardcodes only three statuses:
- **Received** -> allows transition to **Repairing**.
- **Repairing** -> allows adding parts and transition to **Completed**.
*This ignores Diagnostics, QC, Approval, and Checkout phases.*

## 3. Rectification Plan
The new PC-09C UI MUST NOT hardcode this simplified flow. 
- We must implement a "Status Update" Dropdown or Action Menu that allows logically advancing the state machine through ALL valid backend states.
- The UI must dynamically display action buttons based on the exact status (e.g., "Add Parts" only when Diagnosing or Repairing).
