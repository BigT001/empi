"use client";

import { useEffect, useState } from "react";
import { AlertCircle, RefreshCw, Trash2, Download } from "lucide-react";

interface ErrorLog {
  id: string;
  type: string;
  message: string;
  stack?: string;
  context?: any;
  userAgent?: string;
  url?: string;
  timestamp: string;
  level?: string;
}

export default function ErrorLogsPage() {
  const [logs, setLogs] = useState<ErrorLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<string>("");
  const [autoRefresh, setAutoRefresh] = useState(false);

  // Fetch logs from API
  const fetchLogs = async () => {
    setLoading(true);
    try {
      const url = filter ? `/api/errors?type=${filter}&limit=100` : `/api/errors?limit=100`;
      const response = await fetch(url);
      const data = await response.json();
      setLogs(data.errors || []);
      console.log(`📊 Fetched ${data.returned || 0} logs`);
    } catch (err) {
      console.error("Failed to fetch logs:", err);
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh every 5 seconds if enabled
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(fetchLogs, 5000);
    return () => clearInterval(interval);
  }, [autoRefresh, filter]);

  // Initial fetch
  useEffect(() => {
    fetchLogs();
  }, [filter]);

  // Export logs as JSON
  const exportLogs = () => {
    const dataStr = JSON.stringify(logs, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `error-logs-${new Date().toISOString()}.json`;
    link.click();
  };

  // Get error counts by type
  const errorsByType = logs.reduce(
    (acc, log) => {
      acc[log.type] = (acc[log.type] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const errorCount = logs.filter((l) => l.level === "error").length;
  const warningCount = logs.filter((l) => l.level === "warning").length;
  const infoCount = logs.filter((l) => l.level === "info").length;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Error Logs</h1>
          <p className="text-gray-600">Track and monitor application errors and events</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="text-sm text-gray-600">Total Events</div>
            <div className="text-3xl font-bold text-gray-900">{logs.length}</div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-red-200">
            <div className="text-sm text-red-600">🔴 Errors</div>
            <div className="text-3xl font-bold text-red-600">{errorCount}</div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-yellow-200">
            <div className="text-sm text-yellow-600">⚠️ Warnings</div>
            <div className="text-3xl font-bold text-yellow-600">{warningCount}</div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-green-200">
            <div className="text-sm text-green-600">✅ Info</div>
            <div className="text-3xl font-bold text-green-600">{infoCount}</div>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Filter by Type
              </label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Types</option>
                {Object.entries(errorsByType)
                  .sort((a, b) => b[1] - a[1])
                  .map(([type, count]) => (
                    <option key={type} value={type}>
                      {type} ({count})
                    </option>
                  ))}
              </select>
            </div>

            <div className="flex items-end gap-2">
              <button
                onClick={fetchLogs}
                disabled={loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg flex items-center justify-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </button>
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`px-4 py-2 rounded-lg font-medium ${
                  autoRefresh
                    ? "bg-green-600 hover:bg-green-700 text-white"
                    : "bg-gray-200 hover:bg-gray-300 text-gray-900"
                }`}
              >
                {autoRefresh ? "Auto On" : "Auto Off"}
              </button>
            </div>

            <div className="flex items-end gap-2">
              <button
                onClick={exportLogs}
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 rounded-lg flex items-center justify-center gap-2"
              >
                <Download className="h-4 w-4" />
                Export
              </button>
            </div>
          </div>
        </div>

        {/* Logs Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {logs.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No logs found. Upload a product on mobile to see errors here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700">
                      Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700">
                      Level
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700">
                      Message
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700">
                      Device
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log, idx) => {
                    const device = log.userAgent?.includes("Mobile")
                      ? "📱 Mobile"
                      : log.userAgent?.includes("Android")
                        ? "🤖 Android"
                        : "💻 Desktop";
                    const levelColor =
                      log.level === "error"
                        ? "text-red-600"
                        : log.level === "warning"
                          ? "text-yellow-600"
                          : "text-green-600";
                    return (
                      <tr
                        key={idx}
                        className="border-b border-gray-200 hover:bg-gray-50"
                      >
                        <td className="px-6 py-3 text-xs text-gray-600 whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleString()}
                        </td>
                        <td className="px-6 py-3 text-xs font-medium text-gray-900">
                          {log.type}
                        </td>
                        <td className={`px-6 py-3 text-xs font-medium ${levelColor}`}>
                          {log.level}
                        </td>
                        <td className="px-6 py-3 text-xs text-gray-700 max-w-md truncate">
                          {log.message}
                          {log.stack && (
                            <div className="text-red-600 text-xs mt-1 font-mono">
                              {log.stack.split("\n")[0]}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-3 text-xs text-gray-600">
                          {device}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 text-sm text-gray-600">
          <p>
            💡 Tip: Keep this page open with "Auto On" enabled to see errors in real-time
            as mobile users upload products.
          </p>
          <p className="mt-2">
            📊 Last updated: {new Date().toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}
