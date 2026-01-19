'use client';

import { useAdmin } from '@/app/context/AdminContext';
import { hasPermission } from '@/lib/permissions';
import type { Permission } from '@/lib/permissions';
import { ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import Link from 'next/link';

interface PermissionGuardProps {
  children: ReactNode;
  requiredPermission: string;
  fallback?: ReactNode;
  showAccessDenied?: boolean;
}

/**
 * Component to restrict access to sections based on user permissions
 */
export function PermissionGuard({
  children,
  requiredPermission,
  fallback,
  showAccessDenied = true,
}: PermissionGuardProps) {
  const { admin, isLoading } = useAdmin();

  // Still loading
  if (isLoading) {
    return <div className="p-8 text-center text-gray-500">Loading...</div>;
  }

  // Not authenticated
  if (!admin) {
    return null;
  }

  // Check permission
  const hasAccess = hasPermission(admin.permissions, requiredPermission as Permission);

  if (!hasAccess) {
    if (fallback) return fallback;

    if (showAccessDenied) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-8 text-center">
            <AlertTriangle className="h-16 w-16 text-red-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
            <p className="text-gray-600 mb-4">
              You don't have permission to access this page.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Required permission: <code className="bg-gray-100 px-2 py-1 rounded">{requiredPermission}</code>
            </p>
            <Link
              href="/admin/dashboard"
              className="inline-block bg-lime-600 hover:bg-lime-700 text-white font-semibold py-2 px-6 rounded-lg transition"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      );
    }

    return null;
  }

  // Has permission, render children
  return <>{children}</>;
}

/**
 * Higher-order component to wrap entire pages with permission guards
 */
export function withPermissionGuard<P extends object>(
  Component: React.ComponentType<P>,
  requiredPermission: string
) {
  return function ProtectedComponent(props: P) {
    return (
      <PermissionGuard requiredPermission={requiredPermission}>
        <Component {...props} />
      </PermissionGuard>
    );
  };
}
