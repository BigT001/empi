'use client';

import { useState, useEffect } from 'react';
import { useAdmin } from '@/app/context/AdminContext';
import { Users, Plus, Trash2, ToggleLeft, ToggleRight, ArrowLeft, Mail, Shield } from 'lucide-react';
import Link from 'next/link';

interface AdminUser {
  _id: string;
  email: string;
  fullName: string;
  role: 'admin' | 'super_admin';
  permissions: string[];
  isActive: boolean;
  createdAt: string;
}

export default function ManageAdminsPage() {
  const { admin: currentAdmin } = useAdmin();
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form states
  const [formData, setFormData] = useState({
    email: '',
    fullName: '',
    password: '',
    role: 'admin',
  });

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/users', {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch admins');
      }

      const data = await response.json();
      setAdmins(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch admins');
    } finally {
      setLoading(false);
    }
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      if (!formData.email || !formData.fullName || !formData.password) {
        throw new Error('All fields are required');
      }

      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add admin');
      }

      const newAdmin = await response.json();
      setAdmins([...admins, newAdmin]);
      setFormData({ email: '', fullName: '', password: '', role: 'admin' });
      setShowAddForm(false);
      setSuccess('Admin added successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const toggleAdminStatus = async (adminId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/users/${adminId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update admin status');
      }

      const updatedAdmin = await response.json();
      setAdmins(admins.map(a => a._id === adminId ? updatedAdmin : a));
      setSuccess(`Admin ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update admin');
    }
  };

  const deleteAdmin = async (adminId: string) => {
    if (!confirm('Are you sure you want to delete this admin? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/users/${adminId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to delete admin');
      }

      setAdmins(admins.filter(a => a._id !== adminId));
      setSuccess('Admin deleted successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete admin');
    }
  };

  // Only super_admin can access this page
  if (currentAdmin?.role !== 'super_admin') {
    return (
      <div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-md p-8 text-center max-w-md">
          <Shield className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">Only super admins can manage admin users.</p>
          <Link href="/admin" className="mt-6 inline-block bg-lime-600 hover:bg-lime-700 text-white font-semibold py-2 px-6 rounded-lg">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/admin/settings"
            className="inline-flex items-center gap-2 text-lime-600 hover:text-lime-700 font-semibold mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Settings
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Manage Admins</h1>
              <p className="text-gray-600 mt-2">Total admins: {admins.length}/5</p>
            </div>
            {admins.length < 5 && !showAddForm && (
              <button
                onClick={() => setShowAddForm(true)}
                className="flex items-center gap-2 bg-lime-600 hover:bg-lime-700 text-white font-semibold py-2 px-4 rounded-lg transition"
              >
                <Plus className="h-5 w-5" />
                Add Admin
              </button>
            )}
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-start gap-2">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg flex items-start gap-2">
            <span>✅</span>
            <span>{success}</span>
          </div>
        )}

        {/* Add Admin Form */}
        {showAddForm && (
          <div className="bg-white rounded-xl shadow-md p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Add New Admin</h2>
            <form onSubmit={handleAddAdmin} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="Admin full name"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="admin@example.com"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Minimum 6 characters"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Role
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500 bg-white"
                  >
                    <option value="admin">Admin</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="bg-lime-600 hover:bg-lime-700 text-white font-semibold py-2 px-6 rounded-lg transition"
                >
                  Add Admin
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2 px-6 rounded-lg transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Admins List */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Loading admins...</p>
          </div>
        ) : admins.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">No admins yet</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {admins.map((admin) => (
              <div key={admin._id} className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-gray-900">{admin.fullName}</h3>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          admin.role === 'super_admin'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {admin.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                      </span>
                      {!admin.isActive && (
                        <span className="px-3 py-1 rounded-full text-sm font-semibold bg-red-100 text-red-800">
                          Inactive
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Mail className="h-4 w-4" />
                      <span>{admin.email}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {admin._id !== currentAdmin?.id && (
                      <>
                        <button
                          onClick={() => toggleAdminStatus(admin._id, admin.isActive)}
                          className={`p-2 rounded-lg transition ${
                            admin.isActive
                              ? 'bg-green-100 hover:bg-green-200 text-green-600'
                              : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                          }`}
                          title={admin.isActive ? 'Deactivate' : 'Activate'}
                        >
                          {admin.isActive ? (
                            <ToggleRight className="h-5 w-5" />
                          ) : (
                            <ToggleLeft className="h-5 w-5" />
                          )}
                        </button>
                        <button
                          onClick={() => deleteAdmin(admin._id)}
                          className="p-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition"
                          title="Delete"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
