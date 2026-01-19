'use client';

import React, { useMemo } from 'react';
import { AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface SalesData {
  name: string;
  sales: number;
  rentals: number;
  total: number;
}

interface ChartProps {
  data: SalesData[];
  title: string;
  height?: number;
}

/**
 * Combined Sales & Rentals Bar Chart
 */
export function SalesRentalsChart({ data, title }: ChartProps) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="name" stroke="#6b7280" />
          <YAxis stroke="#6b7280" />
          <Tooltip
            contentStyle={{
              backgroundColor: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '12px',
            }}
            formatter={(value) => `₦${Number(value).toLocaleString()}`}
          />
          <Legend />
          <Bar dataKey="sales" fill="#10b981" name="Sales Revenue" radius={[8, 8, 0, 0]} />
          <Bar dataKey="rentals" fill="#f59e0b" name="Rental Revenue" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/**
 * Revenue Trend Line Chart
 */
export function RevenueTrendChart({ data, title }: ChartProps) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="name" stroke="#6b7280" />
          <YAxis stroke="#6b7280" />
          <Tooltip
            contentStyle={{
              backgroundColor: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '12px',
            }}
            formatter={(value) => `₦${Number(value).toLocaleString()}`}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="total"
            stroke="#06b6d4"
            strokeWidth={3}
            dot={{ fill: '#06b6d4', r: 5 }}
            activeDot={{ r: 7 }}
            name="Total Revenue"
          />
          <Line
            type="monotone"
            dataKey="sales"
            stroke="#10b981"
            strokeWidth={2}
            dot={false}
            name="Sales"
          />
          <Line
            type="monotone"
            dataKey="rentals"
            stroke="#f59e0b"
            strokeWidth={2}
            dot={false}
            name="Rentals"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

/**
 * Sales vs Rentals Distribution Pie Chart
 */
interface RevenueDistribution {
  sales: number;
  rentals: number;
}

export function RevenueDistributionChart({ data }: { data: RevenueDistribution; title: string }) {
  const pieData = [
    { name: 'Sales', value: data.sales },
    { name: 'Rentals', value: data.rentals },
  ];

  const COLORS = ['#10b981', '#f59e0b'];

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Distribution</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={pieData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={(entry) => `${entry.name}: ₦${Number(entry.value).toLocaleString()}`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {pieData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => `₦${Number(value).toLocaleString()}`} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

/**
 * Area Chart for Cumulative Revenue
 */
export function CumulativeRevenueChart({ data, title }: ChartProps) {
  const cumulativeData = useMemo(() => {
    let runningTotal = 0;
    return data.map((item) => {
      runningTotal += item.total;
      return { ...item, cumulative: runningTotal };
    });
  }, [data]);

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={cumulativeData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="name" stroke="#6b7280" />
          <YAxis stroke="#6b7280" />
          <Tooltip
            contentStyle={{
              backgroundColor: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '12px',
            }}
            formatter={(value) => `₦${Number(value).toLocaleString()}`}
          />
          <Area
            type="monotone"
            dataKey="cumulative"
            fill="#06b6d4"
            stroke="#0891b2"
            strokeWidth={2}
            name="Cumulative Revenue"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/**
 * Orders Count Chart
 */
interface OrderData {
  name: string;
  sales: number;
  rentals: number;
}

export function OrdersCountChart({ data, title }: { data: OrderData[]; title: string }) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="name" stroke="#6b7280" />
          <YAxis stroke="#6b7280" />
          <Tooltip
            contentStyle={{
              backgroundColor: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '12px',
            }}
          />
          <Legend />
          <Bar dataKey="sales" fill="#3b82f6" name="Sales Orders" radius={[8, 8, 0, 0]} />
          <Bar dataKey="rentals" fill="#8b5cf6" name="Rental Orders" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
