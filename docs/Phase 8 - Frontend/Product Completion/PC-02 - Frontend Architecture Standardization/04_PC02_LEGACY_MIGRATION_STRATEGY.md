# PC-02 LEGACY MIGRATION STRATEGY

## 1. Migration Objective
To safely transform the legacy Monolith structures (`src/services`, `src/components/[domain]`, `api.types.ts`) into the standardized Feature-Sliced Design (FSD) architecture without breaking the frozen functional baseline established in Phase 09.

## 2. The 4-Step Migration Playbook
When migrating a legacy domain (e.g., `Repair`, `POS`, `Inventory`), engineers must execute these exact steps in order.

### Step 1: Scaffold the Feature
Create the `src/features/[domain]` folder structure.

### Step 2: Extract Types & API
- Extract the domain's DTOs from `src/types/api.types.ts` into `src/features/[domain]/types/`.
- Extract the Axios calls from `src/services/[domain]Service.ts` into `src/features/[domain]/api/`.
- Create `src/features/[domain]/hooks/` wrapping the API calls with React Query.

### Step 3: Extract & Refactor UI
- Move domain components from `src/components/[domain]/` to `src/features/[domain]/components/`.
- **CRITICAL DEBT RESOLUTION:** 
  - Strip out all inline Neumorphism Tailwind classes (`bg-[var(--neu-bg-base)] shadow-[var(--neu-shadow-button)]`).
  - Replace them entirely with imports from `src/components/ui/` (`Button`, `Card`, `Input`).
  - Standardize raw `useState` forms into `react-hook-form` + `zod` schemas.

### Step 4: Wire the Page & Delete Legacy
- Update `src/pages/[domain]/` to import from the new feature.
- Ensure `App.tsx` routes remain untouched.
- Delete the old `src/services/[domain]Service.ts`.
- Delete the old `src/components/[domain]/` folder.

## 3. Orphaned Code Purge Protocol
Code identified in PC-01 as explicitly dead (e.g., `src/components/products/`) can be purged immediately prior to migrating active code, provided a `grep` search confirms zero imports.

## 4. Regression Safety
The backend API contract is frozen. The migration strictly reorganizes *where* the frontend makes the calls and *how* the UI is styled. It does not alter the JSON payloads sent to the server.
