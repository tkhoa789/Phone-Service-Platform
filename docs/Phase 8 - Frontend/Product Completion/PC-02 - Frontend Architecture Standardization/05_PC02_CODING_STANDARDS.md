# PC-02 CODING STANDARDS

## 1. Naming Conventions

| Entity | Casing Standard | Example |
|---|---|---|
| Folders | kebab-case | `purchase-orders/` |
| Files (React Components) | PascalCase | `ProductFormModal.tsx` |
| Files (Hooks) | camelCase | `useProducts.ts` |
| Files (Utils/API) | camelCase | `product.api.ts`, `dateUtils.ts` |
| React Components | PascalCase | `export const ProductCard = ...` |
| Interfaces / Types | PascalCase + Suffix | `interface ProductDto`, `type TicketStatus` |
| Generic Type Parameters | Single Capital Letter | `<T>` |
| Query Keys | camelCase | `productKeys` |

## 2. Component Structure Standard
All React components must be declared as standard arrow functions with explicitly typed props. `React.FC` is permitted but not mandatory.

```tsx
import React from 'react';
import { Button } from '@/components/ui/Button';

// 1. Types
interface UserProfileProps {
  userId: string;
  className?: string;
}

// 2. Component
export const UserProfile = ({ userId, className }: UserProfileProps) => {
  // 3. Hooks
  const { data, isLoading } = useUser(userId);

  // 4. Derived State (Avoid useState if computable)
  const displayName = data ? `${data.firstName} ${data.lastName}` : '';

  // 5. Render
  if (isLoading) return <Skeleton />;
  return (
    <div className={cn("base-classes", className)}>
      {displayName}
      <Button variant="primary">Edit</Button>
    </div>
  );
};
```

## 3. Styling Standards (The "No Inline Neumorphism" Rule)
Developers are strictly forbidden from writing inline Neumorphism variables in their feature components.

- **❌ WRONG:** `<div className="bg-[var(--neu-bg-base)] shadow-[var(--neu-shadow-outer)] p-4">`
- **✅ RIGHT:** `<Card className="p-4">`

If a UI primitive does not exist in `components/ui/`, it must be created there first.

## 4. Export Standard
- Use **named exports** exclusively for all components, hooks, and utilities.
- Default exports are **ONLY** permitted for lazy-loaded page components in `App.tsx` (and even then, they are typically remapped from named exports).
