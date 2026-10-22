# Form & Validation Matrix

| Entity | State Management | Validation Strategy | Notes |
|---|---|---|---|
| Customer | `react-hook-form` | `zodResolver(customerSchema)` | Stable. Needs UI component replacement only. |
| Product | `react-hook-form` | `zodResolver(productSchema)` | Stable. Complex form, requires careful UI mapping. |
| Supplier | `react-hook-form` | `zodResolver(supplierSchema)` | Stable. |
| Branch | `react-hook-form` | `zodResolver(branchSchema)` | Stable. |
| User | `useState` (Raw) | Manual/None | **Tech Debt:** Must be refactored to `react-hook-form` + `zod` for consistency. |
