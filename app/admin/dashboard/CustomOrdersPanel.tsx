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
  const [confirmModal, setConfirmModal] = useState<{ type: 'decline' | 'delete'; orderId: string } | null>(null);
  const [imageIndexes, setImageIndexes] = useState<Record<string, number>>({});
  const [imageModalOpen, setImageModalOpen] = useState<{ orderId: string; index: number } | null>(null);
  const [messageCountPerOrder, setMessageCountPerOrder] = useState<Record<string, { total: number; unread: number }>>({});

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
        <div className="bg-lime-50 rounded-xl border border-lime-300 p-5 hover:shadow-lg transition">
          <p className="text-xs font-bold text-lime-700 mb-2 uppercase tracking-wider">📊 Total</p>
          <p className="text-3xl font-black text-lime-600">{orders.length}</p>
        </div>
        <div className="bg-yellow-50 rounded-xl border border-yellow-300 p-5 hover:shadow-lg transition">
          <p className="text-xs font-bold text-yellow-700 mb-2 uppercase tracking-wider">⏳ Pending</p>
          <p className="text-3xl font-black text-yellow-600">{orders.filter((o) => o.status === "pending").length}</p>
        </div>
        <div className="bg-purple-50 rounded-xl border border-purple-300 p-5 hover:shadow-lg transition">
          <p className="text-xs font-bold text-purple-700 mb-2 uppercase tracking-wider">🔨 Progress</p>
          <p className="text-3xl font-black text-purple-600">{orders.filter((o) => o.status === "in-progress").length}</p>
        </div>
        <div className="bg-pink-50 rounded-xl border border-pink-300 p-5 hover:shadow-lg transition">
          <p className="text-xs font-bold text-pink-700 mb-2 uppercase tracking-wider">✓ Ready</p>
          <p className="text-3xl font-black text-pink-600">{orders.filter((o) => o.status === "ready").length}</p>
        </div>
        <div className="bg-emerald-50 rounded-xl border border-emerald-300 p-5 hover:shadow-lg transition">
          <p className="text-xs font-bold text-emerald-700 mb-2 uppercase tracking-wider">✓✓ Done</p>
          <p className="text-3xl font-black text-emerald-600">{orders.filter((o) => o.status === "completed").length}</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-lime-50 rounded-2xl border border-lime-200 p-5 shadow-sm">
        <div className="flex gap-2 flex-wrap">
          {["all", "pending", "approved", "in-progress", "ready", "completed", "rejected"].map((status) => (
            <button
              key={status}
              onClick={() => setSelectedStatus(status)}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                selectedStatus === status
                  ? "bg-lime-600 text-white shadow-lg"
                  : "bg-white text-gray-700 hover:bg-lime-100 border border-gray-200"
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
        <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-200 rounded-full mb-4">
            <FileText className="h-8 w-8 text-slate-500" />
          </div>
          <p className="text-gray-600 font-semibold text-lg">No custom orders found</p>
          <p className="text-gray-500 text-sm mt-1">Change your filter to see other orders</p>
        </div>
      )}

      {/* Orders List */}
      {!isLoading && filteredOrders.length > 0 && (
        <div className="space-y-3">
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

                  {/* Description */}
                  <div className="mt-6">
                    <h3 className="font-bold text-gray-900 mb-3 text-sm uppercase tracking-wide text-purple-700">Description</h3>
                    <p className="text-sm text-gray-700 bg-white rounded-xl p-4 border border-gray-200 shadow-xs leading-relaxed">{order.description}</p>
                  </div>
                  {/* Design Images - Modal View */}
                  {(order.designUrls && order.designUrls.length > 0) || order.designUrl ? (
                    <div className="mt-6">
                      <button
                        type="button"
                        onClick={() => setImageModalOpen({ orderId: order._id, index: 0 })}
                        className="w-full bg-gradient-to-r from-lime-600 to-green-600 hover:from-lime-700 hover:to-green-700 text-white font-bold py-3 px-4 rounded-lg transition transform hover:scale-105 flex items-center justify-center gap-2"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        View Design Images ({(order.designUrls?.length || 1)})
                      </button>
                    </div>
                  ) : null}

                  {/* Admin Action - Chat Button */}
                  <div className="mt-8 pt-6 border-t border-lime-200 space-y-3">
                    <button
                      onClick={() => setChatModalOpen(order._id)}
                      className="w-full bg-lime-600 hover:bg-lime-700 text-white font-semibold py-3 px-4 rounded-lg transition flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                    >
                      <MessageCircle className="h-5 w-5" />
                      Send Quote or Message
                    </button>

                    <div className="grid grid-cols-2 gap-2">
                      {order.status !== "rejected" && (
                        <button
                          onClick={() => setConfirmModal({ type: 'decline', orderId: order._id })}
                          className="bg-red-50 hover:bg-red-100 text-red-700 font-semibold py-2 px-3 rounded-lg transition flex items-center justify-center gap-2 border border-red-200"
                        >
                          <XCircle className="h-4 w-4" />
                          Decline
                        </button>
                      )}
                      <button
                        onClick={() => setConfirmModal({ type: 'delete', orderId: order._id })}
                        className={`bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-3 rounded-lg transition flex items-center justify-center gap-2 ${
                          order.status !== "rejected" ? "" : "col-span-2"
                        }`}
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
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
                Cancel
              </button>
              <button
                onClick={() => {
                  if (confirmModal.type === 'decline') {
                    declineOrder(confirmModal.orderId);
                  } else {
                    deleteOrder(confirmModal.orderId);
                  }
                }}
                className={`flex-1 px-4 py-2 text-white font-semibold rounded-lg transition ${
                  confirmModal.type === 'decline'
                    ? 'bg-yellow-600 hover:bg-yellow-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {confirmModal.type === 'decline' ? 'Decline' : 'Delete'}
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
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-0 md:p-4"
              onClick={() => setImageModalOpen(null)}
            >
              {/* Modal Content */}
              <div
                className="w-full h-full md:w-auto md:h-auto md:max-w-4xl md:max-h-[90vh] bg-black rounded-none md:rounded-xl flex flex-col relative"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Close Button */}
                <button
                  onClick={() => setImageModalOpen(null)}
                  className="absolute top-4 right-4 z-10 bg-white/80 hover:bg-white text-gray-900 rounded-full p-2 transition"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>

                {/* Main Image */}
                <div className="flex-1 flex items-center justify-center p-4 md:p-0 overflow-hidden">
                  <img
                    src={currentImage}
                    alt={`Design ${imageModalOpen.index + 1}`}
                    className="max-w-full max-h-full object-contain w-full h-full md:w-auto md:h-auto"
                  />
                </div>

                {/* Image Info and Navigation */}
                {images.length > 1 && (
                  <div className="bg-black/90 backdrop-blur px-4 py-3 md:px-6 md:py-4 flex items-center justify-between border-t border-gray-700">
                    <div className="text-white text-sm md:text-base">
                      {imageModalOpen.index + 1} / {images.length}
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => setImageModalOpen({
                          orderId: imageModalOpen.orderId,
                          index: imageModalOpen.index === 0 ? images.length - 1 : imageModalOpen.index - 1
                        })}
                        className="bg-lime-600 hover:bg-lime-700 text-white p-2 rounded-lg transition"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      <button
                        onClick={() => setImageModalOpen({
                          orderId: imageModalOpen.orderId,
                          index: imageModalOpen.index === images.length - 1 ? 0 : imageModalOpen.index + 1
                        })}
                        className="bg-lime-600 hover:bg-lime-700 text-white p-2 rounded-lg transition"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>

                    {/* Thumbnail Strip */}
                    <div className="hidden md:flex gap-2 overflow-x-auto max-w-xs">
                      {images.map((url, index) => (
                        <button
                          key={index}
                          onClick={() => setImageModalOpen({ orderId: imageModalOpen.orderId, index })}
                          className={`flex-shrink-0 rounded-lg overflow-hidden border-2 transition ${
                            imageModalOpen.index === index
                              ? "border-lime-600 ring-2 ring-lime-600"
                              : "border-gray-600 hover:border-gray-500"
                          }`}
                        >
                          <img
                            src={url}
                            alt={`Thumbnail ${index + 1}`}
                            className="h-12 w-12 object-cover"
                          />
                        </button>
                      ))}
                    </div>
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
