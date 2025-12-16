"use client";

import { useState, useEffect, useRef } from "react";
import { Send, X, DollarSign, CheckCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useBuyer } from "@/app/context/BuyerContext";
import { calculateQuote } from "@/lib/discountCalculator";
import { formatPrice } from "@/lib/priceCalculations";

interface Message {
  _id: string;
  orderId: string;
  senderEmail: string;
  senderName: string;
  senderType: 'admin' | 'customer' | 'system';
  content: string;
  isFinalPrice?: boolean;
  quotedPrice?: number;
  quotedDeliveryDate?: string; // Admin's proposed delivery date
  quotedVAT?: number;
  quotedTotal?: number;
  discountPercentage?: number;
  discountAmount?: number;
  messageType: 'text' | 'quote' | 'negotiation' | 'system' | 'quantity-update';
  quantityChangeData?: {
    oldQty: number;
    newQty: number;
    unitPrice: number;
    newTotal: number;
  };
  isRead: boolean;
  createdAt: string;
}

interface CustomOrder {
  _id: string;
  orderNumber: string;
  email: string;
  fullName: string;
  quantity?: number;
  quotedPrice?: number;
  buyerAgreedToDate?: boolean; // Whether buyer agreed to proposed delivery date
}

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: CustomOrder;
  userEmail: string;
  userName: string;
  isAdmin?: boolean;
  adminName?: string;
  onMessageSent?: () => void;
}

export function ChatModal({
  isOpen,
  onClose,
  order,
  userEmail,
  userName,
  isAdmin = false,
  adminName = "Empi Costumes",
  onMessageSent,
}: ChatModalProps) {
  const router = useRouter();
  const { buyer } = useBuyer();
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [quotePrice, setQuotePrice] = useState<string>('');
  const [quotedDeliveryDate, setQuotedDeliveryDate] = useState<string>('');
  const [isFinalPrice, setIsFinalPrice] = useState(false);
  const [showQuoteForm, setShowQuoteForm] = useState(false);
  const [orderStatus, setOrderStatus] = useState<string | null>(null);
  const [isPaymentDone, setIsPaymentDone] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [userScrolledUp, setUserScrolledUp] = useState(false);
  const [agreedToDateMessageId, setAgreedToDateMessageId] = useState<string | null>(null);
  const [buyerAgreedToDate, setBuyerAgreedToDate] = useState(order.buyerAgreedToDate || false);

  const calculateQuoteDetails = () => {
    const basePrice = parseFloat(quotePrice) || 0;
    const quantity = order.quantity || 1;
    const quoteData = calculateQuote(basePrice, quantity);
    return quoteData;
  };

  // Fetch order status to check if payment is done
  const fetchOrderStatus = async () => {
    try {
      const res = await fetch(`/api/custom-orders/${order._id}`);
      if (res.ok) {
        const data = await res.json();
        const status = data.data?.status || data.status;
        setOrderStatus(status);
        
        // If status is approved or higher, payment is done
        const paymentDone = ['approved', 'in-progress', 'ready', 'completed'].includes(status);
        setIsPaymentDone(paymentDone);
        
        if (paymentDone) {
          console.log('[ChatModal] ✅ Payment detected, disabling Pay Now button');
        }
      }
    } catch (error) {
      console.error('[ChatModal] Error fetching order status:', error);
    }
  };

  // Handle Pay Now click
  const handlePayNow = (finalQuote: Message) => {
    // Store quote data in sessionStorage for checkout page
    // Use a timestamp + orderId to create a unique session key to avoid cross-order contamination
    const sessionKey = `customOrderQuote_${order._id}_${Date.now()}`;
    const quoteData = {
      orderId: order._id,
      orderNumber: order.orderNumber,
      quotedPrice: finalQuote.quotedPrice,
      quantity: order.quantity || 1,
      discountPercentage: finalQuote.discountPercentage || 0,
      discountAmount: finalQuote.discountAmount || 0,
      quotedVAT: finalQuote.quotedVAT,
      quotedTotal: finalQuote.quotedTotal,
    };
    
    // Store the quote data with unique key
    sessionStorage.setItem(sessionKey, JSON.stringify(quoteData));
    // Also store the key in the default location for backward compatibility
    sessionStorage.setItem('customOrderQuote', JSON.stringify(quoteData));
    
    console.log('[ChatModal] 🔐 Storing quote for order:', {
      orderId: order._id,
      orderNumber: order.orderNumber,
      quotedTotal: finalQuote.quotedTotal,
      sessionKey: sessionKey
    });
    
    // Navigate to checkout
    router.push('/checkout?fromQuote=true');
  };

  // Handle Confirm & Send New Quote for quantity changes
  const handleConfirmAndSendQuote = async (quantityMessage: Message) => {
    try {
      setIsSubmitting(true);
      
      if (!quantityMessage.quantityChangeData) {
        alert('Error: Quantity data missing');
        return;
      }

      const { newQty, unitPrice, newTotal } = quantityMessage.quantityChangeData;
      
      console.log('[ChatModal] 📊 Confirming quantity update and generating quote:', {
        orderId: order._id,
        newQty,
        unitPrice,
        newTotal
      });

      // Send POST to confirm and generate quote
      const response = await fetch('/api/custom-orders/confirm-quantity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order._id,
          orderNumber: order.orderNumber,
          newQuantity: newQty,
          unitPrice,
          newTotal,
          adminEmail: userEmail,
          adminName: userName,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to confirm quantity: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('[ChatModal] ✅ Quote generated and sent:', result);
      
      // Refresh messages to show the new quote
      fetchMessages();
    } catch (error) {
      console.error('[ChatModal] ❌ Error confirming quantity:', error);
      alert('Failed to send quote. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Fetch messages
  useEffect(() => {
    if (!isOpen) return;

    console.log('[ChatModal] Modal opened, fetching messages for order:', order._id);
    fetchMessages();
    fetchOrderStatus();

    const interval = setInterval(() => {
      fetchMessages();
      fetchOrderStatus();
    }, 1500);
    return () => {
      console.log('[ChatModal] Cleaning up polling interval');
      clearInterval(interval);
    };
  }, [isOpen, order._id]);

  // Smart auto-scroll: only scroll to bottom if user is already at the bottom
  useEffect(() => {
    if (!messagesContainerRef.current) return;

    // Only auto-scroll if user hasn't scrolled up
    if (!userScrolledUp) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, userScrolledUp]);

  // Track if user has scrolled up
  const handleMessagesScroll = () => {
    if (!messagesContainerRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50; // 50px threshold
    
    setUserScrolledUp(!isAtBottom);
  };

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Mark messages as read
  useEffect(() => {
    if (!isOpen || messages.length === 0) return;

    const unreadIds = messages
      .filter(m => (isAdmin ? m.senderType === 'customer' : m.senderType === 'admin') && !m.isRead)
      .map(m => m._id);

    if (unreadIds.length > 0) {
      markAsRead(unreadIds);
    }
  }, [messages, isOpen, isAdmin]);

  const fetchMessages = async () => {
    try {
      console.log('[ChatModal] Fetching messages for orderId:', order._id);
      const response = await fetch(`/api/messages?orderId=${order._id}`);
      const data = await response.json();
      if (data.success && Array.isArray(data.messages)) {
        console.log('[ChatModal] ✅ Fetched', data.messages.length, 'messages');
        data.messages.forEach((msg: Message) => {
          if (msg.messageType === 'quantity-update') {
            console.log('[ChatModal] 📊 Found quantity-update message:', {
              messageId: msg._id,
              senderType: msg.senderType,
              quantityChangeData: msg.quantityChangeData
            });
          }
        });
        setMessages(data.messages);
      } else {
        console.warn('[ChatModal] ⚠️ Response format unexpected:', data);
      }
    } catch (error) {
      console.error('[ChatModal] Error fetching messages:', error);
    }
  };

  const markAsRead = async (messageIds: string[]) => {
    try {
      await fetch('/api/messages', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageIds }),
      });
    } catch (error) {
      console.error('[ChatModal] Error marking as read:', error);
    }
  };

  const sendMessage = async (e: React.FormEvent, messageType: string = 'text') => {
    e.preventDefault();

    if (!messageText.trim() && messageType === 'text') {
      return;
    }

    if (messageType === 'quote' && !quotePrice) {
      alert('Please enter a price');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload: any = {
        orderId: order._id,
        orderNumber: order.orderNumber,
        senderEmail: userEmail,
        senderName: userName,
        senderType: isAdmin ? 'admin' : 'customer',
        content: messageText || `Quote: ₦${quotePrice}`,
        messageType: messageType,
      };

      if (isAdmin && (messageType === 'quote' || messageType === 'negotiation')) {
        payload.isFinalPrice = isFinalPrice;
        payload.quotedPrice = parseFloat(quotePrice);
        if (quotedDeliveryDate) {
          payload.quotedDeliveryDate = quotedDeliveryDate;
        }
      }

      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to send message: ${response.status} - ${error}`);
      }

      setMessageText('');
      if (isAdmin) {
        setQuotePrice('');
        setIsFinalPrice(false);
        setShowQuoteForm(false);
      }

      await fetchMessages();

      if (onMessageSent) {
        console.log('[ChatModal] Calling onMessageSent callback');
        onMessageSent();
      }
    } catch (error) {
      console.error('[ChatModal] Error sending message:', error);
      alert('Failed to send message');
    } finally {
      setIsSubmitting(false);
      inputRef.current?.focus();
    }
  };

  const finalMessage = messages.find(m => m.isFinalPrice && m.senderType === 'admin');

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${showQuoteForm ? 'pointer-events-none' : ''}`}
        onClick={onClose}
      />

      {/* Quote Form Modal Overlay (Admin Only) */}
      {isAdmin && showQuoteForm && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-2 md:p-4 pointer-events-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-4 md:p-6 space-y-4 md:space-y-6 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg md:text-xl font-bold text-gray-900">Send Quote</h3>
                <p className="text-xs md:text-sm text-gray-600 mt-1">Order #{order.orderNumber}</p>
              </div>
              <button
                onClick={() => setShowQuoteForm(false)}
                className="text-gray-600 hover:text-gray-900 p-2 rounded-lg transition"
              >
                <X className="h-5 w-5 md:h-6 md:w-6" />
              </button>
            </div>

            {/* Two Column Layout */}
            <div className="grid md:grid-cols-2 gap-4 md:gap-6">
              {/* Price Card */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 md:p-6 space-y-4 border-2 border-blue-300">
                <div>
                  <h4 className="font-semibold text-gray-900 text-sm md:text-base mb-3">💰 Price Details</h4>
                  
                  {/* Discount Info */}
                  {order.quantity && order.quantity >= 3 && (
                    <div className="bg-white border border-green-200 rounded-lg p-3 mb-4">
                      <p className="text-xs md:text-sm font-semibold text-green-700">
                        💡 {order.quantity >= 10 ? '10%' : order.quantity >= 6 ? '7%' : '5%'} discount for {order.quantity} units
                      </p>
                    </div>
                  )}

                  {/* Price Input */}
                  <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">Unit Price (₦)</label>
                  <input
                    type="number"
                    value={quotePrice}
                    onChange={(e) => setQuotePrice(e.target.value)}
                    placeholder="Enter price"
                    className="w-full px-3 md:px-4 py-2 md:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-sm"
                  />
                </div>

                {/* Quote Preview */}
                {quotePrice && (
                  <div className="bg-white border border-gray-200 p-3 md:p-4 rounded-lg space-y-2 text-xs md:text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Unit Price:</span>
                      <span className="font-semibold">₦{parseFloat(quotePrice).toLocaleString()}</span>
                    </div>
                    {calculateQuoteDetails().discountPercentage > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Discount ({calculateQuoteDetails().discountPercentage}%):</span>
                        <span>-₦{calculateQuoteDetails().discountAmount.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-600">VAT (7.5%):</span>
                      <span className="font-semibold">₦{calculateQuoteDetails().vat.toLocaleString()}</span>
                    </div>
                    <div className="border-t border-gray-200 pt-2 flex justify-between font-bold text-blue-600">
                      <span>Total:</span>
                      <span>₦{calculateQuoteDetails().total.toLocaleString()}</span>
                    </div>
                  </div>
                )}

                {/* Final Price Checkbox */}
                <label className="flex items-center gap-2 cursor-pointer pt-2">
                  <input
                    type="checkbox"
                    checked={isFinalPrice}
                    onChange={(e) => setIsFinalPrice(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600"
                  />
                  <span className="text-xs md:text-sm text-gray-700 font-medium">Mark as final price</span>
                </label>
              </div>

              {/* Delivery Date Card */}
              <div className="bg-gradient-to-br from-orange-50 to-amber-100 rounded-xl p-4 md:p-6 space-y-4 border-2 border-orange-300">
                <div>
                  <h4 className="font-semibold text-gray-900 text-sm md:text-base mb-3">📅 Delivery Schedule</h4>
                  
                  <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">Proposed Delivery Date</label>
                  <input
                    type="date"
                    value={quotedDeliveryDate}
                    onChange={(e) => setQuotedDeliveryDate(e.target.value)}
                    className="w-full px-3 md:px-4 py-2 md:py-3 border-2 border-orange-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-600 focus:border-transparent text-sm bg-white font-medium"
                  />
                  
                  {quotedDeliveryDate && (
                    <div className="bg-white border border-orange-200 p-3 md:p-4 rounded-lg mt-4 space-y-2">
                      <p className="text-xs text-gray-600">📌 Scheduled for:</p>
                      <p className="text-sm md:text-base font-bold text-orange-700">
                        {new Date(quotedDeliveryDate).toLocaleDateString('en-NG', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Note */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 md:p-4">
              <p className="text-xs md:text-sm text-gray-700">
                <strong>Note:</strong> Buyer will see this quote and must agree to both the price and delivery date before payment becomes available.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 md:gap-3 pt-4">
              <button
                onClick={() => setShowQuoteForm(false)}
                className="flex-1 py-2 md:py-3 px-4 rounded-lg font-semibold text-sm md:text-base border border-gray-300 text-gray-700 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={(e) => {
                  sendMessage(e, 'quote');
                  setShowQuoteForm(false);
                  setQuotedDeliveryDate('');
                }}
                disabled={isSubmitting || !quotePrice}
                className="flex-1 py-2 md:py-3 px-4 rounded-lg font-semibold text-sm md:text-base bg-lime-600 hover:bg-lime-700 disabled:bg-gray-300 text-white transition flex items-center justify-center gap-2"
              >
                <DollarSign className="h-4 w-4" />
                Send Quote
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Chat Modal - Full Screen on Mobile, Centered on Desktop */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 md:p-4">
        <div className="bg-white rounded-none md:rounded-2xl shadow-2xl w-full md:max-w-2xl h-full md:max-h-[90vh] flex flex-col">
          
          {/* Header - Clean and Minimal */}
          <div className="bg-white border-b border-gray-200 px-4 md:px-6 py-3 md:py-4 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-lime-600 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-lg md:text-xl font-bold text-white">🎨</span>
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-gray-900 text-base md:text-lg truncate">
                  {isAdmin ? order.fullName : adminName}
                </h3>
                <p className="text-gray-500 text-xs md:text-sm">Chat</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 p-2 rounded-lg transition flex-shrink-0"
              aria-label="Close chat"
            >
              <X className="h-5 w-5 md:h-6 md:w-6" />
            </button>
          </div>

          {/* Status Banner - if final price agreed */}
          {finalMessage && (
            <div className="bg-green-50 border-b border-green-200 px-4 md:px-6 py-2 md:py-3 flex items-center gap-2 flex-shrink-0">
              <CheckCircle className="h-4 w-4 md:h-5 md:w-5 text-green-600 flex-shrink-0" />
              <p className="text-xs md:text-sm font-medium text-green-700">✓ Final price agreed</p>
            </div>
          )}

          {/* Messages Container - Scrollable */}
          <div 
            ref={messagesContainerRef}
            onScroll={handleMessagesScroll}
            className="flex-1 overflow-y-auto px-4 md:px-6 py-4 md:py-6 space-y-3 bg-white"
          >
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-8">
                <div className="text-5xl md:text-6xl mb-3">💬</div>
                <p className="text-gray-600 font-medium text-sm md:text-base">No messages yet</p>
                <p className="text-gray-400 text-xs md:text-sm mt-1 max-w-xs">
                  {isAdmin ? "Send a quote to start the conversation" : "Admin will contact you soon"}
                </p>
              </div>
            ) : (
              <>
                {messages.map((msg) => (
                  <div key={msg._id} className={`flex ${msg.senderType === 'customer' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs md:max-w-sm px-3 md:px-4 py-2 md:py-3 rounded-2xl ${
                      msg.senderType === 'customer'
                        ? 'bg-lime-600 text-white rounded-br-none'
                        : 'bg-gray-100 text-gray-900 rounded-bl-none'
                    }`}>
                      {/* Message Content or Quote */}
                      {msg.messageType === 'quote' ? (
                        <div className="space-y-2 md:space-y-3">
                          {msg.content && msg.content !== `Quote: ₦${msg.quotedPrice}` && (
                            <p className="text-sm md:text-base leading-relaxed">{msg.content}</p>
                          )}
                          {msg.quotedPrice && (
                            <div className={`space-y-1 md:space-y-2 pt-2 md:pt-3 border-t ${
                              msg.senderType === 'customer' ? 'border-white/30' : 'border-gray-300'
                            }`}>
                              <div className="flex justify-between text-xs md:text-sm gap-3">
                                <span className="opacity-90">Unit Price:</span>
                                <span className="font-semibold">₦{Math.round(msg.quotedPrice).toLocaleString()}</span>
                              </div>
                              {msg.discountPercentage && msg.discountPercentage > 0 && (
                                <div className={`flex justify-between text-xs md:text-sm gap-3 ${
                                  msg.senderType === 'customer' ? 'text-green-100' : 'text-green-600'
                                }`}>
                                  <span className="opacity-90">Discount ({msg.discountPercentage}%):</span>
                                  <span className="font-semibold">-₦{Math.round(msg.discountAmount || 0).toLocaleString()}</span>
                                </div>
                              )}
                              <div className="flex justify-between text-xs md:text-sm gap-3">
                                <span className="opacity-90">VAT (7.5%):</span>
                                <span className="font-semibold">₦{Math.round(msg.quotedVAT || msg.quotedPrice * 0.075).toLocaleString()}</span>
                              </div>
                              <div className={`flex justify-between text-sm md:text-base font-bold border-t pt-1 md:pt-2 gap-3 ${
                                msg.senderType === 'customer' ? 'border-white/30' : 'border-gray-300'
                              }`}>
                                <span>Total:</span>
                                <span>₦{Math.round(msg.quotedTotal || (msg.quotedPrice + (msg.quotedVAT || msg.quotedPrice * 0.075))).toLocaleString()}</span>
                              </div>

                              {/* Delivery Date Section (if present) */}
                              {msg.quotedDeliveryDate && (
                                <div className={`border-t pt-2 md:pt-3 ${
                                  msg.senderType === 'customer' ? 'border-white/30' : 'border-gray-300'
                                }`}>
                                  <div className="bg-gradient-to-r from-orange-100/50 to-amber-100/50 rounded-lg p-2 md:p-3 border border-orange-200">
                                    <p className="text-xs text-gray-700 font-semibold mb-1">📅 Proposed Delivery Date:</p>
                                    <p className={`text-sm md:text-base font-bold ${
                                      msg.senderType === 'customer' ? 'text-white' : 'text-orange-700'
                                    }`}>
                                      {new Date(msg.quotedDeliveryDate).toLocaleDateString('en-NG', {
                                        weekday: 'short',
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric',
                                      })}
                                    </p>
                                  </div>
                                </div>
                              )}

                              {(msg.isFinalPrice || (msg.messageType === 'quote' && msg.quotedTotal)) && (
                                <div className="space-y-2 mt-3">
                                  {msg.isFinalPrice && (
                                    <div className={`text-xs font-semibold px-2 py-1 rounded text-center ${
                                      msg.senderType === 'customer' ? 'bg-white/20 text-white' : 'bg-green-100 text-green-700'
                                    }`}>
                                      ✓ Final Price
                                    </div>
                                  )}
                                  {msg.senderType === 'admin' && !isAdmin && (
                                    <>
                                      {/* Check if there's a proposed delivery date that needs agreement */}
                                      {msg.quotedDeliveryDate && !buyerAgreedToDate ? (
                                        <div className="space-y-2">
                                          <label className="flex items-start gap-2 cursor-pointer bg-blue-50 p-2 md:p-3 rounded-lg border border-blue-200">
                                            <input
                                              type="checkbox"
                                              id={`agree-date-${msg._id}`}
                                              onChange={async (e) => {
                                                if (e.target.checked) {
                                                  try {
                                                    console.log('[ChatModal] 📍 Checkbox checked, updating agreement...');
                                                    const response = await fetch(`/api/custom-orders?id=${order._id}`, {
                                                      method: 'PATCH',
                                                      headers: { 'Content-Type': 'application/json' },
                                                      body: JSON.stringify({ 
                                                        buyerAgreedToDate: true,
                                                        deliveryDate: msg.quotedDeliveryDate // Update the card's displayed date to the agreed date
                                                      }),
                                                    });
                                                    if (response.ok) {
                                                      console.log('[ChatModal] ✅ Buyer agreed to delivery date');
                                                      setBuyerAgreedToDate(true);
                                                      setAgreedToDateMessageId(msg._id);
                                                      console.log('[ChatModal] ✅ State updated: buyerAgreedToDate = true, deliveryDate updated');
                                                    } else {
                                                      console.error('[ChatModal] ❌ Failed to update agreement:', response.status);
                                                    }
                                                  } catch (error) {
                                                    console.error('[ChatModal] ❌ Error updating agreement:', error);
                                                  }
                                                }
                                              }}
                                              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600 mt-0.5 flex-shrink-0 cursor-pointer"
                                            />
                                            <span className="text-xs md:text-sm text-gray-700 flex-1">
                                              I agree to the proposed delivery date above
                                            </span>
                                          </label>
                                        </div>
                                      ) : (
                                        <button
                                          onClick={() => handlePayNow(msg)}
                                          disabled={isPaymentDone}
                                          className={`w-full font-bold py-2 px-3 rounded-lg transition flex items-center justify-center gap-2 text-sm ${
                                            isPaymentDone
                                              ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                                              : 'bg-lime-600 hover:bg-lime-700 text-white'
                                          }`}
                                          title={isPaymentDone ? 'Payment already completed' : 'Click to proceed to checkout'}
                                        >
                                          <DollarSign className="h-4 w-4" />
                                          {isPaymentDone ? 'Payment Completed ✓' : 'Pay Now'}
                                        </button>
                                      )}
                                    </>
                                  )}
                                  {msg.senderType !== 'admin' && (
                                    <div className="text-xs text-gray-500 italic">
                                      (Pay Now button visible only for customer quote messages from admin)
                                    </div>
                                  )}
                                  {isAdmin && msg.senderType === 'admin' && (
                                    <div className="text-xs text-gray-500 italic">
                                      (Pay Now hidden: you're viewing as admin)
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ) : msg.messageType === 'quantity-update' ? (
                        <div className="space-y-2 md:space-y-3">
                          <p className="text-sm md:text-base font-semibold">📊 Quantity Update Request</p>
                          <div className="bg-white/10 rounded p-2 md:p-3 space-y-1">
                            <p className="text-xs md:text-sm opacity-90">Previous quantity:</p>
                            <p className="text-sm md:text-base font-bold">{msg.quantityChangeData?.oldQty} units</p>
                            <p className="text-xs md:text-sm opacity-90 mt-2">New quantity:</p>
                            <p className="text-sm md:text-base font-bold">{msg.quantityChangeData?.newQty} units</p>
                            <div className="border-t border-white/20 mt-2 pt-2">
                              <p className="text-xs md:text-sm opacity-90">Unit Price:</p>
                              <p className="text-sm md:text-base font-bold">{formatPrice(msg.quantityChangeData?.unitPrice || 0)}</p>
                              <p className="text-xs md:text-sm opacity-90 mt-2">Subtotal:</p>
                              <p className="text-sm md:text-base font-bold">{formatPrice(msg.quantityChangeData?.subtotal || 0)}</p>
                              {msg.quantityChangeData?.discountPercentage > 0 && (
                                <>
                                  <p className="text-xs md:text-sm opacity-90 mt-2">Discount ({msg.quantityChangeData?.discountPercentage}%):</p>
                                  <p className="text-sm md:text-base font-bold text-green-300">-{formatPrice(msg.quantityChangeData?.discountAmount || 0)}</p>
                                  <p className="text-xs md:text-sm opacity-90 mt-2">Subtotal after discount:</p>
                                  <p className="text-sm md:text-base font-bold">{formatPrice(msg.quantityChangeData?.subtotalAfterDiscount || 0)}</p>
                                </>
                              )}
                              <p className="text-xs md:text-sm opacity-90 mt-2">VAT (7.5%):</p>
                              <p className="text-sm md:text-base font-bold text-yellow-300">{formatPrice(msg.quantityChangeData?.vat || 0)}</p>
                              <div className="border-t border-white/20 mt-2 pt-2">
                                <p className="text-xs md:text-sm opacity-90">Total (with VAT):</p>
                                <p className="text-sm md:text-base font-bold text-lime-300">{formatPrice(msg.quantityChangeData?.newTotal || 0)}</p>
                              </div>
                            </div>
                          </div>
                          {isAdmin && msg.senderType === 'customer' && (
                            <button
                              onClick={() => handleConfirmAndSendQuote(msg)}
                              disabled={isSubmitting}
                              className="w-full font-bold py-2 px-3 rounded-lg bg-white text-lime-600 hover:bg-gray-50 transition text-sm mt-2"
                            >
                              {isSubmitting ? 'Sending Quote...' : 'Confirm & Send New Quote'}
                            </button>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm md:text-base leading-relaxed break-words">{msg.content}</p>
                      )}
                      {/* Timestamp */}
                      <p className={`text-xs mt-1 md:mt-2 opacity-70`}>
                        {new Date(msg.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Input Area - Clean, No Extra Scrollbars */}
          <div className="border-t border-gray-200 bg-white px-4 md:px-6 py-3 md:py-4 space-y-3 flex-shrink-0">
            {/* Status Message - If Final Price Set */}
            {finalMessage && (
              <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                <p className="text-sm text-green-700 font-medium">✓ Final price agreed - Order ready for production</p>
              </div>
            )}

            {/* Quote Form Toggle (Admin Only) */}
            {isAdmin && !finalMessage && (
              <button
                onClick={() => setShowQuoteForm(true)}
                className="w-full py-2 px-4 rounded-lg font-medium text-sm md:text-base transition flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-900"
              >
                <DollarSign className="h-4 w-4" />
                + Send Quote
              </button>
            )}

            {/* Message Input - Always Visible */}
            <form onSubmit={sendMessage} className="flex gap-2 items-center">
              <input
                ref={inputRef}
                type="text"
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder={isAdmin ? "Type a message..." : "Reply..."}
                className="flex-1 px-4 py-2 md:py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-lime-600 focus:border-transparent text-sm"
              />
              <button
                type="submit"
                disabled={isSubmitting || !messageText.trim()}
                className="bg-lime-600 hover:bg-lime-700 disabled:bg-gray-300 text-white p-2 md:p-3 rounded-full transition flex items-center justify-center flex-shrink-0 h-10 w-10 md:h-11 md:w-11"
                aria-label="Send message"
              >
                <Send className="h-4 w-4 md:h-5 md:w-5" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
