/**
 * Permission Management System for EMPI Admin Dashboard
 * Manages role-based access control (RBAC) for different admin types
 */

export type AdminRole = 'super_admin' | 'admin' | 'finance_admin' | 'logistics_admin';

export type Permission = 
  | 'view_dashboard'
  | 'view_products'
  | 'view_orders'
  | 'view_finance'
  | 'view_invoices'
  | 'view_settings'
  | 'view_logistics'
  | 'manage_admins'
  | 'manage_store_settings'
  | 'access_all_features';

/**
 * Define permissions for each role
 */
export const ROLE_PERMISSIONS: Record<AdminRole, Permission[]> = {
  super_admin: [
    'view_dashboard',
    'view_products',
    'view_orders',
    'view_finance',
    'view_invoices',
    'view_settings',
    'view_logistics',
    'manage_admins',
    'manage_store_settings',
    'access_all_features',
  ],
  admin: [
    'view_dashboard',
    'view_products',
    'view_orders',
    'view_finance',
    'view_invoices',
    'view_settings',
  ],
  finance_admin: [
    'view_dashboard',
    'view_finance',
    'view_invoices',
    'view_orders',
  ],
  logistics_admin: [
    'view_dashboard',
    'view_logistics',
    'view_orders',
  ],
};

/**
 * Route-based permission mapping
 * Maps routes to required permissions
 */
export const ROUTE_PERMISSIONS: Record<string, Permission[]> = {
  '/admin/dashboard': ['view_dashboard'],
  '/admin/products': ['view_products'],
  '/admin/orders': ['view_orders'],
  '/admin/finance': ['view_finance'],
  '/admin/invoices': ['view_invoices'],
  '/admin/settings': ['view_settings'],
  '/admin/logistics': ['view_logistics'],
  '/admin/settings/manage-admins': ['manage_admins'],
};

/**
 * Check if an admin has a specific permission
 */
export function hasPermission(
  adminPermissions: string[] | undefined,
  requiredPermission: Permission
): boolean {
  if (!adminPermissions) return false;
  return adminPermissions.includes(requiredPermission);
}

/**
 * Check if an admin has ANY of the required permissions
 */
export function hasAnyPermission(
  adminPermissions: string[] | undefined,
  requiredPermissions: Permission[]
): boolean {
  if (!adminPermissions) return false;
  return requiredPermissions.some(permission => adminPermissions.includes(permission));
}

/**
 * Check if an admin has ALL of the required permissions
 */
export function hasAllPermissions(
  adminPermissions: string[] | undefined,
  requiredPermissions: Permission[]
): boolean {
  if (!adminPermissions) return false;
  return requiredPermissions.every(permission => adminPermissions.includes(permission));
}

/**
 * Get permissions for a role
 */
export function getRolePermissions(role: AdminRole): Permission[] {
  return ROLE_PERMISSIONS[role] || [];
}

/**
 * Check if admin can access a specific route
 */
export function canAccessRoute(
  adminPermissions: string[] | undefined,
  route: string
): boolean {
  const requiredPermissions = ROUTE_PERMISSIONS[route];
  if (!requiredPermissions) return true; // If no specific permissions required, allow access
  return hasAnyPermission(adminPermissions, requiredPermissions);
}

/**
 * Get human-readable role name
 */
export function getRoleDisplayName(role: AdminRole): string {
  const names: Record<AdminRole, string> = {
    super_admin: 'Super Admin',
    admin: 'Admin',
    finance_admin: 'Finance Admin',
    logistics_admin: 'Logistics Admin',
  };
  return names[role] || role;
}

/**
 * Get role description
 */
export function getRoleDescription(role: AdminRole): string {
  const descriptions: Record<AdminRole, string> = {
    super_admin: 'Full access to all features and admin management',
    admin: 'Full access to products, orders, finance, and invoices',
    finance_admin: 'Access to finance, invoices, and order information',
    logistics_admin: 'Access to logistics and order management',
  };
  return descriptions[role] || '';
}

/**
 * Check if role is allowed to manage admins
 */
export function canManageAdmins(role: AdminRole): boolean {
  return hasPermission(ROLE_PERMISSIONS[role], 'manage_admins');
}

/**
 * Check if role is allowed to view all features
 */
export function hasFullAccess(role: AdminRole): boolean {
  return role === 'super_admin';
}
