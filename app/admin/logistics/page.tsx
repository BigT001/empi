'use client';

import React, { useEffect, useState } from 'react';
import { ArrowLeft, AlertCircle, X, Package, CheckCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { PermissionGuard } from '@/app/components/PermissionGuard';
import MobileAdminLayout from '../mobile-layout';
import { LogisticsOrderCard } from './LogisticsOrderCard';

function LogisticsPageContent() {
  const router = useRouter();
  const [ordersData, setOrdersData] = useState<any[]>([]);
  const [shippedOrders, setShippedOrders] = useState<any[]>([]);
  const [enrichedOrders, setEnrichedOrders] = useState<any[]>([]);
  const [enrichedShippedOrders, setEnrichedShippedOrders] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'active' | 'shipped'>('active');
  const [loading, setLoading] = useState(true);
  const [shippingConfirmModal, setShippingConfirmModal] = useState<string | null>(null);
  const [isShipping, setIsShipping] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Fetch buyer details from admin/buyers endpoint (most reliable)
  const fetchBuyerDetailsFromAdmin = async () => {
    try {
      const response = await fetch(`/api/admin/buyers`);
      if (response.ok) {
        const data = await response.json();
        // Return as a map for easy lookup by email or id
        const buyerMap: Record<string, any> = {};
        data.buyers?.forEach((buyer: any) => {
          buyerMap[buyer.email?.toLowerCase()] = buyer;
          buyerMap[buyer._id] = buyer;
        });
        return buyerMap;
      }
      return {};
    } catch (error) {
      console.error('[Logistics] Error fetching buyers from admin endpoint:', error);
      return {};
    }
  };

  // Fetch buyer details to enrich order data with full user information
  const fetchBuyerDetails = async (email: string, buyerId?: string, buyerMap?: Record<string, any>) => {
    // First try to use the pre-fetched buyer map
    if (buyerMap) {
      const buyerByEmail = buyerMap[email?.toLowerCase()];
      if (buyerByEmail) {
        console.log(`[Logistics] Found buyer in map for ${email}:`, buyerByEmail);
        return buyerByEmail;
      }
      
      if (buyerId) {
        const buyerById = buyerMap[buyerId];
        if (buyerById) {
          console.log(`[Logistics] Found buyer in map by ID ${buyerId}:`, buyerById);
          return buyerById;
        }
      }
    }

    // Fallback to fetching by email
    try {
      const response = await fetch(`/api/buyers/${encodeURIComponent(email)}?type=email`);
      
      if (response.ok) {
        const buyerData = await response.json();
        console.log(`[Logistics] Fetched buyer by email ${email}:`, buyerData);
        return buyerData;
      }
      
      // Fallback to buyerId if available
      if (buyerId) {
        const fallbackResponse = await fetch(`/api/buyers/${buyerId}`);
        if (fallbackResponse.ok) {
          const buyerData = await fallbackResponse.json();
          console.log(`[Logistics] Fetched buyer by ID ${buyerId}:`, buyerData);
          return buyerData;
        }
      }
      
      return null;
    } catch (error) {
      console.error(`[Logistics] Error fetching buyer details for ${email}:`, error);
      return null;
    }
  };

  // Fetch custom order details to get deliveryDetails field
  const fetchCustomOrderDetails = async (orderId: string) => {
    try {
      const response = await fetch(`/api/custom-orders?id=${orderId}`);
      if (response.ok) {
        const data = await response.json();
        
        // The API returns an array for GET, but for a specific id query it should return one
        // If it's an array, get the first item
        const orderData = Array.isArray(data) ? data[0] : data;
        
        console.log(`[Logistics] Fetched custom order ${orderId}:`, {
          deliveryDetails: orderData?.deliveryDetails,
          address: orderData?.address,
          city: orderData?.city,
          state: orderData?.state,
        });
        
        return orderData;
      }
      return null;
    } catch (error) {
      console.error(`[Logistics] Error fetching custom order details for ${orderId}:`, error);
      return null;
    }
  };

  // Enrich orders with full user and delivery details
  const enrichOrders = async (orders: any[], buyerMap?: Record<string, any>) => {
    const enrichedList = await Promise.all(
      orders.map(async (order) => {
        // Fetch buyer profile for general user info
        const buyerDetails = await fetchBuyerDetails(order.email, order.buyerId, buyerMap);
        
        // Fetch custom order details to get deliveryDetails field
        const customOrderDetails = await fetchCustomOrderDetails(order._id);
        
        const enrichedOrder = {
          ...order,
          userDetails: buyerDetails || {
            email: order.email,
            fullName: order.fullName || 'Unknown',
            phone: order.phone || 'N/A',
            address: order.address || 'Not provided',
            city: order.city || 'Not provided',
            state: order.state || 'Not provided',
          },
          // Include delivery details from custom order
          deliveryDetails: customOrderDetails?.deliveryDetails || order.deliveryDetails || {},
        };

        console.log(`[Logistics] Enriched order ${order.orderNumber}:`, {
          userName: enrichedOrder.userDetails.fullName,
          userEmail: enrichedOrder.userDetails.email,
          userAddress: enrichedOrder.userDetails.address,
          userCity: enrichedOrder.userDetails.city,
          userState: enrichedOrder.userDetails.state,
        });

        return enrichedOrder;
      })
    );
    return enrichedList;
  };

  useEffect(() => {
    const loadAndEnrichOrders = async () => {
      try {
        // First, fetch all buyers from admin endpoint for quick lookup
        console.log('[Logistics] 🔍 Fetching all buyers from admin endpoint...');
        const buyerMap = await fetchBuyerDetailsFromAdmin();
        console.log('[Logistics] ✅ Buyer map loaded with', Object.keys(buyerMap).length, 'keys');

        // Load active orders (from production team)
        const storedOrders = sessionStorage.getItem('logistics_orders');
        console.log('[Logistics] 📦 sessionStorage "logistics_orders":', storedOrders);
        const parsedOrders = storedOrders ? JSON.parse(storedOrders) : [];
        console.log('[Logistics] ✅ Parsed', parsedOrders.length, 'active orders');
        
        // Load shipped orders
        const storedShipped = sessionStorage.getItem('logistics_shipped_orders');
        console.log('[Logistics] 📦 sessionStorage "logistics_shipped_orders":', storedShipped);
        const parsedShipped = storedShipped ? JSON.parse(storedShipped) : [];
        console.log('[Logistics] ✅ Parsed', parsedShipped.length, 'shipped orders');

        setOrdersData(Array.isArray(parsedOrders) ? parsedOrders : []);
        setShippedOrders(Array.isArray(parsedShipped) ? parsedShipped : []);

        // Enrich orders with user details
        if (parsedOrders.length > 0) {
          console.log('[Logistics] 🔄 Enriching', parsedOrders.length, 'active orders...');
          const enriched = await enrichOrders(parsedOrders, buyerMap);
          console.log('[Logistics] ✅ Enriched active orders:', enriched);
          setEnrichedOrders(enriched);
        } else {
          console.log('[Logistics] ⚠️ No active orders in sessionStorage');
        }

        if (parsedShipped.length > 0) {
          console.log('[Logistics] 🔄 Enriching', parsedShipped.length, 'shipped orders...');
          const enrichedShipped = await enrichOrders(parsedShipped, buyerMap);
          console.log('[Logistics] ✅ Enriched shipped orders:', enrichedShipped);
          setEnrichedShippedOrders(enrichedShipped);
        } else {
          console.log('[Logistics] ⚠️ No shipped orders in sessionStorage');
        }
      } catch (error) {
        console.error('[Logistics] ❌ Error retrieving orders data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAndEnrichOrders();
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

  if (!isMounted) return null;

  const content = (
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
        {activeTab === 'active' && enrichedOrders.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {enrichedOrders.map((order) => (
              <LogisticsOrderCard
                key={order._id}
                order={order}
                onMarkShipped={() => setShippingConfirmModal(order._id)}
                onDelete={() => deleteOrder(order._id)}
                formatCurrency={formatCurrency}
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
        {activeTab === 'shipped' && enrichedShippedOrders.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {enrichedShippedOrders.map((order) => (
              <LogisticsOrderCard
                key={order._id}
                order={order}
                onMarkShipped={() => {}}
                onDelete={() => deleteOrder(order._id)}
                formatCurrency={formatCurrency}
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

  if (isMobile) {
    return (
      <MobileAdminLayout>
        {content}
      </MobileAdminLayout>
    );
  }

  return content;
}

// Wrap with permission guard
export default function LogisticsPage() {
  return (
    <PermissionGuard requiredPermission="view_logistics">
      <LogisticsPageContent />
    </PermissionGuard>
  );
}
