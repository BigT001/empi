"use client";

import { useState, useEffect } from "react";
import { FileText, Clock, CheckCircle, AlertCircle, Phone, Mail, DollarSign, Calendar, MessageCircle, MapPin, ChevronDown, Trash2, XCircle, Search } from "lucide-react";
// ChatModal removed
import { useAdmin } from "@/app/context/AdminContext";
import { StatusTabs } from "./components/StatusTabs";
import { ApprovedOrderCard } from "./components/ApprovedOrderCard";
import { OtherStatusOrderCard } from "./components/OtherStatusOrderCard";
import { ImageModal } from "./components/ImageModal";
import { ConfirmationModal } from "./components/ConfirmationModal";

interface CustomOrder {
  _id: string;
  orderNumber: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phone?: string;
  address?: string;
  busStop?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  description?: string;
  costumeType?: string;
  designUrl?: string;
  designUrls?: string[];
  quantity?: number;
  quantityOfPieces?: number;
  deliveryDate?: string;
  productionStartedAt?: string;
  status: "pending" | "approved" | "in-progress" | "ready" | "completed" | "rejected" | "awaiting_payment" | "payment_confirmed" | "cancelled";
  notes?: string;
  quotedPrice?: number;
  price?: number;
  productId?: string;
  paymentVerified?: boolean;
  paymentReference?: string;
  items?: any[];
  isCustomOrder?: boolean;
  createdAt: string;
  updatedAt: string;
}

export type { CustomOrder };

// Helper function to get full name from either fullName or firstName + lastName
const getFullName = (order: CustomOrder): string => {
  if (order.fullName) return order.fullName;
  if (order.firstName && order.lastName) return `${order.firstName} ${order.lastName}`;
  if (order.firstName) return order.firstName;
  if (order.lastName) return order.lastName;
  return 'Unknown';
};

// Helper function to get description/items display
const getDescription = (order: CustomOrder): string => {
  if (order.description) return order.description;
  if (order.items && order.items.length > 0) {
    return order.items.map((item: any) => `${item.name} (x${item.quantity})`).join(', ');
  }
  return 'No description';
};

export function CustomOrdersPanel() {
  const { admin } = useAdmin();
  const [orders, setOrders] = useState<CustomOrder[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<CustomOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>("pending");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState<{ type: 'decline' | 'delete' | 'cancel' | 'approve'; orderId: string } | null>(null);
  const [imageIndexes, setImageIndexes] = useState<Record<string, number>>({});
  const [imageModalOpen, setImageModalOpen] = useState<{ orderId: string; index: number } | null>(null);
  const [messageCountPerOrder, setMessageCountPerOrder] = useState<Record<string, { total: number; unread: number }>>({});
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    // Initial fetch
    fetchOrders();
    
    // Handle page visibility - stop polling when tab is inactive
    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log('[CustomOrdersPanel] Tab hidden - pausing polling');
      } else {
        console.log('[CustomOrdersPanel] Tab visible - resuming polling');
        // Don't fetch on tab return, wait for next interval
      }
    };

    // Add visibility change listener
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Set up polling to refresh orders every 8 seconds for real-time updates
    // Only poll when tab is visible and use background fetch (no loading state)
    const pollingInterval = setInterval(() => {
      if (!document.hidden) {
        console.log('[CustomOrdersPanel] Polling for order updates...');
        fetchOrdersBackground();
      }
    }, 8000);

    return () => {
      clearInterval(pollingInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    let filtered: CustomOrder[];
    
    if (selectedStatus === "all") {
      filtered = orders;
    } else if (selectedStatus === "rejected") {
      filtered = orders.filter((o) => o.status === "rejected");
    } else {
      filtered = orders.filter((o) => o.status === selectedStatus);
    }

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter((o) =>
        o.orderNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.fullName?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredOrders(filtered);
  }, [orders, selectedStatus, searchQuery]);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      console.log("[CustomOrdersPanel] ðŸ“‹ Fetching orders...");
      const response = await fetch("/api/custom-orders");
      console.log("[CustomOrdersPanel] Response status:", response.status);
      const data = await response.json();
      
      if (!response.ok) throw new Error(data.message || "Failed to fetch custom orders");
      
      // DEBUG: Log detailed order info
      if (data.orders && Array.isArray(data.orders)) {
        console.log("[CustomOrdersPanel] 📋 Total orders received:", data.orders.length);
        data.orders.forEach((order: any, idx: number) => {
          console.log(`[CustomOrdersPanel] Order ${idx + 1}:`, {
            orderNumber: order.orderNumber,
            email: order.email,
            fullName: order.fullName,
            status: order.status,
            quantity: order.quantity,
            quantityOfPieces: order.quantityOfPieces,
            quotedPrice: order.quotedPrice,
            price: order.price,
            designUrls: order.designUrls?.length || 0,
            images: order.images?.length || 0,
            description: order.description,
            costumeType: order.costumeType,
            paymentVerified: order.paymentVerified
          });
        });
      }
      
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

  // Background fetch - no loading state, only updates if data changed
  const fetchOrdersBackground = async () => {
    try {
      console.log("[CustomOrdersPanel] 📋 Background polling for order updates...");
      const response = await fetch("/api/custom-orders");
      
      if (!response.ok) {
        console.error("[CustomOrdersPanel] Background fetch failed:", response.status);
        return;
      }
      
      const data = await response.json();
      const newOrders = data.orders || [];
      
      // Only update if orders actually changed
      setOrders(prevOrders => {
        const hasChanged = prevOrders.length !== newOrders.length ||
          prevOrders.some((p, i) => 
            p._id !== newOrders[i]?._id || 
            p.status !== newOrders[i]?.status ||
            p.quotedPrice !== newOrders[i]?.quotedPrice
          );
        
        if (hasChanged) {
          console.log("[CustomOrdersPanel] ✅ Orders changed, updating...");
          // Only fetch message counts if orders actually changed
          if (newOrders && Array.isArray(newOrders)) {
            fetchMessageCounts(newOrders);
          }
          return newOrders;
        } else {
          console.log("[CustomOrdersPanel] ℹ️ No changes detected, keeping current data");
          return prevOrders;
        }
      });
    } catch (error) {
      console.error("[CustomOrdersPanel] Error in background polling:", error);
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
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4" />;
      case "approved":
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const declineOrder = async (orderId: string) => {
    try {
      console.log(`[CustomOrdersPanel] ðŸ“¤ Declining order: ${orderId}`);
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
            content: "âŒ This order has been declined by the admin. Contact us if you have questions.",
            messageType: "system",
          }),
        });
      }
      
      setOrders(orders.map(o => 
        o._id === orderId ? { ...o, status: "rejected" } : o
      ));
      setConfirmModal(null);
      showToast("Order declined successfully!", "success");
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      console.error("[CustomOrdersPanel] âŒ Error declining order:", errorMsg);
      showToast(`Failed to decline order: ${errorMsg}`, "error");
      setConfirmModal(null);
    }
  };

  const cancelOrder = async (orderId: string) => {
    try {
      console.log(`[CustomOrdersPanel] ðŸ“¤ Cancelling order: ${orderId}`);
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
            content: "ðŸ›‘ Your order has been cancelled by the admin and you will receive a full refund. Contact us if you have questions.",
            messageType: "system",
          }),
        });
      }
      
      setOrders(orders.map(o => 
        o._id === orderId ? { ...o, status: "rejected" } : o
      ));
      setConfirmModal(null);
      showToast("Order cancelled and refund initiated!", "success");
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      console.error("[CustomOrdersPanel] âŒ Error cancelling order:", errorMsg);
      showToast(`Failed to cancel order: ${errorMsg}`, "error");
      setConfirmModal(null);
    }
  };

  const deleteOrder = async (orderId: string) => {
    try {
      console.log(`[CustomOrdersPanel] ðŸ—‘ï¸ Deleting order: ${orderId}`);
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
      showToast("Order deleted successfully!", "success");
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      console.error("[CustomOrdersPanel] âŒ Error deleting order:", errorMsg);
      showToast(`Failed to delete order: ${errorMsg}`, "error");
      setConfirmModal(null);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      console.log(`[CustomOrdersPanel] ðŸ"„ Updating order ${orderId} status to: ${newStatus}`);
      
      const updatePayload: Record<string, any> = { status: newStatus };
            // Find the order to check if it's a custom order
      const order = orders.find(o => o._id === orderId);
      if (order) {
        updatePayload.isCustomOrder = order.isCustomOrder !== false; // Default to true if not set
        console.log(`[CustomOrdersPanel] Order type: ${updatePayload.isCustomOrder ? 'Custom Order' : 'Regular Order'}`);
      }
            // If transitioning to "in-progress", set the productionStartedAt timestamp
      if (newStatus === "in-progress") {
        updatePayload.productionStartedAt = new Date().toISOString();
      }
      
      const response = await fetch(`/api/custom-orders?id=${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatePayload),
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
        throw new Error(data.message || `Failed to update order status to ${newStatus}`);
      }

      // Use the order we found earlier to send a system message
      if (order) {
        const statusMessages: Record<string, string> = {
          "in-progress": "Your order production has started! We'll keep you updated.",
          "ready": "Your order is ready! Please confirm your preferred delivery method below.",
          "completed": "Your order has been completed!"
        };
        
        if (statusMessages[newStatus]) {
          // Send the main status message
          await fetch("/api/messages", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              orderId: order._id,
              orderNumber: order.orderNumber,
              senderEmail: admin?.email || "admin@empi.com",
              senderName: "System",
              senderType: "admin",
              content: statusMessages[newStatus],
              messageType: "system",
            }),
          });

          // If marked as ready, send delivery confirmation options
          if (newStatus === "ready") {
            const deliveryOptionsMessage = `🚚 **CONFIRM YOUR DELIVERY CHOICE** 🚚\n\nYour costume is ready! Please confirm how you'd like to receive it:\n\nDELIVERY OPTIONS`;
            
            await fetch("/api/messages", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                orderId: order._id,
                orderNumber: order.orderNumber,
                senderEmail: admin?.email || "admin@empi.com",
                senderName: "System",
                senderType: "admin",
                content: deliveryOptionsMessage,
                messageType: "system",
              }),
            });
          }
        }
      }
      
      setOrders(orders.map(o => 
        o._id === orderId ? { ...o, status: newStatus as any } : o
      ));
      showToast(`Order status updated to ${newStatus}!`, "success");
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      console.error("[CustomOrdersPanel] âŒ Error updating order status:", errorMsg);
      showToast(`Failed to update order status: ${errorMsg}`, "error");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-lime-600 rounded-3xl shadow-2xl p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white opacity-10 rounded-full -mr-48 -mt-48"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-white opacity-10 rounded-full -ml-48 -mb-48"></div>
        <div className="relative z-10 flex items-start justify-between">
          <div>
            <h2 className="text-4xl font-black text-white mb-2">Orders</h2>
            <p className="text-white/90 text-lg">Manage requests and send professional quotes</p>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 border border-white/30">
            <p className="text-white/80 text-sm font-semibold uppercase tracking-wide">Total Orders</p>
            <p className="text-5xl font-black text-white mt-2">{orders.length}</p>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <div className="relative">
          <Search className="absolute left-4 top-4 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by order #, email, or name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-2 rounded-lg border border-gray-300 bg-white placeholder-gray-400 text-gray-900 outline-none focus:ring-2 focus:ring-lime-600 focus:border-lime-600 transition"
          />
        </div>
      </div>

      {/* Filter Bar - Status Tabs */}
      <StatusTabs 
        orders={orders}
        selectedStatus={selectedStatus}
        onStatusChange={setSelectedStatus}
      />

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



      {/* Orders List View - When a status tab is selected */}
      {!isLoading && selectedStatus !== "all" && filteredOrders.length > 0 && (
        <div className={selectedStatus === "approved" || selectedStatus === "pending" ? "grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-6" : "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-6"}>
          {selectedStatus === "approved" ? (
            // Approved cards using ApprovedOrderCard component
            filteredOrders.map((order) => (
              <ApprovedOrderCard
                key={order._id}
                order={order as any}
                onStartProduction={(orderId) => updateOrderStatus(orderId, "in-progress")}
              />
            ))
          ) : (
            // Pending cards using OtherStatusOrderCard component
            filteredOrders.map((order) => (
              <OtherStatusOrderCard
                key={order._id}
                order={order as any}
                expanded={expandedOrder === order._id}
                onExpandClick={() => setExpandedOrder(expandedOrder === order._id ? null : order._id)}
                onImageClick={() => setImageModalOpen({ orderId: order._id, index: 0 })}
                onDeclineClick={() => setConfirmModal({ type: 'decline', orderId: order._id })}
                onCancelClick={() => setConfirmModal({ type: 'cancel', orderId: order._id })}
                onStatusChangeClick={(status) => {
                  updateOrderStatus(order._id, status);
                }}
                onDeleteClick={() => setConfirmModal({ type: 'delete', orderId: order._id })}
                onApproveClick={() => updateOrderStatus(order._id, 'approved')}
              />
            ))
          )}
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModal && (
        <ConfirmationModal
          type={confirmModal.type}
          onConfirm={() => {
            if (confirmModal.type === 'decline') {
              declineOrder(confirmModal.orderId);
            } else if (confirmModal.type === 'cancel') {
              cancelOrder(confirmModal.orderId);
            } else if (confirmModal.type === 'approve') {
              updateOrderStatus(confirmModal.orderId, 'approved');
            } else {
              deleteOrder(confirmModal.orderId);
            }
          }}
          onCancel={() => setConfirmModal(null)}
        />
      )}

      {/* Image Modal */}
      {imageModalOpen && filteredOrders && (() => {
        const order = filteredOrders.find(o => o._id === imageModalOpen.orderId);
        if (!order) return null;
        
        const images = (order.designUrls && order.designUrls.length > 0) 
          ? order.designUrls 
          : order.designUrl ? [order.designUrl] : [];
        
        return (
          <ImageModal
            open={true}
            onClose={() => setImageModalOpen(null)}
            images={images}
            orderName={order.description || order.fullName || getFullName(order)}
          />
        );
      })()}

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg text-white font-medium animate-in fade-in slide-in-from-top-2 duration-300 z-50 ${
          toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
        }`}>
          {toast.message}
        </div>
      )}
    </div>
  );
}
