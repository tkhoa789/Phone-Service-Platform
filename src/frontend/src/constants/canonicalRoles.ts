/**
 * PSP CANONICAL ROLES (RBAC-01)
 * 
 * Only these 7 canonical roles are valid across the frontend and backend:
 * - Owner: System Owner / Executive Master
 * - Admin: IT System Administrator
 * - Manager: Branch Manager
 * - Sales: Counter Cashier & Sales Rep
 * - Technician: Repair Technician
 * - Warranty: Warranty Specialist
 * - Inventory: Warehouse Keeper
 * 
 * Legacy roles (Staff, Receptionist) are strictly forbidden.
 */

export const CANONICAL_ROLES = [
  'Owner',
  'Admin',
  'Manager',
  'Sales',
  'Technician',
  'Warranty',
  'Inventory',
] as const;

export type CanonicalRole = typeof CANONICAL_ROLES[number];

export const isCanonicalRole = (role: string): role is CanonicalRole => {
  return (CANONICAL_ROLES as readonly string[]).includes(role);
};

export const normalizeRole = (role?: string | null): CanonicalRole | null => {
  if (!role) return null;
  const trimmed = role.trim();
  if (trimmed.toLowerCase() === 'receptionist') return 'Sales';
  return CANONICAL_ROLES.find(r => r.toLowerCase() === trimmed.toLowerCase()) ?? null;
};
