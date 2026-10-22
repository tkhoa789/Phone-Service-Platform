# 04.3 SCREEN ACCESS MATRIX

> **Evidence Level Taxonomy:**
> - **CONFIRMED:** Driven strictly by [Authorize(Roles="...")] attributes on corresponding controllers (Backend API authorization).
> - **INFERRED:** UI navigation visibility mapping.
> - **PROPOSED:** Frontend UI design recommendations.

This matrix determines which roles are proposed to view or interact with specific screens. 
**CRITICAL NOTE:** Controller authorization does NOT prove screen visibility. 
- **Backend Allowed Roles:** CONFIRMED via API.
- **Screen Access:** PROPOSED for Frontend UX. Backend remains the ultimate enforcement boundary.

| Screen ID | Screen Name | Proposed Screen Access (Roles) | Backend Allowed Roles (CONFIRMED) | Confidence Level |
|---|---|---|---|---|
| SCR-SALES-01 | POS Checkout | Owner, Admin, Manager, Sales | Owner, Admin, Manager, Sales | **Screen Access: PROPOSED** |
| SCR-SALES-02 | Order Payment | Owner, Admin, Manager, Sales | Owner, Admin, Manager, Sales | **Screen Access: PROPOSED** |
| SCR-WTY-01 | Warranty Intake | Owner, Admin, Manager, Sales, Tech | Owner, Admin, Manager, Sales, Tech | **Screen Access: PROPOSED** |
| SCR-WTY-02 | Warranty Processing | Owner, Admin, Manager, Sales, Tech | Owner, Admin, Manager, Sales, Tech | **Screen Access: PROPOSED** |
| SCR-INV-01 | Stock Take | Owner, Admin, Manager | Owner, Admin, Manager | **Screen Access: PROPOSED** |

## Contextual Authorization (PROPOSED)
Even if a user possesses the correct role to access SCR-SALES-01, their actions are contextually scoped by ICurrentUserService.BranchId within the backend handlers. 
**PROPOSED:** Frontend should scope displayed data (e.g., Inventory, Warehouses) to the user's branch context where branch information is available, while backend BranchId enforcement remains authoritative.

> **Note on Phase 02 Roles:** 
> Receptionist is a confirmed backend role from Phase 02. No screen candidate for Receptionist has been mapped in the current Phase 04 scope. This does NOT imply that Receptionist has no system access.
