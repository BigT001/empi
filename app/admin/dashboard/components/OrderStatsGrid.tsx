"use client";

import { Clock, AlertCircle, CheckCircle, Zap, TrendingUp, Users } from "lucide-react";

interface Order {
  status: string;
  [key: string]: any;
}

interface OrderStatsGridProps {
  orders: Order[];
}

export function OrderStatsGrid({ orders }: OrderStatsGridProps) {
  const stats = [
    {
      label: "Total Orders",
      value: orders.length,
      icon: TrendingUp,
      color: "from-blue-600 to-blue-400",
      bgColor: "bg-blue-50 text-blue-700"
    },
    {
      label: "Pending",
      value: orders.filter(o => o.status === "pending").length,
      icon: Clock,
      color: "from-yellow-600 to-yellow-400",
      bgColor: "bg-yellow-50 text-yellow-700"
    },
    {
      label: "In Progress",
      value: orders.filter(o => o.status === "in-progress").length,
      icon: Zap,
      color: "from-purple-600 to-purple-400",
      bgColor: "bg-purple-50 text-purple-700"
    },
    {
      label: "Ready",
      value: orders.filter(o => o.status === "ready").length,
      icon: AlertCircle,
      color: "from-green-600 to-green-400",
      bgColor: "bg-green-50 text-green-700"
    },
    {
      label: "Completed",
      value: orders.filter(o => o.status === "completed").length,
      icon: CheckCircle,
      color: "from-emerald-600 to-emerald-400",
      bgColor: "bg-emerald-50 text-emerald-700"
    }
  ];

  return (
    <div className="grid md:grid-cols-5 gap-3">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.label}
            className={`${stat.bgColor} rounded-xl p-4 flex items-center gap-3 border border-transparent hover:border-current transition-all`}
          >
            <div className={`bg-gradient-to-br ${stat.color} p-3 rounded-lg text-white`}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold opacity-75 uppercase tracking-wider">{stat.label}</p>
              <p className="text-2xl font-bold">{stat.value}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
