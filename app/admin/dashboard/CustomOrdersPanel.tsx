"use client";

import { useState, useEffect } from "react";
import { FileText, Clock, CheckCircle, AlertCircle, Phone, Mail, DollarSign, Calendar, MessageCircle, MapPin, ChevronDown, Trash2, XCircle } from "lucide-react";
import { ChatModal } from "@/app/components/ChatModal";
import { useAdmin } from "@/app/context/AdminContext";

interface CustomOrder {
  _id: string;
  orderNumber: string;
  fullName: string;
  email: string;
  phone: string;
  address?: string;
  city: string;
  state?: string;
  description: string;
  designUrl?: string;
  designUrls?: string[];
  quantity?: number;
  deliveryDate?: string;
  productionStartedAt?: string;
  status: "pending" | "approved" | "in-progress" | "ready" | "completed" | "rejected";
  notes?: string;
  quotedPrice?: number;
  createdAt: string;
  updatedAt: string;
}

export function CustomOrdersPanel() {
  const { admin } = useAdmin();
  const [orders, setOrders] = useState<CustomOrder[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<CustomOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [chatModalOpen, setChatModalOpen] = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState<{ type: 'decline' | 'delete' | 'cancel'; orderId: string } | null>(null);
  const [imageIndexes, setImageIndexes] = useState<Record<string, number>>({});
  const [imageModalOpen, setImageModalOpen] = useState<{ orderId: string; index: number } | null>(null);
  const [messageCountPerOrder, setMessageCountPerOrder] = useState<Record<string, { total: number; unread: number }>>({});
  const [clientStatusModal, setClientStatusModal] = useState<{ email: string; status: string } | null>(null);

  useEffect(() => {
    // Initial fetch
    fetchOrders();
    
    // Handle page visibility - stop polling when tab is inactive
    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log('[CustomOrdersPanel] Tab hidden - pausing polling');
      } else {
        console.log('[CustomOrdersPanel] Tab visible - resuming polling');
        fetchOrders();
      }
    };

    // Add visibility change listener
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Set up polling to refresh orders every 5 seconds for real-time updates
    // Only poll when tab is visible
    const pollingInterval = setInterval(() => {
      if (!document.hidden) {
        console.log('[CustomOrdersPanel] Polling for message updates...');
        pollMessageCounts();
      }
    }, 5000);

    return () => {
      clearInterval(pollingInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    if (selectedStatus === "all") {
      setFilteredOrders(orders);
    } else if (selectedStatus === "rejected") {
      // Show rejected orders in the rejected tab
      setFilteredOrders(orders.filter((o) => o.status === "rejected"));
    } else {
      setFilteredOrders(orders.filter((o) => o.status === selectedStatus));
    }
  }, [orders, selectedStatus]);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      console.log("[CustomOrdersPanel] 📋 Fetching orders...");
      const response = await fetch("/api/custom-orders");
      console.log("[CustomOrdersPanel] Response status:", response.status);
      const data = await response.json();
      console.log("[CustomOrdersPanel] Response data:", data);
      
      if (!response.ok) throw new Error(data.message || "Failed to fetch custom orders");
      setOrders(data.orders || []);
      
      // Fetch message counts for all orders
      if (data.orders && Array.isArray(data.orders)) {
        fetchMessageCounts(data.orders);
      }
    } catch (error) {
      console.error("Error fetching custom orders:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to fetch message counts for all orders
  const fetchMessageCounts = async (ordersToCheck: CustomOrder[]) => {
    console.log('[CustomOrdersPanel] Fetching message counts for', ordersToCheck.length, 'orders');
    const messageCounts: Record<string, { total: number; unread: number }> = {};
    for (const order of ordersToCheck) {
      try {
        const messagesResponse = await fetch(`/api/messages?orderId=${order._id}`);
        const messagesData = await messagesResponse.json();
        if (messagesData.messages && Array.isArray(messagesData.messages)) {
          const customerMessages = messagesData.messages.filter((msg: any) => msg.senderType === 'customer');
          const unreadCustomerMessages = customerMessages.filter((msg: any) => !msg.isRead);
          messageCounts[order._id] = {
            total: customerMessages.length,
            unread: unreadCustomerMessages.length
          };
          console.log(`[CustomOrdersPanel] Order ${order._id}: ${unreadCustomerMessages.length} unread customer messages`);
        }
      } catch (error) {
        console.error(`Error fetching messages for order ${order._id}:`, error);
        messageCounts[order._id] = { total: 0, unread: 0 };
      }
    }
    setMessageCountPerOrder(messageCounts);
  };

  // Poll ONLY message counts (without re-fetching orders)
  const pollMessageCounts = async () => {
    if (orders.length === 0) return;
    console.log('[CustomOrdersPanel] Polling message counts only...');
    fetchMessageCounts(orders);
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
        return "bg-red-100 text-red-800 border-gray-300";
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

  const declineOrder = async (orderId: string) => {
    try {
      console.log(`[CustomOrdersPanel] 📤 Declining order: ${orderId}`);
      const response = await fetch(`/api/custom-orders?id=${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "rejected" }),
      });

      console.log(`[CustomOrdersPanel] Response status: ${response.status}`);
      const responseText = await response.text();
      console.log(`[CustomOrdersPanel] Response text (first 500 chars):`, responseText.substring(0, 500));
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error("[CustomOrdersPanel] Failed to parse response as JSON:", parseError);
        console.error("[CustomOrdersPanel] Response was:", responseText);
        throw new Error("Server error - check console for details");
      }

      if (!response.ok) {
        throw new Error(data.message || "Failed to decline order");
      }

      // Find the order to get the orderId for messaging
      const order = orders.find(o => o._id === orderId);
      if (order) {
        // Send a system message to the chat
        await fetch("/api/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId: order._id,
            orderNumber: order.orderNumber,
            senderEmail: admin?.email || "admin@empi.com",
            senderName: "System",
            senderType: "admin",
            content: "❌ This order has been declined by the admin. Contact us if you have questions.",
            messageType: "system",
          }),
        });
      }
      
      setOrders(orders.map(o => 
        o._id === orderId ? { ...o, status: "rejected" } : o
      ));
      setConfirmModal(null);
      alert("✅ Order declined successfully!");
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      console.error("[CustomOrdersPanel] ❌ Error declining order:", errorMsg);
      alert(`❌ Failed to decline order: ${errorMsg}`);
      setConfirmModal(null);
    }
  };

  const cancelOrder = async (orderId: string) => {
    try {
      console.log(`[CustomOrdersPanel] 📤 Cancelling order: ${orderId}`);
      const response = await fetch(`/api/custom-orders?id=${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "rejected" }),
      });

      console.log(`[CustomOrdersPanel] Response status: ${response.status}`);
      const responseText = await response.text();
      console.log(`[CustomOrdersPanel] Response text (first 500 chars):`, responseText.substring(0, 500));
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error("[CustomOrdersPanel] Failed to parse response as JSON:", parseError);
        console.error("[CustomOrdersPanel] Response was:", responseText);
        throw new Error("Server error - check console for details");
      }

      if (!response.ok) {
        throw new Error(data.message || "Failed to cancel order");
      }

      // Find the order to get the orderId for messaging
      const order = orders.find(o => o._id === orderId);
      if (order) {
        // Send a system message to the chat
        await fetch("/api/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId: order._id,
            orderNumber: order.orderNumber,
            senderEmail: admin?.email || "admin@empi.com",
            senderName: "System",
            senderType: "admin",
            content: "🛑 Your order has been cancelled by the admin and you will receive a full refund. Contact us if you have questions.",
            messageType: "system",
          }),
        });
      }
      
      setOrders(orders.map(o => 
        o._id === orderId ? { ...o, status: "rejected" } : o
      ));
      setConfirmModal(null);
      alert("✅ Order cancelled and refund initiated!");
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      console.error("[CustomOrdersPanel] ❌ Error cancelling order:", errorMsg);
      alert(`❌ Failed to cancel order: ${errorMsg}`);
      setConfirmModal(null);
    }
  };

  const deleteOrder = async (orderId: string) => {
    try {
      console.log(`[CustomOrdersPanel] 🗑️ Deleting order: ${orderId}`);
      const response = await fetch(`/api/custom-orders?id=${orderId}`, {
        method: "DELETE",
      });

      console.log(`[CustomOrdersPanel] Response status: ${response.status}`);
      const responseText = await response.text();
      console.log(`[CustomOrdersPanel] Response text (first 500 chars):`, responseText.substring(0, 500));
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error("[CustomOrdersPanel] Failed to parse response as JSON:", parseError);
        console.error("[CustomOrdersPanel] Response was:", responseText);
        throw new Error("Server error - check console for details");
      }

      if (!response.ok) {
        throw new Error(data.message || "Failed to delete order");
      }
      
      setOrders(orders.filter(o => o._id !== orderId));
      setConfirmModal(null);
      alert("✅ Order deleted successfully!");
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      console.error("[CustomOrdersPanel] ❌ Error deleting order:", errorMsg);
      alert(`❌ Failed to delete order: ${errorMsg}`);
      setConfirmModal(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-lime-600 rounded-3xl shadow-2xl p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white opacity-10 rounded-full -mr-48 -mt-48"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-white opacity-10 rounded-full -ml-48 -mb-48"></div>
        <div className="relative z-10">
          <h2 className="text-4xl font-black text-white mb-2">🎨 Custom Orders</h2>
          <p className="text-white/90 text-lg">Manage custom costume requests and send professional quotes</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-5 gap-3">
      </div>

      {/* Filter Bar - Clients View */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <div className="flex gap-2 flex-wrap items-center">
          <button
            onClick={() => setSelectedStatus("all")}
            className={`px-4 py-2.5 rounded-xl font-semibold transition-all border-2 flex items-center gap-2 ${
              selectedStatus === "all"
                ? "bg-slate-100 text-slate-700 border-slate-300 border-current shadow-md scale-105"
                : "bg-slate-100 text-slate-700 border-slate-300 border-transparent hover:shadow-md"
            }`}
          >
            <span>Clients</span>
            <span className="bg-slate-200 text-slate-700 px-2.5 py-1 rounded-full text-xs font-bold">
              {new Set(orders.map(o => o.email)).size}
            </span>
          </button>

          {[
            { id: "pending", label: "Pending", color: "bg-yellow-50 text-yellow-700 border-yellow-300", badgeColor: "bg-yellow-100" },
            { id: "approved", label: "Approved", color: "bg-blue-50 text-blue-700 border-blue-300", badgeColor: "bg-blue-100" },
            { id: "in-progress", label: "In Progress", color: "bg-purple-50 text-purple-700 border-purple-300", badgeColor: "bg-purple-100" },
            { id: "ready", label: "Ready", color: "bg-green-50 text-green-700 border-green-300", badgeColor: "bg-green-100" },
            { id: "completed", label: "Completed", color: "bg-emerald-50 text-emerald-700 border-emerald-300", badgeColor: "bg-emerald-100" },
            { id: "rejected", label: "Rejected", color: "bg-red-50 text-red-700 border-red-300", badgeColor: "bg-red-100" }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedStatus(tab.id)}
              className={`px-4 py-2.5 rounded-xl font-semibold transition-all border-2 flex items-center gap-2 ${
                selectedStatus === tab.id
                  ? `${tab.color} border-current shadow-md scale-105`
                  : `${tab.color} border-transparent hover:shadow-md`
              }`}
            >
              <span>{tab.label}</span>
              <span className={`${tab.badgeColor} px-2.5 py-1 rounded-full text-xs font-bold`}>
                {orders.filter(o => o.status === tab.id).length}
              </span>
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
        <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-200 rounded-full mb-4">
            <FileText className="h-8 w-8 text-slate-500" />
          </div>
          <p className="text-gray-600 font-semibold text-lg">No custom orders found</p>
          <p className="text-gray-500 text-sm mt-1">Add orders to get started</p>
        </div>
      )}

      {/* Clients Grid View - Only when "Clients" tab is selected */}
      {!isLoading && selectedStatus === "all" && filteredOrders.length > 0 && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from(new Map(
            filteredOrders.map(order => [order.email, order])
          ).entries()).map(([email, firstOrder]) => {
            const clientOrders = filteredOrders.filter(o => o.email === email);
            const totalCost = clientOrders.reduce((sum, o) => sum + (o.quotedPrice || 0), 0);
            const pendingOrders = clientOrders.filter(o => o.status === 'pending').length;

            return (
              <div key={email} className="bg-gradient-to-br from-white to-slate-50 rounded-2xl border-2 border-slate-200 overflow-hidden shadow-md hover:shadow-xl hover:border-slate-300 transition-all">
                {/* Client Header */}
                <div className="bg-gradient-to-r from-indigo-600 to-blue-600 p-5 text-white">
                  <h3 className="font-bold text-lg">{firstOrder.fullName}</h3>
                  <p className="text-sm text-indigo-100 mt-1">{firstOrder.city || 'Location not set'}</p>
                </div>

                {/* Client Details */}
                <div className="p-5 space-y-4">
                  {/* Contact Info */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-indigo-600" />
                      <p className="text-gray-700 truncate">{email}</p>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-indigo-600" />
                      <p className="text-gray-700">{firstOrder.phone || 'N/A'}</p>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-200">
                    <div className="bg-indigo-50 rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-indigo-700">{clientOrders.length}</p>
                      <p className="text-xs text-indigo-600 font-medium">Orders</p>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-3 text-center">
                      <p className="text-lg font-bold text-blue-700">₦{(totalCost / 1000000).toFixed(1)}M</p>
                      <p className="text-xs text-blue-600 font-medium">Total</p>
                    </div>
                  </div>

                  {/* Status Breakdown */}
                  <div className="pt-3 border-t border-slate-200">
                    <p className="text-xs font-semibold text-gray-600 mb-3 uppercase tracking-wider">Order Status Breakdown</p>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { status: 'pending', label: 'Pending', color: 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100' },
                        { status: 'approved', label: 'Approved', color: 'bg-blue-50 text-blue-700 hover:bg-blue-100' },
                        { status: 'in-progress', label: 'In Progress', color: 'bg-purple-50 text-purple-700 hover:bg-purple-100' },
                        { status: 'ready', label: 'Ready', color: 'bg-green-50 text-green-700 hover:bg-green-100' },
                        { status: 'completed', label: 'Completed', color: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' },
                        { status: 'rejected', label: 'Rejected', color: 'bg-red-50 text-red-700 hover:bg-red-100' }
                      ].map((stat) => {
                        const count = clientOrders.filter(o => o.status === stat.status).length;
                        return (
                          <button
                            key={stat.status}
                            onClick={() => {
                              if (count > 0) {
                                setClientStatusModal({ email, status: stat.status });
                              }
                            }}
                            disabled={count === 0}
                            className={`${stat.color} rounded-lg p-2 text-center text-xs font-semibold transition-all ${count > 0 ? 'cursor-pointer' : 'opacity-50 cursor-not-allowed'}`}
                          >
                            <p className="font-bold text-lg">{count}</p>
                            <p className="text-xs">{stat.label}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Orders List View - When a status tab is selected */}
      {!isLoading && selectedStatus !== "all" && filteredOrders.length > 0 && (
        <div className="space-y-6">
          {filteredOrders.map((order) => (
            <div key={order._id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              {/* Order Header */}
              <div className="p-5 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition" onClick={() => setExpandedOrder(expandedOrder === order._id ? null : order._id)}>
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
                    <p>{order.city}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">{new Date(order.createdAt).toLocaleDateString()}</p>
                  {order.quotedPrice && <p className="font-semibold text-gray-900">₦{order.quotedPrice.toLocaleString()}</p>}
                </div>
              </div>

              {/* Expanded Details */}
              {expandedOrder === order._id && (
                <div className="border-t border-gray-200 p-6 bg-gradient-to-br from-slate-50 to-slate-100">
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Customer Info */}
                    <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-xs">
                      <h3 className="font-bold text-gray-900 mb-4 text-sm uppercase tracking-wide text-purple-700">Customer Information</h3>
                      <div className="space-y-3 text-sm">
                        <div className="flex items-start gap-3">
                          <Mail className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wide">Email</p>
                            <p className="text-gray-900 font-medium">{order.email}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <Phone className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wide">Phone</p>
                            <p className="text-gray-900 font-medium">{order.phone}</p>
                          </div>
                        </div>
                        {order.address && (
                          <div className="flex items-start gap-3">
                            <MapPin className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-xs text-gray-500 uppercase tracking-wide">Address</p>
                              <p className="text-gray-900 font-medium">{order.address}</p>
                            </div>
                          </div>
                        )}
                        <div className="flex items-start gap-3">
                          <MapPin className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wide">Location</p>
                            <p className="text-gray-900 font-medium">
                              {order.city}
                              {order.state && `, ${order.state}`}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Order Details */}
                    <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-xs">
                      <h3 className="font-bold text-gray-900 mb-4 text-sm uppercase tracking-wide text-purple-700">Order Details</h3>
                      <div className="space-y-3 text-sm">
                        {order.quantity && (
                          <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Quantity</p>
                            <p className="text-gray-900 font-medium flex items-center gap-2">
                              {order.quantity} unit{order.quantity !== 1 ? 's' : ''}
                              {order.quantity >= 10 && <span className="text-xs bg-lime-100 text-lime-700 px-2 py-1 rounded">10% Discount</span>}
                              {order.quantity >= 6 && order.quantity < 10 && <span className="text-xs bg-lime-100 text-lime-700 px-2 py-1 rounded">7% Discount</span>}
                              {order.quantity >= 3 && order.quantity < 6 && <span className="text-xs bg-lime-100 text-lime-700 px-2 py-1 rounded">5% Discount</span>}
                            </p>
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
                    {/* Production Progress - Shows when production has started */}
                    {order.status === "in-progress" && order.productionStartedAt && order.deliveryDate && (() => {
                      const startDate = new Date(order.productionStartedAt);
                      const deliveryDate = new Date(order.deliveryDate);
                      const now = new Date();
                      const totalTime = deliveryDate.getTime() - startDate.getTime();
                      const elapsedTime = now.getTime() - startDate.getTime();
                      const progressPercent = Math.min(100, Math.max(0, (elapsedTime / totalTime) * 100));
                      const remainingTime = deliveryDate.getTime() - now.getTime();
                      const daysRemaining = Math.ceil(remainingTime / (1000 * 60 * 60 * 24));
                      const hoursRemaining = Math.ceil((remainingTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

                      return (
                        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-5 border border-purple-200 shadow-sm mt-4">
                          <h3 className="font-bold text-gray-900 mb-4 text-sm uppercase tracking-wide text-purple-700">⏱️ Production Progress</h3>
                          
                          {/* Progress Bar */}
                          <div className="mb-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-semibold text-gray-700">Completion</span>
                              <span className="text-sm font-bold text-purple-600">{Math.round(progressPercent)}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-300"
                                style={{ width: `${progressPercent}%` }}
                              ></div>
                            </div>
                          </div>

                          {/* Countdown Timer */}
                          <div className="grid grid-cols-2 gap-3">
                            <div className="bg-white rounded-lg p-3 border border-purple-100">
                              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Days Remaining</p>
                              <p className="text-2xl font-black text-purple-600">{daysRemaining > 0 ? daysRemaining : 0}</p>
                            </div>
                            <div className="bg-white rounded-lg p-3 border border-purple-100">
                              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Hours Remaining</p>
                              <p className="text-2xl font-black text-pink-600">{hoursRemaining > 0 ? hoursRemaining : 0}</p>
                            </div>
                          </div>

                          <p className="text-xs text-gray-600 mt-3">
                            📅 Delivery: <span className="font-semibold">{new Date(order.deliveryDate).toLocaleDateString()}</span>
                          </p>
                        </div>
                      );
                    })()}
                  {/* Description with Design Images Preview */}
                  <div className="mt-6">
                    <h3 className="font-bold text-gray-900 mb-3 text-sm uppercase tracking-wide text-purple-700">Description & Design Preview</h3>
                    <div className="flex gap-4 items-start">
                      <p className="text-base text-gray-700 bg-white rounded-xl p-5 border border-gray-200 shadow-xs leading-relaxed flex-1">{order.description}</p>
                      {(order.designUrls && order.designUrls.length > 0) || order.designUrl ? (
                        <div className="flex flex-col gap-2 w-48">
                          {/* Image Preview */}
                          <button
                            type="button"
                            onClick={() => setImageModalOpen({ orderId: order._id, index: 0 })}
                            className="relative w-48 h-48 rounded-xl overflow-hidden border-2 border-lime-200 shadow-md hover:shadow-lg transition transform hover:scale-105 group"
                            title={`View ${order.designUrls?.length || 1} design image(s)`}
                          >
                            <img
                              src={(order.designUrls && order.designUrls[0]) || order.designUrl}
                              alt="Design preview"
                              className="w-full h-full object-cover"
                            />
                            {/* Overlay with view icon */}
                            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/60 transition flex items-center justify-center">
                              <div className="text-white text-center">
                                <svg className="w-8 h-8 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                                <span className="text-xs font-semibold">View All</span>
                              </div>
                            </div>
                            {/* Image count badge */}
                            <div className="absolute top-2 right-2 bg-lime-600 text-white px-2 py-1 rounded-lg text-xs font-bold">
                              {order.designUrls?.length || 1}
                            </div>
                          </button>

                          {/* Download button */}
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                const images = (order.designUrls && order.designUrls.length > 0) 
                                  ? order.designUrls 
                                  : order.designUrl ? [order.designUrl] : [];
                                
                                if (images.length === 0) {
                                  alert('No images to download');
                                  return;
                                }

                                // Download each image with staggered timing to prevent browser issues
                                for (let i = 0; i < images.length; i++) {
                                  const url = images[i];
                                  setTimeout(async () => {
                                    try {
                                      const response = await fetch(url);
                                      const blob = await response.blob();
                                      const link = document.createElement('a');
                                      link.href = URL.createObjectURL(blob);
                                      // Better filename with image number
                                      const fileExtension = url.includes('.png') ? 'png' : url.includes('.gif') ? 'gif' : 'jpg';
                                      link.download = `${order.orderNumber}-design-${i + 1}-of-${images.length}.${fileExtension}`;
                                      document.body.appendChild(link);
                                      link.click();
                                      document.body.removeChild(link);
                                      URL.revokeObjectURL(link.href);
                                    } catch (error) {
                                      console.error(`Failed to download image ${i + 1}:`, error);
                                    }
                                  }, i * 500); // 500ms delay between each download
                                }
                              } catch (error) {
                                console.error('Download failed:', error);
                                alert('Failed to download images');
                              }
                            }}
                            className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold py-2 px-3 rounded-lg transition flex items-center justify-center gap-2 shadow-md hover:shadow-lg text-sm"
                            title={`Download all ${(order.designUrls?.length || 1)} design image(s)`}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            <span>Download All</span>
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </div>

                  {/* Admin Actions Section */}
                  <div className="mt-6 pt-4 border-t border-lime-200">
                    {/* During Production - Only Cancel Button */}
                    {order.status === "in-progress" && (
                      <button
                        onClick={() => setConfirmModal({ type: 'cancel', orderId: order._id })}
                        className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white font-bold py-1.5 px-2 rounded-lg transition flex items-center justify-center gap-1 shadow-sm hover:shadow-md text-xs"
                        title="Cancel production and process refund"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Cancel & Refund</span>
                      </button>
                    )}

                    {/* Top Row - Start Production & Send Quote (for pending/approved) */}
                    {order.status !== "in-progress" && (
                      <div className="flex gap-2 mb-2">
                        {order.status === "approved" && !order.productionStartedAt && (
                          <button
                            onClick={async () => {
                              try {
                                const response = await fetch(`/api/custom-orders/${order._id}`, {
                                  method: 'PATCH',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({
                                    status: 'in-progress',
                                    productionStartedAt: new Date().toISOString()
                                  })
                                });

                                if (response.ok) {
                                  alert('Production started! Countdown timer activated.');
                                  fetchOrders();
                                }
                              } catch (error) {
                                console.error('Error:', error);
                              }
                            }}
                            className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-1.5 px-2 rounded-lg transition flex items-center justify-center gap-1 shadow-sm hover:shadow-md text-xs"
                            title="Start production"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="hidden md:inline">Start</span>
                          </button>
                        )}
                        {order.status === "pending" && (
                          <button
                            onClick={() => setChatModalOpen(order._id)}
                            className="flex-1 bg-gradient-to-r from-lime-600 to-green-600 hover:from-lime-700 hover:to-green-700 text-white font-bold py-1.5 px-2 rounded-lg transition flex items-center justify-center gap-1 shadow-sm hover:shadow-md text-xs"
                          >
                            <MessageCircle className="w-4 h-4" />
                            <span>Quote</span>
                          </button>
                        )}
                        {/* Chat button for all statuses */}
                        <button
                          onClick={() => setChatModalOpen(order._id)}
                          className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold py-1.5 px-2 rounded-lg transition flex items-center justify-center gap-1 shadow-sm hover:shadow-md text-xs"
                          title="Open chat"
                        >
                          <MessageCircle className="w-4 h-4" />
                          <span>Chat</span>
                        </button>
                      </div>
                    )}

                    {/* Bottom Row - Decline & Delete (only for non-production statuses) */}
                    {order.status !== "in-progress" && (
                      <div className="flex gap-2">
                        {order.status !== "rejected" && (
                          <button
                            onClick={() => setConfirmModal({ type: 'decline', orderId: order._id })}
                            className="flex-1 bg-yellow-50 hover:bg-yellow-100 text-yellow-700 font-semibold py-1.5 px-2 rounded-lg transition flex items-center justify-center gap-1 border border-yellow-200 text-xs"
                            title="Decline"
                          >
                            <XCircle className="w-4 h-4" />
                            <span className="hidden md:inline">Decline</span>
                          </button>
                        )}
                        <button
                          onClick={() => setConfirmModal({ type: 'delete', orderId: order._id })}
                          className={`bg-red-600 hover:bg-red-700 text-white font-semibold py-1.5 px-2 rounded-lg transition flex items-center justify-center gap-1 text-xs ${
                            order.status !== "rejected" ? "flex-1" : "flex-1"
                          }`}
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span className="hidden md:inline">Delete</span>
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

      {/* Client Status Modal - Show orders for selected client and status */}
      {clientStatusModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900">
                {orders.find(o => o.email === clientStatusModal.email)?.fullName || 'Client'} - {clientStatusModal.status.charAt(0).toUpperCase() + clientStatusModal.status.slice(1)} Orders
              </h3>
              <button
                onClick={() => setClientStatusModal(null)}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {orders
                .filter(o => o.email === clientStatusModal.email && o.status === clientStatusModal.status)
                .map((order) => (
                  <div key={order._id} className="bg-slate-50 rounded-xl border border-slate-200 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <p className="font-bold text-lg text-gray-900">{order.orderNumber}</p>
                        <p className="text-sm text-gray-600 mt-1">{order.description}</p>
                        <p className="text-sm text-gray-500 mt-2">Qty: {order.quantity || 1} | Price: ₦{(order.quotedPrice || 0).toLocaleString()}</p>
                      </div>
                      <button
                        onClick={() => {
                          setChatModalOpen(order._id);
                          setClientStatusModal(null);
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center gap-2 flex-shrink-0"
                      >
                        <MessageCircle className="h-4 w-4" />
                        Chat
                      </button>
                    </div>
                  </div>
                ))}
            </div>

            <button
              onClick={() => setClientStatusModal(null)}
              className="w-full mt-6 bg-gray-200 hover:bg-gray-300 text-gray-900 font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Chat Modal */}
      {filteredOrders && chatModalOpen && (
        <ChatModal
          isOpen={!!chatModalOpen}
          onClose={() => {
            setChatModalOpen(null);
            // Refresh orders when modal closes
            fetchOrders();
          }}
          onMessageSent={() => {
            // Refresh orders when message is sent
            fetchOrders();
          }}
          order={filteredOrders.find(o => o._id === chatModalOpen)!}
          userEmail={admin?.email || ''}
          userName={admin?.fullName || 'Admin'}
          isAdmin={true}
          adminName="Empi Costumes"
        />
      )}

      {/* Confirmation Modal */}
      {confirmModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-300">
            {confirmModal.type === 'decline' ? (
              <>
                <div className="flex items-center justify-center w-12 h-12 bg-yellow-100 rounded-full mx-auto mb-4">
                  <AlertCircle className="h-6 w-6 text-yellow-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 text-center mb-2">Decline Order?</h3>
                <p className="text-gray-600 text-center mb-6">
                  This will decline the order and notify the customer via chat. This action can be undone by accepting the order later.
                </p>
              </>
            ) : confirmModal.type === 'cancel' ? (
              <>
                <div className="flex items-center justify-center w-12 h-12 bg-orange-100 rounded-full mx-auto mb-4">
                  <AlertCircle className="h-6 w-6 text-orange-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 text-center mb-2">Cancel Order & Refund?</h3>
                <p className="text-gray-600 text-center mb-6">
                  This will cancel the production, stop the countdown, and process a full refund to the customer. They will be notified via chat.
                </p>
              </>
            ) : (
              <>
                <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mx-auto mb-4">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 text-center mb-2">Delete Order?</h3>
                <p className="text-gray-600 text-center mb-6">
                  This will permanently delete the order and all associated messages. <span className="font-semibold text-red-600">This cannot be undone.</span>
                </p>
              </>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setConfirmModal(null)}
                className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold rounded-lg transition"
              >
                Back
              </button>
              <button
                onClick={() => {
                  if (confirmModal.type === 'decline') {
                    declineOrder(confirmModal.orderId);
                  } else if (confirmModal.type === 'cancel') {
                    cancelOrder(confirmModal.orderId);
                  } else {
                    deleteOrder(confirmModal.orderId);
                  }
                }}
                className={`flex-1 px-4 py-2 text-white font-semibold rounded-lg transition ${
                  confirmModal.type === 'decline'
                    ? 'bg-yellow-600 hover:bg-yellow-700'
                    : confirmModal.type === 'cancel'
                    ? 'bg-orange-600 hover:bg-orange-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {confirmModal.type === 'decline' ? 'Decline' : confirmModal.type === 'cancel' ? 'Cancel & Refund' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Modal */}
      {imageModalOpen && filteredOrders && (() => {
        const order = filteredOrders.find(o => o._id === imageModalOpen.orderId);
        if (!order) return null;
        
        const images = (order.designUrls && order.designUrls.length > 0) 
          ? order.designUrls 
          : order.designUrl ? [order.designUrl] : [];
        
        const currentImage = images[imageModalOpen.index];

        return (
          <>
            {/* Backdrop - Simple transparent overlay */}
            <div
              className="fixed inset-0 bg-black/40 z-50 flex flex-col items-center justify-center p-3 md:p-6"
              onClick={() => setImageModalOpen(null)}
            >
              {/* Modal Container - Prevents close on internal clicks */}
              <div
                className="relative w-full h-auto max-h-[90vh] flex flex-col items-center justify-between"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Close Button */}
                <button
                  onClick={() => setImageModalOpen(null)}
                  className="absolute top-0 right-0 z-20 bg-white hover:bg-gray-100 text-gray-900 rounded-full p-2 transition shadow-lg"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>

                {/* Image Container with Navigation Arrows */}
                <div className="relative w-full h-[60vh] md:h-[70vh] flex items-center justify-center group">
                  {/* Main Image */}
                  <img
                    src={currentImage}
                    alt={`Design ${imageModalOpen.index + 1}`}
                    className="w-full h-full object-contain max-w-full max-h-full"
                  />

                  {/* Left Arrow */}
                  {images.length > 1 && (
                    <button
                      onClick={() => setImageModalOpen({
                        orderId: imageModalOpen.orderId,
                        index: imageModalOpen.index === 0 ? images.length - 1 : imageModalOpen.index - 1
                      })}
                      className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-900 p-2 md:p-3 rounded-lg transition shadow-lg opacity-0 group-hover:opacity-100 transform hover:scale-110"
                      title="Previous image"
                    >
                      <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                  )}

                  {/* Right Arrow */}
                  {images.length > 1 && (
                    <button
                      onClick={() => setImageModalOpen({
                        orderId: imageModalOpen.orderId,
                        index: imageModalOpen.index === images.length - 1 ? 0 : imageModalOpen.index + 1
                      })}
                      className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-900 p-2 md:p-3 rounded-lg transition shadow-lg opacity-0 group-hover:opacity-100 transform hover:scale-110"
                      title="Next image"
                    >
                      <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  )}

                  {/* Image Counter */}
                  <div className="absolute top-3 left-3 bg-black/60 text-white px-3 py-1 rounded-lg text-sm font-semibold">
                    {imageModalOpen.index + 1} / {images.length}
                  </div>
                </div>

                {/* Thumbnail Strip - Bottom */}
                {images.length > 1 && (
                  <div className="w-full flex gap-2 justify-center overflow-x-auto pb-2 mt-4 px-2">
                    {images.map((url, index) => (
                      <button
                        key={index}
                        onClick={() => setImageModalOpen({ orderId: imageModalOpen.orderId, index })}
                        className={`flex-shrink-0 rounded-lg overflow-hidden border-3 transition transform hover:scale-110 ${
                          imageModalOpen.index === index
                            ? "border-lime-400 ring-2 ring-lime-400"
                            : "border-gray-300 hover:border-gray-400"
                        }`}
                      >
                        <img
                          src={url}
                          alt={`Thumbnail ${index + 1}`}
                          className="h-16 w-16 md:h-20 md:w-20 object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        );
      })()}
    </div>
  );
}
