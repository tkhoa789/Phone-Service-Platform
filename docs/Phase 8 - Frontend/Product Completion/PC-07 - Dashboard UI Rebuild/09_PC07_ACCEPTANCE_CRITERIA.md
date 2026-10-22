# PC-07 ACCEPTANCE CRITERIA

1. **Zero Raw HTML Inputs/Buttons:** No `<input>`, `<select>`, or `<button>` tags exist in `DashboardPage.tsx`. They are all replaced by PC-03 primitives.
2. **Zero Hardcoded Shadows/Colors:** No instances of `bg-[#...]` or `shadow-[...#...]`. All tokens must be standard CSS variables (`var(--neu-bg-base)`).
3. **Role Persistence:** The 3-role views (Owner, Admin, Branch) behave exactly as they did before. No business logic or API hooks were modified.
4. **Build Passing:** `tsc -b` and `vite build` complete without errors.
