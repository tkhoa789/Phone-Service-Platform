# PC-07 DASHBOARD UI AUDIT

## 1. Audit Scope
Inventory of current Dashboard Page (`src/pages/dashboard/DashboardPage.tsx`).

## 2. Views Identified
The Dashboard currently conditionally renders completely different layouts based on Role:
- `isOwner` -> **1. OWNER DASHBOARD VIEW**
- `isAdmin` -> **2. ADMIN IT DASHBOARD VIEW**
- `!isOwner && !isAdmin` -> **3. BRANCH OPERATIONAL DASHBOARD VIEW**

## 3. Findings

### 3.1 Hardcoded Neumorphism
- **Status:** **CRITICAL UI DEBT**
- **Observation:** The entire page relies on manual `bg-[var(--neu-bg-base)] shadow-[var(--neu-shadow-outer)]` or `shadow-[var(--neu-shadow-inset)]` classes for almost every element (cards, buttons, icons).
- **Resolution Needed:** All metric cards, banners, and lists must be reconstructed using PC-03 `<Card>`, `<Badge>`, and `<Button>`.

### 3.2 Page Header
- **Status:** **DUPLICATED**
- **Observation:** Each of the 3 views implements its own custom banner with a flexbox grid, absolute SVG icons, and a cluster of action buttons.
- **Resolution Needed:** Should use PC-06 `<PageHeader>` or a customized `<Card>` that acts as a hero banner.

### 3.3 KPI Grids
- **Status:** **INCONSISTENT**
- **Observation:** Owner view shows Revenue/Profit. Admin view shows Accounts/Audit Logs. Branch view shows local Revenue/Repairs. Each creates custom grid cards.
- **Resolution Needed:** Create a reusable `<KpiCard>` or just map over standard `<Card>` components.

### 3.4 Data Visualizations & Lists
- **Status:** **RAW HTML**
- **Observation:** The "Branch Performance Breakdown" and "System Infrastructure Engine Status" are manually drawn using nested `div`s for progress bars and list items.
- **Resolution Needed:** Needs to be standardized.
