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
  const { admin } = useAdmin();
  const [isMobile, setIsMobile] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

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

  const [settings, setSettings] = useState({
    storeName: "EMPI Costumes",
    email: "admin@empicostumes.com",
    phone: "+234 123 456 7890",
    notificationsEmail: true,
    notificationsSMS: false,
    autoRentalsReminder: true,
    lowStockAlert: true,
  });

  const [isSaved, setIsSaved] = useState(false);

  const handleChange = (field: string, value: any) => {
    setSettings((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = () => {
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
          <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
              <p className="text-sm text-gray-600">Manage your admin preferences</p>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 mx-auto max-w-2xl px-6 py-12 w-full">
          {/* Save Message */}
          {isSaved && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
              <div className="h-2 w-2 bg-green-600 rounded-full"></div>
              <p className="text-sm text-green-700 font-semibold">Settings saved successfully!</p>
            </div>
          )}

          {/* Store Settings */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mb-6">
            <div className="flex items-center gap-3 mb-6">
              <User className="h-6 w-6 text-lime-600" />
              <h2 className="text-xl font-bold text-gray-900">Store Settings</h2>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Store Name</label>
                <input
                  type="text"
                  value={settings.storeName}
                  onChange={(e) => handleChange("storeName", e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Email Address</label>
                <input
                  type="email"
                  value={settings.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Phone Number</label>
                <input
                  type="tel"
                  value={settings.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500"
                />
              </div>
            </div>
          </div>

          {/* Notification Settings */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mb-6">
            <div className="flex items-center gap-3 mb-6">
              <Bell className="h-6 w-6 text-lime-600" />
              <h2 className="text-xl font-bold text-gray-900">Notifications</h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-semibold text-gray-900">Email Notifications</p>
                  <p className="text-sm text-gray-600">Receive alerts via email</p>
                </div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.notificationsEmail}
                    onChange={(e) => handleChange("notificationsEmail", e.target.checked)}
                    className="w-5 h-5 text-lime-600 rounded cursor-pointer"
                  />
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-semibold text-gray-900">SMS Notifications</p>
                  <p className="text-sm text-gray-600">Receive alerts via SMS</p>
                </div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.notificationsSMS}
                    onChange={(e) => handleChange("notificationsSMS", e.target.checked)}
                    className="w-5 h-5 text-lime-600 rounded cursor-pointer"
                  />
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-semibold text-gray-900">Auto Rental Reminders</p>
                  <p className="text-sm text-gray-600">Remind customers about active rentals</p>
                </div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.autoRentalsReminder}
                    onChange={(e) => handleChange("autoRentalsReminder", e.target.checked)}
                    className="w-5 h-5 text-lime-600 rounded cursor-pointer"
                  />
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-semibold text-gray-900">Low Stock Alerts</p>
                  <p className="text-sm text-gray-600">Alert when products run low</p>
                </div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.lowStockAlert}
                    onChange={(e) => handleChange("lowStockAlert", e.target.checked)}
                    className="w-5 h-5 text-lime-600 rounded cursor-pointer"
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Security Settings */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mb-6">
            <div className="flex items-center gap-3 mb-6">
              <Lock className="h-6 w-6 text-lime-600" />
              <h2 className="text-xl font-bold text-gray-900">Security</h2>
            </div>

            <div className="space-y-4">
              <Link
                href="/admin/settings/change-password"
                className="block w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 font-semibold hover:bg-gray-50 transition text-center"
              >
                Change Password
              </Link>
              {admin?.role === 'super_admin' && (
                <Link
                  href="/admin/settings/manage-admins"
                  className="flex items-center justify-between w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 font-semibold hover:bg-gray-50 transition"
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

          {/* Save Button */}
          <button
            onClick={handleSave}
            className="w-full bg-lime-600 hover:bg-lime-700 text-white font-bold py-3 rounded-lg transition flex items-center justify-center gap-2"
          >
            <Save className="h-5 w-5" />
            Save Settings
          </button>
        </main>
    </div>
  );
}
