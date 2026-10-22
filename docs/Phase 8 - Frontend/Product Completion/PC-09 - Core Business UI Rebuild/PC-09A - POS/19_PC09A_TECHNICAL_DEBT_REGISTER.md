# PC-09A Technical Debt Register

| ID | Issue | Risk Level | Status |
|---|---|---|---|
| TD-09-01 | Cart not persisted across sessions/routes | Low | Deferred. Current behavior is safer to avoid cross-customer cart bleed. |
| TD-09-03 | Two-step API logic | Medium | Mitigated. Encapsulated securely inside `usePosCheckout` React Query mutation. |
