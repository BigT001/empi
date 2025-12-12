"use client";

import { useState, useEffect, useRef } from "react";
import { Send, MessageCircle, DollarSign, CheckCircle } from "lucide-react";

interface Message {
  _id: string;
  orderId: string;
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

interface CustomerChatProps {
  order: CustomOrder;
  customerEmail: string;
  customerName: string;
}

export function CustomerChat({ order, customerEmail, customerName }: CustomerChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch messages
  useEffect(() => {
    console.log('[CustomerChat] Component mounted for order:', order.orderNumber, 'ID:', order._id);
    fetchMessages();
    // Poll for new messages every 3 seconds
    const interval = setInterval(fetchMessages, 3000);
    return () => {
      console.log('[CustomerChat] Cleaning up interval');
      clearInterval(interval);
    };
  }, [order._id]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Count unread messages from admin
  useEffect(() => {
    const unread = messages.filter(
      m => m.senderType === 'admin' && !m.isRead
    ).length;
    setUnreadCount(unread);

    // Mark admin messages as read when chat is open
    if (isOpen && unread > 0) {
      const unreadIds = messages
        .filter(m => m.senderType === 'admin' && !m.isRead)
        .map(m => m._id);
      if (unreadIds.length > 0) {
        markAsRead(unreadIds);
      }
    }
  }, [messages, isOpen]);

  const fetchMessages = async () => {
    try {
      console.log('[CustomerChat] Fetching messages for orderId:', order._id);
      const response = await fetch(`/api/messages?orderId=${order._id}`);
      const data = await response.json();
      console.log('[CustomerChat] API Response:', data);
      if (data.success && Array.isArray(data.messages)) {
        console.log('[CustomerChat] Setting messages, count:', data.messages.length);
        setMessages(data.messages);
      } else {
        console.log('[CustomerChat] Invalid response format:', data);
      }
    } catch (error) {
      console.error('[CustomerChat] Error fetching messages:', error);
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
      console.error('Error marking messages as read:', error);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!messageText.trim()) {
      console.log('[CustomerChat] Empty message, not sending');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        orderId: order._id,
        orderNumber: order.orderNumber,
        senderEmail: customerEmail,
        senderName: customerName,
        senderType: 'customer',
        content: messageText,
        messageType: 'negotiation',
      };
      
      console.log('[CustomerChat] Sending message:', payload);
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
      console.log('[CustomerChat] Message sent successfully:', result);

      setMessageText('');
      // Refresh messages
      fetchMessages();
    } catch (error) {
      console.error('[CustomerChat] Error sending message:', error);
      alert('Failed to send message');
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasAdminQuote = messages.some(
    m => m.senderType === 'admin' && m.messageType === 'quote'
  );

  const finalMessage = messages.find(m => m.isFinalPrice && m.senderType === 'admin');

  return (
    <div className="space-y-4">
      {/* Chat Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-purple-600" />
          <h4 className="font-semibold text-gray-900">Admin Negotiation</h4>
        </div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 ${
            isOpen
              ? 'bg-purple-600 text-white'
              : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
          } relative`}
        >
          {isOpen ? 'Close Chat' : 'Open Chat'}
          {unreadCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* Chat Container */}
      {isOpen && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden flex flex-col h-96">
          {/* Status Banner */}
          {finalMessage && (
            <div className="bg-green-50 border-b border-green-200 px-4 py-3 flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-semibold text-green-900">Final Price Set</p>
                <p className="text-sm text-green-700">
                  ₦{finalMessage.quotedPrice?.toLocaleString()} - No further negotiation
                </p>
              </div>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-500">
                <p className="text-sm text-center">
                  No messages yet.<br />
                  Admin will contact you soon with a quote.
                </p>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg._id}
                  className={`flex ${msg.senderType === 'customer' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs px-4 py-2 rounded-lg ${
                      msg.senderType === 'customer'
                        ? 'bg-purple-600 text-white'
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
                          <span className="text-xs ml-1 px-2 py-0.5 rounded bg-green-600">Final</span>
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
          {!finalMessage ? (
            <div className="border-t border-gray-200 p-3 bg-white">
              <form onSubmit={sendMessage} className="flex gap-2">
                <input
                  type="text"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Type your message or response..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 text-sm"
                  disabled={!!finalMessage}
                />
                <button
                  type="submit"
                  disabled={isSubmitting || !messageText.trim()}
                  className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 text-white p-2 rounded-lg transition"
                >
                  <Send className="h-5 w-5" />
                </button>
              </form>
            </div>
          ) : (
            <div className="border-t border-gray-200 p-3 bg-green-50 text-center text-sm font-medium text-green-700">
              Price is final - no further negotiation possible
            </div>
          )}
        </div>
      )}
    </div>
  );
}
