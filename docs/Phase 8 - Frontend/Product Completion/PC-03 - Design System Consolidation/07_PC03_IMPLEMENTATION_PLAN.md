# PC-03 IMPLEMENTATION PLAN

## Phase 1: Foundation (Tokens & Layout)
1. Lock in the `index.css` Neumorphism CSS variables.
2. Refine `components/ui/Card.tsx` to support sub-components (`CardHeader`, `CardTitle`, `CardContent`).

## Phase 2: Form Controls (Missing Primitives)
1. Create `components/ui/Textarea.tsx`.
2. Create `components/ui/Select.tsx`.
3. Create `components/ui/Checkbox.tsx`.
4. Create `components/ui/Radio.tsx`.
5. Update `components/forms/FormField.tsx` to support these new inputs seamlessly with React Hook Form.

## Phase 3: Data Display & Feedback
1. Create `components/ui/Table.tsx` (Sub-components: Header, Row, Cell).
2. Create `components/ui/Alert.tsx`.
3. Create `components/ui/Badge.tsx` (Ensure standard variants).
4. Create `components/ui/Tabs.tsx`.

## Phase 4: Overlays & Modals
1. Refine `components/ui/Dialog.tsx`.
2. Create `components/ui/Drawer.tsx`.

## Phase 5: Verification
Run `tsc -b` and `vite build` to ensure no circular dependencies or type errors were introduced into the `components/ui/` namespace.
