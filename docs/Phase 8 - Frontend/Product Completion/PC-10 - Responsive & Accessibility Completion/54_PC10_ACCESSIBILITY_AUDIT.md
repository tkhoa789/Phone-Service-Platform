# PC-10 Discovery: Accessibility Audit

## 1. Automated Findings (Axe-Core)
An automated Axe-Core audit injected via Puppeteer revealed consistent failures across all 7 critical routes:

| Rule ID | Impact | Description | Occurrences |
| :--- | :--- | :--- | :--- |
| `button-name` | Critical | Buttons must have discernible text. | Global (Icon buttons) |
| `landmark-one-main` | Moderate | Document must have a `<main>` landmark. | Global (`MainLayout`) |
| `region` | Moderate | Content must be contained by landmarks. | Global |

## 2. Semantic HTML (P1 — High)
- The `MainLayout.tsx` uses `<div className="w-full ...">` for the route outlet wrapper instead of `<main>`.
- The `Header.tsx` uses `<div>` instead of `<header>`.
- The `Sidebar.tsx` uses `<aside>` (PASS) but lacks an `aria-label="Sidebar"`.

## 3. Keyboard & Focus (P2 — Medium)
- Radix UI Dialogs inherently manage focus traps and `Escape` closing (PASS).
- Dropdowns and Selects are fully keyboard accessible (PASS).
- **Defect**: Some custom list actions may have unpredictable tab order if not explicitly managed.

## 4. Touch Targets (P2 — Medium)
- Icon buttons in `ListPages` (Edit/Delete) use `size="icon"` which is `h-9 w-9` (36px). WCAG 2.1 AAA recommends 44px, but 36px is an acceptable enterprise standard (Material Design uses 40px). No changes required unless authorized.