# PC-06 MIGRATION GUIDELINES

## Scope for Next Phase (PC-07: Business Domains UI Rebuild)

When rebuilding specific business modules in `src/pages/*`, developers **MUST** follow these substitution rules:

1. **Delete** inline `window.confirm`. Replace with `ConfirmDialog` and manage an `isOpen` state locally.
2. **Delete** `<input type="text" className="w-full pl-11...">`. Replace with `<SearchInput>`.
3. **Delete** custom `if (loading) return <PageSkeleton />`. Wrap the table section with `<DataTable isLoading={isLoading}>`.
4. **Delete** inline page header divs (`<div className="p-6 bg-... shadow-...">`). Replace with `<PageHeader title="..." icon={<Icon />} actions={<Button>...</Button>} />`.
5. **Delete** `import { Pagination } from '../../components/common/Pagination'`. Replace with `import { AppPagination } from '../../components/shared'`.

These guidelines guarantee that Business Pages lose their explicit styling responsibilities and become purely functional orchestrators.
