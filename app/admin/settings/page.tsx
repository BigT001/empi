"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAdmin } from "@/app/context/AdminContext";
import { useResponsive } from "@/app/hooks/useResponsive";
import { Lock, Users, DollarSign, Plus, Edit2, Trash2, Eye, EyeOff, LogOut, Clock, CheckCircle2, AlertCircle, Sliders, Sparkles } from "lucide-react";
import { PERMISSION_CATALOG, ROLE_PERMISSIONS, type AdminRole, type Permission } from "@/lib/permissions";

type SubAdminRole = Exclude<AdminRole, 'super_admin'>;

interface SubAdmin {
  _id: string;
  fullName: string;
  email: string;
  role: SubAdminRole;
  department: 'general' | 'finance' | 'logistics' | 'sales';
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  permissions: Permission[];
}

interface PasswordForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface AdminSessionDisplay {
  token: string;
  createdAt: string;
  expiresAt: string;
}

export default function SettingsPage() {
  const { admin } = useAdmin();
  const { mounted } = useResponsive();
  const [activeTab, setActiveTab] = useState<"sub-admins" | "security" | "bank" | "homepage">("sub-admins");

  // Homepage Settings State
  const [activeHomePageSetting, setActiveHomePageSetting] = useState<"default" | "costume-show">("default");
  const [isPriceOptionalSetting, setIsPriceOptionalSetting] = useState(false);
  const [isVatDisabledSetting, setIsVatDisabledSetting] = useState(false);
  const [loadingHomepage, setLoadingHomepage] = useState(false);

  // Sub-Admins State
  const [subAdmins, setSubAdmins] = useState<SubAdmin[]>([]);
  const [loadingAdmins, setLoadingAdmins] = useState(false);
  const [showAddAdmin, setShowAddAdmin] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<SubAdmin | null>(null);
  const [newAdminForm, setNewAdminForm] = useState<{
    fullName: string;
    email: string;
    role: SubAdminRole;
    password: string;
    department: 'general' | 'finance' | 'logistics' | 'sales';
  }>({
    fullName: '',
    email: '',
    role: 'admin',
    password: '',
    department: 'general',
  });
  const [selectedPermissions, setSelectedPermissions] = useState<Permission[]>(ROLE_PERMISSIONS.admin);

  // Security State
  const [passwordForm, setPasswordForm] = useState<PasswordForm>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswords, setShowPasswords] = useState({ current: false, new: false, confirm: false });
  const [changePassMessage, setChangePassMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [sessions, setSessions] = useState<AdminSessionDisplay[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);

  // UI State
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const hasAccess = admin?.role === 'super_admin' ||
    admin?.permissions?.includes('access_all_features') ||
    admin?.permissions?.includes('view_settings');
  const canManageStore = admin?.role === 'super_admin' ||
    admin?.permissions?.includes('access_all_features') ||
    admin?.permissions?.includes('manage_store_settings');

  // Function Definitions (must be before useEffect that uses them)
  const loadSubAdmins = async () => {
    setLoadingAdmins(true);
    try {
      console.log('📋 Loading sub-admins...');
      const response = await fetch('/api/admin/users?subAdminsOnly=true', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      console.log('Response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('Sub-admins data:', data);
        setSubAdmins(Array.isArray(data) ? data : data.data || []);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('API error:', errorData);
        setMessage({ type: 'error', text: errorData.error || 'Failed to load sub-admins' });
      }
    } catch (error) {
      console.error('Error loading sub-admins:', error);
      setMessage({ type: 'error', text: 'Failed to load sub-admins' });
    } finally {
      setLoadingAdmins(false);
    }
  };

  const loadSessions = async () => {
    setLoadingSessions(true);
    try {
      const response = await fetch('/api/admin/me');
      if (response.ok) {
        const data = await response.json();
        setSessions(data.sessions || []);
      }
    } catch (error) {
      console.error('Error loading sessions:', error);
    } finally {
      setLoadingSessions(false);
    }
  };

  const fetchHomepageSettings = async () => {
    try {
      setLoadingHomepage(true);
      const [res, vatRes] = await Promise.all([
        fetch("/api/admin/homepage-settings"),
        fetch("/api/admin/vat-settings")
      ]);
      if (res.ok) {
        const data = await res.json();
        if (data.activeHomePage) {
          setActiveHomePageSetting(data.activeHomePage);
        }
        if (data.isPriceOptional !== undefined) {
          setIsPriceOptionalSetting(data.isPriceOptional);
        }
      }
      if (vatRes.ok) {
        const vatData = await vatRes.json();
        if (typeof vatData.isVatDisabled === "boolean") {
          setIsVatDisabledSetting(vatData.isVatDisabled);
        }
      }
    } catch (err) {
      console.error("Error fetching homepage/vat settings:", err);
    } finally {
      setLoadingHomepage(false);
    }
  };

  const handleSaveHomepageSetting = async (selectedVal: "default" | "costume-show") => {
    setIsSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/homepage-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activeHomePage: selectedVal }),
      });
      if (res.ok) {
        const data = await res.json();
        setActiveHomePageSetting(data.activeHomePage);
        setMessage({ type: "success", text: "Homepage settings updated successfully!" });
      } else {
        const error = await res.json();
        setMessage({ type: "error", text: error.error || "Failed to update homepage settings" });
      }
    } catch {
      setMessage({ type: "error", text: "Error saving homepage settings" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTogglePriceOptional = async (enabled: boolean) => {
    setIsSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/homepage-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPriceOptional: enabled }),
      });
      if (res.ok) {
        const data = await res.json();
        setIsPriceOptionalSetting(data.isPriceOptional);
        setMessage({ type: "success", text: "Product price setting updated successfully!" });
        setTimeout(() => setMessage(null), 3000);
      } else {
        const error = await res.json();
        setMessage({ type: "error", text: error.error || "Failed to update settings" });
      }
    } catch (err) {
      setMessage({ type: "error", text: "Error saving settings" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleVatDisabled = async (disabled: boolean) => {
    setIsSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/vat-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isVatDisabled: disabled }),
      });
      if (res.ok) {
        const data = await res.json();
        setIsVatDisabledSetting(data.isVatDisabled);
        setMessage({ type: "success", text: `VAT has been ${data.isVatDisabled ? 'disabled' : 'enabled'} globally!` });
        setTimeout(() => setMessage(null), 3000);
      } else {
        const error = await res.json();
        setMessage({ type: "error", text: error.error || "Failed to update VAT settings" });
      }
    } catch {
      setMessage({ type: "error", text: "Error saving VAT settings" });
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (activeTab === 'sub-admins' && admin?.role !== 'super_admin') {
        setActiveTab('security');
        return;
      }
      if (activeTab === 'sub-admins' && admin?.role === 'super_admin') void loadSubAdmins();
      if (activeTab === 'security') void loadSessions();
      if (activeTab === 'homepage') void fetchHomepageSettings();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [activeTab, admin?.role]);

  const handleAddAdmin = async () => {
    setMessage(null);
    if (!newAdminForm.fullName.trim() || !newAdminForm.email.trim() || !newAdminForm.password) {
      setMessage({ type: 'error', text: 'Please fill all required fields' });
      return;
    }
    if (newAdminForm.password.length < 8) {
      setMessage({ type: 'error', text: 'Initial password must be at least 8 characters' });
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newAdminForm,
          permissions: selectedPermissions,
          fullName: newAdminForm.fullName.trim(),
          email: newAdminForm.email.trim().toLowerCase(),
        }),
      });

      if (response.ok) {
        const createdAdmin = await response.json();
        if (!createdAdmin?._id) throw new Error('The database did not confirm the new admin account');
        setSubAdmins((current) => [...current.filter((item) => item._id !== createdAdmin._id), createdAdmin]);
        setMessage({ type: 'success', text: `${createdAdmin.fullName} was created and saved successfully` });
        setNewAdminForm({ fullName: '', email: '', role: 'admin', password: '', department: 'general' });
        setSelectedPermissions(ROLE_PERMISSIONS.admin);
        setShowAddAdmin(false);
        void loadSubAdmins();
      } else {
        const error = await response.json().catch(() => ({}));
        setMessage({ type: 'error', text: error.error || error.message || `Failed to create sub-admin (${response.status})` });
      }
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Error creating sub-admin' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setChangePassMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      setChangePassMessage({ type: 'error', text: 'Password must be at least 8 characters' });
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch('/api/admin/change-password', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
          confirmPassword: passwordForm.confirmPassword,
        }),
      });

      if (response.ok) {
        setChangePassMessage({ type: 'success', text: 'Password changed successfully' });
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setTimeout(() => setChangePassMessage(null), 5000);
      } else {
        const error = await response.json();
        setChangePassMessage({ type: 'error', text: error.error || error.message || 'Failed to change password' });
      }
    } catch {
      setChangePassMessage({ type: 'error', text: 'Error changing password' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleAdminStatus = async (adminId: string, isActive: boolean) => {
    const action = isActive ? 'suspend' : 'reactivate';
    if (!window.confirm(`Are you sure you want to ${action} this admin?${isActive ? ' They will be signed out immediately on every device.' : ''}`)) return;
    setIsSaving(true);
    try {
      const response = await fetch(`/api/admin/users/${adminId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isActive }),
      });

      if (response.ok) {
        const updatedAdmin = await response.json();
        setSubAdmins((current) => current.map((item) => item._id === updatedAdmin._id ? updatedAdmin : item));
        setMessage({ type: 'success', text: `Sub-admin ${!isActive ? 'reactivated' : 'suspended'} successfully` });
      } else {
        const responseError = await response.json().catch(() => ({}));
        setMessage({ type: 'error', text: responseError.error || `Failed to ${action} admin` });
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to update admin status' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAdmin = async (adminId: string, adminEmail: string) => {
    if (!confirm(`Are you sure you want to delete ${adminEmail}? This action cannot be undone.`)) {
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(`/api/admin/users/${adminId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        setMessage({ type: 'success', text: `Sub-admin ${adminEmail} deleted successfully` });
        loadSubAdmins();
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.error || 'Failed to delete admin' });
      }
    } catch (error) {
      console.error('Error deleting admin:', error);
      setMessage({ type: 'error', text: 'Failed to delete admin' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditAdmin = (admin: SubAdmin) => {
    setEditingAdmin(admin);
    setNewAdminForm({
      fullName: admin.fullName,
      email: admin.email,
      role: admin.role,
      password: '',
      department: admin.department || 'general',
    });
    setSelectedPermissions(admin.permissions || []);
    window.scrollTo({ top: 300, behavior: 'smooth' });
  };

  const handleSaveEdit = async () => {
    if (!editingAdmin) return;

    setIsSaving(true);
    try {
      const response = await fetch(`/api/admin/users/${editingAdmin._id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: newAdminForm.fullName,
          role: newAdminForm.role,
          department: newAdminForm.department,
          permissions: selectedPermissions,
        }),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Sub-admin access updated. Their existing sessions were closed so the new permissions apply immediately.' });
        setEditingAdmin(null);
        setNewAdminForm({ fullName: '', email: '', role: 'admin', password: '', department: 'general' });
        setSelectedPermissions(ROLE_PERMISSIONS.admin);
        loadSubAdmins();
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.error || error.message || 'Failed to update admin' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error updating admin' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleManagePermissions = (admin: SubAdmin) => {
    handleEditAdmin(admin);
  };

  const handleLogoutSession = async (sessionToken: string) => {
    try {
      const response = await fetch('/api/admin/logout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionToken }),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Session terminated' });
        loadSessions();
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to logout session' });
    }
  };

  // Show nothing while loading mount state or admin data
  if (!mounted || !admin) {
    return null;
  }

  // Show access denied if user is not super_admin
  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="h-8 w-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-6">
            You do not have permission to access Settings. Ask the Super Admin to grant Settings access.
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-sm text-gray-600 mt-1">Manage system configuration, sub-admins, and security</p>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="sticky top-20 z-30 bg-white border-b border-gray-200">
        <div className="mx-auto max-w-7xl px-6 flex gap-8 overflow-x-auto">
          {admin?.role === 'super_admin' && (
            <button
              onClick={() => setActiveTab("sub-admins")}
              className={`px-4 py-4 font-semibold transition-colors border-b-2 whitespace-nowrap flex items-center gap-2 ${activeTab === "sub-admins"
                  ? "border-lime-600 text-lime-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
                }`}
            >
              <Users className="h-5 w-5" />
              Sub-Admin Management
            </button>
          )}
          {canManageStore && <button
            onClick={() => setActiveTab("security")}
            className={`px-4 py-4 font-semibold transition-colors border-b-2 whitespace-nowrap flex items-center gap-2 ${activeTab === "security"
                ? "border-lime-600 text-lime-600"
                : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
          >
            <Lock className="h-5 w-5" />
            Security
          </button>}
          {canManageStore && <button
            onClick={() => setActiveTab("bank")}
            className={`px-4 py-4 font-semibold transition-colors border-b-2 whitespace-nowrap flex items-center gap-2 ${activeTab === "bank"
                ? "border-lime-600 text-lime-600"
                : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
          >
            <DollarSign className="h-5 w-5" />
            Bank Details
          </button>}
          <button
            onClick={() => setActiveTab("homepage")}
            className={`px-4 py-4 font-semibold transition-colors border-b-2 whitespace-nowrap flex items-center gap-2 ${activeTab === "homepage"
                ? "border-lime-600 text-lime-600"
                : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
          >
            <Sliders className="h-5 w-5" />
            General Settings
          </button>
        </div>
      </div>

      {/* Content */}
      <main className="mx-auto max-w-7xl px-6 py-12 w-full">
        {/* Messages */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg flex items-center gap-2 border ${message.type === 'success'
              ? 'bg-green-50 border-green-200'
              : 'bg-red-50 border-red-200'
            }`}>
            {message.type === 'success' ? (
              <CheckCircle2 className={`h-5 w-5 ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`} />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-600" />
            )}
            <p className={`text-sm font-semibold ${message.type === 'success' ? 'text-green-700' : 'text-red-700'}`}>
              {message.text}
            </p>
          </div>
        )}

        {/* Sub-Admin Management Tab */}
        {activeTab === 'sub-admins' && admin?.role === 'super_admin' && (
          <div className="space-y-6">
            {/* Add Sub-Admin Button */}
            <div className="flex justify-end">
              <button
                onClick={() => {
                  const nextOpen = !showAddAdmin;
                  setShowAddAdmin(nextOpen);
                  if (nextOpen) {
                    setEditingAdmin(null);
                    setSelectedPermissions(ROLE_PERMISSIONS.admin);
                  }
                }}
                className="px-6 py-3 bg-gradient-to-r from-lime-600 to-green-600 hover:from-lime-700 hover:to-green-700 text-white font-semibold rounded-lg flex items-center gap-2 transition"
              >
                <Plus className="h-5 w-5" />
                Add Sub-Admin
              </button>
            </div>

            {/* Add Admin Form */}
            {showAddAdmin && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Create New Sub-Admin</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Full Name *</label>
                    <input
                      type="text"
                      value={newAdminForm.fullName}
                      onChange={(e) => setNewAdminForm({ ...newAdminForm, fullName: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500"
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Email *</label>
                    <input
                      type="email"
                      value={newAdminForm.email}
                      onChange={(e) => setNewAdminForm({ ...newAdminForm, email: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500"
                      placeholder="john@empi.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Role *</label>
                    <select
                      value={newAdminForm.role}
                      onChange={(e) => {
                        const role = e.target.value as SubAdminRole;
                        setNewAdminForm({ ...newAdminForm, role });
                        setSelectedPermissions([...ROLE_PERMISSIONS[role]]);
                      }}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500"
                    >
                      <option value="admin">General Admin</option>
                      <option value="finance_admin">Finance Admin</option>
                      <option value="logistics_admin">Logistics Admin</option>
                      <option value="sales_admin">Sales Admin</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Department</label>
                    <select
                      value={newAdminForm.department}
                      onChange={(e) => setNewAdminForm({ ...newAdminForm, department: e.target.value as SubAdmin['department'] })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500"
                    >
                      <option value="general">General</option>
                      <option value="finance">Finance</option>
                      <option value="logistics">Logistics</option>
                      <option value="sales">Sales</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Initial Password *</label>
                    <input
                      type="password"
                      value={newAdminForm.password}
                      onChange={(e) => setNewAdminForm({ ...newAdminForm, password: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500"
                      placeholder="Minimum 8 characters"
                    />
                  </div>
                </div>
                <PermissionSelector
                  selected={selectedPermissions}
                  onChange={setSelectedPermissions}
                  role={newAdminForm.role}
                />
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => {
                      setShowAddAdmin(false);
                      setSelectedPermissions(ROLE_PERMISSIONS.admin);
                    }}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-900 font-semibold hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddAdmin}
                    disabled={isSaving}
                    className="flex-1 px-4 py-3 bg-lime-600 hover:bg-lime-700 disabled:bg-gray-400 text-white font-semibold rounded-lg"
                  >
                    {isSaving ? 'Creating...' : 'Create Sub-Admin'}
                  </button>
                </div>
              </div>
            )}

            {/* Edit Admin Form */}
            {editingAdmin && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Edit Sub-Admin: {editingAdmin.fullName}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Full Name *</label>
                    <input
                      type="text"
                      value={newAdminForm.fullName}
                      onChange={(e) => setNewAdminForm({ ...newAdminForm, fullName: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500"
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Email</label>
                    <input
                      type="email"
                      value={newAdminForm.email}
                      disabled
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                    />
                    <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Role *</label>
                    <select
                      value={newAdminForm.role}
                      onChange={(e) => {
                        const role = e.target.value as SubAdminRole;
                        setNewAdminForm({ ...newAdminForm, role });
                        setSelectedPermissions([...ROLE_PERMISSIONS[role]]);
                      }}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500"
                    >
                      <option value="admin">General Admin</option>
                      <option value="finance_admin">Finance Admin</option>
                      <option value="logistics_admin">Logistics Admin</option>
                      <option value="sales_admin">Sales Admin</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Department</label>
                    <select
                      value={newAdminForm.department}
                      onChange={(e) => setNewAdminForm({ ...newAdminForm, department: e.target.value as SubAdmin['department'] })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500"
                    >
                      <option value="general">General</option>
                      <option value="finance">Finance</option>
                      <option value="logistics">Logistics</option>
                      <option value="sales">Sales</option>
                    </select>
                  </div>
                </div>
                <PermissionSelector
                  selected={selectedPermissions}
                  onChange={setSelectedPermissions}
                  role={newAdminForm.role}
                />
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => {
                      setEditingAdmin(null);
                      setNewAdminForm({ fullName: '', email: '', role: 'admin', password: '', department: 'general' });
                      setSelectedPermissions(ROLE_PERMISSIONS.admin);
                    }}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-900 font-semibold hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    disabled={isSaving}
                    className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold rounded-lg"
                  >
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            )}

            {/* Sub-Admins List */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-8 py-6 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900">Sub-Admin Accounts ({subAdmins.length})</h2>
              </div>
              {loadingAdmins ? (
                <div className="p-8 text-center text-gray-600">
                  <p>Loading sub-admins...</p>
                </div>
              ) : subAdmins.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-gray-600 mb-2">No sub-admins created yet</p>
                  <p className="text-xs text-gray-500">Debug: {subAdmins.length} records loaded</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-8 py-4 text-left text-sm font-semibold text-gray-900">Name</th>
                        <th className="px-8 py-4 text-left text-sm font-semibold text-gray-900">Email</th>
                        <th className="px-8 py-4 text-left text-sm font-semibold text-gray-900">Role</th>
                        <th className="px-8 py-4 text-left text-sm font-semibold text-gray-900">Last Login</th>
                        <th className="px-8 py-4 text-left text-sm font-semibold text-gray-900">Status</th>
                        <th className="px-8 py-4 text-left text-sm font-semibold text-gray-900">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {subAdmins.map((subAdmin) => (
                        <tr key={subAdmin._id} className="hover:bg-gray-50">
                          <td className="px-8 py-4 text-sm font-semibold text-gray-900">{subAdmin.fullName}</td>
                          <td className="px-8 py-4 text-sm text-gray-600">{subAdmin.email}</td>
                          <td className="px-8 py-4 text-sm">
                            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                              {subAdmin.role === 'finance_admin' ? 'Finance' : subAdmin.role === 'logistics_admin' ? 'Logistics' : subAdmin.role === 'sales_admin' ? 'Sales' : 'General'}
                            </span>
                          </td>
                          <td className="px-8 py-4 text-sm text-gray-600">
                            {subAdmin.lastLogin ? new Date(subAdmin.lastLogin).toLocaleDateString() : 'Never'}
                          </td>
                          <td className="px-8 py-4 text-sm">
                            <button
                              onClick={() => handleToggleAdminStatus(subAdmin._id, subAdmin.isActive)}
                              className={`px-3 py-1 rounded-full text-xs font-semibold cursor-pointer transition ${subAdmin.isActive
                                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            >
                              {subAdmin.isActive ? 'Active' : 'Suspended'}
                            </button>
                          </td>
                          <td className="px-8 py-4 text-sm flex gap-2">
                            <button
                              onClick={() => handleDeleteAdmin(subAdmin._id, subAdmin.email)}
                              disabled={isSaving}
                              className="p-2 hover:bg-red-100 rounded-lg transition disabled:opacity-50"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </button>
                            <button
                              onClick={() => handleEditAdmin(subAdmin)}
                              disabled={isSaving}
                              className="p-2 hover:bg-blue-100 rounded-lg transition disabled:opacity-50"
                              title="Edit"
                            >
                              <Edit2 className="h-4 w-4 text-blue-600" />
                            </button>
                            <button
                              onClick={() => handleManagePermissions(subAdmin)}
                              disabled={isSaving}
                              className="p-2 hover:bg-purple-100 rounded-lg transition disabled:opacity-50"
                              title="Manage Permissions"
                            >
                              <Lock className="h-4 w-4 text-purple-600" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Security Tab */}
        {activeTab === 'security' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Change Password */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Change Password</h2>

                {changePassMessage && (
                  <div className={`mb-4 p-3 rounded-lg text-sm font-semibold flex items-center gap-2 border ${changePassMessage.type === 'success'
                      ? 'bg-green-50 border-green-200 text-green-700'
                      : 'bg-red-50 border-red-200 text-red-700'
                    }`}>
                    {changePassMessage.type === 'success' ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      <AlertCircle className="h-4 w-4" />
                    )}
                    {changePassMessage.text}
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Current Password</label>
                    <div className="relative">
                      <input
                        type={showPasswords.current ? "text" : "password"}
                        value={passwordForm.currentPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500 pr-10"
                      />
                      <button
                        onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                        className="absolute right-3 top-3.5"
                      >
                        {showPasswords.current ? (
                          <EyeOff className="h-5 w-5 text-gray-400" />
                        ) : (
                          <Eye className="h-5 w-5 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">New Password</label>
                    <div className="relative">
                      <input
                        type={showPasswords.new ? "text" : "password"}
                        value={passwordForm.newPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500 pr-10"
                      />
                      <button
                        onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                        className="absolute right-3 top-3.5"
                      >
                        {showPasswords.new ? (
                          <EyeOff className="h-5 w-5 text-gray-400" />
                        ) : (
                          <Eye className="h-5 w-5 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Confirm Password</label>
                    <div className="relative">
                      <input
                        type={showPasswords.confirm ? "text" : "password"}
                        value={passwordForm.confirmPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500 pr-10"
                      />
                      <button
                        onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                        className="absolute right-3 top-3.5"
                      >
                        {showPasswords.confirm ? (
                          <EyeOff className="h-5 w-5 text-gray-400" />
                        ) : (
                          <Eye className="h-5 w-5 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={handleChangePassword}
                    disabled={isSaving}
                    className="w-full px-4 py-3 bg-lime-600 hover:bg-lime-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition flex items-center justify-center gap-2"
                  >
                    <Lock className="h-5 w-5" />
                    {isSaving ? 'Updating...' : 'Update Password'}
                  </button>
                </div>
              </div>
            </div>

            {/* Active Sessions */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Active Sessions</h2>
                {loadingSessions ? (
                  <div className="text-center text-gray-600">Loading sessions...</div>
                ) : sessions.length === 0 ? (
                  <div className="text-center text-gray-600">No active sessions</div>
                ) : (
                  <div className="space-y-4">
                    {sessions.map((session, idx) => (
                      <div key={idx} className="p-4 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Clock className="h-5 w-5 text-lime-600" />
                          <div>
                            <p className="font-semibold text-gray-900">Session {idx + 1}</p>
                            <p className="text-sm text-gray-600">
                              Created: {new Date(session.createdAt).toLocaleString()}
                            </p>
                            <p className="text-sm text-gray-600">
                              Expires: {new Date(session.expiresAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleLogoutSession(session.token)}
                          className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 font-semibold rounded-lg transition flex items-center gap-2"
                        >
                          <LogOut className="h-4 w-4" />
                          Logout
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Bank Details Tab */}
        {activeTab === 'bank' && canManageStore && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Bank Account Details</h2>
                <p className="text-gray-600 mt-1">Manage bank accounts for customer payments</p>
              </div>
              <Link
                href="/admin/settings/bank-details"
                className="px-6 py-3 bg-gradient-to-r from-green-600 to-lime-600 hover:from-green-700 hover:to-lime-700 text-white font-semibold rounded-lg transition flex items-center gap-2"
              >
                <DollarSign className="h-5 w-5" />
                Manage Bank Accounts
              </Link>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <span className="font-semibold">💡 Tip:</span> Click &quot;Manage Bank Accounts&quot; to add, edit, or switch between your payment accounts. Only the active account will be displayed to customers.
              </p>
            </div>
          </div>
        )}

        {/* Homepage Selection Tab */}
        {activeTab === 'homepage' && canManageStore && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900">General & Homepage Settings</h2>
              <p className="text-gray-600 mt-1">Configure general store behaviors and select which landing page to show.</p>
            </div>

            {loadingHomepage ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-lime-600"></div>
              </div>
            ) : (
              <div className="space-y-6 max-w-2xl">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-3">Homepage Selection</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Option 1: Default Homepage */}
                    <div
                      onClick={() => handleSaveHomepageSetting('default')}
                      className={`cursor-pointer p-6 rounded-2xl border-2 transition-all flex flex-col justify-between h-48 ${
                        activeHomePageSetting === 'default'
                          ? 'border-lime-500 bg-lime-50/20 shadow-md shadow-lime-500/5'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-lg font-bold text-gray-900">Default Homepage</span>
                          {activeHomePageSetting === 'default' && (
                            <span className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-lime-700 bg-lime-100 rounded-full">Active</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 leading-relaxed">
                          The standard e-commerce layout featuring the hero section slideshow, trust bar badges, and product categories collection grid.
                        </p>
                      </div>
                    </div>

                    {/* Option 2: The Costume Show Homepage */}
                    <div
                      onClick={() => handleSaveHomepageSetting('costume-show')}
                      className={`cursor-pointer p-6 rounded-2xl border-2 transition-all flex flex-col justify-between h-48 ${
                        activeHomePageSetting === 'costume-show'
                          ? 'border-lime-500 bg-lime-50/20 shadow-md shadow-lime-500/5'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-lg font-bold text-gray-950 flex items-center gap-1.5"><Sparkles className="h-4.5 w-4.5 text-lime-500" /> THE COSTUME SHOW</span>
                          {activeHomePageSetting === 'costume-show' && (
                            <span className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-lime-700 bg-lime-100 rounded-full">Active</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 leading-relaxed">
                          A dynamic interactive promotion page specifically for the upcoming Costume Show. Ideal for marketing the movement and show-only shop collections.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 flex gap-3.5">
                  <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold text-amber-900 mb-1">Production Status Info</h4>
                    <p className="text-xs text-amber-800 leading-relaxed">
                      Updating this choice takes effect instantly for all visitors. Make sure you have checked and marked appropriate products as <strong>Featured in THE COSTUME SHOW 2026</strong> so that the dedicated costumes show shop page displays content correctly.
                    </p>
                  </div>
                </div>

                <hr className="border-gray-200 my-8" />

                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Product Settings</h3>
                    <p className="text-gray-600 mt-1">Configure options for product uploads and details.</p>
                  </div>

                  <div className={`p-6 rounded-2xl border-2 transition ${isPriceOptionalSetting ? 'border-lime-500 bg-lime-50/20 shadow-md shadow-lime-500/5' : 'border-gray-200 bg-white'}`}>
                    <div className="flex items-center justify-between">
                      <div className="space-y-1 pr-4">
                        <h4 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                          Optional Product Prices
                        </h4>
                        <p className="text-xs text-gray-500 leading-relaxed">
                          When enabled, you can upload or edit products without specifying a Sell Price or Rent Price. Products without prices will display as &quot;Price on Request&quot; on the storefront and won&apos;t be purchasable online.
                        </p>
                      </div>
                      <button
                        onClick={() => handleTogglePriceOptional(!isPriceOptionalSetting)}
                        disabled={isSaving}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                          isPriceOptionalSetting ? 'bg-lime-600' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            isPriceOptionalSetting ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  {/* VAT Tax Toggle Card */}
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mt-8 mb-2">VAT & Tax Configuration</h3>
                    <p className="text-gray-600 text-sm mb-4">Globally enable or disable VAT calculations across all purchases and invoices.</p>
                  </div>

                  <div className={`p-6 rounded-2xl border-2 transition ${isVatDisabledSetting ? 'border-amber-500 bg-amber-50/20 shadow-md shadow-amber-500/5' : 'border-emerald-500 bg-emerald-50/20 shadow-md shadow-emerald-500/5'}`}>
                    <div className="flex items-center justify-between">
                      <div className="space-y-1 pr-4">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-gray-900">
                            Disable Store VAT (0% Tax)
                          </h4>
                          <span className={`px-2 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-full ${isVatDisabledSetting ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                            {isVatDisabledSetting ? 'Disabled' : 'Standard 7.5% Active'}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 leading-relaxed">
                          When toggled ON (disabled), VAT is set to 0% across all store checkouts, custom quotes, invoices, and cart summaries. Toggle OFF to re-enable standard 7.5% VAT.
                        </p>
                      </div>
                      <button
                        onClick={() => handleToggleVatDisabled(!isVatDisabledSetting)}
                        disabled={isSaving}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                          isVatDisabledSetting ? 'bg-amber-600' : 'bg-gray-300'
                        }`}
                        title={isVatDisabledSetting ? 'VAT is Disabled' : 'VAT is Active'}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            isVatDisabledSetting ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

function PermissionSelector({
  selected,
  onChange,
  role,
}: {
  selected: Permission[];
  onChange: (permissions: Permission[]) => void;
  role: SubAdminRole;
}) {
  const groups = ['Core', 'Commerce', 'Operations', 'Administration'] as const;
  const togglePermission = (permission: Permission) => {
    onChange(
      selected.includes(permission)
        ? selected.filter((item) => item !== permission)
        : [...selected, permission]
    );
  };

  return (
    <section className="mt-7 rounded-2xl border border-gray-200 bg-gray-50/70 p-4 sm:p-6">
      <div className="flex flex-col gap-3 border-b border-gray-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="flex items-center gap-2 text-lg font-black text-gray-900">
            <Lock className="h-5 w-5 text-lime-600" />
            Roles and permissions
          </h3>
          <p className="mt-1 text-xs text-gray-500">
            The role provides a starting template. Every permission below can be customized.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onChange([...ROLE_PERMISSIONS[role]])}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-bold text-gray-700"
          >
            Reset to role
          </button>
          <button
            type="button"
            onClick={() => onChange(
              selected.length === PERMISSION_CATALOG.length
                ? []
                : PERMISSION_CATALOG.map((permission) => permission.id)
            )}
            className="rounded-lg bg-[#142319] px-3 py-2 text-xs font-bold text-white"
          >
            {selected.length === PERMISSION_CATALOG.length ? 'Clear all' : 'Select all'}
          </button>
        </div>
      </div>

      <div className="mt-5 space-y-5">
        {groups.map((group) => (
          <div key={group}>
            <p className="mb-2 text-[10px] font-black uppercase tracking-[.18em] text-gray-400">{group}</p>
            <div className="grid gap-2 md:grid-cols-2">
              {PERMISSION_CATALOG.filter((permission) => permission.group === group).map((permission) => {
                const checked = selected.includes(permission.id);
                return (
                  <label
                    key={permission.id}
                    className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition ${
                      checked ? 'border-lime-400 bg-lime-50' : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => togglePermission(permission.id)}
                      className="mt-0.5 h-5 w-5 shrink-0 accent-lime-600"
                    />
                    <span>
                      <span className="block text-sm font-black text-gray-900">{permission.label}</span>
                      <span className="mt-0.5 block text-xs leading-relaxed text-gray-500">{permission.description}</span>
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <p className="mt-4 text-xs font-semibold text-gray-500">{selected.length} of {PERMISSION_CATALOG.length} permissions selected</p>
    </section>
  );
}
