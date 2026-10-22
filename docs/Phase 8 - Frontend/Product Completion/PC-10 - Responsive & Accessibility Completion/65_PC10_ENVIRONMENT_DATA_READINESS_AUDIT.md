# PC-10 Environment Data Readiness Audit

## 1. Objective
To audit the repository and local environment in a strict read-only manner to determine if an approved mechanism exists for provisioning `Product` and `ProductVariant` test data, which is a prerequisite for executing the POS Checkout E2E workflow.

## 2. Audit Scope & Execution
- **Methodology**: Read-only static analysis of the backend `.NET` solution (`PSP.API`, `PSP.Infrastructure`, etc.), database seed documentation, and root project scripts.
- **Constraints**: 0 code modifications, 0 database mutations, 0 data seeding executed.

## 3. Findings

### 3.1 C# Codebase Inspection (`PSP.Infrastructure`)
- Inspected `PSP.Infrastructure/Data/Seeders/DatabaseSeeder.cs` which is executed via `Program.cs`.
- The `DatabaseSeeder.cs` is strictly limited to seeding foundational system data:
  1. `PaymentMethodEntity`
  2. `BranchEntity`
  3. `RoleEntity`
  4. `PermissionEntity`
  5. `UserEntity` (owner, admin, manager, sales, etc.)
  6. `UserRoleEntity`
  7. `RolePermissionEntity`
- **Finding**: There is **no code** within the existing `DatabaseSeeder` to provision `Products`, `ProductVariants`, or `Inventories`.

### 3.2 SQL Scripts & Documentation Inspection
- Inspected `docs/Phase 2 - Database Design/SEED_DATA.md`.
- The document provides raw SQL inserts for: `permissions`, `role_permissions`, `users`, `user_roles`, `payment_methods`, `brands`, `categories`, and `warehouses`.
- **Finding**: The database design documentation explicitly stops at `warehouses`. There are no provided SQL seed scripts for products or variants.
- Inspected the repository root and `scripts/` directories. No standalone CLI commands or `.sql` seed scripts exist for populating business catalog data.

### 3.3 Test Fixtures Inspection
- Inspected `PSP.Infrastructure.Tests`.
- The tests (e.g., `RepairExecutionConcurrencyTests.cs`) manually insert mock `Products` and `ProductVariants` directly into the EF Core `InMemoryDatabase` or test `AppDbContext` during the `Arrange` phase. 
- **Finding**: These fixtures are tightly scoped to unit/integration testing contexts and cannot be invoked to seed the running local development server without writing custom code.

## 4. Conclusion
The POS Application expects a populated catalog of `Products` and `ProductVariants` to function. The frontend `usePosProducts()` hook correctly fetches data, and the backend correctly returns it, but the local development database contains `0` records because no approved mechanism exists to seed this specific business data.

The previous `qa-batch4-pos-e2e.cjs` script in PC-09D suffered from a false positive because it did not strictly enforce the cart state before proceeding to click the disabled "Thanh toÃ¡n" button. The new targeted script correctly blocked the mechanical checkout due to this lack of data.

## 5. Final Classification

**C) NO APPROVED DATA SOURCE**

**Reasoning**: The repository does not contain an approved mechanism (SQL script, EF Core Seeder, or CLI tool) for providing the required `Product` and `ProductVariant` data for local E2E testing. 

*Recommendation*: A formal test-data seed script or FSD mock payload mechanism must be designed and approved before PC-10 Final QA can mechanically pass the POS checkout sequence.
