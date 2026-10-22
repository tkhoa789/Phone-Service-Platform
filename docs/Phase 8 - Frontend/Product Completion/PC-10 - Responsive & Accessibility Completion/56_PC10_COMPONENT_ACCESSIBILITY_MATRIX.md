# PC-10 Component Accessibility Matrix

| Component | Keyboard Nav | Focus Ring | ARIA Labels | Semantic Tag | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `Button` (Text) | ✅ | ✅ | N/A (Has text) | `<button>` | 🟢 PASS |
| `Button` (Icon) | ✅ | ✅ | ❌ Missing | `<button>` | 🔴 P0 FAIL |
| `Dialog` | ✅ (Trap) | ✅ | ✅ | `<dialog>` / Radix | 🟢 PASS |
| `Table` | ❌ (No wrap) | ➖ | ➖ | `<table>` | 🟡 P1 FAIL |
| `SearchInput` | ✅ | ✅ | ✅ | `<input>` | 🟢 PASS |
| `Sidebar` | ✅ | ✅ | ❌ Missing | `<aside>` | 🟡 P2 FAIL |
| `MainLayout` | N/A | N/A | N/A | `<div>` | 🔴 P1 FAIL |