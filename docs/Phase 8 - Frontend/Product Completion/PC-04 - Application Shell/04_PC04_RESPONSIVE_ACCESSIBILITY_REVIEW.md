# PC-04 RESPONSIVE & ACCESSIBILITY REVIEW

## 1. Responsive Layout
- **Desktop (1024px+):** Sidebar is fixed left (256px). Header adjusts its `left` property accordingly.
- **Tablet (768px - 1023px):** Sidebar collapses to icon-only mode (80px). Header expands to fill the remaining space.
- **Mobile (<768px):** The Sidebar translates off-screen (`-translate-x-full`). 
  > *Note: A dedicated mobile hamburger menu toggle is currently missing from the Header. This is a known UX debt that should be addressed in PC-05 (Navigation/Routing UX).*

## 2. Accessibility (A11y)
- **Focus States:** Because the shell now uses `Button`, `Input`, and `Select` from the Design System, every interactive element in the Header and Sidebar correctly receives a `focus:ring-2 focus:ring-emerald-500/50` when navigated via keyboard.
- **Semantic Structure:** 
  - `Sidebar` uses `<aside>` and `<nav>`.
  - `Header` uses `<header>`.
  - `MainLayout` uses `<main>`.
- **Contrast:** The strict adherence to `var(--neu-text-title)` and `var(--neu-text-sub)` guarantees sufficient contrast against `var(--neu-bg-base)` in both Light and Dark themes.
