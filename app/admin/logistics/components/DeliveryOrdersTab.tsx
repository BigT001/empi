"use client";

import { useState } from "react";
import { MessageSquare, Package, Check } from "lucide-react";
import { LogisticsOrder } from "../types";

interface DeliveryOrdersTabProps {
  deliverySubTab: 'pending' | 'approved' | 'in-progress' | 'delivered';
  setDeliverySubTab: (tab: 'pending' | 'approved' | 'in-progress' | 'delivered') => void;
  pendingDeliveryOrders: LogisticsOrder[];
  approvedDeliveryOrders: LogisticsOrder[];
  inProgressDeliveryOrders: LogisticsOrder[];
  deliveredDeliveryOrders: LogisticsOrder[];
  allDeliveryOrders: LogisticsOrder[];
  onJoinConversation: (order: LogisticsOrder) => void;
}

const getCustomerName = (order: any) => {
  if (order.fullName) return order.fullName;
  if (order.firstName && order.lastName) return `${order.firstName} ${order.lastName}`;
  if (order.buyerName) return order.buyerName;
  return 'Customer';
};

// Helper function to check if payment approval is required
const shouldShowPaymentApprovalMessage = (order: LogisticsOrder, deliverySubTab: string): boolean => {
  // Only show "Awaiting Payment Approval" for:
  // 1. Regular orders (not custom orders)
  // 2. In pending tab
  // 3. Payment not yet confirmed
  return deliverySubTab === 'pending' && 
         !order.paymentConfirmedAt && 
         !order._isCustomOrder;
};

export function DeliveryOrdersTab({
  deliverySubTab,
  setDeliverySubTab,
  pendingDeliveryOrders,
  approvedDeliveryOrders,
  inProgressDeliveryOrders,
  deliveredDeliveryOrders,
  allDeliveryOrders,
  onJoinConversation,
}: DeliveryOrdersTabProps) {
  const [approvalModal, setApprovalModal] = useState<{ orderId: string; orderNumber: string } | null>(null);
  const [isApproving, setIsApproving] = useState(false);
  const getDisplayOrders = () => {
    switch (deliverySubTab) {
      case 'pending':
        return pendingDeliveryOrders;
      case 'approved':
        return approvedDeliveryOrders;
      case 'in-progress':
        return inProgressDeliveryOrders;
      case 'delivered':
        return deliveredDeliveryOrders;
      default:
        return [];
    }
  };

  const displayOrders = getDisplayOrders();

  const handleApproveOrder = async () => {
    if (!approvalModal) return;
    
    setIsApproving(true);
    try {
      console.log('[Logistics] Approving order:', {
        orderId: approvalModal.orderId,
        orderNumber: approvalModal.orderNumber,
      });

      const response = await fetch(`/api/orders/${approvalModal.orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'payment_confirmed' }),
      });

      const data = await response.json();
      console.log('[Logistics] Approval response:', data);

      if (response.ok) {
        console.log('[Logistics] ✅ Order approved successfully');
        setApprovalModal(null);
        // Refresh the page to update the tabs
        setTimeout(() => window.location.reload(), 500);
      } else {
        const errorMsg = data.error || data.details || 'Unknown error';
        console.error('[Logistics] ❌ Approval failed:', errorMsg);
        alert(`Failed to approve order: ${errorMsg}`);
      }
    } catch (error) {
      console.error('[Logistics] Error approving order:', error);
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsApproving(false);
    }
  };

  return (
    <>
      {/* Delivery Sub-Tabs */}
      <div className="flex gap-2 mb-6 bg-gray-100 rounded-lg p-2 w-fit scrollbar-hide">
        {[
          { id: 'pending', label: 'Pending', count: pendingDeliveryOrders.length },
          { id: 'approved', label: 'Approved', count: approvedDeliveryOrders.length },
          { id: 'in-progress', label: 'In Progress', count: inProgressDeliveryOrders.length },
          { id: 'delivered', label: 'Delivered', count: deliveredDeliveryOrders.length },
        ].map((subTab) => (
          <button
            key={subTab.id}
            onClick={() => setDeliverySubTab(subTab.id as 'pending' | 'approved' | 'in-progress' | 'delivered')}
            className={`px-4 py-2 rounded-lg font-semibold text-sm transition ${
              deliverySubTab === subTab.id
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300'
            }`}
          >
            {subTab.label} ({subTab.count})
          </button>
        ))}
      </div>

      {/* Delivery Orders Grid */}
      {displayOrders.length > 0 ? (
        <div className="grid grid-cols-3 gap-3">
          {displayOrders.map(order => (
            <div key={order._id} className={`rounded-lg p-3 h-full flex flex-col gap-2 shadow-md hover:shadow-lg transition ${
              deliverySubTab === 'pending' 
                ? 'bg-white border-2 border-red-200' 
                : 'bg-white border-2 border-blue-200'
            }`}>
              {/* Header with Status Badge */}
              <div className={`rounded-xl p-4 text-white shadow-lg ${
                deliverySubTab === 'pending'
                  ? 'bg-gradient-to-br from-red-500 via-red-600 to-red-700'
                  : 'bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-600'
              }`}>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex-1">
                    <p className="font-black text-base mb-1">📦 {getCustomerName(order)}</p>
                    <p className="text-sm opacity-95 font-semibold">Order #{order.orderNumber}</p>
                  </div>
                  <span className={`px-3 py-1.5 rounded-full text-xs font-black whitespace-nowrap shadow-md ${
                    deliverySubTab === 'pending' ? 'bg-red-200 text-red-800' :
                    deliverySubTab === 'in-progress' ? 'bg-orange-200 text-orange-800' :
                    'bg-green-200 text-green-800'
                  }`}>
                    {deliverySubTab === 'pending' ? '📨 SEND QUOTE' :
                     deliverySubTab === 'in-progress' ? '🚚 IN TRANSIT' :
                     '✓ DELIVERED'}
                  </span>
                </div>
              </div>

              {/* Customer Info */}
              <div className="bg-gray-50 rounded p-2 border border-gray-200 space-y-1 text-xs">
                <div className="flex items-center gap-2">
                  <span>📞</span>
                  <span className="text-gray-700">{order.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>📧</span>
                  <span className="text-gray-700 truncate">{order.email}</span>
                </div>
              </div>

              {/* Order Details Grid */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-blue-50 rounded p-2 border border-blue-200">
                  <p className="text-xs font-semibold text-gray-600 mb-0.5">Quantity</p>
                  <p className="text-sm font-bold text-blue-700">
                    {order.quantity || (order.items?.reduce((sum: number, item: any) => sum + item.quantity, 0) ?? 0)}
                  </p>
                </div>
                <div className="bg-blue-50 rounded p-2 border border-blue-200">
                  <p className="text-xs font-semibold text-gray-600 mb-0.5">Method</p>
                  <p className="text-xs font-bold text-blue-700">🚚 Delivery</p>
                </div>
              </div>

              {/* Description */}
              <div className="bg-blue-50 rounded p-2 border border-blue-200">
                <p className="text-xs font-semibold text-gray-600 mb-0.5">Description</p>
                <p className="text-xs text-gray-900 line-clamp-2">{order.description}</p>
              </div>

              {/* Product Images */}
              {(() => {
                const customImages = (order.images || order.designUrls || []);
                const itemImages = order.items?.map((item: any) => item.imageUrl).filter(Boolean) || [];
                const allImages = [...customImages, ...itemImages];
                return allImages.length > 0 ? (
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-gray-600">Images</p>
                    <div className="grid grid-cols-3 gap-1">
                      {allImages.slice(0, 3).map((img, idx) => (
                        <div key={idx} className="relative aspect-square bg-gray-100 rounded border border-blue-300 overflow-hidden hover:border-blue-500 transition cursor-pointer">
                          <img src={img} alt={`Design ${idx + 1}`} className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null;
              })()}

              {/* Delivery Address or Delivery Details */}
              {(order as any).deliveryDetails ? (
                <div className="bg-emerald-50 rounded p-2 border border-emerald-200 text-xs space-y-2">
                  <p className="font-semibold text-gray-600 mb-1">📍 Delivery Details</p>
                  <div>
                    <p className="text-gray-700 text-xs">
                      <span className="font-semibold">Address:</span> {(order as any).deliveryDetails.address}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-700 text-xs">
                      <span className="font-semibold">Location:</span> {(order as any).deliveryDetails.location}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <p className="text-gray-700 text-xs">
                      <span className="font-semibold">State:</span> {(order as any).deliveryDetails.state}
                    </p>
                    <p className="text-gray-700 text-xs">
                      <span className="font-semibold">LGA:</span> {(order as any).deliveryDetails.localGovernment}
                    </p>
                  </div>
                  {(order as any).deliveryDetails.phone && (
                    <div>
                      <p className="text-gray-700 text-xs">
                        <span className="font-semibold">Phone:</span> {(order as any).deliveryDetails.phone}
                      </p>
                    </div>
                  )}
                </div>
              ) : order.address ? (
                <div className="bg-emerald-50 rounded p-2 border border-emerald-200 text-xs">
                  <p className="font-semibold text-gray-600 mb-0.5">📍 Delivery Address</p>
                  <p className="text-gray-900 font-semibold text-xs">{order.address}</p>
                  {order.city && <p className="text-gray-600 text-xs">{order.city}</p>}
                </div>
              ) : null}

              {/* Timeline */}
              {order.updatedAt && (
                <div className="bg-amber-50 rounded p-2 border border-amber-200 text-xs">
                  <p className="font-semibold text-gray-600 mb-0.5">📅 Expected Delivery</p>
                  <p className="text-gray-900 font-bold">{new Date(order.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                </div>
              )}

              {/* Action Button */}
              <div className="mt-auto pt-2 flex gap-2">
                <button 
                  onClick={() => onJoinConversation(order)}
                  disabled={shouldShowPaymentApprovalMessage(order, deliverySubTab)}
                  className={`flex-1 flex items-center justify-center gap-2 px-2 py-2 text-white font-semibold text-xs rounded-lg transition ${
                    deliverySubTab === 'pending' 
                      ? 'bg-blue-600 hover:bg-blue-700' 
                      : 'bg-green-600 hover:bg-green-700'
                  }`}
                >
                  <MessageSquare className="h-4 w-4" />
                  Chat
                </button>
                {deliverySubTab === 'pending' && (
                  <button
                    onClick={() => {
                      console.log('[DeliveryOrdersTab] Full order object:', {
                        _id: order._id,
                        id: (order as any).id,
                        orderNumber: order.orderNumber,
                        allKeys: Object.keys(order)
                      });
                      if (!order._id) {
                        alert('Error: Order ID not found. Check console for details.');
                        return;
                      }
                      setApprovalModal({ orderId: order._id, orderNumber: order.orderNumber });
                    }}
                    className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg transition flex items-center gap-1"
                  >
                    <Check className="h-4 w-4" />
                    Approve
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-40 bg-white rounded-lg border border-gray-200">
          <Package className="h-12 w-12 text-gray-400 mb-3" />
          <p className="text-gray-600 font-medium">No delivery orders</p>
        </div>
      )}

      {/* Approval Modal */}
      {approvalModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="h-8 w-8 text-purple-600" />
              </div>
              <h2 className="text-3xl font-black text-gray-900 mb-2">Confirm Payment</h2>
              <p className="text-lg font-bold text-purple-600 mb-4">Order #{approvalModal.orderNumber}</p>
              <p className="text-sm text-gray-700 mb-2 leading-relaxed font-semibold">
                Have you confirmed payment in your bank account?
              </p>
              <p className="text-xs text-gray-600 mb-8">
                Click "Yes" to move this order to the Approved tab and proceed with logistics.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setApprovalModal(null)}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-bold rounded-lg hover:bg-gray-50 transition text-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApproveOrder}
                  disabled={isApproving}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 disabled:bg-gray-400 text-white font-bold rounded-lg transition flex items-center justify-center gap-2 text-lg"
                >
                  {isApproving ? (
                    <>
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Approving...
                    </>
                  ) : (
                    <>
                      <Check className="h-5 w-5" />
                      Yes, Confirm
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
