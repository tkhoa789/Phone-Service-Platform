# PC-07 MISSING / LEGACY COMPONENT REGISTER

## Missing Components in Design System
- **ProgressBar / ProgressTrack:** There is no standard primitive for progress bars. The Dashboard draws its own (`div` with inline width percentages).
  - *Recommendation:* Do not create a global primitive for this yet, as it's only used in the Dashboard's Branch Performance section. Just clean up the CSS to match PC-03 tokens.

## Legacy Components to Retire
- The inline `<select>` element used for the Date Range picker. Must be replaced with `<Select>`.
- The raw HTML buttons used for action links (`/branches`, `/users`, etc.).
