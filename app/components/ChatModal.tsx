"use client";

import { useState, useEffect, useRef } from "react";
import { Send, X, DollarSign, CheckCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useBuyer } from "@/app/context/BuyerContext";
import { calculateQuote } from "@/lib/discountCalculator";

interface Message {
  _id: string;
  orderId: string;
  senderEmail: string;
  senderName: string;
  senderType: 'admin' | 'customer' | 'system';
  content: string;
  isFinalPrice?: boolean;
  quotedPrice?: number;
  quotedVAT?: number;
  quotedTotal?: number;
  discountPercentage?: number;
  discountAmount?: number;
  messageType: 'text' | 'quote' | 'negotiation' | 'system';
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
  const [isFinalPrice, setIsFinalPrice] = useState(false);
  const [showQuoteForm, setShowQuoteForm] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [userScrolledUp, setUserScrolledUp] = useState(false);

  const calculateQuoteDetails = () => {
    const basePrice = parseFloat(quotePrice) || 0;
    const quantity = order.quantity || 1;
    const quoteData = calculateQuote(basePrice, quantity);
    return quoteData;
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

  // Fetch messages
  useEffect(() => {
    if (!isOpen) return;

    console.log('[ChatModal] Modal opened, fetching messages for order:', order._id);
    fetchMessages();

    const interval = setInterval(fetchMessages, 1500);
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
        setMessages(data.messages);
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
        className="fixed inset-0 bg-black/50 z-40 transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Modal - Full Screen on Mobile, Centered on Desktop */}
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
                                <span className="font-semibold">₦{msg.quotedPrice.toLocaleString()}</span>
                              </div>
                              {msg.discountPercentage && msg.discountPercentage > 0 && (
                                <div className={`flex justify-between text-xs md:text-sm gap-3 ${
                                  msg.senderType === 'customer' ? 'text-green-100' : 'text-green-600'
                                }`}>
                                  <span className="opacity-90">Discount ({msg.discountPercentage}%):</span>
                                  <span className="font-semibold">-₦{(msg.discountAmount || 0).toLocaleString()}</span>
                                </div>
                              )}
                              <div className="flex justify-between text-xs md:text-sm gap-3">
                                <span className="opacity-90">VAT (7.5%):</span>
                                <span className="font-semibold">₦{(msg.quotedVAT || msg.quotedPrice * 0.075).toLocaleString()}</span>
                              </div>
                              <div className={`flex justify-between text-sm md:text-base font-bold border-t pt-1 md:pt-2 gap-3 ${
                                msg.senderType === 'customer' ? 'border-white/30' : 'border-gray-300'
                              }`}>
                                <span>Total:</span>
                                <span>₦{(msg.quotedTotal || (msg.quotedPrice + (msg.quotedVAT || msg.quotedPrice * 0.075))).toLocaleString()}</span>
                              </div>
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
                                    <button
                                      onClick={() => handlePayNow(msg)}
                                      className="w-full bg-lime-600 hover:bg-lime-700 text-white font-bold py-2 px-3 rounded-lg transition flex items-center justify-center gap-2 text-sm"
                                    >
                                      <DollarSign className="h-4 w-4" />
                                      Pay Now
                                    </button>
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
          {!finalMessage ? (
            <div className="border-t border-gray-200 bg-white px-4 md:px-6 py-3 md:py-4 space-y-3 flex-shrink-0">
              {/* Quote Form Toggle (Admin Only) */}
              {isAdmin && (
                <button
                  onClick={() => setShowQuoteForm(!showQuoteForm)}
                  className={`w-full py-2 px-4 rounded-lg font-medium text-sm md:text-base transition flex items-center justify-center gap-2 ${
                    showQuoteForm
                      ? 'bg-lime-600 text-white'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                  }`}
                >
                  <DollarSign className="h-4 w-4" />
                  {showQuoteForm ? 'Cancel' : '+ Send Quote'}
                </button>
              )}

              {/* Quote Form (Admin Only) - Compact */}
              {isAdmin && showQuoteForm && (
                <div className="bg-gray-50 p-3 md:p-4 rounded-lg space-y-3 border border-gray-200">
                  {/* Discount Info */}
                  {order.quantity && order.quantity >= 3 && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-2 md:p-3">
                      <p className="text-xs md:text-sm font-semibold text-green-700">
                        💡 {order.quantity >= 10 ? '10%' : order.quantity >= 6 ? '7%' : '5%'} discount for {order.quantity} units
                      </p>
                    </div>
                  )}

                  {/* Price Input */}
                  <div>
                    <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">Unit Price (₦)</label>
                    <input
                      type="number"
                      value={quotePrice}
                      onChange={(e) => setQuotePrice(e.target.value)}
                      placeholder="Enter price"
                      className="w-full px-3 md:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-600 focus:border-transparent text-sm"
                    />
                  </div>

                  {/* Quote Preview - Compact */}
                  {quotePrice && (
                    <div className="bg-white border border-gray-200 p-2 md:p-3 rounded-lg space-y-1 md:space-y-2 text-xs md:text-sm">
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
                      <div className="border-t border-gray-200 pt-1 flex justify-between font-semibold text-green-600">
                        <span>Total:</span>
                        <span>₦{calculateQuoteDetails().total.toLocaleString()}</span>
                      </div>
                    </div>
                  )}

                  {/* Final Price Checkbox */}
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isFinalPrice}
                      onChange={(e) => setIsFinalPrice(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-lime-600 focus:ring-lime-600"
                    />
                    <span className="text-xs md:text-sm text-gray-700">Mark as final price</span>
                  </label>

                  {/* Send Quote Button */}
                  <button
                    onClick={(e) => sendMessage(e, 'quote')}
                    disabled={isSubmitting || !quotePrice}
                    className="w-full bg-lime-600 hover:bg-lime-700 disabled:bg-gray-300 text-white font-semibold py-2 px-4 rounded-lg transition text-sm"
                  >
                    Send Quote
                  </button>
                </div>
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
                  disabled={showQuoteForm && isAdmin}
                />
                <button
                  type="submit"
                  disabled={isSubmitting || (!messageText.trim() && !showQuoteForm)}
                  className="bg-lime-600 hover:bg-lime-700 disabled:bg-gray-300 text-white p-2 md:p-3 rounded-full transition flex items-center justify-center flex-shrink-0 h-10 w-10 md:h-11 md:w-11"
                  aria-label="Send message"
                >
                  <Send className="h-4 w-4 md:h-5 md:w-5" />
                </button>
              </form>
            </div>
          ) : (
            <div className="border-t border-green-200 bg-green-50 px-4 md:px-6 py-3 md:py-4 text-center flex-shrink-0">
              <p className="text-sm md:text-base text-green-700 font-medium">✓ Order ready for production</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
