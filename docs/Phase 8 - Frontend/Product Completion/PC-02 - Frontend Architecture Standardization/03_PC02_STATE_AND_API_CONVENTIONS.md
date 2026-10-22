# PC-02 STATE & API CONVENTIONS

## 1. State Ownership Matrix
The frontend operates on four distinct layers of state. They must never overlap.

| State Type | Technology | Purpose | Forbidden Actions |
|---|---|---|---|
| **Server State** | React Query | API data fetching, caching, pagination, synchronization. | Do NOT copy API data into `useState` or Zustand to manipulate it. |
| **Global Client State** | Zustand | Theming, Auth tokens, global UI flags (Sidebar open). | Do NOT store lists of domain objects (e.g., `products`) in Zustand. |
| **Form State** | React Hook Form | Draft data entry, validation, dirty tracking. | Do NOT use raw `useState` for complex forms. |
| **Local UI State** | `useState` | Modals open/close, accordion toggles, active tabs. | Do NOT lift UI state higher than necessary. |

## 2. API & Data Fetching Conventions

### 2.1 The 3-Tier Execution Chain
Every backend API call must flow through exactly three tiers:

1. **DTO & Interface (`types/*.types.ts`):** Strictly typed mirroring the C# backend.
2. **API Client (`api/*.api.ts`):** Pure asynchronous functions executing Axios requests. NO React hooks here.
3. **Query Hook (`hooks/use*.ts`):** React Query `useQuery` or `useMutation` wrappers. This handles loading states, error toasts, and cache invalidation.

### 2.2 Query Key Factory Pattern
All React Query keys must be centralized in the feature's hook file to prevent string-typo bugs and ensure reliable cache invalidation.

```typescript
// Correct Pattern Example
export const productKeys = {
  all: ['products'] as const,
  lists: () => [...productKeys.all, 'list'] as const,
  list: (filters: ProductListFilterParams) => [...productKeys.lists(), filters] as const,
  detail: (id: string) => [...productKeys.all, 'detail', id] as const,
};
```

### 2.3 Form Mutation Standard
Mutations (`POST/PUT/DELETE`) must follow this sequence:
1. `onSuccess` triggers a `toast.success()`.
2. `onSuccess` triggers `queryClient.invalidateQueries()` using the precise Query Key Factory.
3. Modals close automatically upon success.
