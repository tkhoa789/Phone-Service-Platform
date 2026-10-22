# 04.4 DATA CONSISTENCY STRATEGY

> **Evidence Level Taxonomy:**
> - **CONFIRMED:** Direct code evidence exists for synchronization mechanisms.
> - **OBSERVED:** Behavior seen in the codebase.
> - **INFERRED:** Architectural/business interpretation.
> - **PROPOSED:** Frontend implementation strategy.
> - **UNKNOWN:** Missing capability.

## 1. Backend Synchronization Mechanisms (Initial Audit)

### Transaction Boundaries
- **Mechanism (OBSERVED):** The audited handler performs the identified cross-module mutations synchronously and invokes SaveChangesAsync within the same command execution path.
- **Architectural Implication (INFERRED):** These mutations are intended to commit within the same persistence operation. Exact transactional guarantees should not be stated beyond the transaction/unit-of-work implementation verified in code.

### Realtime Synchronization & Messaging
An explicit audit was conducted across the codebase for realtime and messaging components:
- **Domain Events:** Not identified in the audited scope (BaseEntity.cs lacks event collections).
- **SignalR / WebSockets (OBSERVED):** No domain-state synchronization mechanism was identified in the audited SignalR implementation. NotificationHub and NotificationService exist but were observed to be used for system notifications (NotificationEntity) rather than Sales/Inventory state-change broadcasting.
- **Background Jobs (CONFIRMED):** AIInsightsWorker exists, but functions periodically rather than acting as a realtime event bus for frontend updates.
- **Event Bus / RabbitMQ:** Not identified in the audited scope.

## 2. Frontend Data Refresh Strategy (PROPOSED)

Because the audited backend relies entirely on synchronous EF transactions and no realtime domain updates were identified over SignalR in the scope, the Frontend architecture recommends explicit client-driven refresh mechanisms.

### Strategy A: Contextual Cache Invalidation
When the Frontend initiates a mutation (e.g., PUT /api/SalesOrder/{id}/status ➔ Completed), the local HTTP client (e.g., React Query, SWR, or Redux Toolkit) should explicitly invalidate related queries:
1. Invalidate [SalesOrder, id]
2. Invalidate [InventoryList]
3. Invalidate [CustomerLoyalty, customerId]

### Strategy B: Polling for High-Volatility Dashboards
For screens requiring frequent updates of concurrent changes (e.g., a "Live POS Dashboard" or "Warehouse Queue"), the UI should implement short-polling (e.g., every 15-30 seconds - PROPOSED EXAMPLE), as no SignalR push capability was established for these domains.

### Strategy C: User-Initiated Refresh
For lower-volatility views (e.g., Warranty History), present a manual "Refresh" button rather than aggressively polling, to conserve backend resources.
