"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FileText, Clock, CheckCircle, AlertCircle, Eye, Download, Trash2, Edit, Phone, Mail, DollarSign, Calendar } from "lucide-react";

interface CustomOrder {
  _id: string;
  orderNumber: string;
  fullName: string;
  email: string;
  phone: string;
  address?: string;
  city: string;
  state?: string;
  costumeType: string;
  description: string;
  designUrl?: string;
  designUrls?: string[];
  budget?: number;
  deliveryDate?: string;
  status: "pending" | "approved" | "in-progress" | "ready" | "completed" | "rejected";
  notes?: string;
  quotedPrice?: number;
  createdAt: string;
  updatedAt: string;
}

export default function AdminCustomOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<CustomOrder[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<CustomOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [editingOrder, setEditingOrder] = useState<string | null>(null);
  const [editQuote, setEditQuote] = useState<number | null>(null);
  const [editNotes, setEditNotes] = useState<string>("");

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    if (selectedStatus === "all") {
      setFilteredOrders(orders);
    } else {
      setFilteredOrders(orders.filter((o) => o.status === selectedStatus));
    }
  }, [orders, selectedStatus]);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/custom-orders");
      if (!response.ok) throw new Error("Failed to fetch custom orders");
      const data = await response.json();
      setOrders(data.orders || []);
    } catch (error) {
      console.error("Error fetching custom orders:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "approved":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "in-progress":
        return "bg-purple-100 text-purple-800 border-purple-300";
      case "ready":
        return "bg-green-100 text-green-800 border-green-300";
      case "completed":
        return "bg-gray-100 text-gray-800 border-gray-300";
      case "rejected":
        return "bg-red-100 text-red-800 border-red-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4" />;
      case "approved":
      case "in-progress":
        return <AlertCircle className="h-4 w-4" />;
      case "ready":
      case "completed":
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <main className="p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Custom Costume Orders</h1>
              <p className="text-gray-600 mt-1">Manage on-demand custom costume requests</p>
            </div>
            <Link
              href="/admin/dashboard"
              className="text-lime-600 hover:text-lime-700 font-medium flex items-center gap-2"
            >
              ← Back to Dashboard
            </Link>
          </div>

          {/* Stats Cards */}
          <div className="grid md:grid-cols-5 gap-4 mb-8">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-sm text-gray-600 mb-1">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900">{orders.length}</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-sm text-gray-600 mb-1">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{orders.filter((o) => o.status === "pending").length}</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-sm text-gray-600 mb-1">In Progress</p>
              <p className="text-2xl font-bold text-purple-600">{orders.filter((o) => o.status === "in-progress").length}</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-sm text-gray-600 mb-1">Ready</p>
              <p className="text-2xl font-bold text-green-600">{orders.filter((o) => o.status === "ready").length}</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-sm text-gray-600 mb-1">Completed</p>
              <p className="text-2xl font-bold text-gray-600">{orders.filter((o) => o.status === "completed").length}</p>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 mb-8">
            <div className="flex gap-2 flex-wrap">
              {["all", "pending", "approved", "in-progress", "ready", "completed", "rejected"].map((status) => (
                <button
                  key={status}
                  onClick={() => setSelectedStatus(status)}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    selectedStatus === status
                      ? "bg-lime-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1).replace("-", " ")}
                </button>
              ))}
            </div>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
              <p className="text-gray-600">Loading custom orders...</p>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && filteredOrders.length === 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No custom orders found for this status</p>
            </div>
          )}

          {/* Orders List */}
          {!isLoading && filteredOrders.length > 0 && (
            <div className="space-y-4">
              {filteredOrders.map((order) => (
                <div key={order._id} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  {/* Order Header */}
                  <div className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50" onClick={() => setExpandedOrder(expandedOrder === order._id ? null : order._id)}>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-bold text-gray-900">{order.orderNumber}</span>
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(order.status)}`}>
                          {getStatusIcon(order.status)}
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">
                        <p className="font-medium text-gray-900">{order.fullName}</p>
                        <p>{order.costumeType} • {order.city}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">{new Date(order.createdAt).toLocaleDateString()}</p>
                      {order.quotedPrice && <p className="font-semibold text-gray-900">₦{order.quotedPrice.toLocaleString()}</p>}
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {expandedOrder === order._id && (
                    <div className="border-t border-gray-200 p-4 bg-gray-50">
                      <div className="grid md:grid-cols-2 gap-6">
                        {/* Customer Info */}
                        <div>
                          <h3 className="font-semibold text-gray-900 mb-3">Customer Information</h3>
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2 text-gray-600">
                              <Mail className="h-4 w-4" /> {order.email}
                            </div>
                            <div className="flex items-center gap-2 text-gray-600">
                              <Phone className="h-4 w-4" /> {order.phone}
                            </div>
                            {order.address && <p className="text-gray-600">{order.address}</p>}
                            <p className="text-gray-600">
                              {order.city}
                              {order.state && `, ${order.state}`}
                            </p>
                          </div>
                        </div>

                        {/* Order Details */}
                        <div>
                          <h3 className="font-semibold text-gray-900 mb-3">Order Details</h3>
                          <div className="space-y-2 text-sm">
                            <div>
                              <p className="text-gray-600">Costume Type: <span className="font-medium text-gray-900">{order.costumeType}</span></p>
                            </div>
                            {order.budget && (
                              <div className="flex items-center gap-2">
                                <DollarSign className="h-4 w-4 text-gray-600" />
                                <span className="text-gray-600">Budget: <span className="font-medium text-gray-900">₦{order.budget.toLocaleString()}</span></span>
                              </div>
                            )}
                            {order.deliveryDate && (
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-gray-600" />
                                <span className="text-gray-600">Needed by: <span className="font-medium text-gray-900">{new Date(order.deliveryDate).toLocaleDateString()}</span></span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Description */}
                      <div className="mt-6">
                        <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
                        <p className="text-sm text-gray-700 bg-white rounded p-3 border border-gray-300">{order.description}</p>
                      </div>

                      {/* Design Images - Show all uploaded pictures */}
                      {(order.designUrls && order.designUrls.length > 0) || order.designUrl ? (
                        <div className="mt-6">
                          <h3 className="font-semibold text-gray-900 mb-2">Design References ({(order.designUrls?.length || 0) || (order.designUrl ? 1 : 0)})</h3>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {order.designUrls && order.designUrls.length > 0 ? (
                              order.designUrls.map((url, index) => (
                                <img key={index} src={url} alt={`Design ${index + 1}`} className="h-40 rounded-lg object-cover border border-gray-300 hover:border-gray-400 transition" />
                              ))
                            ) : order.designUrl ? (
                              <img src={order.designUrl} alt="Design" className="h-40 rounded-lg object-cover border border-gray-300 hover:border-gray-400 transition" />
                            ) : null}
                          </div>
                        </div>
                      ) : null}

                      {/* Admin Actions */}
                      <div className="mt-6 pt-6 border-t border-gray-200 space-y-4">
                        {editingOrder === order._id ? (
                          <div className="space-y-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-900 mb-1">Quoted Price (NGN)</label>
                              <input
                                type="number"
                                value={editQuote || ""}
                                onChange={(e) => setEditQuote(e.target.value ? parseFloat(e.target.value) : null)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-600"
                                placeholder="Enter price"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-900 mb-1">Admin Notes</label>
                              <textarea
                                value={editNotes}
                                onChange={(e) => setEditNotes(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-600"
                                rows={3}
                                placeholder="Internal notes"
                              />
                            </div>
                            <button
                              onClick={() => setEditingOrder(null)}
                              className="w-full bg-lime-600 hover:bg-lime-700 text-white font-medium py-2 rounded-lg transition"
                            >
                              Save Changes
                            </button>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setEditingOrder(order._id);
                                setEditQuote(order.quotedPrice || null);
                                setEditNotes(order.notes || "");
                              }}
                              className="flex-1 flex items-center justify-center gap-2 bg-blue-100 hover:bg-blue-200 text-blue-700 font-medium py-2 rounded-lg transition"
                            >
                              <Edit className="h-4 w-4" /> Edit
                            </button>
                            <button
                              onClick={() => window.open(order.designUrl, "_blank")}
                              disabled={!order.designUrl}
                              className="flex-1 flex items-center justify-center gap-2 bg-green-100 hover:bg-green-200 text-green-700 font-medium py-2 rounded-lg transition disabled:opacity-50"
                            >
                              <Download className="h-4 w-4" /> Design
                            </button>
                            <button
                              className="flex-1 flex items-center justify-center gap-2 bg-red-100 hover:bg-red-200 text-red-700 font-medium py-2 rounded-lg transition"
                            >
                              <Trash2 className="h-4 w-4" /> Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
