import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './stores/authStore';

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


const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
      retry: 1, // Only retry once before failing
    },
  },
});

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
              style: {
                background: '#0f172a',
                color: '#f8fafc',
                border: '1px solid #1e293b',
                borderRadius: '12px',
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

            {/* Protected Dashboard & App Routes */}
            <Route element={<ProtectedRoute />}>
              <Route element={<MainLayout />}>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                
                <Route element={<ProtectedRoute allowedRoles={['Owner', 'Admin', 'Manager']} />}>
                  <Route path="/dashboard" element={<DashboardPage />} />
                </Route>

                {/* Admin / Owner Exclusive System Pages */}
                <Route element={<ProtectedRoute allowedRoles={['Owner', 'Admin']} />}>
                  <Route path="/branches" element={<BranchListPage />} />
                  <Route path="/users" element={<UserListPage />} />
                  <Route path="/settings" element={<SystemSettingsPage />} />
                  <Route path="/audit-logs" element={<AuditLogPage />} />
                </Route>

                {/* Branch Operations & Sales Pages */}
                <Route element={<ProtectedRoute allowedRoles={['Owner', 'Admin', 'Manager', 'Sales']} />}>
                  <Route path="/pos" element={<PosPage />} />
                  <Route path="/sales" element={<SalesOrderListPage />} />
                  <Route path="/vouchers" element={<VoucherListPage />} />
                </Route>

                {/* Product & Catalog Management */}
                <Route element={<ProtectedRoute allowedRoles={['Owner', 'Admin', 'Manager', 'Sales', 'Inventory', 'Technician']} />}>
                  <Route path="/products" element={<ProductListPage />} />
                </Route>

                {/* Inventory & Stock Control */}
                <Route element={<ProtectedRoute allowedRoles={['Owner', 'Admin', 'Manager', 'Inventory', 'Technician', 'Warranty']} />}>
                  <Route path="/warehouses" element={<WarehouseListPage />} />
                  <Route path="/purchase-orders" element={<PurchaseOrderListPage />} />
                  <Route path="/inventory" element={<InventoryPage />} />
                  <Route path="/stock-take" element={<StockTakePage />} />
                </Route>

                <Route element={<ProtectedRoute allowedRoles={['Owner', 'Admin', 'Manager', 'Inventory']} />}>
                  <Route path="/suppliers" element={<SupplierListPage />} />
                </Route>

                {/* Repair Workshop Service */}
                <Route element={<ProtectedRoute allowedRoles={['Owner', 'Admin', 'Manager', 'Technician']} />}>
                  <Route path="/repairs" element={<RepairListPage />} />
                  <Route path="/repairs/intake" element={<RepairIntakePage />} />
                </Route>

                {/* Warranty & Replacement Control */}
                <Route element={<ProtectedRoute allowedRoles={['Owner', 'Admin', 'Manager', 'Warranty', 'Sales']} />}>
                  <Route path="/warranties" element={<WarrantyListPage />} />
                </Route>

                {/* Customers Directory */}
                <Route element={<ProtectedRoute allowedRoles={['Owner', 'Admin', 'Manager', 'Sales', 'Warranty']} />}>
                  <Route path="/customers" element={<CustomerListPage />} />
                </Route>

                {/* General Allowed Routes */}
                <Route path="/ai-chat" element={<AiChatPage />} />
                <Route path="/profile" element={<UserProfilePage />} />
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
