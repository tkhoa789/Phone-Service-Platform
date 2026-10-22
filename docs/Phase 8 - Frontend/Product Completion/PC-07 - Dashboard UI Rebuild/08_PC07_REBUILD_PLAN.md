# PC-07 REBUILD PLAN

## Objective
Rebuild `DashboardPage.tsx` using strictly PC-03 Design System components.

## Steps
1. **Import:** Add `Card`, `Badge`, `Button`, `Select`, `Skeleton` from `ui/`.
2. **Hero Banners:** Replace the 3 top-level banner divs (`Owner`, `Admin IT`, `Branch`) with `<Card>` components. Replace raw html buttons inside them with `<Button>`.
3. **KPI Grids:** Refactor all 12 KPI cards across the 3 views. Replace `shadow-[var(--neu-shadow-outer)]` with `<Card>`.
4. **Custom Lists:** Refactor the Branch Performance and System Engines status rows into cleanly styled elements without inline hex values.
5. **Loading States:** Implement `<Skeleton>` loaders instead of flashing text like "Đang tính...".
6. **Verify:** Run TypeScript and Vite builds. Ensure layout matches the frozen functional baseline (all roles see what they are supposed to see).
