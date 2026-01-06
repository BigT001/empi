"use client";

import { useEffect, useState, useRef } from "react";
import { Truck, Loader2, Package, Phone, MessageSquare, Send, Check } from "lucide-react";
import { ChatModal } from "@/app/components/ChatModal";
import MobileAdminLayout from "../mobile-layout";
import { DeliveryOrdersTab } from "./components/DeliveryOrdersTab";
import { PickupOrdersTab } from "./components/PickupOrdersTab";
import { CompletedOrdersTab } from "./components/CompletedOrdersTab";
import { SettingsPanel } from "./components/SettingsPanel";
import { TabNavigation } from "./components/TabNavigation";

interface LogisticsOrder {
  _id: string;
  orderNumber: string;
  fullName: string;
  email: string;
  phone: string;
  address?: string;
  city: string;
  state?: string;
  description?: string;
  quantity: number;
  status: string;
  deliveryDate?: string;
  createdAt: string;
  updatedAt: string;
  deliveryOption?: 'pickup' | 'delivery';
  shippingType?: 'self' | 'empi' | 'standard';
  currentHandler?: 'production' | 'logistics';
  handoffAt?: string;
  images?: string[];
  designUrls?: string[];
  productId?: string;
  paymentConfirmedAt?: string;
  _isCustomOrder?: boolean;
}

export default function LogisticsPage() {
  const [orders, setOrders] = useState<LogisticsOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'delivery' | 'pickup' | 'completed' | 'settings'>('delivery');
  const [deliverySubTab, setDeliverySubTab] = useState<'pending' | 'approved' | 'in-progress' | 'delivered'>('pending');
  const [isMobile, setIsMobile] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const isFetchingRef = useRef(false);
  
  // Settings state
  const [paymentCards, setPaymentCards] = useState<{_id: string; bankName: string; accountNumber: string; accountHolderName: string; active: boolean; createdAt: string}[]>([]);
  
  // ChatModal state
  const [chatModalOpen, setChatModalOpen] = useState<string | null>(null);
  const [selectedOrderForChat, setSelectedOrderForChat] = useState<LogisticsOrder | null>(null);
  
  // Quote modal state
  const [quoteModalOrder, setQuoteModalOrder] = useState<LogisticsOrder | null>(null);
  const [quoteAmount, setQuoteAmount] = useState('');
  const [deliveryType, setDeliveryType] = useState<'bike' | 'car' | 'van' | ''>('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountHolderName, setAccountHolderName] = useState('');
  const [sendingQuote, setSendingQuote] = useState(false);

  // Payment confirmation modal state
  const [paymentConfirmModalOrder, setPaymentConfirmModalOrder] = useState<LogisticsOrder | null>(null);
  const [paymentReceived, setPaymentReceived] = useState(false);
  const [confirmingPayment, setConfirmingPayment] = useState(false);

  useEffect(() => {
    fetchLogisticsOrders();
    
    // Background refresh every 5 seconds without causing page blink
    const interval = setInterval(() => {
      if (!isFetchingRef.current) {
        fetchLogisticsOrders(true); // Pass true to indicate background refresh
      }
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);

  // Mobile detection
  useEffect(() => {
    setIsMounted(true);
    
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Load payment cards settings
  const loadPaymentCards = async () => {
    try {
      const res = await fetch('/api/logistics/payment-settings');
      if (res.ok) {
        const data = await res.json();
        setPaymentCards(data.paymentCards || []);
      }
    } catch (error) {
      console.error('Error loading payment settings:', error);
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
      console.error('Error adding payment card:', error);
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

  const joinConversation = async (order: LogisticsOrder) => {
    try {
      console.log('[Logistics] 💬 Opening chat for order:', {
        orderId: order._id,
        orderNumber: order.orderNumber,
        fullName: order.fullName,
        isCustomOrder: (order as unknown as { _isCustomOrder?: boolean })._isCustomOrder,
      });
      
      // Check if this is a custom order (supports handoff) or regular order
      const isCustomOrder = (order as unknown as { _isCustomOrder?: boolean })._isCustomOrder;
      
      if (isCustomOrder) {
        // Custom orders support handoff API
        const response = await fetch('/api/orders/handoff', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: order._id,
            orderNumber: order.orderNumber,
          }),
        });

        console.log('[Logistics] Handoff response status:', response.status);
        
        if (!response.ok) {
          let errorData = {};
          try {
            errorData = await response.json();
          } catch {
            console.warn('[Logistics] Could not parse error response as JSON');
          }
          
          const errorMessage = (errorData as unknown as { message?: string; error?: string })?.message || (errorData as unknown as { message?: string; error?: string })?.error || 'Failed to hand off order';
          console.error('[Logistics] ❌ Handoff failed:', {
            status: response.status,
            message: errorMessage,
            orderId: order._id,
            orderNumber: order.orderNumber,
          });
        } else {
          const data = await response.json();
          console.log('[Logistics] ✅ Handoff successful:', data);
        }
      } else {
        // Regular orders don't support handoff
        console.log('[Logistics] ℹ️ Regular order - no handoff needed');
      }
      
      // Open chat for both custom and regular orders
      setSelectedOrderForChat(order);
      setChatModalOpen(order._id);
      console.log('[Logistics] 🔓 Chat modal opened for order:', order._id);
    } catch (error) {
      console.error('[Logistics] ❌ Error joining conversation:', error);
      // Still try to open chat on error
      setSelectedOrderForChat(order);
      setChatModalOpen(order._id);
    }
  };

  const sendDeliveryQuote = async () => {
    if (!quoteModalOrder || !quoteAmount || !deliveryType || !bankName || !accountNumber || !accountHolderName || sendingQuote) return;
    
    setSendingQuote(true);
    try {
      const deliveryTypeLabel: Record<'bike' | 'car' | 'van', string> = {
        bike: '🏍️ Bike',
        car: '🚗 Car',
        van: '🚐 Van'
      };

      // Send quote data as JSON for proper React rendering
      const quoteData = {
        amount: Number(quoteAmount),
        transportType: deliveryTypeLabel[deliveryType as 'bike' | 'car' | 'van'],
        bankName: bankName,
        accountNumber: accountNumber,
        accountHolder: accountHolderName
      };

      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: quoteModalOrder._id,
          orderNumber: quoteModalOrder.orderNumber,
          senderEmail: 'logistics@empi.com',
          senderName: 'Logistics Team',
          senderType: 'admin',
          content: JSON.stringify(quoteData),
          messageType: 'quote',
          recipientType: 'all',
        }),
      });

      if (response.ok) {
        setQuoteModalOrder(null);
        setQuoteAmount('');
        setDeliveryType('');
        setBankName('');
        setAccountNumber('');
        setAccountHolderName('');
      }
    } catch (error) {
      console.error('Error sending delivery quote:', error);
      alert('Failed to send quote. Please try again.');
    } finally {
      setSendingQuote(false);
    }
  };

  // Confirm payment from customer
  const handleConfirmPayment = async () => {
    if (!paymentConfirmModalOrder) return;
    
    setConfirmingPayment(true);
    try {
      const isDeliveryCompletion = paymentConfirmModalOrder.status === 'in-progress';
      
      // Determine if this is a custom order or regular order
      const isCustomOrder = !!paymentConfirmModalOrder.deliveryOption;
      const endpoint = isCustomOrder ? '/api/custom-orders' : '/api/orders';
      
      console.log('[Logistics] Processing:', isDeliveryCompletion ? 'Delivery completion' : 'Payment confirmation', 'for order:', paymentConfirmModalOrder.orderNumber);
      console.log('[Logistics] Order type:', isCustomOrder ? 'Custom Order' : 'Regular Order');
      
      // If this is a delivery completion (in-progress order and Yes is selected)
      if (isDeliveryCompletion && paymentReceived === true) {
        console.log('[Logistics] 📦 Marking order as completed for order ID:', paymentConfirmModalOrder._id);
        const updateResponse = await fetch(`${endpoint}/${paymentConfirmModalOrder._id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: 'completed'
          }),
        });

        const updateData = await updateResponse.json();
        
        if (updateResponse.ok) {
          console.log('[Logistics] ✅ Order marked as completed:', updateData);
          alert('✅ Delivery confirmed! Order moved to Delivered tab.');
          setPaymentConfirmModalOrder(null);
          setPaymentReceived(false);
          fetchLogisticsOrders();
          return;
        } else {
          console.error('[Logistics] ⚠️ Failed to update order status. Status:', updateResponse.status);
          console.error('[Logistics] Response:', updateData);
          alert('Failed to mark delivery as complete. Please try again.');
          return;
        }
      }

      // Original payment confirmation flow for pending/ready orders
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderNumber: paymentConfirmModalOrder.orderNumber, // Use orderNumber as primary identifier
          orderId: paymentConfirmModalOrder._id, // Include orderId as backup
          senderEmail: 'logistics@empi.com',
          senderName: 'Logistics Team',
          senderType: 'admin',
          content: paymentReceived 
            ? '✅ Payment confirmed! We have received your payment. Delivery is scheduled and will be processed shortly. Thank you!'
            : '⏳ Payment pending - we are still waiting for payment to be completed. Please make the transfer to the provided bank account.',
          messageType: 'text',
          paymentConfirmed: paymentReceived,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[Logistics] ❌ Failed to send message:', {
          status: response.status,
          error: errorText,
          orderId: paymentConfirmModalOrder._id,
          orderNumber: paymentConfirmModalOrder.orderNumber,
        });
        alert(`Failed to send confirmation: ${errorText}`);
        throw new Error(`Failed to send confirmation: ${response.status}`);
      }
      
      console.log('[Logistics] ✅ Payment confirmation sent');
      
      // Close modal first
      setPaymentConfirmModalOrder(null);
      setPaymentReceived(false);
      
      // Show success message
      alert(paymentReceived ? 'Payment confirmed! Customer notified.' : 'Pending notification sent to customer.');
      
      // If payment was confirmed, switch to "In Progress" tab to show the updated order
      if (paymentReceived && activeTab === 'delivery') {
        setDeliverySubTab('in-progress');
      }
      
      // Add a small delay before refreshing to ensure backend has processed the message
      console.log('[Logistics] ⏳ Waiting 500ms before refreshing orders...');
      setTimeout(() => {
        console.log('[Logistics] 🔄 Refreshing orders after payment confirmation');
        fetchLogisticsOrders();
      }, 500);
    } catch (error) {
      console.error('[Logistics] Error confirming payment:', error);
      alert('Error confirming payment. Please try again.');
    } finally {
      setConfirmingPayment(false);
    }
  };

  const fetchLogisticsOrders = async (isBackground = false) => {
    if (isFetchingRef.current) return;
    
    isFetchingRef.current = true;
    if (!isBackground) setLoading(true);
    
    try {
      // Fetch both custom orders and regular orders
      // Regular orders use shippingType (self/empi) while custom orders use deliveryOption (pickup/delivery)
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
      
      // Deduplicate orders - keep track of IDs we've seen
      const seenIds = new Set<string>();
      const allOrders: (LogisticsOrder & { _isCustomOrder?: boolean })[] = [];
      
      // Add custom orders first
      customOrdersList.forEach((o: LogisticsOrder) => {
        if (!seenIds.has(o._id)) {
          seenIds.add(o._id);
          allOrders.push({ ...o, _isCustomOrder: true });
        }
      });
      
      // Add regular orders, skipping any already added
      regularOrdersList.forEach((o: LogisticsOrder) => {
        if (!seenIds.has(o._id)) {
          seenIds.add(o._id);
          allOrders.push({ ...o, _isCustomOrder: false });
        }
      });
      
      console.log('📦 Fetched:', customOrdersList.length, 'custom orders,', regularOrdersList.length, 'regular orders, deduplicated to', allOrders.length);
      
      // Show all orders regardless of status for logistics to manage
      const logisticsOrders = allOrders.filter((order: LogisticsOrder & { _isCustomOrder?: boolean }) => 
        order._id // Just check if order exists
      );
      
      // Only update state if orders actually changed to prevent page blink
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

  // Show orders that have a delivery option selected (pickup or delivery)
  // Exclude only rejected and cancelled statuses
  // This way orders appear in logistics once customer selects their delivery preference
  // Handle both custom orders (deliveryOption) and regular orders (shippingType)
  const validOrders = orders.filter((o: LogisticsOrder) => {
    const isCustomOrder = !!o.deliveryOption;
    const isRegularOrder = !!o.shippingType;
    
    if (isCustomOrder) {
      // For custom orders: exclude rejected and pending statuses, but include all delivery options
      const isValid = o.status !== 'rejected' && 
             o.status !== 'pending' &&
             (o.deliveryOption === 'pickup' || o.deliveryOption === 'delivery');
      
      if (!isValid && o.orderNumber === 'DEBUG') {
        console.log('[Logistics Filter] Custom order excluded:', { orderNumber: o.orderNumber, status: o.status, deliveryOption: o.deliveryOption });
      }
      
      return isValid;
    } else if (isRegularOrder) {
      // For regular orders: exclude cancelled and rejected
      return o.status !== 'cancelled' && 
             o.status !== 'rejected' &&
             (o.shippingType === 'self' || o.shippingType === 'empi');
    }
    return false;
  });
  
  // Split by delivery type:
  // Custom orders: 'pickup' → Personal Pickup, 'delivery' → Empi Delivery
  // Regular orders: 'self' → Personal Pickup, 'empi' → Empi Delivery
  // NOTE: Pickup orders show ALL statuses (pending, ready, confirmed, in-progress, completed)
  // They should stay in Pickup tab regardless of status
  const pickupOrders = validOrders.filter((o: LogisticsOrder) => {
    const isPickup = o.deliveryOption === 'pickup' || o.shippingType === 'self';
    return isPickup;
  });
  
  const allDeliveryOrders = validOrders.filter((o: LogisticsOrder) => {
    const isDelivery = o.deliveryOption === 'delivery' || o.shippingType === 'empi';
    return isDelivery;
  });
  
  // Further split delivery orders by status
  const pendingDeliveryOrders = allDeliveryOrders.filter(o => o.status === 'ready' || o.status === 'confirmed' || o.status === 'pending');
  const approvedDeliveryOrders = allDeliveryOrders.filter(o => o.status === 'approved');
  const inProgressDeliveryOrders = allDeliveryOrders.filter(o => o.status === 'in-progress');
  const deliveredDeliveryOrders = allDeliveryOrders.filter((o: LogisticsOrder) => o.status === 'completed');
  const deliveryOrders = deliverySubTab === 'pending' ? pendingDeliveryOrders : 
                         deliverySubTab === 'approved' ? approvedDeliveryOrders :
                         deliverySubTab === 'in-progress' ? inProgressDeliveryOrders :
                         deliverySubTab === 'delivered' ? deliveredDeliveryOrders : [];
  
  const completedOrders = orders.filter((o: LogisticsOrder) => {
    // Show completed orders that don't have a delivery method yet (no pickup/delivery selected)
    // Pickup orders are handled in the Pickup tab, delivery orders in the Delivery tab
    const isPickup = o.deliveryOption === 'pickup' || o.shippingType === 'self';
    const isDelivery = o.deliveryOption === 'delivery' || o.shippingType === 'empi';
    return o.status === 'completed' && !isPickup && !isDelivery;
  });

  // Debug logging
  console.log('📍 Pickup orders:', pickupOrders.length, pickupOrders);
  console.log('🚚 Delivery orders:', deliveryOrders.length, deliveryOrders);
  console.log('📊 All orders fetched:', orders.length);
  console.log('📊 Valid orders (after filter):', validOrders.length);
  
  // Show all ready orders and their deliveryOption values for debugging
  console.log('📊 All ready orders breakdown:');
  validOrders.forEach(o => {
    console.log(`- ${o.orderNumber}: status=${o.status}, deliveryOption=${o.deliveryOption}, currentHandler=${o.currentHandler}`);
  });

  // Show mobile view on small screens
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

          {/* Tab Navigation */}
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
                  if (tab.id === 'delivery') setDeliverySubTab('pending');
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

          {/* Delivery Sub-Tabs */}
          {activeTab === 'delivery' && (
            <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-hide">
              {[
                { id: 'pending', label: 'Pending', count: pendingDeliveryOrders.length },
                { id: 'in-progress', label: 'In Progress', count: inProgressDeliveryOrders.length },
                { id: 'delivered', label: 'Delivered', count: deliveredDeliveryOrders.length },
              ].map((subTab) => (
                <button
                  key={subTab.id}
                  onClick={() => setDeliverySubTab(subTab.id as 'pending' | 'in-progress' | 'delivered')}
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

          {/* Orders List */}
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

  return (
    <div className="w-full h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shrink-0 shadow-sm">
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
              <TabNavigation
                activeTab={activeTab}
                onTabChange={(tab) => {
                  setActiveTab(tab);
                  if (tab === 'delivery') setDeliverySubTab('pending');
                  if (tab === 'settings') loadPaymentCards();
                }}
                deliveryCount={allDeliveryOrders.length}
                pickupCount={pickupOrders.length}
                completedCount={completedOrders.length}
              />

              {activeTab === 'delivery' && (
                <DeliveryOrdersTab
                  deliverySubTab={deliverySubTab}
                  setDeliverySubTab={setDeliverySubTab}
                  pendingDeliveryOrders={pendingDeliveryOrders}
                  approvedDeliveryOrders={[]}
                  inProgressDeliveryOrders={inProgressDeliveryOrders}
                  deliveredDeliveryOrders={deliveredDeliveryOrders}
                  allDeliveryOrders={allDeliveryOrders}
                  onJoinConversation={joinConversation}
                />
              )}

              {/* Pickup Tab */}
              {activeTab === 'pickup' && (
                <PickupOrdersTab
                  pickupOrders={pickupOrders}
                  onJoinConversation={joinConversation}
                />
              )}


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

      {/* Message Modal */}
      {/* ChatModal for selected order */}
      {chatModalOpen && selectedOrderForChat && (
        <ChatModal
          isOpen={!!chatModalOpen}
          onClose={() => {
            setChatModalOpen(null);
            setSelectedOrderForChat(null);
            // Refresh orders when modal closes
            fetchLogisticsOrders();
          }}
          order={selectedOrderForChat}
          userEmail="logistics@empi.com"
          userName="Logistics Team"
          isAdmin={true}
          isLogisticsTeam={true}
          deliveryOption={selectedOrderForChat?.deliveryOption}
          adminName="Logistics Team"
          orderStatus="ready" // Logistics always has orders in ready status
          onMessageSent={() => {
            // Refresh orders immediately when pickup is confirmed
            console.log('[Logistics] 🔄 Refreshing orders after pickup confirmation');
            fetchLogisticsOrders();
          }}
        />
      )}

      {/* Quote Modal */}
      {quoteModalOrder && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-linear-to-br from-white to-gray-50 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-gray-200">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <span className="text-3xl">💰</span>
                <h3 className="text-2xl font-black text-gray-900">Delivery Quote</h3>
              </div>
              <button
                onClick={() => {
                  setQuoteModalOrder(null);
                  setQuoteAmount('');
                  setDeliveryType('');
                  setBankName('');
                  setAccountNumber('');
                }}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                ✕
              </button>
            </div>

            {/* Order Info Card */}
            <div className="bg-linear-to-r from-blue-50 to-cyan-50 rounded-lg p-4 mb-6 border border-blue-200">
              <div className="space-y-2">
                <div>
                  <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide">Order Number</p>
                  <p className="text-lg font-bold text-gray-900">{quoteModalOrder.orderNumber}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide">Customer</p>
                  <p className="font-semibold text-gray-900">{quoteModalOrder.fullName}</p>
                </div>
              </div>
            </div>

            {/* Form Fields */}
            <div className="space-y-4 mb-6">
              {/* Delivery Type */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  🚚 Delivery Type
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setDeliveryType('bike')}
                    className={`py-3 px-2 rounded-lg font-bold text-sm transition border-2 ${
                      deliveryType === 'bike'
                        ? 'bg-green-600 text-white border-green-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    🏍️ Bike
                  </button>
                  <button
                    onClick={() => setDeliveryType('car')}
                    className={`py-3 px-2 rounded-lg font-bold text-sm transition border-2 ${
                      deliveryType === 'car'
                        ? 'bg-green-600 text-white border-green-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    🚗 Car
                  </button>
                  <button
                    onClick={() => setDeliveryType('van')}
                    className={`py-3 px-2 rounded-lg font-bold text-sm transition border-2 ${
                      deliveryType === 'van'
                        ? 'bg-green-600 text-white border-green-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    🚐 Van
                  </button>
                </div>
              </div>

              {/* Bank Details - 2x2 Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    🏦 Bank Name
                  </label>
                  <input
                    type="text"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="e.g., GTBank"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-600 text-sm font-medium"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    💳 Account Number
                  </label>
                  <input
                    type="text"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    placeholder="e.g., 1234567890"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-600 text-sm font-medium"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    👤 Account Holder Name
                  </label>
                  <input
                    type="text"
                    value={accountHolderName}
                    onChange={(e) => setAccountHolderName(e.target.value)}
                    placeholder="Account holder name"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-600 text-sm font-medium"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    💵 Delivery Amount (₦)
                  </label>
                  <input
                    type="number"
                    value={quoteAmount}
                    onChange={(e) => setQuoteAmount(e.target.value)}
                    placeholder="Enter delivery fee"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-600 text-sm font-medium"
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setQuoteModalOrder(null);
                  setQuoteAmount('');
                  setDeliveryType('');
                  setBankName('');
                  setAccountNumber('');
                  setAccountHolderName('');
                }}
                className="flex-1 px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-900 font-bold rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={sendDeliveryQuote}
                disabled={!quoteAmount || sendingQuote}
                className="flex-1 px-4 py-3 bg-linear-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-gray-300 disabled:to-gray-300 text-white font-bold rounded-lg transition flex items-center justify-center gap-2"
              >
                {sendingQuote ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Send Quote
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Confirmation Modal */}
      {paymentConfirmModalOrder && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in-95">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{paymentConfirmModalOrder.status === 'in-progress' ? '�' : '�💳'}</span>
                <h3 className="text-xl font-bold text-gray-900">
                  {paymentConfirmModalOrder.status === 'in-progress' ? 'Delivery Status' : 'Confirm Payment Status'}
                </h3>
              </div>
              <button
                onClick={() => {
                  setPaymentConfirmModalOrder(null);
                  setPaymentReceived(false);
                }}
                className="text-gray-400 hover:text-gray-600 font-bold text-xl w-8 h-8 flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            {/* Order Info Card */}
            <div className="bg-linear-to-r from-blue-50 to-cyan-50 rounded-lg p-4 mb-6 border-2 border-blue-200">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="text-xs text-gray-600 font-semibold uppercase">Order Number</p>
                  <p className="text-lg font-bold text-gray-900">#{paymentConfirmModalOrder.orderNumber}</p>
                </div>
              </div>
              <p className="text-sm text-gray-700 font-medium">
                Customer: <span className="font-bold">{paymentConfirmModalOrder.fullName || 'N/A'}</span>
              </p>
              <p className="text-sm text-gray-600 font-medium mt-1">
                Email: <span>{paymentConfirmModalOrder.email || 'N/A'}</span>
              </p>
            </div>

            {/* Conditional Content Based on Order Status */}
            {paymentConfirmModalOrder.status === 'in-progress' ? (
              <>
                {/* Delivered? Question */}
                <div className="mb-6">
                  <p className="text-lg font-bold text-gray-900 mb-4">Has the delivery been completed?</p>
                  <div className="space-y-3">
                    <button
                      onClick={() => {
                        setPaymentReceived(true);
                      }}
                      className={`w-full p-4 border-2 rounded-lg font-bold transition ${
                        paymentReceived === true
                          ? 'bg-green-100 border-green-600 text-green-900'
                          : 'bg-white border-gray-300 text-gray-900 hover:bg-green-50 hover:border-green-400'
                      }`}
                    >
                      ✅ Yes, Delivered
                    </button>
                    <button
                      onClick={() => {
                        setPaymentReceived(false);
                      }}
                      className={`w-full p-4 border-2 rounded-lg font-bold transition ${
                        paymentReceived === false
                          ? 'bg-red-100 border-red-600 text-red-900'
                          : 'bg-white border-gray-300 text-gray-900 hover:bg-red-50 hover:border-red-400'
                      }`}
                    >
                      ❌ No, Not Yet
                    </button>
                  </div>
                </div>

                {/* Info Message */}
                <div className="bg-blue-50 border-l-4 border-blue-400 p-3 mb-6 rounded">
                  <p className="text-sm text-blue-900">
                    {paymentReceived === true ? '✅ Order will be marked as completed.' : '❌ Order status will remain in progress.'}
                  </p>
                </div>
              </>
            ) : (
              <>
                {/* Payment Status Selection */}
                <div className="space-y-3 mb-6">
                  <label className="flex items-center gap-3 p-4 border-2 border-gray-300 rounded-lg cursor-pointer hover:bg-green-50 hover:border-green-400 transition"
                    onClick={() => setPaymentReceived(true)}
                  >
                    <input
                      type="radio"
                      checked={paymentReceived === true}
                      onChange={() => setPaymentReceived(true)}
                      className="w-5 h-5 text-green-600 cursor-pointer"
                    />
                    <span className="font-semibold text-gray-900 flex-1">✅ Payment Received</span>
                  </label>
                  <label className="flex items-center gap-3 p-4 border-2 border-gray-300 rounded-lg cursor-pointer hover:bg-amber-50 hover:border-amber-400 transition"
                    onClick={() => setPaymentReceived(false)}
                  >
                    <input
                      type="radio"
                      checked={paymentReceived === false}
                      onChange={() => setPaymentReceived(false)}
                      className="w-5 h-5 text-amber-500 cursor-pointer"
                    />
                    <span className="font-semibold text-gray-900 flex-1">⏳ Still Pending</span>
                  </label>
                </div>

                {/* Info Message */}
                <div className="bg-blue-50 border-l-4 border-blue-400 p-3 mb-6 rounded">
                  <p className="text-sm text-blue-900">
                    {paymentReceived ? '✅ Customer will be notified that payment was received.' : '⏳ Customer will be notified to complete the payment.'}
                  </p>
                </div>
              </>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setPaymentConfirmModalOrder(null);
                  setPaymentReceived(false);
                }}
                className="flex-1 px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-900 font-bold rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmPayment}
                disabled={confirmingPayment}
                className="flex-1 px-4 py-3 bg-linear-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-gray-300 disabled:to-gray-300 text-white font-bold rounded-lg transition flex items-center justify-center gap-2"
              >
                {confirmingPayment ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Confirming...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    {paymentConfirmModalOrder.status === 'in-progress' ? 'Confirm Delivery' : 'Confirm Payment'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}