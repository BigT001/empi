# EMPI Costumes - Role-Based Access Control (RBAC) Implementation

## Overview

A professional, multi-tier permission system has been implemented to control admin access to different sections of the EMPI Costumes dashboard. This allows different teams (Super Admin, Finance, and Logistics) to access only the features they need.

## Admin Roles & Permissions

### 1. **Super Admin** 
- **Email**: admin@empicostumes.com
- **Password**: Mastercode@empicostumes
- **Access**: Full access to all features
- **Permissions**:
  - `view_dashboard` - Dashboard overview
  - `view_products` - Product management
  - `view_orders` - Order management
  - `view_finance` - Finance analytics
  - `view_invoices` - Invoice management
  - `view_settings` - Settings/configuration
  - `view_logistics` - Logistics management
  - `manage_admins` - Admin management
  - `manage_store_settings` - Store settings
  - `access_all_features` - Access all features

### 2. **Finance Admin** 
- **Email**: finance@empicostumes.com
- **Password**: Finance009206
- **Access**: Finance and order overview only
- **Permissions**:
  - `view_dashboard` - Dashboard overview
  - `view_finance` - Finance analytics & VAT tracking
  - `view_invoices` - Invoice management & generation
  - `view_orders` - Order information (read-only)

### 3. **Logistics Admin** 
- **Email**: logistics@empicostumes.com
- **Password**: Logistics009206
- **Access**: Logistics and order management only
- **Permissions**:
  - `view_dashboard` - Dashboard overview
  - `view_logistics` - Logistics/shipping management
  - `view_orders` - Order management & tracking

### 4. **Regular Admin** (optional)
- **Access**: Same as originally configured
- **Permissions**: Standard view permissions (products, orders, finance, invoices, settings)

## Technical Implementation

### 1. Updated Admin Model (`lib/models/Admin.ts`)

```typescript
role: 'super_admin' | 'admin' | 'finance_admin' | 'logistics_admin'
department?: 'general' | 'finance' | 'logistics'
permissions: string[]
```

### 2. Permission Management System (`lib/permissions.ts`)

Utility functions for checking permissions:

```typescript
// Check if admin has a specific permission
hasPermission(adminPermissions, 'view_finance')

// Check if admin has any of multiple permissions
hasAnyPermission(adminPermissions, ['view_finance', 'view_invoices'])

// Check if admin has all permissions
hasAllPermissions(adminPermissions, ['view_finance', 'view_invoices'])

// Get role permissions
getRolePermissions('finance_admin')

// Check if admin can access a route
canAccessRoute(adminPermissions, '/admin/finance')

// Role utilities
getRoleDisplayName('finance_admin')
getRoleDescription('finance_admin')
canManageAdmins('super_admin')
hasFullAccess('super_admin')
```

### 3. Updated Admin Context (`app/context/AdminContext.tsx`)

Now tracks role and permissions:

```typescript
interface AdminProfile {
  id: string
  email: string
  fullName: string
  role: 'super_admin' | 'admin' | 'finance_admin' | 'logistics_admin'
  permissions: string[]
  department?: 'general' | 'finance' | 'logistics'
  lastLogin?: Date
}
```

### 4. Permission Guard Component (`app/components/PermissionGuard.tsx`)

Wraps restricted content:

```tsx
<PermissionGuard requiredPermission="view_finance">
  <FinancePageContent />
</PermissionGuard>
```

Or as a HOC:

```typescript
export default withPermissionGuard(YourComponent, 'view_finance')
```

### 5. Updated Admin Sidebar

- Dynamically filters menu items based on user permissions
- Only displays accessible sections
- Finance Admin only sees: Dashboard, Finance, Invoices, Settings
- Logistics Admin only sees: Dashboard, Logistics, Orders, Settings

### 6. Protected Routes

The following routes now enforce permission checks:

- `/admin/finance` - Requires `view_finance` permission
- `/admin/logistics` - Requires `view_logistics` permission
- Additional pages can be protected as needed

## Setup Instructions

### Step 1: Update Admin Users

Run the setup script to create/update all three admin users in the database:

```bash
node scripts/update-admin.js
```

This will:
- Create/update the Super Admin account
- Create the Finance Admin account
- Create the Logistics Admin account
- Output login credentials

### Step 2: Verify Database Changes

The Admin collection will now have:

```javascript
{
  email: 'admin@empicostumes.com',
  fullName: 'Super Admin',
  role: 'super_admin',
  department: 'general',
  permissions: ['view_dashboard', 'view_products', ...all permissions],
  isActive: true
}

{
  email: 'finance@empicostumes.com',
  fullName: 'Finance Team Lead',
  role: 'finance_admin',
  department: 'finance',
  permissions: ['view_dashboard', 'view_finance', 'view_invoices', 'view_orders'],
  isActive: true
}

{
  email: 'logistics@empicostumes.com',
  fullName: 'Logistics Team Lead',
  role: 'logistics_admin',
  department: 'logistics',
  permissions: ['view_dashboard', 'view_logistics', 'view_orders'],
  isActive: true
}
```

### Step 3: Test Login Flow

All three users can log in from the same login page: `/admin/login`

1. **Finance Admin Login**:
   - Email: finance@empicostumes.com
   - Password: Finance009206
   - Will see: Dashboard, Finance, Invoices, Settings, Orders (read-only)
   - Will NOT see: Products, Add Product, Logistics, Reviews

2. **Logistics Admin Login**:
   - Email: logistics@empicostumes.com
   - Password: Logistics009206
   - Will see: Dashboard, Logistics, Orders, Settings
   - Will NOT see: Products, Finance, Invoices, Reviews

3. **Super Admin Login**:
   - Email: admin@empicostumes.com
   - Password: Mastercode@empicostumes
   - Will see: All menu items and all pages

## Adding New Permission Guards

### To protect a page:

1. **Import PermissionGuard**:
   ```tsx
   import { PermissionGuard } from '@/app/components/PermissionGuard';
   ```

2. **Wrap the component**:
   ```tsx
   function YourPageContent() {
     // Your component code
   }

   export default function YourPage() {
     return (
       <PermissionGuard requiredPermission="view_your_feature">
         <YourPageContent />
       </PermissionGuard>
     );
   }
   ```

### To check permissions programmatically:

```tsx
import { useAdmin } from '@/app/context/AdminContext';
import { hasPermission } from '@/lib/permissions';

export function MyComponent() {
  const { admin } = useAdmin();
  const canViewFinance = hasPermission(admin?.permissions, 'view_finance');

  return (
    <>
      {canViewFinance && <FinanceSection />}
    </>
  );
}
```

## Security Considerations

1. **Backend Validation**: Always validate permissions on the backend API routes as well
2. **Session Management**: Users are automatically logged out after 7 days of inactivity
3. **Rate Limiting**: Login attempts are rate-limited to prevent brute force attacks
4. **Password Hashing**: All passwords are securely hashed with bcrypt (salt: 10)
5. **HTTPS Only**: Ensure all cookies are secure and HTTP-only

## File Structure

```
app/
├── components/
│   ├── AdminSidebar.tsx (updated with permission filtering)
│   └── PermissionGuard.tsx (new - permission wrapper component)
├── context/
│   └── AdminContext.tsx (updated with role/permissions)
├── admin/
│   ├── finance/page.tsx (wrapped with permission guard)
│   ├── logistics/page.tsx (wrapped with permission guard)
│   └── layout.tsx (auth check)
lib/
├── models/
│   └── Admin.ts (updated schema)
├── permissions.ts (new - permission utilities)
scripts/
└── update-admin.js (updated setup script)
```

## Future Enhancements

1. **Granular Permissions**: Add more specific permissions (create, edit, delete for each module)
2. **Custom Roles**: Allow creating custom roles with selected permissions
3. **Permission Audit Log**: Track all permission changes and access
4. **Department-based Restrictions**: Auto-restrict based on department
5. **Time-based Access**: Temporary elevated permissions for specific tasks
6. **IP Whitelisting**: Restrict access to specific IP addresses

## Troubleshooting

### User sees "Access Denied"
- Check if their role has the required permission in the PERMISSION_SETS
- Verify the permission string matches exactly (case-sensitive)
- Restart the application for changes to take effect

### Sidebar showing wrong menu items
- Clear browser cache and cookies
- Check localStorage for cached permissions
- Verify admin permissions in the database

### Login failing
- Check database connection
- Verify email/password combination in Admin collection
- Check if account has `isActive: true`

## Contact & Support

For questions or issues with the RBAC system, contact the development team or review the permission utilities in `lib/permissions.ts`.
