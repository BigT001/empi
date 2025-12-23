"use client";

import { useState } from "react";
import { Save, LogOut, AlertCircle, CheckCircle } from "lucide-react";

export default function MobileSettingsPage() {
  const [adminName, setAdminName] = useState("Admin");
  const [adminEmail, setAdminEmail] = useState("admin@empi.com");
  const [storeName, setStoreName] = useState("EMPI");
  const [storeEmail, setStoreEmail] = useState("store@empi.com");
  const [storePhone, setStorePhone] = useState("+234 (0) 123 456 7890");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [activeTab, setActiveTab] = useState<"profile" | "store" | "security">("profile");

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setMessage("✅ Profile updated successfully");
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      setMessage("❌ Failed to update profile");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveStore = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setMessage("✅ Store settings updated");
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      setMessage("❌ Failed to update settings");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setMessage("✅ Password changed successfully");
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      setMessage("❌ Failed to change password");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    if (confirm("Are you sure you want to log out?")) {
      window.location.href = "/";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-200 px-4 py-4">
        <h1 className="text-xl font-bold text-gray-900">⚙️ Settings</h1>
      </div>

      {/* Messages */}
      {message && (
        <div
          className={`mx-4 mt-4 p-3 rounded-lg text-center font-semibold text-sm ${
            message.includes("✅")
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          {message}
        </div>
      )}

      {/* Tabs */}
      <div className="sticky top-16 z-20 bg-white border-b border-gray-200 px-4 overflow-x-auto flex gap-2 py-3">
        {(["profile", "store", "security"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-full font-semibold text-sm transition whitespace-nowrap ${
              activeTab === tab
                ? "bg-lime-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {tab === "profile"
              ? "👤 Profile"
              : tab === "store"
              ? "🏪 Store"
              : "🔐 Security"}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="px-4 py-6">
        {/* Profile Tab */}
        {activeTab === "profile" && (
          <form onSubmit={handleSaveProfile} className="space-y-4 max-w-lg mx-auto">
            <div className="bg-lime-50 border border-lime-200 p-4 rounded-xl mb-6">
              <p className="text-sm font-semibold text-lime-900">
                👤 Manage your admin profile
              </p>
            </div>

            {/* Admin Name */}
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">Admin Name</label>
              <input
                type="text"
                value={adminName}
                onChange={(e) => setAdminName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-lime-500 focus:border-transparent text-sm"
                disabled={isLoading}
              />
            </div>

            {/* Admin Email */}
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">Admin Email</label>
              <input
                type="email"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-lime-500 focus:border-transparent text-sm"
                disabled={isLoading}
              />
            </div>

            {/* Save Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-lime-600 hover:bg-lime-700 text-white rounded-xl font-bold transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Save className="h-5 w-5" />
              {isLoading ? "Saving..." : "Save Changes"}
            </button>
          </form>
        )}

        {/* Store Tab */}
        {activeTab === "store" && (
          <form onSubmit={handleSaveStore} className="space-y-4 max-w-lg mx-auto">
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl mb-6">
              <p className="text-sm font-semibold text-blue-900">
                🏪 Configure your store information
              </p>
            </div>

            {/* Store Name */}
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">Store Name</label>
              <input
                type="text"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-lime-500 focus:border-transparent text-sm"
                disabled={isLoading}
              />
            </div>

            {/* Store Email */}
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">Store Email</label>
              <input
                type="email"
                value={storeEmail}
                onChange={(e) => setStoreEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-lime-500 focus:border-transparent text-sm"
                disabled={isLoading}
              />
            </div>

            {/* Store Phone */}
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">Store Phone</label>
              <input
                type="tel"
                value={storePhone}
                onChange={(e) => setStorePhone(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-lime-500 focus:border-transparent text-sm"
                disabled={isLoading}
              />
            </div>

            {/* Save Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-lime-600 hover:bg-lime-700 text-white rounded-xl font-bold transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Save className="h-5 w-5" />
              {isLoading ? "Saving..." : "Save Settings"}
            </button>
          </form>
        )}

        {/* Security Tab */}
        {activeTab === "security" && (
          <div className="space-y-4 max-w-lg mx-auto">
            {/* Change Password */}
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="bg-orange-50 border border-orange-200 p-4 rounded-xl">
                <p className="text-sm font-semibold text-orange-900">
                  🔐 Change your password
                </p>
              </div>

              {/* Current Password */}
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">
                  Current Password
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-lime-500 focus:border-transparent text-sm"
                  disabled={isLoading}
                />
              </div>

              {/* New Password */}
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-lime-500 focus:border-transparent text-sm"
                  disabled={isLoading}
                />
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">
                  Confirm Password
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-lime-500 focus:border-transparent text-sm"
                  disabled={isLoading}
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold transition disabled:opacity-50"
              >
                {isLoading ? "Updating..." : "Update Password"}
              </button>
            </form>

            {/* Logout Section */}
            <div className="pt-6 border-t border-gray-200">
              <div className="bg-red-50 border border-red-200 p-4 rounded-xl mb-4">
                <p className="text-sm font-semibold text-red-900">
                  🚪 Session management
                </p>
              </div>

              <button
                onClick={handleLogout}
                className="w-full py-3 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition flex items-center justify-center gap-2"
              >
                <LogOut className="h-5 w-5" />
                Logout
              </button>
            </div>

            {/* Security Tips */}
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl mt-6">
              <p className="text-sm font-bold text-blue-900 mb-2">🛡️ Security Tips</p>
              <ul className="text-xs text-blue-800 space-y-1">
                <li>• Change your password regularly</li>
                <li>• Use a strong password (8+ characters)</li>
                <li>• Don't share your login credentials</li>
                <li>• Log out after using the admin panel</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
