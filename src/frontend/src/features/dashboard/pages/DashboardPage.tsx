import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../../../stores/authStore';
import { 
  ExecutiveDashboard, 
  SalesDashboard, 
  TechnicianDashboard, 
  WarrantyDashboard, 
  InventoryDashboard 
} from '../components/role-dashboards';

/**
 * Role-Aware Operational Dashboard Surface
 *
 * Resolves the user's canonical role from their authenticated session and
 * renders the dedicated operational workspace:
 *
 *   - Owner / Admin / Manager -> ExecutiveDashboard (Command Center)
 *   - Sales                   -> SalesDashboard (Retail & POS Workspace)
 *   - Technician              -> TechnicianDashboard (Repair Workbench)
 *   - Warranty                -> WarrantyDashboard (RMA & Warranty Center)
 *   - Inventory               -> InventoryDashboard (Warehouse & Supply Chain)
 *
 * Also supports query param override ?role=Inventory for testing or multi-role previews.
 */
export const DashboardPage: React.FC = () => {
  const { roles } = useAuthStore();
  const [searchParams] = useSearchParams();
  const roleOverride = searchParams.get('role')?.toLowerCase();

  if (roleOverride === 'inventory') return <InventoryDashboard />;
  if (roleOverride === 'warranty') return <WarrantyDashboard />;
  if (roleOverride === 'technician') return <TechnicianDashboard />;
  if (roleOverride === 'sales') return <SalesDashboard />;
  if (roleOverride === 'executive' || roleOverride === 'admin' || roleOverride === 'manager') return <ExecutiveDashboard />;

  const isOwner = roles.includes('Owner');
  const isAdmin = roles.includes('Admin') || isOwner;
  const isManager = roles.includes('Manager');
  const isExecutive = isAdmin || isManager;

  const isSales = roles.includes('Sales') && !isExecutive;
  const isTechnician = roles.includes('Technician') && !isExecutive;
  const isWarranty = roles.includes('Warranty') && !isExecutive;
  const isInventory = roles.includes('Inventory') && !isExecutive;

  if (isExecutive) {
    return <ExecutiveDashboard />;
  }

  if (isSales) {
    return <SalesDashboard />;
  }

  if (isTechnician) {
    return <TechnicianDashboard />;
  }

  if (isWarranty) {
    return <WarrantyDashboard />;
  }

  if (isInventory) {
    return <InventoryDashboard />;
  }

  // Fallback to executive dashboard
  return <ExecutiveDashboard />;
};
