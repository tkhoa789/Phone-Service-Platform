# Responsive Requirements

As Master Data pages consist heavily of Data Tables, responsive handling must be standardized:
1. **Desktop (>1024px)**: Full `DataTable` rendering all columns.
2. **Tablet (768px-1024px)**: `DataTable` with hidden non-critical columns (e.g., Address, secondary dates) or horizontally scrollable wrapper.
3. **Mobile (<768px)**: Card-based list layout or responsive table wrapper. `DataTable` component handles overflow via `overflow-x-auto`. `PageHeader` must stack actions vertically or hide behind a dropdown menu.
