"use client";

import { Package, Loader, CheckCircle, Settings } from "lucide-react";

interface TabNavigationProps {
  activeTab: "delivery" | "pickup" | "completed" | "settings";
  onTabChange: (tab: "delivery" | "pickup" | "completed" | "settings") => void;
  deliveryCount: number;
  pickupCount: number;
  completedCount: number;
}

export function TabNavigation({
  activeTab,
  onTabChange,
  deliveryCount,
  pickupCount,
  completedCount,
}: TabNavigationProps) {
  const tabs = [
    {
      id: "delivery" as const,
      label: "Delivery",
      icon: Package,
      count: deliveryCount,
      color: "blue",
    },
    {
      id: "pickup" as const,
      label: "Pickup",
      icon: Loader,
      count: pickupCount,
      color: "orange",
    },
    {
      id: "completed" as const,
      label: "Completed",
      icon: CheckCircle,
      count: completedCount,
      color: "green",
    },
    {
      id: "settings" as const,
      label: "Settings",
      icon: Settings,
      count: undefined,
      color: "gray",
    },
  ];

  return (
    <div className="flex gap-2 border-b border-gray-200 mb-6">
      {tabs.map(tab => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        const colorClasses: Record<string, string> = {
          blue: isActive ? "border-blue-500 text-blue-600" : "border-transparent text-gray-600 hover:text-blue-600",
          orange: isActive ? "border-orange-500 text-orange-600" : "border-transparent text-gray-600 hover:text-orange-600",
          green: isActive ? "border-green-500 text-green-600" : "border-transparent text-gray-600 hover:text-green-600",
          gray: isActive ? "border-gray-600 text-gray-700" : "border-transparent text-gray-600 hover:text-gray-700",
        };

        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 font-semibold text-sm transition ${colorClasses[tab.color]}`}
          >
            <Icon className="h-5 w-5" />
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span className="ml-1 px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded-full font-bold">
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
