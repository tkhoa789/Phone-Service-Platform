# PC-09A Design System Mapping

## Legacy -> PC-03 Mapping
| Legacy Visuals | PC-03/PC-06 Replacement |
|---|---|
| `var(--neu-bg-base)` cards | `<Card>` or `bg-card` |
| Inline `linear-gradient` buttons | `<Button variant="primary">` |
| Manual `input` with `focus:ring-emerald-500` | `<ControlledInput>` or standard `Input` primitive |
| Cart Item rows | Standard Flex layout with `bg-muted/50` |
| `window.print()` overlay | Unchanged (Native browser behavior) |