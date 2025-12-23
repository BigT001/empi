"use client";

import { useEffect, useState, useRef } from "react";
import { Truck, Phone, Send, X, Package, MessageSquare, Zap, Calendar, Clock, Loader2, Check } from "lucide-react";
import { ChatModal } from "@/app/components/ChatModal";
import MobileAdminLayout from "../mobile-layout";

interface LogisticsOrder {
  _id: string;
  orderNumber: string;
  fullName: string;
  email: string;
  phone: string;
  address?: string;
  city: string;
  state?: string;
  description: string;
  quantity: number;
  status: string;
  deliveryDate?: string;
  createdAt: string;
  deliveryOption?: 'pickup' | 'delivery';
  shippingType?: 'self' | 'empi' | 'standard';
  currentHandler?: 'production' | 'logistics';
  handoffAt?: string;
  images?: string[];
  designUrls?: string[];
  productId?: string;
}

interface Message {
  _id: string;
  orderId: string;
  senderEmail: string;
  senderName: string;
  senderType: 'admin' | 'customer' | 'system';
  content: string;
  messageType: 'text' | 'quote' | 'negotiation' | 'system' | 'quantity-update';
  isRead: boolean;
  createdAt: string;
}

export default function LogisticsPage() {
  const [orders, setOrders] = useState<LogisticsOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pickup' | 'delivery' | 'completed'>('delivery');
  const [deliverySubTab, setDeliverySubTab] = useState<'pending' | 'in-progress' | 'delivered'>('pending');
  const [isMobile, setIsMobile] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const isFetchingRef = useRef(false);
  
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

  const joinConversation = async (order: LogisticsOrder) => {
    try {
      console.log('[Logistics] 💬 Opening chat for order:', {
        orderId: order._id,
        orderNumber: order.orderNumber,
        fullName: order.fullName,
      });
      
      const response = await fetch('/api/orders/handoff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order._id,
          orderNumber: order.orderNumber,
        }),
      });

      console.log('[Logistics] Handoff response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('[Logistics] ✅ Handoff successful:', data);
        // Open ChatModal after successful handoff - store both order ID and the order object
        console.log('[Logistics] 🔓 Opening chat modal for order:', order._id);
        setSelectedOrderForChat(order); // Store the order object
        setChatModalOpen(order._id);
      } else {
        const error = await response.json();
        console.error('[Logistics] ❌ Handoff failed:', {
          status: response.status,
          message: error.message,
          orderId: order._id,
          orderNumber: order.orderNumber,
        });
        
        // If order not found in handoff system, just open chat directly
        if (response.status === 404) {
          console.log('[Logistics] ℹ️ Order not in handoff system, opening chat directly...');
          setSelectedOrderForChat(order);
          setChatModalOpen(order._id);
        } else {
          alert(`Error opening chat: ${error.message || 'Failed to join conversation'}`);
        }
      }
    } catch (error) {
      console.error('[Logistics] ❌ Error joining conversation:', error);
      alert('Error opening chat. Check console for details.');
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
          orderId: paymentConfirmModalOrder._id,
          orderNumber: paymentConfirmModalOrder.orderNumber,
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

      if (response.ok) {
        console.log('[Logistics] ✅ Payment confirmation sent');
        
        // If payment is confirmed, update order status to "in-progress" for EMPI logistics
        if (paymentReceived) {
          try {
            console.log('[Logistics] 📦 Updating order status to in-progress for order ID:', paymentConfirmModalOrder._id);
            const updateResponse = await fetch(`${endpoint}/${paymentConfirmModalOrder._id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                status: 'in-progress'
              }),
            });

            const updateData = await updateResponse.json();
            
            if (updateResponse.ok) {
              console.log('[Logistics] ✅ Order status updated to in-progress:', updateData);
              console.log('[Logistics] Updated order:', updateData.order);
            } else {
              console.error('[Logistics] ⚠️ Failed to update order status. Status:', updateResponse.status);
              console.error('[Logistics] Response:', updateData);
            }
          } catch (statusError) {
            console.error('[Logistics] Error updating order status:', statusError);
          }
        }
        
        alert(paymentReceived ? 'Payment confirmed! Customer notified.' : 'Pending notification sent to customer.');
        setPaymentConfirmModalOrder(null);
        setPaymentReceived(false);
        // Refresh orders
        fetchLogisticsOrders();
      } else {
        const errorData = await response.json();
        console.error('[Logistics] ❌ Failed to send confirmation:', errorData);
        alert('Failed to send confirmation. Please try again.');
      }
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
      
      // Transform regular orders to add fullName from firstName + lastName
      const regularOrdersWithFullName = regularOrdersList.map((order: any) => ({
        ...order,
        fullName: order.fullName || `${order.firstName || ''} ${order.lastName || ''}`.trim() || 'Unknown Customer'
      }));
      
      // Combine both lists
      let allOrders = [...customOrdersList, ...regularOrdersWithFullName];
      console.log('📦 Fetched:', customOrdersList.length, 'custom orders,', regularOrdersList.length, 'regular orders');
      
      // Show all orders regardless of status for logistics to manage
      const logisticsOrders = allOrders.filter((order: any) => 
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

  const pendingHandoff = orders.filter(o => o.status === 'ready' && o.currentHandler !== 'logistics');
  
  // Show orders that have a delivery option selected (pickup or delivery)
  // Exclude only rejected and cancelled statuses
  // This way orders appear in logistics once customer selects their delivery preference
  // Handle both custom orders (deliveryOption) and regular orders (shippingType)
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
  
  // Split by delivery type:
  // Custom orders: 'pickup' → Personal Pickup, 'delivery' → Empi Delivery
  // Regular orders: 'self' → Personal Pickup, 'empi' → Empi Delivery
  const pickupOrders = validOrders.filter((o: any) => {
    const isPickup = o.deliveryOption === 'pickup' || o.shippingType === 'self';
    return isPickup && o.status !== 'completed';
  });
  
  const allDeliveryOrders = validOrders.filter((o: any) => {
    const isDelivery = o.deliveryOption === 'delivery' || o.shippingType === 'empi';
    return isDelivery && o.status !== 'completed';
  });
  
  // Further split delivery orders by status
  const pendingDeliveryOrders = allDeliveryOrders.filter(o => o.status === 'ready' || o.status === 'confirmed' || o.status === 'pending');
  const inProgressDeliveryOrders = allDeliveryOrders.filter(o => o.status === 'in-progress');
  const deliveredDeliveryOrders = orders.filter((o: any) => o.status === 'completed' && (o.deliveryOption === 'delivery' || o.shippingType === 'empi'));
  const deliveryOrders = deliverySubTab === 'pending' ? pendingDeliveryOrders : 
                         deliverySubTab === 'in-progress' ? inProgressDeliveryOrders :
                         deliverySubTab === 'delivered' ? deliveredDeliveryOrders : [];
  
  const completedOrders = orders.filter((o: any) => o.status === 'completed' && (o.deliveryOption === 'pickup' || o.deliveryOption === 'delivery' || o.shippingType === 'self' || o.shippingType === 'empi'));

  // Debug logging
  console.log('📍 Pickup orders:', pickupOrders.length, pickupOrders);
  console.log('🚚 Delivery orders:', deliveryOrders.length, deliveryOrders);
  
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
              <div className="flex gap-0 mb-6 border-b border-gray-200">
                <button
                  onClick={() => {
                    setActiveTab('delivery');
                    setDeliverySubTab('pending');
                  }}
                  className={`px-6 py-3 font-semibold border-b-2 transition ${
                    activeTab === 'delivery'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  🚚 Delivery ({allDeliveryOrders.length})
                </button>
                <button
                  onClick={() => setActiveTab('pickup')}
                  className={`px-6 py-3 font-semibold border-b-2 transition ${
                    activeTab === 'pickup'
                      ? 'border-purple-600 text-purple-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  📍 Pickup ({pickupOrders.length})
                </button>
                <button
                  onClick={() => setActiveTab('completed')}
                  className={`px-6 py-3 font-semibold border-b-2 transition ${
                    activeTab === 'completed'
                      ? 'border-green-600 text-green-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  ✓ Completed ({completedOrders.length})
                </button>
              </div>

              {/* Delivery Sub-Tabs */}
              {activeTab === 'delivery' && (
                <div className="flex gap-2 mb-6 bg-gray-100 rounded-lg p-2 w-fit scrollbar-hide">
                  {[
                    { id: 'pending', label: 'Pending', count: pendingDeliveryOrders.length },
                    { id: 'in-progress', label: 'In Progress', count: inProgressDeliveryOrders.length },
                    { id: 'delivered', label: 'Delivered', count: deliveredDeliveryOrders.length },
                  ].map((subTab) => (
                    <button
                      key={subTab.id}
                      onClick={() => setDeliverySubTab(subTab.id as 'pending' | 'in-progress' | 'delivered')}
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
              )}

              {/* Pickup Tab */}
              {activeTab === 'pickup' && (
                <>
                  {pickupOrders.length > 0 ? (
                    <div className="grid grid-cols-3 gap-3">
                      {pickupOrders.map(order => (
                        <div key={order._id} className="bg-purple-50 border-2 border-purple-300 rounded-lg p-2 h-full flex flex-col gap-2 shadow-sm hover:shadow-md transition">
                          {/* Header */}
                          <div className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-lg p-3 text-white">
                            <p className="text-xs font-semibold uppercase opacity-90 flex items-center gap-1 mb-1">
                              <Package className="h-3 w-3" /> 📍 Pickup - {order.status.toUpperCase()}
                            </p>
                            <p className="font-bold text-lg mb-1">👤 {order.fullName}</p>
                            <p className="font-semibold text-xs">Order #{order.orderNumber}</p>
                          </div>

                          {/* Product ID */}
                          {order.productId && (
                            <div className="bg-white rounded p-2 border border-purple-200">
                              <p className="text-xs font-semibold text-gray-600 uppercase mb-1">Product ID</p>
                              <p className="text-sm font-bold text-purple-700 font-mono">{order.productId}</p>
                            </div>
                          )}

                          {/* Description */}
                          <div className="bg-white rounded p-2 border border-purple-200">
                            <p className="text-xs font-semibold text-gray-600 uppercase mb-1">Order Description</p>
                            <p className="text-sm font-bold text-purple-700">{order.description}</p>
                          </div>

                          {/* Product Images Gallery */}
                          {(order.images?.length || 0) + (order.designUrls?.length || 0) > 0 && (
                            <div className="space-y-2">
                              <div className="flex justify-between items-center">
                                <p className="text-xs font-semibold text-gray-600 uppercase">Product Images</p>
                              </div>
                              <div className="grid grid-cols-3 gap-2">
                                {(order.images || order.designUrls || []).slice(0, 6).map((img, idx) => (
                                  <div
                                    key={idx}
                                    className="relative aspect-square bg-gray-100 rounded border border-purple-300 overflow-hidden cursor-pointer hover:border-purple-500 transition"
                                  >
                                    <img src={img} alt={`Design ${idx + 1}`} className="w-full h-full object-cover" />
                                  </div>
                                ))}
                              </div>
                              {(((order.images?.length) ?? 0) + ((order.designUrls?.length) ?? 0) > 6) && (
                                <p className="text-xs text-purple-600 font-semibold">
                                  +{((order.images?.length) ?? 0) + ((order.designUrls?.length) ?? 0) - 6} more images
                                </p>
                              )}
                            </div>
                          )}

                          {/* Customer Contact */}
                          <div className="bg-white rounded p-2 border border-purple-200 space-y-1 text-xs">
                            <div className="flex items-center gap-2">
                              <Phone className="h-3 w-3 text-purple-600" />
                              <span className="text-gray-700">{order.phone}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="h-3 w-3 text-purple-600">✉</span>
                              <span className="text-gray-700 truncate">{order.email}</span>
                            </div>
                          </div>

                          {/* Quantity & Delivery */}
                          <div className="grid grid-cols-2 gap-2">
                            <div className="bg-white rounded p-2 border border-purple-200">
                              <p className="text-xs font-semibold text-gray-600">Qty</p>
                              <p className="text-lg font-bold text-purple-700">{order.quantity}</p>
                            </div>
                            <div className="bg-white rounded p-2 border border-purple-200">
                              <p className="text-xs font-semibold text-gray-600">Type</p>
                              <p className="text-sm font-bold text-purple-700">📍 Pickup</p>
                            </div>
                          </div>

                          {/* Pickup Location Info */}
                          <div className="bg-white rounded p-2 border border-purple-200 text-xs">
                            <p className="text-xs font-semibold text-gray-600 mb-1">📍 Pickup Location</p>
                            <p className="text-gray-900 font-semibold">22 Chi-Ben street, Ojo, Lagos</p>
                            <p className="text-gray-600">Customer will pick up here</p>
                          </div>

                          {/* Action Button */}
                          <button 
                            onClick={() => joinConversation(order)}
                            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-lg transition mt-auto"
                          >
                            <MessageSquare className="h-4 w-4" />
                            Open Chat
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-40 bg-white rounded-lg border border-gray-200">
                      <Package className="h-12 w-12 text-gray-400 mb-3" />
                      <p className="text-gray-600 font-medium">No pending handoffs</p>
                    </div>
                  )}
                </>
              )}

              {/* Delivery Tab */}
              {activeTab === 'delivery' && (
                <>
                  {deliveryOrders.length > 0 ? (
                    <div className="grid grid-cols-3 gap-2">
                      {deliveryOrders.map(order => (
                        <div key={order._id} className="bg-blue-50 border-2 border-blue-300 rounded-lg p-2 h-full flex flex-col gap-2 shadow-sm hover:shadow-md transition">
                          {/* Header */}
                          <div className="bg-gradient-to-r from-blue-500 to-cyan-600 rounded-lg p-3 text-white">
                            <p className="text-xs font-semibold uppercase opacity-90 flex items-center gap-1 mb-1">
                              <Package className="h-3 w-3" /> 🚚 Delivery - {order.status.toUpperCase()}
                            </p>
                            <p className="font-bold text-lg mb-1">👤 {order.fullName}</p>
                            <p className="font-semibold text-xs">Order #{order.orderNumber}</p>
                          </div>

                          {/* Product ID */}
                          {order.productId && (
                            <div className="bg-white rounded p-1.5 border border-blue-200">
                              <p className="text-xs font-semibold text-gray-600 uppercase mb-0.5">Product ID</p>
                              <p className="text-xs font-bold text-blue-700 font-mono">{order.productId}</p>
                            </div>
                          )}

                          {/* Description */}
                          <div className="bg-white rounded p-1.5 border border-blue-200">
                            <p className="text-xs font-semibold text-gray-600 uppercase mb-0.5">Order Description</p>
                            <p className="text-xs font-bold text-blue-700">{order.description}</p>
                          </div>

                          {/* Product Images Gallery */}
                          {(order.images?.length || 0) + (order.designUrls?.length || 0) > 0 && (
                            <div className="space-y-1">
                              <div className="flex justify-between items-center">
                                <p className="text-xs font-semibold text-gray-600 uppercase">Images</p>
                              </div>
                              <div className="grid grid-cols-3 gap-1">
                                {(order.images || order.designUrls || []).slice(0, 6).map((img, idx) => (
                                  <div
                                    key={idx}
                                    className="relative aspect-square bg-gray-100 rounded border border-blue-300 overflow-hidden cursor-pointer hover:border-blue-500 transition"
                                  >
                                    <img src={img} alt={`Design ${idx + 1}`} className="w-full h-full object-cover" />
                                  </div>
                                ))}
                              </div>
                              {(((order.images?.length) ?? 0) + ((order.designUrls?.length) ?? 0) > 6) && (
                                <p className="text-xs text-blue-600 font-semibold">
                                  +{((order.images?.length) ?? 0) + ((order.designUrls?.length) ?? 0) - 6} more
                                </p>
                              )}
                            </div>
                          )}

                          {/* Customer Contact */}
                          <div className="bg-white rounded p-1.5 border border-blue-200 space-y-0.5 text-xs">
                            <div className="flex items-center gap-2">
                              <Phone className="h-3 w-3 text-blue-600" />
                              <span className="text-gray-700">{order.phone}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="h-3 w-3 text-blue-600">✉</span>
                              <span className="text-gray-700 truncate">{order.email}</span>
                            </div>
                          </div>

                          {/* Quantity & Delivery */}
                          <div className="grid grid-cols-2 gap-1">
                            <div className="bg-white rounded p-1.5 border border-blue-200">
                              <p className="text-xs font-semibold text-gray-600">Qty</p>
                              <p className="text-sm font-bold text-blue-700">{order.quantity}</p>
                            </div>
                            <div className="bg-white rounded p-1.5 border border-blue-200">
                              <p className="text-xs font-semibold text-gray-600">Type</p>
                              <p className="text-xs font-bold text-blue-700">🚚 Delivery</p>
                            </div>
                          </div>

                          {/* Delivery Date */}
                          {order.deliveryDate && (
                            <div className="bg-white rounded p-1.5 border border-blue-200">
                              <div className="flex items-center gap-2 text-xs">
                                <Calendar className="h-3 w-3 text-blue-600" />
                                <span className="text-gray-700">By: <span className="font-semibold text-gray-900">{new Date(order.deliveryDate).toLocaleDateString()}</span></span>
                              </div>
                            </div>
                          )}

                          {/* Delivery Address */}
                          {order.address && (
                            <div className="bg-white rounded p-1.5 border border-blue-200 text-xs">
                              <p className="text-xs font-semibold text-gray-600 mb-0.5">🚚 Address</p>
                              <p className="text-gray-900 font-semibold">{order.address}</p>
                              <p className="text-gray-600">{order.city}</p>
                            </div>
                          )}

                          {/* Action Buttons */}
                          <div className="flex gap-2 mt-auto">
                            <button 
                              onClick={() => joinConversation(order)}
                              className="flex-1 flex items-center justify-center gap-2 px-2 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition"
                            >
                              <MessageSquare className="h-3 w-3" />
                              Chat
                            </button>
                            <button 
                              onClick={() => setPaymentConfirmModalOrder(order)}
                              className="flex-1 flex items-center justify-center gap-2 px-2 py-1.5 bg-green-600 hover:bg-green-700 text-white font-bold text-xs rounded-lg transition"
                            >
                              {order.status === 'in-progress' ? '✓ Delivered?' : '✓ Confirm'}
                            </button>
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
                </>
              )}

              {/* Completed Tab */}
              {activeTab === 'completed' && (
                <>
                  {completedOrders.length > 0 ? (
                    <div className="grid grid-cols-3 gap-3">
                      {completedOrders.map(order => (
                        <div key={order._id} className="bg-green-50 border-2 border-green-300 rounded-lg p-2 h-full flex flex-col gap-2 shadow-sm hover:shadow-md transition">
                          {/* Header */}
                          <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg p-3 text-white">
                            <p className="text-xs font-semibold uppercase opacity-90 flex items-center gap-1">
                              <Package className="h-3 w-3" /> ✓ {order.deliveryOption === 'pickup' ? '📍 Pickup' : '🚚 Delivery'} - COMPLETED
                            </p>
                            <p className="font-bold text-sm">#{order.orderNumber}</p>
                          </div>

                          {/* Customer Info */}
                          <div>
                            <p className="text-xs font-semibold text-gray-600 mb-1">👤 Customer</p>
                            <p className="font-semibold text-gray-900">{order.fullName}</p>
                            <p className="text-gray-600 text-sm flex items-center gap-1">
                              <Phone className="h-3 w-3" /> {order.phone}
                            </p>
                          </div>

                          {/* Order Details */}
                          <div className="bg-white rounded-lg p-2.5 space-y-2 text-sm">
                            <div>
                              <p className="text-xs font-semibold text-gray-600">📦 Quantity</p>
                              <p className="font-semibold text-gray-900">{order.quantity} pieces</p>
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-gray-600">📅 Order Date</p>
                              <p className="text-gray-900 font-semibold">{new Date(order.createdAt).toLocaleDateString('en-NG')}</p>
                            </div>
                          </div>

                          {/* Delivery Address (if delivery order) */}
                          {order.deliveryOption === 'delivery' && (
                            <div className="bg-white rounded-lg p-2.5">
                              <p className="text-xs font-semibold text-gray-600 mb-1">🚚 Delivery Address</p>
                              <p className="text-gray-900 font-semibold">{order.address}</p>
                              <p className="text-gray-600">{order.city}</p>
                            </div>
                          )}

                          {/* Pickup Status (if pickup order) */}
                          {order.deliveryOption === 'pickup' && (
                            <div className="bg-green-100 border-l-4 border-green-600 p-2.5 rounded text-center">
                              <p className="text-sm font-semibold text-green-900">✓ Successfully Picked Up</p>
                            </div>
                          )}

                          {/* Design Images - Horizontal Scrollable */}
                          {order.designUrls && order.designUrls.length > 0 && (
                            <div className="space-y-2">
                              <p className="text-xs font-semibold text-gray-600">🖼️ Design Images</p>
                              <div className="overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-green-300 scrollbar-track-green-100">
                                <div className="flex gap-2">
                                  {order.designUrls.map((img, idx) => (
                                    <div
                                      key={idx}
                                      className="relative aspect-square bg-gray-100 rounded border border-green-300 overflow-hidden cursor-pointer hover:border-green-500 transition flex-shrink-0 w-16 h-16"
                                    >
                                      <img src={img} alt={`Design ${idx + 1}`} className="w-full h-full object-cover" />
                                    </div>
                                  ))}
                                </div>
                              </div>
                              {order.designUrls.length > 4 && (
                                <p className="text-xs text-gray-500 text-center">← Scroll to see more →</p>
                              )}
                            </div>
                          )}

                          {/* Completion Badge */}
                          <div className="bg-green-100 border border-green-300 rounded-lg p-2 text-center">
                            <p className="text-xs font-bold text-green-700">✓ COMPLETED</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-40 bg-white rounded-lg border border-gray-200">
                      <Package className="h-12 w-12 text-gray-400 mb-3" />
                      <p className="text-gray-600 font-medium">No completed orders yet</p>
                    </div>
                  )}
                </>
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
          <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-gray-200">
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
            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg p-4 mb-6 border border-blue-200">
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
                className="flex-1 px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-gray-300 disabled:to-gray-300 text-white font-bold rounded-lg transition flex items-center justify-center gap-2"
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
            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg p-4 mb-6 border-2 border-blue-200">
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
                className="flex-1 px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-gray-300 disabled:to-gray-300 text-white font-bold rounded-lg transition flex items-center justify-center gap-2"
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