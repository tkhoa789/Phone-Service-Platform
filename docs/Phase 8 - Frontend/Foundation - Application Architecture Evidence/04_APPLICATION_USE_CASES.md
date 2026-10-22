# 04.1 APPLICATION USE CASES

> **Evidence Level Taxonomy:**
> - **CONFIRMED:** Direct code evidence exists.
> - **OBSERVED:** Implementation capability / behavior directly observed.
> - **INFERRED:** Architectural/business interpretation based on evidence.
> - **PROPOSED:** Suggested design/architecture for the Frontend.
> - **UNKNOWN:** Insufficient code evidence.
> - **CONTRADICTION:** Conflicting evidence.

## Use Case 1: Create Sales Order (POS Checkout Initiation)
**Evidence Level:** CONFIRMED

* **Allowed Roles (CONFIRMED):** Sales, Manager, Admin, Owner (via [Authorize(Roles="...")]).
* **Business Actor (INFERRED):** Cashier / Store Staff.
* **Authorization:** [Authorize] with role checks (SalesOrderController.cs:L20) + Handler applies contextual scoping via ICurrentUserService.BranchId (SalesOrderCommandHandlers.cs:L35).
* **UI Intent:** Cashier submits cart items (products, quantities, optional IMEIs, optional voucher) to initiate a checkout transaction.
* **HTTP API:** POST /api/SalesOrder ([Idempotent] attribute observed at SalesOrderController.cs:L22).
* **Request Payload (DTO):** CreateSalesOrderCommand
* **Command:** CreateSalesOrderCommand
* **Handler:** CreateSalesOrderCommandHandler
* **Preconditions:**
  - *Validation (FluentValidation):* CustomerId and Items cannot be empty. Quantity must be > 0.
  - *Business (Handler):* Customer must exist, Product Variant must exist.
* **State Transition:** (New) ➔ Draft (OBSERVED).
* **Side Effects:** Creates SalesOrderEntity and SalesOrderItemEntity in the database.
* **Response:** ApiResponse<Guid> (Returns newly created Order ID). SalesOrderController.cs:L25
* **Error Conditions (CONFIRMED from Code):**
  - 400 BadRequest (Code: VALIDATION_ERROR): Missing payload fields (GlobalExceptionMiddleware.cs).
  - 404 NotFound (Code: NOT_FOUND): Customer or ProductVariant ID invalid (BusinessExceptions.cs).
* **UI State Change (PROPOSED):** Upon success, navigate to the "Order Payment/Confirmation" screen, loading the new Order ID.
* **Data Refresh Requirement (PROPOSED):** No global refresh required. Local state transition only.

---

## Use Case 2: Complete Sales Order (Payment & Handover)
**Evidence Level:** CONFIRMED

* **Allowed Roles (CONFIRMED):** Sales, Manager, Admin, Owner.
* **Business Actor (INFERRED):** Cashier / Store Staff.
* **Authorization:** Standard BranchId match.
* **UI Intent:** Cashier confirms payment has been received and finalizes the order to deduct inventory and close the ticket.
* **HTTP API:** PUT /api/SalesOrder/{id}/status (SalesOrderController.cs:L33)
* **Request Payload (DTO):** UpdateSalesOrderStatusCommand
* **Command:** UpdateSalesOrderStatusCommand
* **Handler:** UpdateSalesOrderStatusCommandHandler
* **Preconditions:**
  - *Validation:* Id not empty, Status must be valid enum.
  - *Business:* Order must exist. Current status != Cancelled. The Branch MUST have an active warehouse (observed ordering rule: newest warehouse). Valid IMEIs must be InStock at the valid warehouse. Physical inventory must be sufficient.
* **State Transition:** Draft / Confirmed / Processing ➔ Completed (OBSERVED).
* **Side Effects (Cross-Module Workflow):**
  - Deducts InventoryEntity.
  - Creates InventoryTransactionEntity (Type: SALE).
  - Mutates ImeiEntity status ➔ Sold.
  - Modifies VoucherEntity (UsageCount++).
  - Modifies CustomerEntity (RewardPoints++).
* **Response:** ApiResponse<bool> (Success flag). SalesOrderController.cs:L43
* **Error Conditions (CONFIRMED from Code):**
  - 400 BadRequest (Code: INVENTORY_NOT_ENOUGH): Insufficient stock (BusinessExceptions.cs).
  - 400 BadRequest (Code: INVALID_IMEI_STATUS): IMEI not available for sale.
  - 404 NotFound (Code: NOT_FOUND): Order ID not found.
  - 409 Conflict (Code: CONCURRENCY_ERROR): Implicit concurrency conflict. Stale data detected by EF Core DbUpdateConcurrencyException, mapped by GlobalExceptionMiddleware.cs:L47.
* **UI State Change (PROPOSED):** Show "Success" receipt modal. Clear POS cart.
* **Data Refresh Requirement (PROPOSED):** Inventory Screen needs manual/polling refresh (Domain Events realtime sync is UNKNOWN).

---

## Use Case 3: Register Warranty Ticket
**Evidence Level:** CONFIRMED

* **Allowed Roles (CONFIRMED):** Sales, Manager, Admin, Owner, Technician.
* **Business Actor (INFERRED):** Customer Service / Technician.
* **Authorization:** Standard BranchId contextual scoping (WarrantyTicketController.cs:L25).
* **UI Intent:** Staff intakes a defective device from a customer to begin a warranty claim.
* **HTTP API:** POST /api/WarrantyTicket (WarrantyTicketController.cs:L26)
* **Request Payload (DTO):** CreateWarrantyTicketCommand (CustomerId, ProductVariantId, Imei, Note).
* **Preconditions:**
  - IMEI must exist.
  - IMEI must be associated with a Completed Sales Order (BR-901).
  - Current Date <= PurchaseDate.AddMonths(12) (BR-902).
* **State Transition:** (New) ➔ Received (OBSERVED).
* **Side Effects:** IMEI Status mutated to WarrantyHold.
* **Response:** ApiResponse<Guid> (Ticket ID). WarrantyTicketController.cs:L29
* **Error Conditions:** 
  - 400 BadRequest (Code: BAD_REQUEST): Exceeded 12 months, or SalesOrder not completed (WarrantyCommandHandlers.cs:L50).
* **UI State Change (PROPOSED):** Navigate to Warranty Ticket detail view for printing receipt.
* **Data Refresh Requirement (PROPOSED):** None.

---

## Use Case 4: Process Warranty (Swap Device)
**Evidence Level:** CONFIRMED

* **Allowed Roles (CONFIRMED):** Technician, Manager, Owner, Admin, Sales.
* **Business Actor (INFERRED):** Technician.
* **UI Intent:** Staff resolves the warranty by providing the customer with a replacement device (Swap).
* **HTTP API:** PUT /api/WarrantyTicket/{id}/status (WarrantyTicketController.cs:L38)
* **Request Payload (DTO):** UpdateWarrantyStatusCommand (Includes NewImei and yte[] RowVersion).
* **Preconditions:**
  - Pre-flight RowVersion Concurrency Check (Explicitly checked in WarrantyCommandHandlers.cs:L150).
  - Target state must be Completed. Current state must be Received or Processing.
  - NewImei must exist, be InStock, and belong to the correct WarehouseId.
* **State Transition:** Received or Processing ➔ Completed (OBSERVED).
* **Side Effects (Business Swap):** 
  - Old IMEI Status ➔ Disposed.
  - New IMEI Status ➔ Sold and WarehouseId ➔ 
ull.
* **Response:** ApiResponse<bool>. WarrantyTicketController.cs:L46
* **Error Conditions:**
  - 409 Conflict (Code: CONFLICT): Explicit pre-flight check fails and throws ConflictException.
* **UI State Change (PROPOSED):** Transition UI to read-only "Completed" state.
* **Data Refresh Requirement (PROPOSED):** Inventory tracking screen must refresh IMEI statuses.

---

## Use Case 5: Execute Stock Take
**Evidence Level:** CONFIRMED

* **Allowed Roles (CONFIRMED):** Manager, Admin, Owner.
* **Business Actor (INFERRED):** Manager / Authorized Inventory Operator.
* **UI Intent:** Staff initiates a physical stock count process.
* **HTTP API:** POST /api/StockTake (StockTakeController.cs)
* **Request Payload (DTO):** CreateStockTakeCommand
* **Command:** CreateStockTakeCommand
* **Handler:** CreateStockTakeCommandHandler
* **State Transition:** (New) ➔ Draft (OBSERVED).
* **Side Effects:** Creates StockTakeEntity.
* **Response:** ApiResponse<Guid> (Returns newly created Stock Take ID).
* **Data Refresh Requirement (PROPOSED):** None globally; local UI redirection.
