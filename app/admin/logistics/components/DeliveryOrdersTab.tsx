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
  return `Order #${order.orderNumber}`;
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
        <div className="grid grid-cols-3 gap-4">
          {displayOrders.map(order => (
            <div key={order._id} className={`rounded-xl overflow-hidden flex flex-col gap-0 shadow-md hover:shadow-lg transition h-full ${
              deliverySubTab === 'pending' 
                ? 'border-2 border-red-300 bg-white' 
                : 'border-2 border-blue-300 bg-white'
            }`}>
              {/* Header with Status Badge - Enhanced */}
              <div className={`p-4 text-white shadow-md ${
                deliverySubTab === 'pending'
                  ? 'bg-gradient-to-br from-red-500 via-red-600 to-red-700'
                  : 'bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-600'
              }`}>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1">
                    <p className="text-xs font-semibold opacity-90 uppercase tracking-wide">🚚 Delivery</p>
                    <p className="text-lg font-black mt-1">{getCustomerName(order)}</p>
                    <p className="text-xs opacity-85 font-semibold mt-0.5">#{order.orderNumber}</p>
                  </div>
                  <span className={`px-3 py-1.5 rounded-full text-xs font-black whitespace-nowrap shadow-md ${
                    deliverySubTab === 'pending' ? 'bg-red-200 text-red-800' :
                    deliverySubTab === 'in-progress' ? 'bg-orange-200 text-orange-800' :
                    'bg-green-200 text-green-800'
                  }`}>
                    {deliverySubTab === 'pending' ? '📨 QUOTE' :
                     deliverySubTab === 'in-progress' ? '🚚 IN TRANSIT' :
                     '✓ DONE'}
                  </span>
                </div>
              </div>

              {/* Customer Contact */}
              <div className="px-4 py-3 border-b border-gray-100 space-y-1 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-lg">📞</span>
                  <span className="text-gray-700 font-medium">{order.phone}</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-lg">📧</span>
                  <span className="text-gray-600 truncate">{order.email}</span>
                </div>
              </div>

              {/* Complete Delivery Address - Enhanced */}
              {(order as any).deliveryDetails ? (
                <div className="px-4 py-3 border-b border-gray-100 bg-emerald-50">
                  <p className="font-bold text-xs text-gray-700 mb-2 uppercase tracking-wide">📍 Delivery Address</p>
                  <div className="space-y-1.5 text-xs text-gray-900">
                    <p className="font-semibold">{(order as any).deliveryDetails.address}</p>
                    <p className="text-gray-700">{(order as any).deliveryDetails.location}</p>
                    <p className="text-gray-700">{(order as any).deliveryDetails.state} - {(order as any).deliveryDetails.localGovernment}</p>
                    {(order as any).deliveryDetails.phone && (
                      <p className="text-gray-600 mt-1">Phone: {(order as any).deliveryDetails.phone}</p>
                    )}
                  </div>
                </div>
              ) : order.address ? (
                <div className="px-4 py-3 border-b border-gray-100 bg-emerald-50">
                  <p className="font-bold text-xs text-gray-700 mb-2 uppercase tracking-wide">📍 Delivery Address</p>
                  <div className="space-y-1 text-xs text-gray-900">
                    <p className="font-semibold">{order.address}</p>
                    <p className="text-gray-700">{order.city}</p>
                  </div>
                </div>
              ) : null}



              {/* What They're Ordering */}
              {order.items && order.items.length > 0 ? (
                <div className="px-4 py-3 border-b border-gray-100 space-y-2">
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Items</p>
                  {order.items.map((item: any, idx: number) => (
                    <div key={idx} className="flex gap-3 bg-blue-50 rounded-lg p-2 border border-blue-200">
                      {/* Product Image */}
                      <div className="relative aspect-square bg-gray-100 rounded border border-blue-300 overflow-hidden flex-shrink-0 w-16 h-16">
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const img = e.target as HTMLImageElement;
                              img.style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-200">
                            <span className="text-xs text-gray-600">No Image</span>
                          </div>
                        )}
                      </div>
                      {/* Product Details */}
                      <div className="flex-1 flex flex-col justify-center gap-1 min-w-0">
                        <h4 className="font-bold text-sm text-gray-900 truncate">{item.name || item.productName || 'Product'}</h4>
                        <div className="flex gap-2 items-center text-xs">
                          <span className="text-gray-600">Qty: {item.quantity || 1}</span>
                          {item.price && <span className="font-semibold text-blue-700">₦{(item.price).toLocaleString('en-NG')}</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Description</p>
                  <p className="text-xs text-gray-900 line-clamp-3">{order.description}</p>
                  {/* Design Images for Custom Orders */}
                  {(order.designUrls && order.designUrls.length > 0) && (
                    <div className="mt-3">
                      <p className="text-xs font-semibold text-gray-600 uppercase mb-2">Design Images</p>
                      <div className="grid grid-cols-3 gap-2">
                        {order.designUrls.map((img: string, idx: number) => (
                          <div
                            key={idx}
                            className="relative aspect-square bg-gray-100 rounded border border-blue-300 overflow-hidden"
                          >
                            <img
                              src={img}
                              alt={`Design ${idx + 1}`}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const img = e.target as HTMLImageElement;
                                img.style.display = 'none';
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Timeline */}
              {order.updatedAt && (
                <div className="px-4 py-3 border-b border-gray-100 bg-amber-50">
                  <p className="font-bold text-xs text-gray-700 mb-1 uppercase tracking-wide">📅 Expected Delivery</p>
                  <p className="text-gray-900 font-semibold text-xs">{new Date(order.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                </div>
              )}

              {/* Action Button */}
              <div className="mt-auto px-4 py-3 flex gap-2">
                <button 
                  onClick={() => onJoinConversation(order)}
                  disabled={shouldShowPaymentApprovalMessage(order, deliverySubTab)}
                  className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 text-white font-semibold text-xs rounded-lg transition shadow-sm hover:shadow-md ${
                    deliverySubTab === 'pending' 
                      ? 'bg-blue-600 hover:bg-blue-700' 
                      : 'bg-blue-600 hover:bg-blue-700'
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
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg transition flex items-center gap-1 shadow-sm hover:shadow-md"
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
