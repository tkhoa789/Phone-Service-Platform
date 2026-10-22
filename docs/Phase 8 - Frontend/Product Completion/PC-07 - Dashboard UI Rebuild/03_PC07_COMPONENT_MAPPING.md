# PC-07 COMPONENT MAPPING

| Legacy Component / HTML | Target PC-03 / PC-06 Component | Notes |
|---|---|---|
| `<div className="p-6 ... flex-row justify-between">` | `PageHeader` | Map the Hero banners to the standard PageHeader, or use a custom `Card` if DateRange selects are required inside the title block. |
| `<div className="p-5 rounded-3xl shadow-outer">` | `Card` | All KPI boxes should be wrapped in `Card`. |
| `<div className="w-10 h-10 shadow-inset">` | Custom | This is an icon container. Can use a generic `div` with `bg-slate-100/50` or just let the `Card` styling carry the weight. |
| `<button className="px-4 py-2.5 ... shadow-button">` | `Button` | Map actions to `variant="primary"` or `variant="secondary"`. |
| `<select className="bg-transparent ...">` | `Select` | Update DateRange dropdowns to use the PC-03 Select component. |
| `<span className="px-3 py-1 rounded-full bg-emerald-500/20">`| `Badge` | Map role badges to `Badge variant="success"`. |
