# PC-05 NAVIGATION & ROUTING AUDIT

## 1. Scope of Audit
This audit assesses the global navigation UX, URL handling, role-based visibility, and mobile shell routing of the Phone Service Platform.

## 2. Findings

### 2.1 Mobile Navigation (Hamburger Menu)
- **Status:** **CRITICAL UX GAP (Resolved).**
- **Observation:** In PC-04, the Sidebar was configured to slide off-screen (`-translate-x-full`) on mobile (<768px). However, there was no toggle button to bring it back.
- **Action Required:** Inject a Hamburger Menu `<Button>` in `Header.tsx` that controls a `mobileMenuOpen` state in `MainLayout.tsx`.

### 2.2 Breadcrumb Trail
- **Status:** **UX GAP (Resolved).**
- **Observation:** Pages were rendering isolated titles. There was no way for users to understand their depth within the app or navigate up a level (e.g., from `/repairs/intake` back to `/repairs`).
- **Action Required:** Create a `<Breadcrumb>` component based on `react-router-dom`'s `useLocation()` and inject it statically above the `<Outlet>` in `MainLayout.tsx`.

### 2.3 404 & Unauthorized Handling
- **Status:** **POOR UX (Resolved).**
- **Observation:** Invalid routes (`/*`) were silently redirecting to `/dashboard`. Unauthorized routes (`ProtectedRoute.tsx`) rendered an `AccessDeniedScreen` that broke the Neumorphic Design System rules (hardcoded tailwind blocks).
- **Action Required:** Build a dedicated `NotFoundScreen.tsx` for 404s. Refactor `AccessDeniedScreen` to use PC-03 `<Card>` and `<Badge>` primitives.

### 2.4 Active Route & Role Visibility
- **Status:** **GOOD (Preserved).**
- **Observation:** `Sidebar.tsx` effectively uses `location.pathname.startsWith(item.path)` to highlight active nested routes. It also successfully checks `user.roles.includes(...)` before rendering items.
- **Action:** No changes needed to routing logic; only styling was updated in PC-04.
