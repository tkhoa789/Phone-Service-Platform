# PC-03 DESIGN SYSTEM AUDIT

## 1. Overview
The current Design System inside `src/components/ui/` is severely incomplete. While the baseline `Button`, `Input`, and `Card` exist and successfully encapsulate the Neumorphism design tokens (`var(--neu-*)`), the library is missing critical structural elements (Tables, Textareas, Selects, Checkboxes) and feedback mechanisms (Alerts, Tooltips, Toasts are imported directly from third parties instead of wrapped).

Because of this incompleteness, developers in previous phases were forced to bypass the Design System and write raw HTML/Tailwind classes throughout business pages, resulting in massive UI duplication.

## 2. Token Audit (`index.css`)
**Status: GOOD.** 
The pure CSS variable system utilizing `--neu-bg-base`, `--neu-shadow-button`, `--neu-shadow-inset`, and `--neu-accent-mint` provides a solid high-contrast Neumorphic baseline. 
However, there is no standardized focus ring color token, forcing hardcoded `focus:ring-emerald-500/20` throughout components.

## 3. Component Inventory (Pre-Consolidation)

| Component | Status | Assessment |
|---|---|---|
| `Button` | Exists | Solid variants, but lacks `icon` standard sizing consistency. |
| `Input` | Exists | Handles errors and labels well. |
| `Select` | **Missing** | Developers use `SearchableSelect` or raw `<select>`. |
| `Checkbox`| **Missing** | Developers write raw `<input type="checkbox">`. |
| `Radio` | **Missing** | Developers write raw `<input type="radio">`. |
| `Textarea`| **Missing** | Developers write raw `<textarea>`. |
| `Table` | **Missing** | Entire tables are hardcoded in `ProductListPage` and `RepairListPage`. |
| `Alert` | **Missing** | Needs a standard inline warning component. |
| `Dialog` | Exists | Stable Radix-style dialog. |
| `Modal` | **Deleted** | Removed duplicate of Dialog. |
| `Card` | Exists | Basic wrapper, lacks Sub-components (CardHeader, CardContent). |
| `Badge` | Exists | Used for status tags. |
| `Skeleton`| Exists | Used for loading states. |

## 4. Bypassed Patterns Detected
- **`ProductListPage.tsx`**: Uses raw `<button className="px-4 py-2.5 rounded-2xl bg-gradient-to-r... shadow-[var(--neu-shadow-button)]">`. This is a direct violation of Design System encapsulation.
- **`RepairListPage.tsx`**: Uses inline `<table className="w-full text-left border-collapse">`.

## 5. Objective
To build the missing components natively within `components/ui/` using Tailwind CSS and the existing Neumorphic tokens, completely eliminating the need for any business page to write custom UI CSS.
