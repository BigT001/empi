"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useAdmin } from "@/app/context/AdminContext";
import { Save, Bell, Lock, User, Shield, Users } from "lucide-react";

// Mobile components
const MobileSettingsPage = dynamic(() => import("../mobile-settings"), { ssr: false });
import MobileAdminLayout from "../mobile-layout";

export default function SettingsPage() {
  // HOOKS MUST BE CALLED FIRST - BEFORE ANY CONDITIONAL LOGIC
  const { admin } = useAdmin();
  const [isMobile, setIsMobile] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<"store" | "notifications" | "security">("store");
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
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
