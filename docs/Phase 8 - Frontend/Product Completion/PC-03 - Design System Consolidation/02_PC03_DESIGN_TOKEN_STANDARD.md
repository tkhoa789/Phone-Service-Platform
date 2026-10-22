# PC-03 DESIGN TOKEN STANDARD

## 1. Neumorphism Foundation (CSS Variables)
All UI components **MUST** use these variables. Hardcoding hexadecimal colors for backgrounds or shadows is strictly forbidden.

```css
:root {
  --neu-bg-base: #e2e8f0;
  --neu-text-title: #2d3748;
  --neu-text-sub: #4a5568;
  --neu-accent-mint: #059669;
  --neu-shadow-outer: 8px 8px 18px #b8c4d4, -8px -8px 18px #ffffff;
  --neu-shadow-inset: inset 4px 4px 9px #b8c4d4, inset -4px -4px 9px #ffffff;
  --neu-shadow-button: 6px 6px 14px #b8c4d4, -6px -6px 14px #ffffff;
}
```

## 2. Interaction States (Tailwind Classes)
The Design System components will encode the following standard states using Tailwind:

| State | Neumorphic Execution | Tailwind Pattern |
|---|---|---|
| **Default** | Outer Shadow (protruding) | `shadow-[var(--neu-shadow-button)]` |
| **Hover** | Slight scale up | `hover:scale-[1.02] transition-all` |
| **Active / Pressed** | Scale down + Inset Shadow | `active:scale-95 active:shadow-[var(--neu-shadow-inset)]` |
| **Focus (Keyboard)** | Emerald Ring | `focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 focus-visible:ring-offset-2` |
| **Disabled** | 50% Opacity + No pointer events | `disabled:opacity-50 disabled:cursor-not-allowed` |
| **Error** | Rose Ring / Border | `border-rose-500/50 focus-visible:ring-rose-500/50` |

## 3. Typography & Scale
- **Font Family:** `Plus Jakarta Sans` (Sans-serif fallback).
- **Titles (H1-H4):** `text-[var(--neu-text-title)] font-medium tracking-tight`.
- **Body Text:** `text-[var(--neu-text-sub)] font-normal`.
- **Input Text:** `text-sm` (To prevent iOS Safari auto-zoom).
- **Small Text (Meta):** `text-[11px]` or `text-xs`.

## 4. Spacing & Border Radius
- **Inputs & Buttons:** `rounded-2xl` (Standard pill-like Neumorphism).
- **Cards & Modals:** `rounded-3xl`.
- **Inner Elements (Badges):** `rounded-xl`.
- **Spacing Scale:** Standard Tailwind (`gap-2`, `gap-4`, `p-4`, `p-6`).
