"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAdmin } from "@/app/context/AdminContext";
import { useResponsive } from "@/app/hooks/useResponsive";
import { Save, Lock, Users, DollarSign, Plus, Edit2, Trash2, Eye, EyeOff, LogOut, Clock, CheckCircle2, AlertCircle } from "lucide-react";

interface SubAdmin {
  _id: string;
  fullName: string;
  email: string;
  role: 'admin' | 'finance_admin' | 'logistics_admin';
  department: 'general' | 'finance' | 'logistics';
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
}

interface PasswordForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export default function SettingsPage() {
  const { admin } = useAdmin();
  const router = useRouter();
  const { mounted } = useResponsive();
  const [activeTab, setActiveTab] = useState<"sub-admins" | "security" | "bank">("sub-admins");
  
  // Sub-Admins State
  const [subAdmins, setSubAdmins] = useState<SubAdmin[]>([]);
  const [loadingAdmins, setLoadingAdmins] = useState(false);
  const [showAddAdmin, setShowAddAdmin] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<SubAdmin | null>(null);
  const [newAdminForm, setNewAdminForm] = useState<{
    fullName: string;
    email: string;
    role: 'admin' | 'finance_admin' | 'logistics_admin';
    password: string;
    department: 'general' | 'finance' | 'logistics';
  }>({
    fullName: '',
    email: '',
    role: 'admin',
    password: '',
    department: 'general',
  });
  
  // Security State
  const [passwordForm, setPasswordForm] = useState<PasswordForm>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswords, setShowPasswords] = useState({ current: false, new: false, confirm: false });
  const [changePassMessage, setChangePassMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  
  // UI State
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Settings page is locked - nobody can access it
  const hasAccess = false;

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

  useEffect(() => {
    if (activeTab === 'sub-admins' && admin?.role === 'super_admin') {
      console.log('👤 Admin context:', admin);
      console.log('🔓 Admin role is super_admin - loading sub-admins');
      loadSubAdmins();
    }
    if (activeTab === 'security') {
      loadSessions();
    }
  }, [activeTab, admin?.role]);

  const handleAddAdmin = async () => {
    if (!newAdminForm.fullName || !newAdminForm.email || !newAdminForm.password) {
      setMessage({ type: 'error', text: 'Please fill all required fields' });
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAdminForm),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Sub-admin created successfully' });
        setNewAdminForm({ fullName: '', email: '', role: 'admin', password: '', department: 'general' });
        setShowAddAdmin(false);
        loadSubAdmins();
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.message || 'Failed to create sub-admin' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error creating sub-admin' });
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });

      if (response.ok) {
        setChangePassMessage({ type: 'success', text: 'Password changed successfully' });
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setTimeout(() => setChangePassMessage(null), 5000);
      } else {
        const error = await response.json();
        setChangePassMessage({ type: 'error', text: error.message || 'Failed to change password' });
      }
    } catch (error) {
      setChangePassMessage({ type: 'error', text: 'Error changing password' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleAdminStatus = async (adminId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/admin/users/${adminId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isActive }),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: `Sub-admin ${!isActive ? 'activated' : 'deactivated'}` });
        loadSubAdmins();
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update admin status' });
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
      role: (admin.role as 'admin' | 'finance_admin' | 'logistics_admin'),
      password: '',
      department: admin.department || 'general',
    });
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
        }),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Sub-admin updated successfully' });
        setEditingAdmin(null);
        setNewAdminForm({ fullName: '', email: '', role: 'admin', password: '', department: 'general' });
        loadSubAdmins();
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.message || 'Failed to update admin' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error updating admin' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleManagePermissions = (admin: SubAdmin) => {
    // Open permissions modal
    alert(`Manage permissions for ${admin.fullName}\n\nCurrent role: ${admin.role}\n\nThis feature allows you to customize the admin's permissions. Coming soon!`);
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
            Settings are only available to Super Administrators. You do not have permission to access this page.
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
              className={`px-4 py-4 font-semibold transition-colors border-b-2 whitespace-nowrap flex items-center gap-2 ${
                activeTab === "sub-admins"
                  ? "border-lime-600 text-lime-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              <Users className="h-5 w-5" />
              Sub-Admin Management
            </button>
          )}
          <button
            onClick={() => setActiveTab("security")}
            className={`px-4 py-4 font-semibold transition-colors border-b-2 whitespace-nowrap flex items-center gap-2 ${
              activeTab === "security"
                ? "border-lime-600 text-lime-600"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            <Lock className="h-5 w-5" />
            Security
          </button>
          <button
            onClick={() => setActiveTab("bank")}
            className={`px-4 py-4 font-semibold transition-colors border-b-2 whitespace-nowrap flex items-center gap-2 ${
              activeTab === "bank"
                ? "border-lime-600 text-lime-600"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            <DollarSign className="h-5 w-5" />
            Bank Details
          </button>
        </div>
      </div>

      {/* Content */}
      <main className="mx-auto max-w-7xl px-6 py-12 w-full">
        {/* Messages */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg flex items-center gap-2 border ${
            message.type === 'success' 
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
                onClick={() => setShowAddAdmin(!showAddAdmin)}
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
                      onChange={(e) => setNewAdminForm({ ...newAdminForm, role: e.target.value as any })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500"
                    >
                      <option value="admin">General Admin</option>
                      <option value="finance_admin">Finance Admin</option>
                      <option value="logistics_admin">Logistics Admin</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Department</label>
                    <select
                      value={newAdminForm.department}
                      onChange={(e) => setNewAdminForm({ ...newAdminForm, department: e.target.value as any })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500"
                    >
                      <option value="general">General</option>
                      <option value="finance">Finance</option>
                      <option value="logistics">Logistics</option>
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
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowAddAdmin(false)}
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
                      onChange={(e) => setNewAdminForm({ ...newAdminForm, role: e.target.value as any })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500"
                    >
                      <option value="admin">General Admin</option>
                      <option value="finance_admin">Finance Admin</option>
                      <option value="logistics_admin">Logistics Admin</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Department</label>
                    <select
                      value={newAdminForm.department}
                      onChange={(e) => setNewAdminForm({ ...newAdminForm, department: e.target.value as any })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500"
                    >
                      <option value="general">General</option>
                      <option value="finance">Finance</option>
                      <option value="logistics">Logistics</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => {
                      setEditingAdmin(null);
                      setNewAdminForm({ fullName: '', email: '', role: 'admin', password: '', department: 'general' });
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
                              {subAdmin.role === 'finance_admin' ? 'Finance' : subAdmin.role === 'logistics_admin' ? 'Logistics' : 'General'}
                            </span>
                          </td>
                          <td className="px-8 py-4 text-sm text-gray-600">
                            {subAdmin.lastLogin ? new Date(subAdmin.lastLogin).toLocaleDateString() : 'Never'}
                          </td>
                          <td className="px-8 py-4 text-sm">
                            <button
                              onClick={() => handleToggleAdminStatus(subAdmin._id, subAdmin.isActive)}
                              className={`px-3 py-1 rounded-full text-xs font-semibold cursor-pointer transition ${
                                subAdmin.isActive
                                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                            >
                              {subAdmin.isActive ? 'Active' : 'Inactive'}
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
                  <div className={`mb-4 p-3 rounded-lg text-sm font-semibold flex items-center gap-2 border ${
                    changePassMessage.type === 'success'
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
        {activeTab === 'bank' && (
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
                <span className="font-semibold">💡 Tip:</span> Click "Manage Bank Accounts" to add, edit, or switch between your payment accounts. Only the active account will be displayed to customers.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
