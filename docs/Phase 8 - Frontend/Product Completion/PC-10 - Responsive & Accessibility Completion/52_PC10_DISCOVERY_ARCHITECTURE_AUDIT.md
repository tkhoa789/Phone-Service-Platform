# PC-10 Discovery: Architecture Audit

## 1. Overview
This audit evaluates the frontend architecture strictly through the lens of Responsive Design and Accessibility (a11y). The codebase has successfully completed previous phases enforcing FSD, standardizing components, and stabilizing data fetching (PC-09D).

## 2. Structural Patterns
- **Layout Architecture**: The application employs a `MainLayout` wrapping a `Sidebar` and `Header`. The grid/flex structure is highly fluid, utilizing Tailwind's utility classes.
- **Component Primitives**: The move to `@radix-ui` and customized Tailwind components provides a solid foundation for accessibility (e.g., Dialog focus trapping, Select keyboard navigation).
- **Hardcoded Dimensions**: A codebase scan revealed only 4 instances of hardcoded widths (`w-[xxxpx]` or `min-w-[xxxpx]`). The vast majority of the architecture relies on fluid `w-full` and `max-w-*` tokens, which is a massive structural win for responsiveness.

## 3. Global Accessibility Gaps
While individual components are accessible, the macro-architecture lacks:
1. **Semantic Landmarks**: Axe-core automated tests revealed a global lack of a `<main>` landmark. Routes are injected into a standard `<div>`, violating WCAG structure guidelines (`landmark-one-main`, `region`).
2. **Accessible Names**: Icon-only utility buttons (e.g., Theme Toggle, Sidebar Collapse, Edit/Delete row actions) lack `aria-label` attributes, failing the `button-name` rule.

## 4. Conclusion
The foundation is extremely strong. Remediation will be highly targeted, focusing on wrapping tables and adding semantic HTML tags rather than tearing down CSS layouts.