"use client";

import { useEffect, useState, useRef } from "react";
import { Truck, Phone, Send, X, Package, MessageSquare, Zap, Calendar, Clock, Loader2 } from "lucide-react";
import { ChatModal } from "@/app/components/ChatModal";

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
  const isFetchingRef = useRef(false);
  
  // ChatModal state
  const [chatModalOpen, setChatModalOpen] = useState<string | null>(null);
  
  // Quote modal state
  const [quoteModalOrder, setQuoteModalOrder] = useState<LogisticsOrder | null>(null);
  const [quoteAmount, setQuoteAmount] = useState('');
  const [deliveryType, setDeliveryType] = useState<'bike' | 'car' | 'van' | ''>('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountHolderName, setAccountHolderName] = useState('');
  const [sendingQuote, setSendingQuote] = useState(false);

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

  const joinConversation = async (order: LogisticsOrder) => {
    try {
      const response = await fetch('/api/orders/handoff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order._id,
          orderNumber: order.orderNumber,
        }),
      });

      if (response.ok) {
        // Open ChatModal after successful handoff
        setChatModalOpen(order._id);
      }
    } catch (error) {
      console.error('Error joining conversation:', error);
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

  const fetchLogisticsOrders = async (isBackground = false) => {
    if (isFetchingRef.current) return;
    
    isFetchingRef.current = true;
    if (!isBackground) setLoading(true);
    
    try {
      const response = await fetch('/api/custom-orders');
      if (!response.ok) throw new Error('Failed to fetch orders');
      const data = await response.json();
      
      const allOrders = (data.orders || data.data) || [];
      console.log('📦 All orders fetched:', allOrders.length);
      
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
  // Exclude only rejected and pending statuses
  // This way orders appear in logistics once customer selects their delivery preference
  const validOrders = orders.filter(o => 
    o.status !== 'rejected' && 
    o.status !== 'pending' &&
    (o.deliveryOption === 'pickup' || o.deliveryOption === 'delivery') // Must have delivery option set
  );
  
  // Split by deliveryOption that customer selects:
  // - 'pickup' → Personal Pickup option
  // - 'delivery' → Empi Delivery option
  const pickupOrders = validOrders.filter(o => o.deliveryOption === 'pickup' && o.status !== 'completed');
  const deliveryOrders = validOrders.filter(o => o.deliveryOption === 'delivery' && o.status !== 'completed');
  const completedOrders = orders.filter(o => o.status === 'completed' && (o.deliveryOption === 'pickup' || o.deliveryOption === 'delivery'));

  // Debug logging
  console.log('📍 Pickup orders:', pickupOrders.length, pickupOrders);
  console.log('🚚 Delivery orders:', deliveryOrders.length, deliveryOrders);
  
  // Show all ready orders and their deliveryOption values for debugging
  console.log('📊 All ready orders breakdown:');
  validOrders.forEach(o => {
    console.log(`- ${o.orderNumber}: status=${o.status}, deliveryOption=${o.deliveryOption}, currentHandler=${o.currentHandler}`);
  });

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
                  onClick={() => setActiveTab('delivery')}
                  className={`px-6 py-3 font-semibold border-b-2 transition ${
                    activeTab === 'delivery'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  🚚 Delivery ({deliveryOrders.length})
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

              {/* Pickup Tab */}
              {activeTab === 'pickup' && (
                <>
                  {pickupOrders.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {pickupOrders.map(order => (
                        <div key={order._id} className="bg-purple-50 border-2 border-purple-300 rounded-xl p-4 h-full flex flex-col gap-3 shadow-sm hover:shadow-md transition">
                          {/* Header */}
                          <div className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-lg p-3 text-white">
                            <p className="text-xs font-semibold uppercase opacity-90 flex items-center gap-1">
                              <Package className="h-3 w-3" /> 📍 Pickup - {order.status.toUpperCase()}
                            </p>
                            <p className="font-bold text-sm">#{order.orderNumber}</p>
                            <p className="text-xs opacity-75">{order.fullName}</p>
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
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {deliveryOrders.map(order => (
                        <div key={order._id} className="bg-blue-50 border-2 border-blue-300 rounded-xl p-4 h-full flex flex-col gap-3 shadow-sm hover:shadow-md transition">
                          {/* Header */}
                          <div className="bg-gradient-to-r from-blue-500 to-cyan-600 rounded-lg p-3 text-white">
                            <p className="text-xs font-semibold uppercase opacity-90 flex items-center gap-1">
                              <Package className="h-3 w-3" /> 🚚 Delivery - {order.status.toUpperCase()}
                            </p>
                            <p className="font-bold text-sm">#{order.orderNumber}</p>
                            <p className="text-xs opacity-75">{order.fullName}</p>
                          </div>

                          {/* Product ID */}
                          {order.productId && (
                            <div className="bg-white rounded p-2 border border-blue-200">
                              <p className="text-xs font-semibold text-gray-600 uppercase mb-1">Product ID</p>
                              <p className="text-sm font-bold text-blue-700 font-mono">{order.productId}</p>
                            </div>
                          )}

                          {/* Description */}
                          <div className="bg-white rounded p-2 border border-blue-200">
                            <p className="text-xs font-semibold text-gray-600 uppercase mb-1">Order Description</p>
                            <p className="text-sm font-bold text-blue-700">{order.description}</p>
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
                                    className="relative aspect-square bg-gray-100 rounded border border-blue-300 overflow-hidden cursor-pointer hover:border-blue-500 transition"
                                  >
                                    <img src={img} alt={`Design ${idx + 1}`} className="w-full h-full object-cover" />
                                  </div>
                                ))}
                              </div>
                              {(((order.images?.length) ?? 0) + ((order.designUrls?.length) ?? 0) > 6) && (
                                <p className="text-xs text-blue-600 font-semibold">
                                  +{((order.images?.length) ?? 0) + ((order.designUrls?.length) ?? 0) - 6} more images
                                </p>
                              )}
                            </div>
                          )}

                          {/* Customer Contact */}
                          <div className="bg-white rounded p-2 border border-blue-200 space-y-1 text-xs">
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
                          <div className="grid grid-cols-2 gap-2">
                            <div className="bg-white rounded p-2 border border-blue-200">
                              <p className="text-xs font-semibold text-gray-600">Qty</p>
                              <p className="text-lg font-bold text-blue-700">{order.quantity}</p>
                            </div>
                            <div className="bg-white rounded p-2 border border-blue-200">
                              <p className="text-xs font-semibold text-gray-600">Type</p>
                              <p className="text-sm font-bold text-blue-700">🚚 Delivery</p>
                            </div>
                          </div>

                          {/* Delivery Date */}
                          {order.deliveryDate && (
                            <div className="bg-white rounded p-2 border border-blue-200">
                              <div className="flex items-center gap-2 text-xs">
                                <Calendar className="h-3 w-3 text-blue-600" />
                                <span className="text-gray-700">Needed by: <span className="font-semibold text-gray-900">{new Date(order.deliveryDate).toLocaleDateString()}</span></span>
                              </div>
                            </div>
                          )}

                          {/* Delivery Address */}
                          {order.address && (
                            <div className="bg-white rounded p-2 border border-blue-200 text-xs">
                              <p className="text-xs font-semibold text-gray-600 mb-1">🚚 Delivery Address</p>
                              <p className="text-gray-900 font-semibold">{order.address}</p>
                              <p className="text-gray-600">{order.city}</p>
                            </div>
                          )}

                          {/* Action Button - Open Chat */}
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
                      <p className="text-gray-600 font-medium">No delivery orders</p>
                    </div>
                  )}
                </>
              )}

              {/* Completed Tab */}
              {activeTab === 'completed' && (
                <>
                  {completedOrders.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {completedOrders.map(order => (
                        <div key={order._id} className="bg-green-50 border-2 border-green-300 rounded-xl p-4 h-full flex flex-col gap-3 shadow-sm hover:shadow-md transition">
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
      {chatModalOpen && orders.find(o => o._id === chatModalOpen) && (
        <ChatModal
          isOpen={!!chatModalOpen}
          onClose={() => {
            setChatModalOpen(null);
            // Refresh orders when modal closes
            fetchLogisticsOrders();
          }}
          order={orders.find(o => o._id === chatModalOpen)!}
          userEmail="logistics@empi.com"
          userName="Logistics Team"
          isAdmin={true}
          isLogisticsTeam={true}
          deliveryOption={orders.find(o => o._id === chatModalOpen)?.deliveryOption}
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
                    placeholder="e.g., John Doe"
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
    </div>
  );
}