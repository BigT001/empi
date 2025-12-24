"use client";

import { useEffect, useState, useRef } from "react";
import { Truck, Loader2, MessageSquare, Phone, Check, Package } from "lucide-react";
import { ChatModal } from "@/app/components/ChatModal";
import MobileAdminLayout from "../mobile-layout";
import { DeliveryOrdersTab } from "./components/DeliveryOrdersTab";
import { PickupOrdersTab } from "./components/PickupOrdersTab";
import { CompletedOrdersTab } from "./components/CompletedOrdersTab";
import { SettingsPanel } from "./components/SettingsPanel";
import { TabNavigation } from "./components/TabNavigation";
import { LogisticsOrder, Message } from "./types";

export default function LogisticsPage() {
  const [orders, setOrders] = useState<LogisticsOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'delivery' | 'pickup' | 'completed' | 'settings'>('delivery');
  const [deliverySubTab, setDeliverySubTab] = useState<'approved' | 'pending' | 'in-progress' | 'delivered'>('approved');
  const [isMobile, setIsMobile] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const isFetchingRef = useRef(false);
  
  // Settings state
  const [paymentCards, setPaymentCards] = useState<any[]>([]);
  const [loadingSettings, setLoadingSettings] = useState(false);
  
  // ChatModal state
  const [chatModalOpen, setChatModalOpen] = useState<string | null>(null);
  const [selectedOrderForChat, setSelectedOrderForChat] = useState<LogisticsOrder | null>(null);

  useEffect(() => {
    fetchLogisticsOrders();
    
    const interval = setInterval(() => {
      if (!isFetchingRef.current) {
        fetchLogisticsOrders(true);
      }
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setIsMounted(true);
    
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const loadPaymentCards = async () => {
    try {
      setLoadingSettings(true);
      const res = await fetch('/api/logistics/payment-settings');
      if (res.ok) {
        const data = await res.json();
        setPaymentCards(data.paymentCards || []);
      }
    } catch (error) {
      console.error('Error loading payment settings:', error);
    } finally {
      setLoadingSettings(false);
    }
  };

  const handleAddPaymentCard = async (cardData: { bankName: string; accountNumber: string; accountHolderName: string }) => {
    try {
      const res = await fetch('/api/logistics/payment-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cardData),
      });

      if (res.ok) {
        const data = await res.json();
        setPaymentCards(data.paymentCards || []);
      } else {
        const error = await res.json();
        throw new Error(error.error || 'Failed to save payment card');
      }
    } catch (error) {
      console.error('Error saving payment card:', error);
      throw error;
    }
  };

  const handleDeletePaymentCard = async (cardId: string) => {
    try {
      const res = await fetch(`/api/logistics/payment-settings?cardId=${cardId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        const data = await res.json();
        setPaymentCards(data.paymentCards || []);
      } else {
        const error = await res.json();
        throw new Error(error.error || 'Failed to delete payment card');
      }
    } catch (error) {
      console.error('Error deleting payment card:', error);
      throw error;
    }
  };

  const handleSetActivePaymentCard = async (cardId: string) => {
    try {
      const res = await fetch('/api/logistics/payment-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardId, active: true }),
      });

      if (res.ok) {
        const data = await res.json();
        setPaymentCards(data.paymentCards || []);
      } else {
        throw new Error('Failed to update card');
      }
    } catch (error) {
      console.error('Error updating card:', error);
      throw error;
    }
  };

  const joinConversation = (order: LogisticsOrder) => {
    console.log('[Logistics] 💬 Opening chat for order:', {
      orderId: order._id,
      orderNumber: order.orderNumber,
      fullName: order.fullName,
      isCustomOrder: (order as any)._isCustomOrder,
    });
    
    const isCustomOrder = (order as any)._isCustomOrder;
    
    setSelectedOrderForChat(order);
    setChatModalOpen(order._id);
    console.log('[Logistics] 🔓 Chat modal opened for order:', order._id);
    
    if (isCustomOrder) {
      fetch('/api/orders/handoff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order._id,
          orderNumber: order.orderNumber,
        }),
      }).then(response => {
        console.log('[Logistics] Handoff response status:', response.status);
        if (response.ok) {
          response.json().then(data => {
            console.log('[Logistics] ✅ Handoff successful:', data);
          });
        } else {
          console.error('[Logistics] ❌ Handoff failed');
        }
      }).catch(error => {
        console.error('[Logistics] ❌ Error in handoff:', error);
      });
    } else {
      console.log('[Logistics] ℹ️ Regular order - no handoff needed');
    }
  };

  const fetchLogisticsOrders = async (isBackground = false) => {
    if (isFetchingRef.current) return;
    
    isFetchingRef.current = true;
    if (!isBackground) setLoading(true);
    
    try {
      const [customOrdersRes, regularOrdersRes] = await Promise.all([
        fetch('/api/custom-orders'),
        fetch('/api/orders')
      ]);
      
      if (!customOrdersRes.ok || !regularOrdersRes.ok) {
        throw new Error('Failed to fetch orders');
      }
      
      const customData = await customOrdersRes.json();
      const regularData = await regularOrdersRes.json();
      
      const customOrdersList = (customData.orders || customData.data) || [];
      const regularOrdersList = regularData.orders || [];
      
      let allOrders = customOrdersList.map((o: any) => ({ ...o, _isCustomOrder: true }));
      allOrders = allOrders.concat(regularOrdersList.map((o: any) => ({ ...o, _isCustomOrder: false })));
      
      console.log('📦 Fetched:', customOrdersList.length, 'custom orders,', regularOrdersList.length, 'regular orders');
      
      const logisticsOrders = allOrders.filter((order: any) => order._id);
      
      setOrders(prevOrders => {
        const hasChanged = prevOrders.length !== logisticsOrders.length ||
          prevOrders.some((p, i) => p._id !== logisticsOrders[i]?._id);
        
        return hasChanged ? logisticsOrders : prevOrders;
      });
    } catch (error) {
      console.error('Error fetching logistics orders:', error);
    } finally {
      if (!isBackground) setLoading(false);
      isFetchingRef.current = false;
    }
  };

  const validOrders = orders.filter((o: any) => {
    const isCustomOrder = !!o.deliveryOption;
    const isRegularOrder = !!o.shippingType;
    
    if (isCustomOrder) {
      return o.status !== 'rejected' && 
             o.status !== 'pending' &&
             (o.deliveryOption === 'pickup' || o.deliveryOption === 'delivery');
    } else if (isRegularOrder) {
      return o.status !== 'cancelled' && 
             o.status !== 'rejected' &&
             (o.shippingType === 'self' || o.shippingType === 'empi');
    }
    return false;
  });
  
  const pickupOrders = validOrders.filter((o: any) => {
    const isPickup = o.deliveryOption === 'pickup' || o.shippingType === 'self';
    return isPickup && o.status !== 'completed';
  });
  
  const allDeliveryOrders = validOrders.filter((o: any) => {
    const isDelivery = o.deliveryOption === 'delivery' || o.shippingType === 'empi';
    return isDelivery;
  });
  
  const approvedDeliveryOrders = allDeliveryOrders.filter(o => o.status === 'payment_confirmed' || o.status === 'confirmed');
  const pendingDeliveryOrders = allDeliveryOrders.filter(o => o.status === 'ready' || o.status === 'pending');
  const inProgressDeliveryOrders = allDeliveryOrders.filter(o => o.status === 'in-progress');
  const deliveredDeliveryOrders = allDeliveryOrders.filter((o: any) => o.status === 'completed');
  const deliveryOrders = deliverySubTab === 'approved' ? approvedDeliveryOrders :
                         deliverySubTab === 'pending' ? pendingDeliveryOrders : 
                         deliverySubTab === 'in-progress' ? inProgressDeliveryOrders :
                         deliverySubTab === 'delivered' ? deliveredDeliveryOrders : [];
  
  const completedOrders = orders.filter((o: any) => o.status === 'completed' && (o.deliveryOption === 'pickup' || o.deliveryOption === 'delivery' || o.shippingType === 'self' || o.shippingType === 'empi'));

  if (!isMounted) {
    return null;
  }

  if (isMobile) {
    return (
      <MobileAdminLayout>
        <div className="min-h-screen bg-gray-50 pb-6 p-4">
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-green-100 rounded-lg p-3">
                <Truck className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Logistics</h1>
                <p className="text-sm text-gray-600 mt-1">Manage deliveries & pickups</p>
              </div>
            </div>
          </div>

          <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-hide">
            {[
              { id: 'delivery', label: 'Delivery', count: allDeliveryOrders.length },
              { id: 'pickup', label: 'Pickup', count: pickupOrders.length },
              { id: 'completed', label: 'Completed', count: completedOrders.length },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as 'pickup' | 'delivery' | 'completed');
                  if (tab.id === 'delivery') setDeliverySubTab('approved');
                }}
                className={`px-4 py-2 rounded-lg whitespace-nowrap font-semibold text-sm transition ${
                  activeTab === tab.id
                    ? 'bg-lime-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-200'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>

          {activeTab === 'delivery' && (
            <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-hide">
              {[
                { id: 'pending', label: 'Pending', count: pendingDeliveryOrders.length },
                { id: 'approved', label: 'Approved', count: approvedDeliveryOrders.length },
                { id: 'in-progress', label: 'In Progress', count: inProgressDeliveryOrders.length },
                { id: 'delivered', label: 'Delivered', count: deliveredDeliveryOrders.length },
              ].map((subTab) => (
                <button
                  key={subTab.id}
                  onClick={() => setDeliverySubTab(subTab.id as 'approved' | 'pending' | 'in-progress' | 'delivered')}
                  className={`px-3 py-2 rounded-lg whitespace-nowrap font-semibold text-sm transition ${
                    deliverySubTab === subTab.id
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700 border border-gray-300'
                  }`}
                >
                  {subTab.label} ({subTab.count})
                </button>
              ))}
            </div>
          )}

          <div className="space-y-4">
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-lime-600" />
              </div>
            ) : (activeTab === 'delivery' ? deliveryOrders : activeTab === 'pickup' ? pickupOrders : completedOrders).length === 0 ? (
              <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-8 text-center">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 font-medium">No orders in this category</p>
              </div>
            ) : (
              (activeTab === 'delivery' ? deliveryOrders : activeTab === 'pickup' ? pickupOrders : completedOrders).map((order) => (
                <div key={order._id} className="bg-white rounded-lg border border-gray-200 p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <p className="text-lg font-bold text-gray-900 mb-1">👤 {order.fullName}</p>
                      <h3 className="font-semibold text-gray-700 text-sm">Order #{order.orderNumber}</h3>
                    </div>
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded ml-2">
                      {order.status}
                    </span>
                  </div>

                  <div className="space-y-2 text-sm mb-4">
                    {order.address && (
                      <p className="text-gray-600">
                        <span className="font-medium">Address:</span> {order.address}
                      </p>
                    )}
                    {order.city && (
                      <p className="text-gray-600">
                        <span className="font-medium">City:</span> {order.city}
                      </p>
                    )}
                    {order.phone && (
                      <p className="text-gray-600 flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        {order.phone}
                      </p>
                    )}
                  </div>

                  <button
                    onClick={() => joinConversation(order)}
                    className="w-full px-3 py-2 bg-lime-600 text-white rounded-lg font-semibold text-sm hover:bg-lime-700 transition flex items-center justify-center gap-2"
                  >
                    <MessageSquare className="h-4 w-4" />
                    Message
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </MobileAdminLayout>
    );
  }

  // Desktop view
  return (
    <div className="w-full h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between flex-shrink-0 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-100 rounded-lg">
            <Truck className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Logistics</h1>
            <p className="text-xs text-gray-500">Manage deliveries & pickups</p>
          </div>
        </div>
        <button 
          onClick={() => fetchLogisticsOrders()}
          className="px-4 py-2 bg-lime-600 text-white font-semibold rounded-lg hover:bg-lime-700 transition"
        >
          🔄 Refresh
        </button>
      </div>

      {/* Main Content - Scrollable */}
      <div className="flex-1 overflow-auto">
        <div className="px-6 py-4">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <Truck className="h-8 w-8 text-lime-600 animate-spin" />
            </div>
          ) : (
            <>
              {/* Tab Navigation */}
              <TabNavigation
                activeTab={activeTab}
                onTabChange={(tab) => {
                  setActiveTab(tab);
                  if (tab === 'delivery') setDeliverySubTab('approved');
                  if (tab === 'settings') loadPaymentCards();
                }}
                deliveryCount={allDeliveryOrders.length}
                pickupCount={pickupOrders.length}
                completedCount={completedOrders.length}
              />

              {/* Delivery Tab */}
              {activeTab === 'delivery' && (
                <DeliveryOrdersTab
                  deliverySubTab={deliverySubTab}
                  setDeliverySubTab={setDeliverySubTab}
                  pendingDeliveryOrders={pendingDeliveryOrders}
                  approvedDeliveryOrders={approvedDeliveryOrders}
                  inProgressDeliveryOrders={inProgressDeliveryOrders}
                  deliveredDeliveryOrders={deliveredDeliveryOrders}
                  allDeliveryOrders={allDeliveryOrders}
                  onJoinConversation={(order) => joinConversation(order)}
                />
              )}

              {/* Pickup Tab */}
              {activeTab === 'pickup' && (
                <PickupOrdersTab
                  pickupOrders={pickupOrders}
                  onJoinConversation={joinConversation}
                />
              )}

              {/* Completed Tab */}
              {activeTab === 'completed' && (
                <CompletedOrdersTab
                  completedOrders={completedOrders}
                  onJoinConversation={joinConversation}
                />
              )}

              {/* Settings Tab */}
              {activeTab === 'settings' && (
                <SettingsPanel
                  paymentCards={paymentCards}
                  onAddCard={handleAddPaymentCard}
                  onDeleteCard={handleDeletePaymentCard}
                  onSetActive={handleSetActivePaymentCard}
                />
              )}
            </>
          )}
        </div>
      </div>

      {/* ChatModal for selected order */}
      {chatModalOpen && selectedOrderForChat && (
        <ChatModal
          isOpen={!!chatModalOpen}
          onClose={() => {
            setChatModalOpen(null);
            setSelectedOrderForChat(null);
            fetchLogisticsOrders();
          }}
          order={selectedOrderForChat}
          userEmail="logistics@empi.com"
          userName="Logistics Team"
          isAdmin={true}
          isLogisticsTeam={true}
          deliveryOption={selectedOrderForChat?.deliveryOption}
          adminName="Logistics Team"
          orderStatus="ready"
          onMessageSent={() => {
            console.log('[Logistics] 🔄 Refreshing orders after message');
            fetchLogisticsOrders();
          }}
        />
      )}
    </div>
  );
}
