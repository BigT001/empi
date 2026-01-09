"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useAdmin } from "@/app/context/AdminContext";
import { Save, Bell, Lock, User, Shield, Users, Trash2, AlertTriangle, DollarSign } from "lucide-react";

// Mobile components
const MobileSettingsPage = dynamic(() => import("../mobile-settings"), { ssr: false });
import MobileAdminLayout from "../mobile-layout";

export default function SettingsPage() {
  // HOOKS MUST BE CALLED FIRST - BEFORE ANY CONDITIONAL LOGIC
  const { admin } = useAdmin();
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<"store" | "notifications" | "security" | "bank">("store");
  const [adminName, setAdminName] = useState("Admin");
  const [adminEmail, setAdminEmail] = useState("admin@empi.com");
  const [storeName, setStoreName] = useState("EMPI Costumes");
  const [storeEmail, setStoreEmail] = useState("admin@empicostumes.com");
  const [storePhone, setStorePhone] = useState("+234 123 456 7890");
  const [notificationsEmail, setNotificationsEmail] = useState(true);
  const [notificationsSMS, setNotificationsSMS] = useState(false);
  const [autoRentalsReminder, setAutoRentalsReminder] = useState(true);
  const [lowStockAlert, setLowStockAlert] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Detect mobile device
  useEffect(() => {
    setIsMounted(true);
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Show mobile view on small screens
  if (!isMounted) {
    return null;
  }

  if (isMobile) {
    return (
      <MobileAdminLayout>
        <MobileSettingsPage />
      </MobileAdminLayout>
    );
  }

  const handleSave = () => {
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleDatabaseReset = async () => {
    setResetLoading(true);
    setResetMessage(null);

    try {
      // Call the reset API with the tokens
      const response = await fetch('/api/admin/reset-database', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_ADMIN_RESET_SECRET}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          confirmationToken: process.env.NEXT_PUBLIC_RESET_CONFIRMATION_TOKEN
        })
      });

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        setResetMessage({
          type: 'error',
          text: 'Invalid response from server. Check if endpoint exists and is responding correctly.'
        });
        setResetLoading(false);
        return;
      }

      const data = await response.json();

      if (response.ok) {
        setResetMessage({
          type: 'success',
          text: `Database reset successful! Deleted ${data.deletedCounts.buyers} users, ${data.deletedCounts.invoices} transactions, and ${data.deletedCounts.orders} orders. Logging out all users...`
        });
        setShowResetModal(false);

        // Clear all session cookies to logout all users
        await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});

        // Wait a moment then navigate to login without a full reload
        setTimeout(() => {
          // Clear local storage
          try { localStorage.clear(); } catch (e) { /* ignore */ }
          // Navigate client-side to home/login
          try { router.push('/'); } catch (e) { window.location.href = '/'; }
        }, 2000);
      } else {
        setResetMessage({
          type: 'error',
          text: data.error || 'Failed to reset database. Status: ' + response.status
        });
      }
    } catch (error) {
      console.error('Reset database error:', error);
      setResetMessage({
        type: 'error',
        text: 'Error: ' + (error instanceof Error ? error.message : String(error))
      });
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-sm text-gray-600 mt-1">Manage your admin and store preferences</p>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="sticky top-20 z-30 bg-white border-b border-gray-200">
        <div className="mx-auto max-w-7xl px-6 flex gap-8 overflow-x-auto">
          <button
            onClick={() => setActiveTab("store")}
            className={`px-4 py-4 font-semibold transition-colors border-b-2 whitespace-nowrap ${
              activeTab === "store"
                ? "border-lime-600 text-lime-600"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            <span className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Store Settings
            </span>
          </button>
          <button
            onClick={() => setActiveTab("notifications")}
            className={`px-4 py-4 font-semibold transition-colors border-b-2 whitespace-nowrap ${
              activeTab === "notifications"
                ? "border-lime-600 text-lime-600"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            <span className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
            </span>
          </button>
          <button
            onClick={() => setActiveTab("security")}
            className={`px-4 py-4 font-semibold transition-colors border-b-2 whitespace-nowrap ${
              activeTab === "security"
                ? "border-lime-600 text-lime-600"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            <span className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Security
            </span>
          </button>
          <button
            onClick={() => setActiveTab("bank")}
            className={`px-4 py-4 font-semibold transition-colors border-b-2 whitespace-nowrap ${
              activeTab === "bank"
                ? "border-lime-600 text-lime-600"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            <span className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Bank Details
            </span>
          </button>
        </div>
      </div>

      {/* Content */}
      <main className="mx-auto max-w-4xl px-6 py-12 w-full">
        {/* Save Message */}
        {isSaved && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
            <div className="h-2 w-2 bg-green-600 rounded-full"></div>
            <p className="text-sm text-green-700 font-semibold">Settings saved successfully!</p>
          </div>
        )}

        {/* Store Settings Tab */}
        {activeTab === "store" && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mb-6 animate-fadeIn">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">Store Settings</h2>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Store Name</label>
                <input
                  type="text"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500"
                  placeholder="Enter store name"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Store Email</label>
                <input
                  type="email"
                  value={storeEmail}
                  onChange={(e) => setStoreEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500"
                  placeholder="Enter store email"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Store Phone</label>
                <input
                  type="tel"
                  value={storePhone}
                  onChange={(e) => setStorePhone(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500"
                  placeholder="Enter store phone"
                />
              </div>

              <button
                onClick={handleSave}
                className="w-full bg-lime-600 hover:bg-lime-700 text-white font-bold py-3 rounded-lg transition flex items-center justify-center gap-2 mt-8"
              >
                <Save className="h-5 w-5" />
                Save Changes
              </button>
            </div>
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === "notifications" && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mb-6 animate-fadeIn">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">Notification Preferences</h2>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-semibold text-gray-900">Email Notifications</p>
                  <p className="text-sm text-gray-600">Receive alerts via email</p>
                </div>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notificationsEmail}
                    onChange={(e) => setNotificationsEmail(e.target.checked)}
                    className="w-5 h-5 text-lime-600 rounded"
                  />
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-semibold text-gray-900">SMS Notifications</p>
                  <p className="text-sm text-gray-600">Receive alerts via SMS</p>
                </div>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notificationsSMS}
                    onChange={(e) => setNotificationsSMS(e.target.checked)}
                    className="w-5 h-5 text-lime-600 rounded"
                  />
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-semibold text-gray-900">Auto Rental Reminders</p>
                  <p className="text-sm text-gray-600">Remind customers about active rentals</p>
                </div>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoRentalsReminder}
                    onChange={(e) => setAutoRentalsReminder(e.target.checked)}
                    className="w-5 h-5 text-lime-600 rounded"
                  />
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-semibold text-gray-900">Low Stock Alerts</p>
                  <p className="text-sm text-gray-600">Alert when products run low</p>
                </div>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={lowStockAlert}
                    onChange={(e) => setLowStockAlert(e.target.checked)}
                    className="w-5 h-5 text-lime-600 rounded"
                  />
                </label>
              </div>

              <button
                onClick={handleSave}
                className="w-full bg-lime-600 hover:bg-lime-700 text-white font-bold py-3 rounded-lg transition flex items-center justify-center gap-2 mt-8"
              >
                <Save className="h-5 w-5" />
                Save Changes
              </button>
            </div>
          </div>
        )}

        {/* Security Tab */}
        {activeTab === "security" && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mb-6 animate-fadeIn">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">Security Settings</h2>

            <div className="space-y-4">
              <Link
                href="/admin/settings/change-password"
                className="block w-full px-4 py-4 border border-gray-300 rounded-lg text-gray-900 font-semibold hover:bg-gray-50 transition text-center text-base"
              >
                Change Password
              </Link>
              {admin?.role === 'super_admin' && (
                <Link
                  href="/admin/settings/manage-admins"
                  className="flex items-center justify-between w-full px-4 py-4 border border-gray-300 rounded-lg text-gray-900 font-semibold hover:bg-gray-50 transition"
                >
                  <span className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Manage Admin Users
                  </span>
                  <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">Super Admin</span>
                </Link>
              )}

              {/* Database Management Section */}
              <div className="mt-8 pt-8 border-t border-gray-200">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Trash2 className="h-5 w-5 text-red-600" />
                  Database Management
                </h3>
                <p className="text-sm text-gray-600 mb-4">Dangerous actions - use with caution</p>
                
                {admin?.role === 'super_admin' && (
                  <button
                    onClick={() => setShowResetModal(true)}
                    className="w-full px-4 py-4 border-2 border-red-300 rounded-lg text-red-700 font-semibold hover:bg-red-50 transition flex items-center justify-center gap-2"
                  >
                    <AlertTriangle className="h-5 w-5" />
                    Reset Database (Delete All Users, Orders & Transactions)
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Bank Details Tab */}
        {activeTab === "bank" && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mb-6 animate-fadeIn">
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
                <span className="font-semibold">💡 Tip:</span> Click "Manage Bank Accounts" above to add, edit, delete, or switch between up to 3 bank accounts. Only the active account will be displayed to customers during checkout.
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Database Reset Confirmation Modal */}
      {showResetModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-fadeIn">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Reset Database?</h2>
            </div>

            <p className="text-gray-700 mb-2 font-semibold">This action cannot be undone!</p>
            <p className="text-sm text-gray-600 mb-6">
              This will permanently delete:
            </p>
            <ul className="text-sm text-gray-600 mb-6 space-y-1 bg-red-50 p-3 rounded-lg border border-red-200">
              <li>✗ All user accounts</li>
              <li>✗ All orders</li>
              <li>✗ All transaction histories</li>
              <li>✗ All invoices</li>
              <li>✗ Log out all active users</li>
            </ul>

            <div className="flex gap-3">
              <button
                onClick={() => setShowResetModal(false)}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-900 font-semibold hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDatabaseReset}
                disabled={resetLoading}
                className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-lg font-semibold transition flex items-center justify-center gap-2"
              >
                {resetLoading ? 'Resetting...' : 'Yes, Reset Database'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Message Alert */}
      {resetMessage && (
        <div className={`fixed top-6 right-6 max-w-md px-6 py-4 rounded-lg shadow-lg z-50 flex items-center gap-3 ${
          resetMessage.type === 'success' 
            ? 'bg-green-50 border border-green-200' 
            : 'bg-red-50 border border-red-200'
        }`}>
          <div className={`h-2 w-2 rounded-full ${resetMessage.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}></div>
          <p className={`font-semibold ${resetMessage.type === 'success' ? 'text-green-700' : 'text-red-700'}`}>
            {resetMessage.text}
          </p>
        </div>
      )}
    </div>
  );
}
