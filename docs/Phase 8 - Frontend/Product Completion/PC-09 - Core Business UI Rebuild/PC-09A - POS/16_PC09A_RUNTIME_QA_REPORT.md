# PC-09A Runtime QA Report

## Tests Executed
1. **Double Submission Test**: Rapid clicks on "Confirm Print" in payment modal were suppressed by `isSubmitting` state and the Idempotency Key payload.
2. **Checkout Flow**: 
   - `POST /SalesOrder` fires with Idempotency Key header.
   - Wait for response.
   - `PUT /SalesOrder/{id}/status` fires to set 'Completed'.
   - Success toast appears.
3. **Failure State**: Simulating a failure on `createOrder` correctly aborts the flow, leaving the idempotency key intact for a retry.
