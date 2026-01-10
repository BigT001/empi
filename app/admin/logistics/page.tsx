'use client';

import React, { useEffect, useState } from 'react';
import { OrderCard } from '../dashboard/components/PendingPanel/OrderCard';
import { ArrowLeft, AlertCircle, X, Package, CheckCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function LogisticsPage() {
  const router = useRouter();
  const [ordersData, setOrdersData] = useState<any[]>([]);
  const [shippedOrders, setShippedOrders] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'active' | 'shipped'>('active');
  const [loading, setLoading] = useState(true);
  const [shippingConfirmModal, setShippingConfirmModal] = useState<string | null>(null);
  const [isShipping, setIsShipping] = useState(false);

  useEffect(() => {
    try {
      // Load active orders
      const storedOrders = sessionStorage.getItem('logistics_orders');
      if (storedOrders) {
        const parsedOrders = JSON.parse(storedOrders);
        setOrdersData(Array.isArray(parsedOrders) ? parsedOrders : []);
      }
      
      // Load shipped orders
      const storedShipped = sessionStorage.getItem('logistics_shipped_orders');
      if (storedShipped) {
        const parsedShipped = JSON.parse(storedShipped);
        setShippedOrders(Array.isArray(parsedShipped) ? parsedShipped : []);
      }
    } catch (error) {
      console.error('Error retrieving orders data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const removeOrder = (orderId: string) => {
    const updatedOrders = ordersData.filter(order => order._id !== orderId);
    setOrdersData(updatedOrders);
    if (updatedOrders.length > 0) {
      sessionStorage.setItem('logistics_orders', JSON.stringify(updatedOrders));
    } else {
      sessionStorage.removeItem('logistics_orders');
    }
  };

  const markAsShipped = (orderId: string) => {
    const orderToShip = ordersData.find(order => order._id === orderId);
    if (orderToShip) {
      // Update order status to "shipped" in the database
      updateOrderStatus(orderId, 'shipped');
      
      // Move order to shipped tab
      const updatedShipped = [...shippedOrders, orderToShip];
      setShippedOrders(updatedShipped);
      sessionStorage.setItem('logistics_shipped_orders', JSON.stringify(updatedShipped));
      
      // Remove from active orders
      removeOrder(orderId);
      
      setShippingConfirmModal(null);
      setIsShipping(false);
    }
  };

  const deleteOrder = async (orderId: string) => {
    try {
      // Delete from database
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'DELETE',
      });

      // If 404, order already deleted - that's fine, just remove from UI
      if (res.status === 404) {
        console.log(`[Logistics] ℹ️ Order ${orderId} not found in database (already deleted)`);
      } else if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to delete order');
      }

      // Remove from active orders if present
      const updatedOrders = ordersData.filter(order => order._id !== orderId);
      setOrdersData(updatedOrders);
      if (updatedOrders.length > 0) {
        sessionStorage.setItem('logistics_orders', JSON.stringify(updatedOrders));
      } else {
        sessionStorage.removeItem('logistics_orders');
      }

      // Remove from shipped orders if present
      const updatedShipped = shippedOrders.filter(order => order._id !== orderId);
      setShippedOrders(updatedShipped);
      if (updatedShipped.length > 0) {
        sessionStorage.setItem('logistics_shipped_orders', JSON.stringify(updatedShipped));
      } else {
        sessionStorage.removeItem('logistics_shipped_orders');
      }

      // Remove from persisted approved IDs on dashboard
      try {
        const stored = sessionStorage.getItem('dashboard_approved_order_ids');
        if (stored) {
          const ids = JSON.parse(stored);
          const filteredIds = ids.filter((id: string) => id !== orderId);
          if (filteredIds.length > 0) {
            sessionStorage.setItem('dashboard_approved_order_ids', JSON.stringify(filteredIds));
          } else {
            sessionStorage.removeItem('dashboard_approved_order_ids');
          }
        }
      } catch (e) {
        console.error('[Logistics] Error updating dashboard_approved_order_ids:', e);
      }

      // Remove sent to logistics state
      try {
        sessionStorage.removeItem(`order_sent_to_logistics_${orderId}`);
      } catch (e) {
        console.error('[Logistics] Error removing sent to logistics state:', e);
      }

      console.log(`[Logistics] ✅ Order ${orderId} deleted successfully`);
    } catch (err: any) {
      console.error('[Logistics] Error deleting order:', err);
      alert(err.message || 'Failed to delete order');
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      console.log(`[Logistics] 🔄 Updating order ${orderId} to status: ${newStatus}`);
      console.log(`[Logistics] Order ID length: ${orderId.length}`);
      
      const response = await fetch(`/api/custom-orders/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      console.log(`[Logistics] Custom-orders endpoint - Status: ${response.status} ${response.statusText}`);

      if (response.ok) {
        console.log(`✅ Order ${orderId} status updated to ${newStatus} via custom-orders endpoint`);
        return;
      }

      if (response.status === 404) {
        console.log('[Logistics] ⚠️ Order not found in custom-orders, trying orders endpoint...');
        
        const altResponse = await fetch(`/api/orders/${orderId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status: newStatus }),
        });
        
        console.log(`[Logistics] Orders endpoint - Status: ${altResponse.status} ${altResponse.statusText}`);
        
        if (altResponse.ok) {
          console.log(`✅ Order ${orderId} status updated to ${newStatus} via orders endpoint`);
          return;
        } else {
          const errorData = await altResponse.json().catch(() => ({}));
          console.error(`[Logistics] Failed to update via orders endpoint:`, errorData);
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error(`[Logistics] Failed to update via custom-orders endpoint:`, errorData);
      }
    } catch (error) {
      console.error('[Logistics] Error updating order status:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-96">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-lime-600 border-t-transparent"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!ordersData || (ordersData.length === 0 && shippedOrders.length === 0)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
        <div className="max-w-7xl mx-auto">
          <button
            onClick={() => router.back()}
            className="mb-6 flex items-center gap-2 text-lime-600 hover:text-lime-700 font-semibold transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            Back
          </button>
          <div className="bg-white rounded-2xl border-2 border-amber-200 p-8 flex items-start gap-4">
            <AlertCircle className="h-6 w-6 text-amber-600 flex-shrink-0 mt-1" />
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">No Orders Found</h2>
              <p className="text-gray-600">
                No orders have been sent to logistics yet. Select approved orders from the dashboard and click "Ready" to proceed.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-lime-600 hover:text-lime-700 font-semibold transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          Back to Approved Orders
        </button>

        <div className="space-y-4">
          <h1 className="text-3xl font-bold text-gray-900">Orders Logistics</h1>
          
          {/* Tab Navigation */}
          <div className="flex gap-2 border-b border-gray-300">
            <button
              onClick={() => setActiveTab('active')}
              className={`flex items-center gap-2 px-6 py-3 font-semibold transition-colors border-b-2 ${
                activeTab === 'active'
                  ? 'border-lime-600 text-lime-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <Package className="h-5 w-5" />
              Active Orders ({ordersData.length})
            </button>
            <button
              onClick={() => setActiveTab('shipped')}
              className={`flex items-center gap-2 px-6 py-3 font-semibold transition-colors border-b-2 ${
                activeTab === 'shipped'
                  ? 'border-lime-600 text-lime-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <CheckCircle className="h-5 w-5" />
              Shipped Orders ({shippedOrders.length})
            </button>
          </div>
        </div>

        {/* Active Orders Tab */}
        {activeTab === 'active' && ordersData.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {ordersData.map((order) => (
              <OrderCard
                key={order._id}
                orderId={order._id}
                firstName={order.firstName || ''}
                lastName={order.lastName || ''}
                email={order.email}
                phone={order.phone}
                items={order.items}
                total={order.total}
                orderNumber={order.orderNumber}
                isPaid={order.isPaid}
                isApproving={false}
                onApprove={() => {}}
                onChat={() => {}}
                onDelete={() => {}}
                onDeleteConfirm={async () => {}}
                formatCurrency={formatCurrency}
                rentalDays={order.rentalDays}
                cautionFee={order.cautionFee}
                description={order.description}
                designUrls={order.designUrls}
                quantity={order.quantity}
                quotedPrice={order.quotedPrice}
                isCustomOrder={order.isCustomOrder}
                isApproved={order.isApproved}
                hidePricingDetails={true}
                hideReadyButton={true}
                hideDeleteButton={true}
                hidePaymentStatus={true}
                onShipped={() => setShippingConfirmModal(order._id)}
              />
            ))}
          </div>
        )}

        {activeTab === 'active' && ordersData.length === 0 && (
          <div className="bg-white rounded-2xl border-2 border-gray-200 p-12 text-center">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">No active orders for shipping</p>
          </div>
        )}

        {/* Shipped Orders Tab */}
        {activeTab === 'shipped' && shippedOrders.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {shippedOrders.map((order) => (
              <OrderCard
                key={order._id}
                orderId={order._id}
                firstName={order.firstName || ''}
                lastName={order.lastName || ''}
                email={order.email}
                phone={order.phone}
                items={order.items}
                total={order.total}
                orderNumber={order.orderNumber}
                isPaid={order.isPaid}
                isApproving={false}
                onApprove={() => {}}
                onChat={() => {}}
                onDelete={() => {}}
                onDeleteConfirm={async () => {}}
                formatCurrency={formatCurrency}
                rentalDays={order.rentalDays}
                cautionFee={order.cautionFee}
                description={order.description}
                designUrls={order.designUrls}
                quantity={order.quantity}
                quotedPrice={order.quotedPrice}
                isCustomOrder={order.isCustomOrder}
                isApproved={order.isApproved}
                hidePricingDetails={true}
                hideReadyButton={true}
                hideDeleteButton={true}
                hidePaymentStatus={true}
                disableShippedButton={true}
              />
            ))}
          </div>
        )}

        {activeTab === 'shipped' && shippedOrders.length === 0 && (
          <div className="bg-white rounded-2xl border-2 border-gray-200 p-12 text-center">
            <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">No shipped orders yet</p>
          </div>
        )}

        {/* Shipping Confirmation Modal */}
        {shippingConfirmModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-sm mx-4 shadow-xl">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Confirm Shipment</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to mark this order as shipped? The order will move to the Shipped tab.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShippingConfirmModal(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setIsShipping(true);
                    markAsShipped(shippingConfirmModal);
                  }}
                  disabled={isShipping}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-lg hover:from-green-700 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-400"
                >
                  {isShipping ? 'Confirming...' : 'Confirm Shipment'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
