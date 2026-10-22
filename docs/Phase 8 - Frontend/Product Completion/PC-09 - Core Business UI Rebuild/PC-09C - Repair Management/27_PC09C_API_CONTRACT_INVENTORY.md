# PC-09C Discovery: API Contract Inventory

## 1. RepairTicket Endpoints
- `GET /RepairTicket`: Fetches paginated repair list.
- `GET /RepairTicket/{id}`: Fetches details.
- `POST /RepairTicket`: Creates a new ticket.
- `PUT /RepairTicket/{id}/status`: Updates status. Payload: { repairTicketId, status, note }.
- `POST /RepairTicket/{id}/parts`: Adds parts to the ticket. Payload: { repairTicketId, productVariantId, quantity, unitPrice }.
- `POST /RepairTicket/checklist`: Records device condition checkpoints (CheckIn/CheckOut).
- `POST /RepairTicket/{id}/deposit`: Collects deposit.
- `DELETE /RepairTicket/{id}`: Soft delete/cancellation.

## 2. Pagination Strategy
Currently, `getRepairs()` fetches an array and calculates items.length. It appears to function identically to the Inventory domain (client-side pagination or pseudo-server-pagination). 
The rebuild will convert this to React Query useQuery to handle fetching and cache invalidation automatically.

## 3. Financial Calculation
- Calculations (Total Amount, Remaining Balance) are handled by the Backend domain logic.
- When the Frontend calls POST /parts, the backend updates the partsTotal and totalAmount. The frontend merely refreshes the RepairTicketDto to reflect the new totals.
