# PC-04 CURRENT SHELL AUDIT

## 1. Overview
The current Application Shell consists of `MainLayout.tsx`, `Sidebar.tsx`, and `Header.tsx`. These components currently serve as the orchestration backbone for authenticated routes in `App.tsx`.

## 2. Component Assessment

| Component | Architecture Compliance | Design System Compliance | Assessment & Findings |
|---|---|---|---|
| **MainLayout.tsx** | Good | Poor | Defines the main flex grid. Has hardcoded `bg-[var(--neu-bg-base)]` which is okay for the root body, but handles layout widths manually. |
| **Sidebar.tsx** | Poor | Poor | Contains extensive hardcoded Neumorphism tailwind blocks for `NavLink` states. Uses raw `<button>` for collapse toggles. |
| **Header.tsx** | Poor | Poor | Contains a raw `<input>` for search (bypassing `Input.tsx`) and raw `<select>` for branch switching (bypassing `Select.tsx`). Uses raw HTML buttons for user avatars and settings. |

## 3. Preservation Requirements (Functional Baseline)
1. **Routing:** `MainLayout` wrapping `Outlet` via `App.tsx` is completely stable.
2. **State Management:** `Sidebar` uses `useAuthStore`, `useSystemStore`, and `useThemeStore`. This must be preserved.
3. **RBAC:** Navigation items in `Sidebar` specify allowed roles (e.g., `roles: ['Owner', 'Admin']`). This logic must remain untouched.

## 4. Rebuild Plan
- Upgrade `Header.tsx` to use `Input` for global search and `Select` for branch switching. Use `Button` for action icons.
- Upgrade `Sidebar.tsx` to use `Button` for the collapse toggle. Refactor the `NavLink` active/inactive states to use cleaner, standardized Tailwind maps rather than massive inline templates.
- Ensure proper semantic HTML (`<nav>`, `<header>`, `<main>`, `<aside>`).
