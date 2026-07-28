/**
 * Permission Management System for EMPI Admin Dashboard
 * Manages role-based access control (RBAC) for different admin types
 */

export type AdminRole = 'super_admin' | 'admin' | 'finance_admin' | 'logistics_admin' | 'sales_admin';

export type Permission = 
  | 'view_dashboard'
  | 'view_users'
  | 'view_products'
  | 'view_orders'
  | 'view_finance'
  | 'manage_payroll'
  | 'view_invoices'
  | 'view_settings'
  | 'view_logistics'
  | 'manage_admins'
  | 'manage_store_settings'
  | 'access_all_features'
  | 'view_mail_room'
  | 'manage_mail_room';

export const PERMISSION_CATALOG: Array<{
  id: Permission;
  label: string;
  description: string;
  group: 'Core' | 'Commerce' | 'Operations' | 'Administration';
}> = [
  { id: 'view_dashboard', label: 'Dashboard', description: 'View business overview and performance cards.', group: 'Core' },
  { id: 'view_users', label: 'Customers', description: 'View registered customers and their information.', group: 'Core' },
  { id: 'view_products', label: 'Products', description: 'View and manage the product catalogue.', group: 'Commerce' },
  { id: 'view_orders', label: 'Orders', description: 'View and process customer orders.', group: 'Commerce' },
  { id: 'view_finance', label: 'Finance', description: 'View sales, revenue, expenses, and finance reporting.', group: 'Commerce' },
  { id: 'manage_payroll', label: 'Payroll', description: 'Manage staff payroll, adjustments, and payment records.', group: 'Commerce' },
  { id: 'view_invoices', label: 'Invoices', description: 'View and manage customer invoices.', group: 'Commerce' },
  { id: 'view_logistics', label: 'Logistics', description: 'Manage delivery and pickup operations.', group: 'Operations' },
  { id: 'view_mail_room', label: 'Mail Room', description: 'View support mailboxes and conversations.', group: 'Operations' },
  { id: 'manage_mail_room', label: 'Manage Mail Room', description: 'Configure mailboxes, services, and mail permissions.', group: 'Operations' },
  { id: 'view_settings', label: 'Settings', description: 'View permitted system settings.', group: 'Administration' },
  { id: 'manage_store_settings', label: 'Store Settings', description: 'Change storefront, bank, and system configuration.', group: 'Administration' },
];

export const ALL_PERMISSIONS = PERMISSION_CATALOG.map((permission) => permission.id);

/**
 * Define permissions for each role
 */
export const ROLE_PERMISSIONS: Record<AdminRole, Permission[]> = {
  super_admin: [
    'view_dashboard',
    'view_users',
    'view_products',
    'view_orders',
    'view_finance',
    'manage_payroll',
    'view_invoices',
    'view_settings',
    'view_logistics',
    'manage_admins',
    'manage_store_settings',
    'access_all_features',
    'view_mail_room',
    'manage_mail_room',
  ],
  admin: [
    'view_dashboard',
    'view_users',
    'view_products',
    'view_orders',
    'view_finance',
    'manage_payroll',
    'view_invoices',
    'view_settings',
    'view_mail_room',
    'manage_mail_room',
  ],
  finance_admin: [
    'view_dashboard',
    'view_finance',
    'manage_payroll',
    'view_invoices',
    'view_orders',
    'view_mail_room',
  ],
  logistics_admin: [
    'view_dashboard',
    'view_logistics',
    'view_orders',
    'view_mail_room',
  ],
  sales_admin: [
    'view_dashboard',
    'view_products',
    'view_orders',
    'view_invoices',
    'view_mail_room',
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
  '/admin/payroll': ['manage_payroll'],
  '/admin/invoices': ['view_invoices'],
  '/admin/settings': ['view_settings'],
  '/admin/logistics': ['view_logistics'],
  '/admin/settings/manage-admins': ['manage_admins'],
  '/admin/mail-room': ['view_mail_room'],
};

/**
 * Check if an admin has a specific permission
 */
export function hasPermission(
  adminPermissions: string[] | undefined,
  requiredPermission: Permission
): boolean {
  if (!adminPermissions) return false;
  return adminPermissions.includes('access_all_features') || adminPermissions.includes(requiredPermission);
}

/**
 * Check if an admin has ANY of the required permissions
 */
export function hasAnyPermission(
  adminPermissions: string[] | undefined,
  requiredPermissions: Permission[]
): boolean {
  if (!adminPermissions) return false;
  return adminPermissions.includes('access_all_features') ||
    requiredPermissions.some(permission => adminPermissions.includes(permission));
}

/**
 * Check if an admin has ALL of the required permissions
 */
export function hasAllPermissions(
  adminPermissions: string[] | undefined,
  requiredPermissions: Permission[]
): boolean {
  if (!adminPermissions) return false;
  return adminPermissions.includes('access_all_features') ||
    requiredPermissions.every(permission => adminPermissions.includes(permission));
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
    sales_admin: 'Sales Admin',
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
    sales_admin: 'Access to products, sales orders, invoices, and customer communication',
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
