# PC-04 APPLICATION SHELL ARCHITECTURE

## 1. Architectural Concept
The Application Shell establishes the fixed layout boundaries that all FSD domains (Products, Customers, POS) will render within. 

```text
[MainLayout] (flex, h-screen)
├── [Sidebar] (fixed left, responsive width)
│   ├── Brand/Logo
│   ├── Primary Navigation (RBAC-aware)
│   └── User Profile / Logout
│
├── [Header] (fixed top right, sticky width)
│   ├── Global Search Input
│   ├── Branch Selector (Owner/Admin only)
│   └── Utility Actions (AI, Theme, Language, Notifications)
│
├── [AIFloatingButton] (fixed bottom right)
│
└── [Main] (flex-1, scrolling viewport)
    └── [Outlet] (Business Page Container)
```

## 2. Design System Integration
The shell now exclusively imports components from `src/components/ui/*`:
- `Button`: Used for toggling the sidebar, theme switching, language switching, and notifications.
- `Input`: Used for the global search bar in the Header.
- `Select`: Used for branch switching in the Header.
- `Badge`: Used for notification counters and nav item tags.
- `Card`: Used for dropdown menus and the AI chat drawer.

## 3. The `MainLayout` Preservation
`MainLayout.tsx` itself acts strictly as a composition root. It avoids complex UI logic, simply rendering the `Sidebar` and `Header` while managing the `collapsed` state and adjusting the margin-left of the `<main>` tag. This guarantees that `App.tsx` routing stays completely unaffected.
