# PC-07 CURRENT TO TARGET MATRIX

| Feature | Current Implementation | Target Implementation |
|---|---|---|
| Dashboard Banners | Hardcoded flex grids with raw inline Tailwind styling. | Compose using `Card` and `Button` from the Design System. |
| KPI Metric Cards | Inline `shadow-[var(--neu-shadow-outer)]`. | `<Card className="p-5 space-y-3">` |
| Progress Bars (Branch Revenue) | Raw `div` with inline width styling. | Clean `div` tracking standard UI colors. |
| Loading State | Ternary inline text (`loading ? 'Đang tính...' : ...`). | Use `Skeleton` component for text lines. |
