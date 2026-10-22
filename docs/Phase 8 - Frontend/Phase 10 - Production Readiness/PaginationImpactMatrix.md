# Pagination Impact Matrix

## Scope
This matrix traces all list endpoints affected by PERF-10-001.

| Domain | Endpoint | Backend Handler | Repository Method | Entity | Frontend Hook | Page Component | Current Slice | Risk |
|---|---|---|---|---|---|---|---|---|
| **Product** | `GET /Product` | `GetAllProductsQuery` | `GetAllAsNoTrackingAsync` | `ProductEntity` | `useProducts` | `ProductListPage` | `allProducts.slice` | High (Data Volume) |
| **Customer** | `GET /Customer` | `GetAllCustomersQuery` | `GetAllAsNoTrackingAsync` | `CustomerEntity` | `useCustomers` | `CustomerListPage` | `allCustomers.slice` | High (Data Volume) |
| **Warehouse** | `GET /Warehouse` | `GetAllWarehousesQuery` | `GetAllAsNoTrackingAsync` | `WarehouseEntity` | `useWarehouses` | `WarehouseListPage` | `allWarehouses.slice` | Low (Static) |
| **Branch** | `GET /Branch` | `GetAllBranchesQuery` | `GetAllAsNoTrackingAsync` | `BranchEntity` | `useBranches` | `BranchListPage` | `allBranches.slice` | Low (Static) |
| **Warranty** | `GET /Warranty` | `GetWarrantiesQuery` | `FindAsync` | `WarrantyTicketEntity` | `serviceService.getWarranties` | `WarrantyListPage` | `warranties.slice` | High (Volume) |
| **Repair** | `GET /RepairTicket`| `GetRepairTicketsQuery` | `FindAsync` | `RepairTicketEntity` | `serviceService.getRepairs` | `RepairListPage` | `filtered.slice` | High (Volume) |
| **Sales** | `GET /SalesOrder` | `GetSalesOrdersQuery` | `FindAsync` | `SalesOrderEntity` | `salesService.getOrders` | `SalesOrderListPage`| `filtered.slice` | High (Volume) |

## Wave 1 Bounded Execution Scope
To strictly control regression, Wave 1 will ONLY migrate:
1. **Product** (`GET /Product`)
2. **Customer** (`GET /Customer`)

These two endpoints carry the highest risk of OOM due to large dataset volumes in retail environments.
The remaining low/medium volume endpoints will remain unchanged in Wave 1 to ensure backward compatibility and limit the blast radius.

## Implementation Steps for Wave 1
1. **Backend:** Create `PagedResult<T>`.
2. **Backend:** Refactor `ProductQueryHandlers` and `CustomerQueryHandlers` to use `.GetQueryableAsNoTracking().Skip().Take()`.
3. **Frontend:** Update `product.api.ts` and `customer.api.ts` to return `PagedResult<T>`.
4. **Frontend:** Update `useProducts` and `useCustomers` hooks to pass `page` and `pageSize` actively and return the paged payload.
5. **Frontend:** Remove `.slice()` from `ProductListPage.tsx` and `CustomerListPage.tsx` and wire the API `TotalCount` to the Pagination component.
