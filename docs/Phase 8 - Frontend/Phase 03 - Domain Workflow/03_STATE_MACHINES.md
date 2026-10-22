# 03.4 STATE MACHINES

*NOTE: Confidence Taxonomy:*
- **OBSERVED:** Implementation behavior directly observed.
- **CONFIRMED:** Explicit guard/constraint/configuration directly evidenced.
- **INFERRED:** Architectural/business interpretation.
- **UNKNOWN:** Insufficient evidence.
- **CONTRADICTION:** Conflicting evidence.

## 1. SalesOrder State Machine
### Observed States
- Draft, Confirmed, Processing, Completed, Cancelled.
### Transition Graph
- **(New) ➔ Draft:** OBSERVED (Creation sets Draft).
- **Draft/Confirmed/Processing ➔ Completed:** OBSERVED (Generic status mutation observed; explicit guard only checks Current != Cancelled).
- **Completed ➔ Cancelled:** CONFIRMED (Explicit transition guard Current == Completed and specific reversal logic).
- **Draft/Confirmed/Processing ➔ Cancelled:** OBSERVED (Flag update without explicit from-state guard).
- **Draft ➔ Confirmed ➔ Processing:** UNKNOWN (Generic status mutation permits target, but no explicit from-to workflow guard identified).

## 2. RepairTicket State Machine
### Observed States
- Draft, WaitingForParts, Repairing, WaitingForPayment, Completed, Cancelled.
### Transition Graph
- **(New) ➔ Draft:** OBSERVED.
- **Any ➔ Cancelled:** OBSERVED (Handler enforces parts must be disposed, but accepts any from-state).
- **Other transitions:** UNKNOWN (Target status mutations exist, but strict from-to gating is not established).

## 3. PurchaseOrder State Machine (Procurement)
### Observed States
- Draft, Confirmed, Received, Cancelled.
### Transition Graph
- **(New) ➔ Draft:** OBSERVED.
- **Draft ➔ Draft:** OBSERVED.
- **Draft/Confirmed ➔ Received:** OBSERVED (Accepted as valid targets, triggers side-effects).
- **Draft/Confirmed ➔ Cancelled:** OBSERVED.
- **Draft ➔ Confirmed:** UNKNOWN (No explicit command found).

## 4. WarehouseTransfer State Machine
### Observed States
- Pending, InTransit, Received, Cancelled.
### Transition Graph
- **(New) ➔ Pending:** OBSERVED.
- **Pending ➔ Pending:** OBSERVED.
- **Pending ➔ InTransit:** CONFIRMED (Explicit status guard Status == Pending).
- **InTransit ➔ Received:** CONFIRMED (Explicit status guard Status == InTransit).
- **Pending/InTransit ➔ Cancelled:** CONFIRMED (Explicit status guard and rollback).

## 5. StockTake State Machine
### Observed States
- Draft, InProgress, Completed, Cancelled.
### Transition Graph
- **(New) ➔ Draft:** OBSERVED.
- **Draft ➔ InProgress:** CONFIRMED (Explicit guard Status == Draft).
- **InProgress ➔ Completed:** CONFIRMED (Explicit guard Status == InProgress).
- **Draft/InProgress ➔ Cancelled:** CONFIRMED.

## 6. WarrantyTicket State Machine
### Observed States
- Received
- Processing
- Completed
- Rejected
- Cancelled
### Transition Graph
- **(New) ➔ Received:** CONFIRMED (Explicit constraints on IMEI and SalesOrder).
- **Received ➔ Processing:** CONFIRMED (Explicit valid transition path defined in handler).
- **Received ➔ Completed:** CONFIRMED.
- **Received ➔ Rejected:** CONFIRMED.
- **Received ➔ Cancelled:** CONFIRMED.
- **Processing ➔ Completed:** CONFIRMED.
- **Processing ➔ Rejected:** CONFIRMED.
- **Processing ➔ Cancelled:** CONFIRMED.
