"use client";

import { useState, useEffect, useRef } from "react";
import { Send, AlertCircle, CheckCircle, DollarSign } from "lucide-react";

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
  messageType: 'text' | 'quote' | 'negotiation';
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
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden flex flex-col h-96">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-b border-gray-200 px-4 py-3">
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
                <p className="text-sm">{msg.content}</p>

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

      {/* Quote Form */}
      {showQuoteForm && (
        <div className="border-t border-gray-200 bg-blue-50 p-3 space-y-2">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-semibold text-blue-900">Send Quote</span>
          </div>

          <div className="space-y-2">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Price (₦)
              </label>
              <input
                type="number"
                value={quotePrice}
                onChange={(e) => setQuotePrice(e.target.value)}
                placeholder="Enter price"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="finalPrice"
                checked={isFinalPrice}
                onChange={(e) => setIsFinalPrice(e.target.checked)}
                className="rounded"
              />
              <label htmlFor="finalPrice" className="text-xs font-medium text-gray-700">
                This is the final price (no negotiation)
              </label>
            </div>

            <textarea
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Add a message (optional)"
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
            />

            <div className="flex gap-2">
              <button
                onClick={(e) => sendMessage(e, 'quote')}
                disabled={isSubmitting || !quotePrice}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white text-sm font-medium py-2 rounded transition"
              >
                Send Quote
              </button>
              <button
                onClick={() => {
                  setShowQuoteForm(false);
                  setMessageText('');
                  setQuotePrice('');
                }}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-900 text-sm font-medium py-2 rounded transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="border-t border-gray-200 p-3 space-y-2">
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

        <button
          onClick={() => setShowQuoteForm(!showQuoteForm)}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 font-medium rounded-lg transition text-sm"
        >
          <DollarSign className="h-4 w-4" />
          Send Quote
        </button>
      </div>
    </div>
  );
}
