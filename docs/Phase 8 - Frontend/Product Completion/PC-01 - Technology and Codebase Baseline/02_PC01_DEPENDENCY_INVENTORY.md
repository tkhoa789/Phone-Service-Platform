# PC-01 DEPENDENCY INVENTORY

## 1. Core Framework & Build
| Dependency | Version | Action | Justification |
|---|---|---|---|
| `react` / `react-dom` | 19.2.7 | **KEEP** | Core framework. |
| `vite` | 8.1.1 | **KEEP** | Core build tool. Extremely fast. |
| `@tailwindcss/vite` | 4.3.3 | **KEEP** | Tailwind v4 standard integration. |
| `typescript` | ~6.0.2 | **KEEP** | Core language. |

## 2. State & Data Fetching
| Dependency | Version | Action | Justification |
|---|---|---|---|
| `@tanstack/react-query` | 5.101.4 | **KEEP** | Perfect for server state. Deeply integrated. |
| `zustand` | 5.0.14 | **KEEP** | Excellent for lightweight global client state. |
| `axios` | 1.18.1 | **KEEP** | Handles auth interceptors reliably. |
| `react-router-dom` | 7.18.1 | **KEEP** | Standard routing, heavily relied upon in `App.tsx`. |

## 3. UI & Forms
| Dependency | Version | Action | Justification |
|---|---|---|---|
| `react-hook-form` | 7.82.0 | **KEEP** | Excellent performance. Needs to be rolled out globally to replace legacy `useState` forms. |
| `@hookform/resolvers` | 5.4.0 | **KEEP** | Bridge for Zod. |
| `zod` | 4.4.3 | **KEEP** | Runtime type safety and form validation. |
| `lucide-react` | 1.25.0 | **KEEP** | Current icon standard. |
| `clsx` / `tailwind-merge` | 2.1 / 3.6 | **KEEP** | Powers the `cn()` utility for the Design System. |
| `react-hot-toast` | 2.6.0 | **KEEP** | Standardized notification system. |
| `recharts` | 3.10.0 | **KEEP** | Used in Dashboard. |

## 4. Linting & Testing
| Dependency | Version | Action | Justification |
|---|---|---|---|
| `oxlint` | 1.71.0 | **KEEP** | Blazing fast Rust-based linter. |
| `vitest` / `@testing-library/*` | 4.1 / 16 | **REVIEW** | Present but actual test coverage needs validation in future phases. |

**Note:** No UI component libraries (like Radix, MUI, or AntD) are present. The UI is 100% custom-built using raw Tailwind classes and CSS variables.
