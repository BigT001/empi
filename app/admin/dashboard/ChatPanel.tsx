"use client";

import { useState, useEffect, useRef } from "react";
import { Send, AlertCircle, CheckCircle, DollarSign, X } from "lucide-react";

interface Message {
  _id: string;
  orderId: string;
  orderNumber: string;
  senderEmail: string;
  senderName: string;
  senderType: 'admin' | 'customer';
  content: string;
  isFinalPrice?: boolean;
  quotedPrice?: number;
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
  quotedPrice?: number;
}

interface ChatPanelProps {
  order: CustomOrder;
  adminEmail: string;
  adminName: string;
  onQuoteUpdate?: (price: number) => void;
}

export function ChatPanel({ order, adminEmail, adminName, onQuoteUpdate }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [quotePrice, setQuotePrice] = useState<string>(order.quotedPrice?.toString() || '');
  const [quotedDeliveryDate, setQuotedDeliveryDate] = useState<string>('');
  const [isFinalPrice, setIsFinalPrice] = useState(false);
  const [showQuoteForm, setShowQuoteForm] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch messages
  useEffect(() => {
    console.log('[ChatPanel] Component mounted for order:', order.orderNumber, 'ID:', order._id);
    fetchMessages();
    // Poll for new messages every 3 seconds
    const interval = setInterval(fetchMessages, 3000);
    return () => {
      console.log('[ChatPanel] Cleaning up interval');
      clearInterval(interval);
    };
  }, [order._id]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchMessages = async () => {
    try {
      console.log('[ChatPanel] Fetching messages for orderId:', order._id);
      const response = await fetch(
        `/api/messages?orderId=${order._id}`
      );
      const data = await response.json();
      console.log('[ChatPanel] API Response:', data);
      if (data.success && Array.isArray(data.messages)) {
        console.log('[ChatPanel] Setting messages, count:', data.messages.length);
        setMessages(data.messages);
      } else {
        console.log('[ChatPanel] Invalid response format:', data);
      }
    } catch (error) {
      console.error('[ChatPanel] Error fetching messages:', error);
    }
  };

  const sendMessage = async (e: React.FormEvent, messageType: string = 'text') => {
    e.preventDefault();

    if (!messageText.trim() && messageType === 'text') {
      console.log('[ChatPanel] Empty message, not sending');
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
        senderEmail: adminEmail,
        senderName: adminName,
        senderType: 'admin',
        content: messageText || `Quote: ₦${quotePrice}`,
        messageType: messageType,
        isFinalPrice,
      };

      if (messageType === 'quote' || messageType === 'negotiation') {
        payload.quotedPrice = parseFloat(quotePrice);
        if (quotedDeliveryDate) {
          payload.quotedDeliveryDate = quotedDeliveryDate;
        }
      }

      console.log('[ChatPanel] Sending message:', payload);
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to send message: ${response.status} - ${error}`);
      }

      const result = await response.json();
      console.log('[ChatPanel] Message sent successfully:', result);

      setMessageText('');
      setQuotePrice('');
      setQuotedDeliveryDate('');
      setIsFinalPrice(false);
      setShowQuoteForm(false);
      
      if (onQuoteUpdate && messageType === 'quote') {
        onQuoteUpdate(parseFloat(quotePrice));
      }

      // Refresh messages
      fetchMessages();
    } catch (error) {
      console.error('[ChatPanel] Error sending message:', error);
      alert('Failed to send message');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Chat Panel - Always Fixed Height */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden flex flex-col min-h-96">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-b border-gray-200 px-4 py-3 flex-shrink-0">
          <h3 className="font-semibold text-gray-900">Chat with Customer</h3>
          <p className="text-xs text-gray-600 mt-1">{order.email}</p>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              <p className="text-sm">No messages yet. Start the conversation!</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg._id}
                className={`flex ${msg.senderType === 'admin' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs px-4 py-2 rounded-lg ${
                    msg.senderType === 'admin'
                      ? 'bg-lime-600 text-white'
                      : 'bg-white text-gray-900 border border-gray-200'
                  }`}
                >
                  <p className="text-xs font-medium opacity-75 mb-1">{msg.senderName}</p>
                  
                  {/* Quantity Update Message */}
                  {msg.messageType === 'quantity-update' ? (
                    <div className="space-y-2">
                      <p className="text-sm font-semibold">📊 Quantity Update Request</p>
                      <div className="bg-white/10 rounded p-2 space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="opacity-75">Previous:</span>
                          <span className="font-bold">{msg.quantityChangeData?.oldQty} units</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="opacity-75">New:</span>
                          <span className="font-bold">{msg.quantityChangeData?.newQty} units</span>
                        </div>
                        <div className="border-t border-current border-opacity-30 pt-1 mt-1">
                          <div className="flex justify-between">
                            <span className="opacity-75">Unit Price:</span>
                            <span className="font-bold">₦{msg.quantityChangeData?.unitPrice?.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="opacity-75">New Total:</span>
                            <span className="font-bold">₦{msg.quantityChangeData?.newTotal?.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm">{msg.content}</p>
                  )}

                  {/* Price Badge */}
                  {msg.quotedPrice && (
                    <div className="mt-2 pt-2 border-t border-current border-opacity-30 flex items-center gap-1">
                      <DollarSign className="h-3 w-3" />
                      <span className="text-sm font-bold">₦{msg.quotedPrice.toLocaleString()}</span>
                      {msg.isFinalPrice && (
                        <span className="text-xs ml-1 bg-opacity-30 px-2 py-0.5 rounded">Final</span>
                      )}
                    </div>
                  )}

                  <p className="text-xs opacity-75 mt-1">
                    {new Date(msg.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-200 p-3 space-y-3 flex-shrink-0">
          <form onSubmit={(e) => sendMessage(e, 'text')} className="flex gap-2">
            <input
              type="text"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-600 text-sm"
            />
            <button
              type="submit"
              disabled={isSubmitting || !messageText.trim()}
              className="bg-lime-600 hover:bg-lime-700 disabled:bg-gray-300 text-white p-2 rounded-lg transition"
            >
              <Send className="h-5 w-5" />
            </button>
          </form>

          <div className="grid grid-cols-2 gap-2 w-full">
            <button
              onClick={() => setShowQuoteForm(true)}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 font-semibold rounded-lg transition text-sm border border-blue-300"
            >
              <DollarSign className="h-4 w-4" />
              Send Quote
            </button>
            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to decline this order?')) {
                  fetch(`/api/custom-orders?id=${order._id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: 'rejected' })
                  }).then(() => {
                    alert('Order declined');
                    window.location.reload();
                  });
                }
              }}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 font-semibold rounded-lg transition text-sm border border-red-300"
            >
              <X className="h-4 w-4" />
              Decline
            </button>
          </div>
        </div>
      </div>

      {/* Quote Modal - Separate Card */}
      {showQuoteForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 animate-in fade-in zoom-in-95 duration-300">
            {/* Header */}
            <div className="flex items-center gap-2 mb-6">
              <div className="bg-blue-100 rounded-lg p-3">
                <DollarSign className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Send Quote</h2>
                <p className="text-xs text-gray-600">Order: {order.orderNumber}</p>
              </div>
            </div>

            {/* Two Column Layout */}
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              {/* Price Card */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border-2 border-blue-300">
                <label className="block text-sm font-bold text-blue-900 mb-3">
                  💰 Unit Price (₦)
                </label>
                <input
                  type="number"
                  value={quotePrice}
                  onChange={(e) => setQuotePrice(e.target.value)}
                  placeholder="Enter price in Naira"
                  className="w-full px-4 py-3 border-2 border-blue-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg font-semibold bg-white"
                />
                {quotePrice && (
                  <div className="mt-3 p-3 bg-white rounded-lg border border-blue-200">
                    <p className="text-xs text-blue-600">Price: </p>
                    <p className="text-xl font-bold text-blue-700">₦{parseFloat(quotePrice).toLocaleString()}</p>
                  </div>
                )}
              </div>

              {/* Date Card */}
              <div className="bg-gradient-to-br from-orange-50 to-amber-100 rounded-xl p-4 border-2 border-orange-300">
                <label className="block text-sm font-bold text-orange-900 mb-3">
                  📅 Production Ready Date
                </label>
                <input
                  type="date"
                  value={quotedDeliveryDate}
                  onChange={(e) => setQuotedDeliveryDate(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-orange-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm font-semibold bg-white"
                />
                {quotedDeliveryDate && (
                  <div className="mt-3 p-3 bg-white rounded-lg border border-orange-200">
                    <p className="text-xs text-orange-600">Proposed: </p>
                    <p className="text-sm font-bold text-orange-700">
                      {new Date(quotedDeliveryDate).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Options */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="finalPrice"
                  checked={isFinalPrice}
                  onChange={(e) => setIsFinalPrice(e.target.checked)}
                  className="w-4 h-4 accent-blue-600 cursor-pointer"
                />
                <label htmlFor="finalPrice" className="text-sm font-medium text-gray-700 cursor-pointer">
                  ✓ This is the final price (no negotiation)
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  📝 Additional Message (Optional)
                </label>
                <textarea
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="e.g., 'Includes rush fee' or 'Based on your specifications...'"
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowQuoteForm(false);
                  setMessageText('');
                  setQuotePrice('');
                  setQuotedDeliveryDate('');
                  setIsFinalPrice(false);
                }}
                className="flex-1 px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-900 font-semibold rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={(e) => {
                  sendMessage(e, 'quote');
                  setTimeout(() => {
                    setShowQuoteForm(false);
                    setQuotePrice('');
                    setQuotedDeliveryDate('');
                    setIsFinalPrice(false);
                  }, 500);
                }}
                disabled={isSubmitting || !quotePrice}
                className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-semibold rounded-lg transition flex items-center justify-center gap-2"
              >
                <DollarSign className="h-4 w-4" />
                Send Quote
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
