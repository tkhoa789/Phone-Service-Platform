import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './stores/authStore';
import { queryClient } from './utils/queryClient';
import { PERMISSIONS } from './constants/permissions';

// Error Boundary Guard
import { ErrorBoundary } from './components/common/ErrorBoundary';

// Public Pages
const LoginPage = React.lazy(() => import('./pages/auth/LoginPage').then(m => ({ default: m.LoginPage })));
const PublicWarrantyCheckPage = React.lazy(() => import('./pages/public/PublicWarrantyCheckPage').then(m => ({ default: m.PublicWarrantyCheckPage })));
const OrderTrackingPage = React.lazy(() => import('./pages/public/OrderTrackingPage').then(m => ({ default: m.OrderTrackingPage })));

// Layout & Guards (DO NOT lazy load core layouts/guards to avoid waterfall)
import { MainLayout } from './components/layout/MainLayout';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { PageSkeleton } from './components/common/PageSkeleton';
import { NotFoundScreen } from './components/common/NotFoundScreen';

// Dashboard
const DashboardPage = React.lazy(() => import('./features/dashboard/pages/DashboardPage').then(m => ({ default: m.DashboardPage })));

// Subsystem Pages
const BranchListPage = React.lazy(() => import('./pages/branches/BranchListPage').then(m => ({ default: m.BranchListPage })));
const UserListPage = React.lazy(() => import('./pages/users/UserListPage').then(m => ({ default: m.UserListPage })));
const CustomerListPage = React.lazy(() => import('./pages/customers/CustomerListPage').then(m => ({ default: m.CustomerListPage })));
const WarehouseListPage = React.lazy(() => import('./pages/warehouses/WarehouseListPage').then(m => ({ default: m.WarehouseListPage })));
const PurchaseOrderListPage = React.lazy(() => import('./features/purchase-orders/pages/PurchaseOrderListPage').then(m => ({ default: m.PurchaseOrderListPage })));
const AuditLogPage = React.lazy(() => import('./pages/audit/AuditLogPage').then(m => ({ default: m.AuditLogPage })));
const ProductListPage = React.lazy(() => import('./pages/products/ProductListPage').then(m => ({ default: m.ProductListPage })));
const InventoryPage = React.lazy(() => import('./features/inventory/pages/InventoryPage').then(m => ({ default: m.InventoryPage })));
const StockTakePage = React.lazy(() => import('./features/inventory/pages/StockTakePage').then(m => ({ default: m.StockTakePage })));
const PosPage = React.lazy(() => import('./features/pos/pages/PosPage').then(m => ({ default: m.PosPage })));
const SalesOrderListPage = React.lazy(() => import('./pages/sales/SalesOrderListPage').then(m => ({ default: m.SalesOrderListPage })));
const VoucherListPage = React.lazy(() => import('./pages/sales/VoucherListPage').then(m => ({ default: m.VoucherListPage })));
const RepairListPage = React.lazy(() => import('./features/repairs/pages/RepairListPage').then(m => ({ default: m.RepairListPage })));
const RepairIntakePage = React.lazy(() => import('./features/repairs/pages/RepairIntakePage').then(m => ({ default: m.RepairIntakePage })));
const WarrantyListPage = React.lazy(() => import('./pages/warranties/WarrantyListPage').then(m => ({ default: m.WarrantyListPage })));
const SupplierListPage = React.lazy(() => import('./pages/suppliers/SupplierListPage').then(m => ({ default: m.SupplierListPage })));
const AiChatPage = React.lazy(() => import('./pages/ai/AiChatPage').then(m => ({ default: m.AiChatPage })));
const SystemSettingsPage = React.lazy(() => import('./pages/system/SystemSettingsPage').then(m => ({ default: m.SystemSettingsPage })));
const UserProfilePage = React.lazy(() => import('./pages/profile/UserProfilePage').then(m => ({ default: m.UserProfilePage })));
const DesignSystemPreviewPage = React.lazy(() => import('./pages/preview/DesignSystemPreviewPage').then(m => ({ default: m.DesignSystemPreviewPage })));
const NotificationTrashPage = React.lazy(() => import('./features/notifications/pages/NotificationTrashPage').then(m => ({ default: m.NotificationTrashPage })));

const RootRedirect: React.FC = () => {
  const { roles } = useAuthStore();
  const canonicalDashboardRoles = ['Owner', 'Admin', 'Manager', 'Sales', 'Technician', 'Warranty', 'Inventory'];
  if (roles.some((r) => canonicalDashboardRoles.includes(r))) {
    return <Navigate to="/dashboard" replace />;
  }
  return <Navigate to="/profile" replace />;
};

export function App() {
  const { initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          {/* Toast Notification Container */}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              className: 'neu-raised border border-border/40 text-foreground bg-card shadow-xl font-sans text-xs font-medium rounded-2xl px-4 py-3',
              style: {
                background: 'var(--card)',
                color: 'var(--foreground)',
                border: '1px solid var(--border)',
                boxShadow: 'var(--shadow-lg)',
                borderRadius: '16px',
                fontSize: '13px',
              },
            }}
          />

          <React.Suspense fallback={<PageSkeleton />}>
            <Routes>
            {/* Public Unprotected Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/warranty-check" element={<PublicWarrantyCheckPage />} />
            <Route path="/order-tracking" element={<OrderTrackingPage />} />
            <Route path="/design-system-preview" element={<DesignSystemPreviewPage />} />

            {/* Protected Dashboard & App Routes */}
            <Route element={<ProtectedRoute />}>
              <Route element={<MainLayout />}>
                <Route path="/" element={<RootRedirect />} />
                
                <Route element={<ProtectedRoute allowedRoles={['Owner', 'Admin', 'Manager', 'Sales', 'Technician', 'Warranty', 'Inventory']} />}>
                  <Route path="/dashboard" element={<DashboardPage />} />
                </Route>

                {/* Admin / Owner Exclusive System Pages */}
                <Route element={<ProtectedRoute permission={PERMISSIONS.Branch_View} allowedRoles={['Owner', 'Admin']} />}>
                  <Route path="/branches" element={<BranchListPage />} />
                </Route>
                <Route element={<ProtectedRoute permission={PERMISSIONS.User_View} allowedRoles={['Owner', 'Admin']} />}>
                  <Route path="/users" element={<UserListPage />} />
                </Route>
                <Route element={<ProtectedRoute permission={PERMISSIONS.SystemSettings_View} allowedRoles={['Owner', 'Admin']} />}>
                  <Route path="/settings" element={<SystemSettingsPage />} />
                </Route>
                <Route element={<ProtectedRoute permission={PERMISSIONS.AuditLog_View} allowedRoles={['Owner', 'Admin']} />}>
                  <Route path="/audit-logs" element={<AuditLogPage />} />
                </Route>

                {/* Branch Operations & Sales Pages */}
                <Route element={<ProtectedRoute permission={PERMISSIONS.POS_View} allowedRoles={['Owner', 'Admin', 'Manager', 'Sales']} />}>
                  <Route path="/pos" element={<PosPage />} />
                </Route>
                <Route element={<ProtectedRoute permission={PERMISSIONS.Voucher_View} allowedRoles={['Owner', 'Admin', 'Manager', 'Sales']} />}>
                  <Route path="/vouchers" element={<VoucherListPage />} />
                </Route>
                <Route element={<ProtectedRoute permission={PERMISSIONS.SalesOrder_View} allowedRoles={['Owner', 'Admin', 'Manager', 'Sales']} />}>
                  <Route path="/sales" element={<SalesOrderListPage />} />
                </Route>

                {/* Product & Catalog Management */}
                <Route element={<ProtectedRoute permission={PERMISSIONS.Product_View} allowedRoles={['Owner', 'Admin', 'Manager', 'Sales', 'Inventory', 'Technician', 'Warranty']} />}>
                  <Route path="/products" element={<ProductListPage />} />
                </Route>

                {/* Inventory & Stock Control */}
                <Route element={<ProtectedRoute permission={PERMISSIONS.Warehouse_View} allowedRoles={['Owner', 'Admin', 'Manager', 'Inventory']} />}>
                  <Route path="/warehouses" element={<WarehouseListPage />} />
                </Route>
                <Route element={<ProtectedRoute permission={PERMISSIONS.PurchaseOrder_View} allowedRoles={['Owner', 'Admin', 'Manager', 'Inventory']} />}>
                  <Route path="/purchase-orders" element={<PurchaseOrderListPage />} />
                </Route>
                <Route element={<ProtectedRoute permission={PERMISSIONS.Inventory_View} allowedRoles={['Owner', 'Admin', 'Manager', 'Inventory']} />}>
                  <Route path="/inventory" element={<InventoryPage />} />
                </Route>
                <Route element={<ProtectedRoute permission={PERMISSIONS.StockTake_View} allowedRoles={['Owner', 'Admin', 'Manager', 'Inventory']} />}>
                  <Route path="/stock-take" element={<StockTakePage />} />
                </Route>
                <Route element={<ProtectedRoute permission={PERMISSIONS.Supplier_View} allowedRoles={['Owner', 'Admin', 'Manager', 'Inventory']} />}>
                  <Route path="/suppliers" element={<SupplierListPage />} />
                </Route>

                {/* Repair Workshop Service */}
                <Route element={<ProtectedRoute permission={PERMISSIONS.Repair_View} allowedRoles={['Owner', 'Admin', 'Manager', 'Technician', 'Sales']} />}>
                  <Route path="/repairs" element={<RepairListPage />} />
                  <Route path="/repairs/intake" element={<RepairIntakePage />} />
                </Route>

                {/* Warranty & Replacement Control */}
                <Route element={<ProtectedRoute permission={PERMISSIONS.Warranty_View} allowedRoles={['Owner', 'Admin', 'Manager', 'Warranty', 'Sales']} />}>
                  <Route path="/warranties" element={<WarrantyListPage />} />
                </Route>

                {/* Customers Directory */}
                <Route element={<ProtectedRoute permission={PERMISSIONS.Customer_View} allowedRoles={['Owner', 'Admin', 'Manager', 'Sales', 'Warranty', 'Technician']} />}>
                  <Route path="/customers" element={<CustomerListPage />} />
                </Route>

                {/* General Allowed Routes */}
                <Route element={<ProtectedRoute permission={PERMISSIONS.AI_Chat} />}>
                  <Route path="/ai-chat" element={<AiChatPage />} />
                </Route>
                <Route path="/profile" element={<UserProfilePage />} />
                <Route path="/notifications" element={<NotificationTrashPage />} />
                <Route path="/notifications/trash" element={<NotificationTrashPage />} />
                <Route path="*" element={<NotFoundScreen />} />
              </Route>
            </Route>
          </Routes>
          </React.Suspense>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
