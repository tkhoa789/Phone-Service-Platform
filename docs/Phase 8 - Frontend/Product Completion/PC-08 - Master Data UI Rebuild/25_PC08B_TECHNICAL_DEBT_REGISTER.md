# PC-08 Phase B Technical Debt Register

| ID | Domain | Issue | Mitigation Strategy | Priority |
|---|---|---|---|---|
| TD-08-01 | Supplier | Client-side Pagination (`.slice()`) is used because the API lacks `PagedResult` return type. | Isolated cleanly before `DataTable`. Can be hot-swapped once API is updated. | Low |
| TD-08-02 | Branch | Client-side Pagination (`.slice()`) is used because the API lacks `PagedResult` return type. | Isolated cleanly before `DataTable`. Can be hot-swapped once API is updated. | Low |

*(No new defects introduced. Pre-existing architectural constraints successfully documented).*
