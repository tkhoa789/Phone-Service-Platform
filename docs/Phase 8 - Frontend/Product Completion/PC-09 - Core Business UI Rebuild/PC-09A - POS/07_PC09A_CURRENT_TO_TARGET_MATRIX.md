# PC-09A Current to Target Matrix

| Metric | Current State | Target State |
|---|---|---|
| Architecture | `src/pages/sales/` (Legacy) | `src/features/pos/` (FSD) |
| State Management | `useState`, `useEffect` | React Query + local `useState` / `useForm` |
| UI Primitives | Raw HTML, manual CSS variables | PC-03 UI Components (`Card`, `Button`, `Input`) |
| Layout | Custom flex/grid without standard spacing | PC-06 standardized grid/flex spacing |
| Network | Axios direct | TanStack Query |