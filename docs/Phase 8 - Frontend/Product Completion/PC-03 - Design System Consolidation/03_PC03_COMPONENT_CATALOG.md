# PC-03 COMPONENT CATALOG

The following components will form the complete, production-ready Design System inside `src/components/ui/`.

## 1. Action Primitives
- **`Button`**: Primary, Secondary, Danger, Ghost, Outline variants.
- **`IconButton`**: Standardized wrapper for Lucide icons.

## 2. Form Primitives
- **`Input`**: Standard text/password/email input with inset shadow.
- **`Textarea`**: Multi-line input with inset shadow.
- **`Select`**: Native HTML select styled uniformly.
- **`Checkbox`**: Custom Neumorphic checkbox (inset when unchecked, colored when checked).
- **`Radio`**: Custom Neumorphic radio button.
- **`FormField`**: Wrapper handling labels and error messages automatically.

## 3. Feedback Primitives
- **`Badge`**: Small pill for status (Success, Warning, Danger, Info).
- **`Alert`**: Inline block for warnings or errors (e.g., "Out of stock").
- **`Toast`**: Handled via `react-hot-toast`, but styling overridden to match Neumorphism.
- **`Skeleton`**: Animated loading placeholder matching Card radius.

## 4. Layout & Overlay Primitives
- **`Card`**: Sub-components `CardHeader`, `CardTitle`, `CardContent`, `CardFooter`.
- **`Dialog`**: Modal overlay.
- **`Drawer`**: Slide-out panel for mobile or complex filters.
- **`Table`**: Sub-components `TableHeader`, `TableRow`, `TableCell`, `TableHead`, `TableBody`.

## 5. Navigation Primitives
- **`Tabs`**: Segmented control for switching views within a page.
- **`Breadcrumb`**: Hierarchical navigation.
