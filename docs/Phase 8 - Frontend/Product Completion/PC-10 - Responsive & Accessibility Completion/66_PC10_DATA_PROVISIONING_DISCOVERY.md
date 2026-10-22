# PC-10 Data Provisioning Discovery

## 1. Objective
To explicitly determine if the repository possesses an *existing approved mechanism* to provision `Product` and `ProductVariant` data for local development, and to map the exact data dependencies required to unblock the POS Checkout E2E test.

## 2. Discovery Process & Scope
- **Scope**: Read-only inspection of API definitions, C# Service contracts, frontend UI components (Product Management, Inventory Management), and backend controllers.
- **Constraints**: No application code modified, no database mutations, no mocking.

## 3. Findings: Data Provisioning Mechanisms
While the EF Core `DatabaseSeeder.cs` and raw `SEED_DATA.md` scripts do not include business catalog data, the application **does** provide existing, approved, and fully functional API mechanisms to provision this data:

1. **Product Creation API**:
   - Endpoint: `POST /api/Product`
   - Contract: `CreateProductCommand` (requires `categoryId`, `brandId`, `code`, `name`)
   - UI Mapping: `ProductListPage.tsx` → `ProductModal`
2. **Product Variant Creation API**:
   - Endpoint: `POST /api/Product/Variant`
   - Contract: `CreateProductVariantCommand` (requires `productId`, `sku`, `name`, `costPrice`, `salePrice`)
   - UI Mapping: `ProductListPage.tsx` → `VariantModal`
3. **Inventory Provisioning API**:
   - Endpoint: `POST /api/StockTake` (Kiá»ƒm Kho / Inventory Audit)
   - Contract: `CreateStockTakeCommand` (requires `warehouseId`, and a list of `CreateStockTakeItemCommand` containing `productVariantId` and `actualQuantity`)
   - UI Mapping: `InventoryPage.tsx` → `AuditModal`

**Conclusion**: The repository possesses the requisite application layers to provision data. A developer (or E2E setup script) can programmatically orchestrate these APIs using an authenticated JWT token to seed the environment without modifying the codebase.

## 4. Minimum Valid Data Dependencies for POS Workflow
To unblock the POS Critical Path (`Catalog → Variant → Cart → Voucher → Payment → VietQR → K80 Receipt`), the following dependency chain must be satisfied:

1. **Foundation (Already Seeded)**:
   - `Brand` (e.g., Apple: `b1b1...`)
   - `Category` (e.g., Smartphone: `c1c1...`)
   - `Warehouse` (e.g., WH_Q1: `w1w1...`)
2. **Catalog Definition (Requires Setup)**:
   - Create at least `1 Product` tied to an existing Brand and Category.
   - Create at least `1 ProductVariant` tied to the Product, with a valid `salePrice` > 0.
3. **FSD Cart & Availability (Requires Setup)**:
   - Execute an `Inventory StockTake` to set `actualQuantity` > 0 for the created ProductVariant in the active Branch's Warehouse. (Without this, the FSD checkout boundary restricts adding the item to the cart or disables the payment button).

## 5. Final Classification

**B. DATA SETUP REQUIRED — EXISTING MECHANISM AVAILABLE**

**Reasoning**: 
- `Product`/`ProductVariant`/`Inventory` data is explicitly expected but currently missing from the local database.
- An approved mechanism **already exists** via the application's standard REST API (`/api/Product`, `/api/StockTake`). 
- We do not need to write custom EF Core seeders or raw SQL patches; the environment simply needs to be prepared by invoking the existing administrative APIs prior to running the POS E2E tests.
