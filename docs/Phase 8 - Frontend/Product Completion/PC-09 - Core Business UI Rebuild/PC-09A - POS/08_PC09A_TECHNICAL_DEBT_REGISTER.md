# PC-09A Technical Debt Register

| ID | Issue | Risk Level | Migration Strategy |
|---|---|---|---|
| TD-09-01 | Lack of global Cart persistence | Low | If users accidentally navigate away, cart is lost. Will implement browser warning before unload if cart is non-empty. |
| TD-09-02 | Barcode Scanner focus loss | Medium | Ref attach logic requires careful handling during React Query re-renders. |
| TD-09-03 | Two-step Checkout (Create -> Update Status) | Medium | API design forces two network calls. Keep current pattern, wrap in a single React Query mutation if possible, or execute sequentially in standard handler. |