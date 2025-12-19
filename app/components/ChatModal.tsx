"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Send, X, DollarSign, CheckCircle, MapPin } from "lucide-react";
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
  messageType: 'text' | 'quote' | 'negotiation' | 'system' | 'quantity-update' | 'delivery-option' | 'address' | 'review-request' | 'review';
  deliveryOption?: 'pickup' | 'delivery'; // Selected delivery option
  quantityChangeData?: {
    oldQty: number;
    newQty: number;
    unitPrice: number;
    newTotal: number;
  };
  recipientType?: 'admin' | 'buyer' | 'all'; // Who should see this message
  isRead: boolean;
  createdAt: string;
}

interface CustomOrder {
  _id: string;
  orderNumber: string;
  email: string;
  phone: string;
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
  isLogisticsTeam?: boolean; // True if ChatModal is opened from logistics page
  deliveryOption?: 'pickup' | 'delivery'; // Type of delivery for logistics
  adminName?: string;
  onMessageSent?: () => void;
  orderStatus?: string; // Current tab/status: pending, approved, in-progress, ready, completed, rejected
}


export function ChatModal({
  isOpen,
  onClose,
  order,
  userEmail,
  userName,
  isAdmin = false,
  isLogisticsTeam = false,
  deliveryOption,
  adminName = "Empi Costumes",
  onMessageSent,
  orderStatus: currentOrderStatus = 'pending',
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
  const [showDeliveryOptions, setShowDeliveryOptions] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [userScrolledUp, setUserScrolledUp] = useState(false);
  const [agreedToDateMessageId, setAgreedToDateMessageId] = useState<string | null>(null);
  const [buyerAgreedToDate, setBuyerAgreedToDate] = useState((order && order.buyerAgreedToDate) || false);
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [declineReason, setDeclineReason] = useState('');
  const [isSubmittingDecline, setIsSubmittingDecline] = useState(false);
  
  // Logistics delivery quote state
  const [showLogisticsQuoteForm, setShowLogisticsQuoteForm] = useState(false);
  const [logisticsQuoteAmount, setLogisticsQuoteAmount] = useState('');
  const [logisticsDeliveryType, setLogisticsDeliveryType] = useState('car');
  const [logisticsBankName, setLogisticsBankName] = useState('');
  const [logisticsAccountNumber, setLogisticsAccountNumber] = useState('');
  const [logisticsAccountHolder, setLogisticsAccountHolder] = useState('');
  const [isSubmittingLogisticsQuote, setIsSubmittingLogisticsQuote] = useState(false);

  // Logistics pickup address modal state
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [selectedPickupAddress, setSelectedPickupAddress] = useState<string>('');
  const [isSubmittingAddress, setIsSubmittingAddress] = useState(false);

  // Pickup confirmation modal state
  const [showPickupConfirmModal, setShowPickupConfirmModal] = useState(false);
  const [isSubmittingPickupConfirm, setIsSubmittingPickupConfirm] = useState(false);

  // Review submission state
  const [reviewText, setReviewText] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);

  // Review warning dialog state
  const [showReviewWarning, setShowReviewWarning] = useState(false);
  const [hasReviewBeenSent, setHasReviewBeenSent] = useState(false);

  const pickupAddresses = [
    '22 Chi-Ben street, Ojo, Lagos',
    '22 Ejire street Suru Lere, Lagos, Nigeria',
  ];

  const calculateQuoteDetails = () => {
    const basePrice = parseFloat(quotePrice) || 0;
    const quantity = order.quantity || 1;
    const quoteData = calculateQuote(basePrice, quantity);
    return quoteData;
  };

  // Fetch order status to check if payment is done
  const fetchOrderStatus = async () => {
    try {
      if (!order?._id) {
        console.warn('[ChatModal] ⚠️ Order ID missing, skipping status fetch');
        return;
      }
      
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
      } else {
        console.warn('[ChatModal] ⚠️ Failed to fetch order status:', res.status, res.statusText);
      }
    } catch (error) {
      console.error('[ChatModal] ❌ Error fetching order status:', error);
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
        
        // Check if a review request has already been sent
        const reviewRequestSent = data.messages.some((msg: Message) => msg.messageType === 'review-request');
        setHasReviewBeenSent(reviewRequestSent);
        console.log('[ChatModal] Review request sent:', reviewRequestSent);
        
        // Filter messages based on recipientType and viewer role
        const filteredMessages = data.messages.filter((msg: Message) => {
          // Always show messages without recipientType (backward compatibility) or recipientType='all'
          if (!msg.recipientType || msg.recipientType === 'all') {
            console.log('[ChatModal] 📊 Message passes filter (no recipientType or all):', {
              messageId: msg._id,
              messageType: msg.messageType,
              recipientType: msg.recipientType,
            });
            return true;
          }
          // Admin-only messages: show only if viewer is admin
          if (msg.recipientType === 'admin' && isAdmin) {
            console.log('[ChatModal] 📊 Message passes filter (admin message, viewer is admin):', {
              messageId: msg._id,
              messageType: msg.messageType,
              recipientType: msg.recipientType,
            });
            return true;
          }
          // Buyer-only messages: show only if viewer is NOT admin (is buyer)
          if (msg.recipientType === 'buyer' && !isAdmin) {
            console.log('[ChatModal] 📊 Message passes filter (buyer message, viewer is buyer):', {
              messageId: msg._id,
              messageType: msg.messageType,
              recipientType: msg.recipientType,
            });
            return true;
          }
          console.log('[ChatModal] 📊 Message BLOCKED by filter:', {
            messageId: msg._id,
            messageType: msg.messageType,
            recipientType: msg.recipientType,
            viewerIsAdmin: isAdmin,
          });
          return false;
        });
        
        console.log('[ChatModal] 📊 Filtered to', filteredMessages.length, 'messages (viewer is', isAdmin ? 'admin' : 'buyer', ')');
        
        filteredMessages.forEach((msg: Message) => {
          if (msg.messageType === 'quantity-update') {
            console.log('[ChatModal] 📊 Found quantity-update message:', {
              messageId: msg._id,
              senderType: msg.senderType,
              quantityChangeData: msg.quantityChangeData
            });
          }
        });
        setMessages(filteredMessages);
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

  // Send delivery options to buyer
  const sendDeliveryOptions = async () => {
    try {
      setIsSubmitting(true);
      const deliveryMessage = `📦 **DELIVERY OPTIONS** 📦\n\nYour costume is ready! Please select how you'd like to receive it:`;
      
      const messageResponse = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order._id,
          orderNumber: order.orderNumber,
          senderEmail: userEmail,
          senderName: adminName,
          senderType: 'admin',
          content: deliveryMessage,
          messageType: 'system',
          recipientType: 'all',
          deliveryOptionRequest: true
        })
      });

      if (!messageResponse.ok) {
        console.error('Failed to send delivery options:', await messageResponse.text());
        alert('Failed to send delivery options');
        return;
      }

      setShowDeliveryOptions(false);
      // Refresh messages
      fetchMessages();
    } catch (error) {
      console.error('Error sending delivery options:', error);
      alert('Failed to send delivery options. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delivery option selection by buyer
  const selectDeliveryOption = async (option: 'pickup' | 'delivery') => {
    try {
      const optionLabel = option === 'pickup' ? '📍 Personal Pickup' : '🚚 Empi Delivery';
      const optionMessage = `I choose: ${optionLabel}`;
      
      const messageResponse = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order._id,
          orderNumber: order.orderNumber,
          senderEmail: userEmail,
          senderName: userName,
          senderType: 'customer',
          content: optionMessage,
          messageType: 'system',
          deliveryOption: option,
          recipientType: 'all'
        })
      });

      if (!messageResponse.ok) {
        console.error('Failed to select delivery option:', await messageResponse.text());
        alert('Failed to select delivery option');
        return;
      }

      // **TRIGGER: Hand off order to logistics**
      console.log('[ChatModal] 🚀 TRIGGER: Handing off order to logistics...');
      const handoffResponse = await fetch('/api/orders/handoff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order._id,
          orderNumber: order.orderNumber,
        })
      });

      if (!handoffResponse.ok) {
        console.error('Failed to hand off order to logistics:', await handoffResponse.text());
      } else {
        console.log('[ChatModal] ✅ Order successfully handed off to logistics');
      }

      // Refresh messages
      fetchMessages();
    } catch (error) {
      console.error('Error selecting delivery option:', error);
      alert('Failed to select delivery option. Please try again.');
    }
  };

  // Send delivery quote from chat (Logistics team)
  const sendLogisticsQuote = async () => {
    if (!logisticsQuoteAmount.trim()) {
      alert('Please enter a quote amount');
      return;
    }

    if (!logisticsBankName.trim() || !logisticsAccountNumber.trim() || !logisticsAccountHolder.trim()) {
      alert('Please fill in all bank details');
      return;
    }

    setIsSubmittingLogisticsQuote(true);

    try {
      const quoteData = {
        amount: logisticsQuoteAmount,
        transportType: logisticsDeliveryType,
        bankName: logisticsBankName,
        accountNumber: logisticsAccountNumber,
        accountHolder: logisticsAccountHolder,
      };

      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order._id,
          orderNumber: order.orderNumber,
          senderEmail: userEmail,
          senderName: userName,
          senderType: 'admin',
          content: JSON.stringify(quoteData),
          messageType: 'quote',
          recipientType: 'all',
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to send quote: ${response.status} - ${error}`);
      }

      // Reset form
      setShowLogisticsQuoteForm(false);
      setLogisticsQuoteAmount('');
      setLogisticsDeliveryType('car');
      setLogisticsBankName('');
      setLogisticsAccountNumber('');
      setLogisticsAccountHolder('');

      // Refresh messages
      await fetchMessages();

      console.log('[ChatModal] ✅ Logistics quote sent successfully');
    } catch (error) {
      console.error('[ChatModal] Error sending logistics quote:', error);
      alert('Failed to send quote. Please try again.');
    } finally {
      setIsSubmittingLogisticsQuote(false);
    }
  };

  const sendPickupAddress = async (address: string) => {
    if (!address.trim()) {
      alert('Please select an address');
      return;
    }

    setIsSubmittingAddress(true);

    try {
      const addressData = {
        pickupLocation: address,
        type: 'pickup_address',
      };

      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order._id,
          orderNumber: order.orderNumber,
          senderEmail: userEmail,
          senderName: userName,
          senderType: 'admin',
          content: JSON.stringify(addressData),
          messageType: 'address',
          recipientType: 'all',
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to send address: ${response.status} - ${error}`);
      }

      // Reset form
      setShowAddressModal(false);
      setSelectedPickupAddress('');

      // Refresh messages
      await fetchMessages();

      console.log('[ChatModal] ✅ Pickup address sent successfully');
    } catch (error) {
      console.error('[ChatModal] Error sending pickup address:', error);
      alert('Failed to send address. Please try again.');
    } finally {
      setIsSubmittingAddress(false);
    }
  };

  const confirmPickup = async () => {
    console.log('[ChatModal] ==================== confirmPickup STARTED ====================');
    setIsSubmittingPickupConfirm(true);

    try {
      // Step 1: Update order status to 'completed'
      console.log('[ChatModal] 📍 Step 1: Updating order status to completed...');
      console.log('[ChatModal] Order ID:', order._id);
      console.log('[ChatModal] Order fullName:', order.fullName);
      
      const patchUrl = `/api/custom-orders?id=${order._id}`;
      console.log('[ChatModal] PATCH URL:', patchUrl);
      
      const statusResponse = await fetch(patchUrl, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: 'completed',
        }),
      });

      console.log('[ChatModal] PATCH response status:', statusResponse.status);
      if (!statusResponse.ok) {
        const error = await statusResponse.text();
        console.error('[ChatModal] ❌ PATCH error:', error);
        throw new Error(`Failed to update status: ${statusResponse.status} - ${error}`);
      }
      console.log('[ChatModal] ✅ Step 1 complete: Order status updated successfully');

      // Step 2: Send thank you message to chat
      console.log('[ChatModal] 📨 Step 2: Sending thank you message...');
      const thankYouMessage = `Thank you ${order.fullName}! 🎉

Your costumes have been successfully picked up from our pickup location. We hope you're excited about your order!

If you have any questions or feedback about your experience with Empi, please don't hesitate to reach out. We'd love to hear from you!

Thank you for choosing Empi! 👖✨`;

      const messagePayload = {
        orderId: order._id,
        orderNumber: order.orderNumber,
        senderEmail: 'logistics@empi.com',
        senderName: 'Logistics Team',
        senderType: 'admin',
        content: thankYouMessage,
        messageType: 'system',
        recipientType: 'all',
      };
      
      console.log('[ChatModal] 📨 Message payload:', messagePayload);

      const messageResponse = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(messagePayload),
      });

      console.log('[ChatModal] POST /api/messages response status:', messageResponse.status);
      console.log('[ChatModal] POST /api/messages response ok:', messageResponse.ok);

      if (!messageResponse.ok) {
        const error = await messageResponse.text();
        console.error('[ChatModal] ⚠️ POST error:', error);
        throw new Error(`Failed to send message: ${messageResponse.status} - ${error}`);
      }
      
      const messageData = await messageResponse.json();
      console.log('[ChatModal] ✅ Step 2 complete: Thank you message sent successfully:', messageData);

      // Step 3: Close confirmation modal
      console.log('[ChatModal] Step 3: Closing confirmation modal');
      setShowPickupConfirmModal(false);
      
      // Step 4: Refresh messages to show thank you
      console.log('[ChatModal] 🔄 Step 4: Refreshing messages...');
      await fetchMessages();
      console.log('[ChatModal] ✅ Step 4 complete: Messages refreshed');
      
      // Step 5: Call onMessageSent to refresh the parent component (logistics page)
      console.log('[ChatModal] 📢 Step 5: Notifying parent component to refresh order list...');
      if (onMessageSent) {
        console.log('[ChatModal] 📢 Calling onMessageSent callback');
        onMessageSent();
      } else {
        console.warn('[ChatModal] ⚠️ onMessageSent callback not available');
      }

      // Step 6: Wait a bit for parent to refresh, then show success and close
      console.log('[ChatModal] ✅ Step 5 complete: Pickup confirmed - order marked as completed');
      console.log('[ChatModal] ⏳ Step 6: Waiting 2.5 seconds for order list to refresh before closing...');
      
      // Step 7: Close the chat modal after a longer delay
      setTimeout(() => {
        console.log('[ChatModal] 🚪 Step 7: Closing chat modal now...');
        console.log('[ChatModal] ==================== confirmPickup COMPLETED ====================');
        onClose();
      }, 2500);
    } catch (error) {
      console.error('[ChatModal] ❌ Error confirming pickup:', error);
      console.error('[ChatModal] ❌ Error type:', error instanceof Error ? error.constructor.name : typeof error);
      console.error('[ChatModal] ❌ Full error object:', JSON.stringify(error, null, 2));
      alert('Failed to confirm pickup: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setIsSubmittingPickupConfirm(false);
    }
  };

  // Send a review request to the buyer (for completed orders)
  const sendReviewRequest = async () => {
    // If review has been sent before, show warning dialog
    if (hasReviewBeenSent) {
      setShowReviewWarning(true);
      return;
    }

    // Otherwise, proceed with sending
    await performSendReviewRequest();
  };

  // Perform the actual review request send
  const performSendReviewRequest = async () => {
    try {
      setIsSubmitting(true);

      // Create a polished review request message as JSON
      const reviewRequestData = {
        type: 'review_request',
        heading: 'We\'d Love Your Feedback!',
        thankYouMessage: 'Thank you so much for choosing Empi Costumes! 👖✨',
        feedbackPrompt: 'Would you mind sharing your experience with us? Your feedback helps us serve you better.',
      };

      const messageResponse = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order._id,
          orderNumber: order.orderNumber,
          senderEmail: userEmail,
          senderName: adminName || userName,
          senderType: 'admin',
          content: JSON.stringify(reviewRequestData),
          messageType: 'review-request',
          recipientType: 'all',
          reviewRequest: true,
        }),
      });

      if (!messageResponse.ok) {
        console.error('Failed to send review request:', await messageResponse.text());
        alert('Failed to send review request');
        return;
      }

      await fetchMessages();
      alert('Review request sent to the customer');
      setShowReviewWarning(false);
    } catch (error) {
      console.error('Error sending review request:', error);
      alert('Failed to send review request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper function to render message content with markdown links
  const renderMessageContent = (content: string) => {
    // Split by markdown link pattern: [text](/url)
    const parts = content.split(/(\[.*?\]\(.*?\))/g);
    
    return parts.map((part, index) => {
      const linkMatch = part.match(/\[(.*?)\]\((.*?)\)/);
      if (linkMatch) {
        const [, linkText, linkUrl] = linkMatch;
        return (
          <Link
            key={index}
            href={linkUrl}
            target={linkUrl.startsWith('http') ? '_blank' : '_self'}
            rel={linkUrl.startsWith('http') ? 'noopener noreferrer' : ''}
            className="text-blue-600 hover:text-blue-800 underline font-semibold"
          >
            {linkText}
          </Link>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  // Handle review submission from customer
  const handleSubmitReview = async () => {
    if (!reviewText.trim()) {
      alert('Please enter your feedback');
      return;
    }

    setIsSubmittingReview(true);
    try {
      const reviewData = {
        rating: reviewRating,
        feedback: reviewText,
      };

      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order._id,
          orderNumber: order.orderNumber,
          senderEmail: userEmail,
          senderName: userName,
          senderType: 'customer',
          content: JSON.stringify(reviewData),
          messageType: 'review',
          recipientType: 'all',
        }),
      });

      if (!response.ok) {
        alert('Failed to submit review');
        return;
      }

      setReviewText('');
      setReviewRating(5);
      await fetchMessages();
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('Failed to submit review');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const finalMessage = messages.find(m => m.isFinalPrice && m.senderType === 'admin');

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/30 backdrop-blur-sm z-40 transition-opacity duration-300 ${showQuoteForm ? 'pointer-events-none' : ''}`}
        onClick={onClose}
      />

      {/* Quote Form Modal Overlay (Admin Only) */}
      {isAdmin && showQuoteForm && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[60] flex items-center justify-center p-2 md:p-4 pointer-events-auto" onClick={() => setShowQuoteForm(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-4 md:p-6 space-y-4 md:space-y-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
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

      {/* Logistics Quote Form Modal */}
      {isAdmin && showLogisticsQuoteForm && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[60] flex items-center justify-center p-2 md:p-4 pointer-events-auto" onClick={() => setShowLogisticsQuoteForm(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-4 md:p-6 space-y-4 md:space-y-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg md:text-xl font-bold text-gray-900">Send Delivery Quote</h3>
                <p className="text-xs md:text-sm text-gray-600 mt-1">Order #{order.orderNumber}</p>
              </div>
              <button
                onClick={() => setShowLogisticsQuoteForm(false)}
                className="text-gray-600 hover:text-gray-900 p-2 rounded-lg transition"
              >
                <X className="h-5 w-5 md:h-6 md:w-6" />
              </button>
            </div>

            {/* Order Summary Card */}
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4 md:p-6 border-2 border-gray-300 space-y-3">
              <h4 className="font-semibold text-gray-900 text-sm md:text-base">📦 Order Information</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600 text-xs">Order Number</p>
                  <p className="font-semibold text-gray-900">{order.orderNumber}</p>
                </div>
                <div>
                  <p className="text-gray-600 text-xs">Customer</p>
                  <p className="font-semibold text-gray-900">{order.fullName}</p>
                </div>
              </div>
            </div>

            {/* Two Column Layout */}
            <div className="grid md:grid-cols-2 gap-4 md:gap-6">
              {/* Delivery Quote Card */}
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 md:p-6 space-y-4 border-2 border-orange-300">
                <div>
                  <h4 className="font-semibold text-gray-900 text-sm md:text-base mb-3">💰 Delivery Quote</h4>
                  
                  {/* Delivery Amount Input */}
                  <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">Quote Amount (₦)</label>
                  <input
                    type="number"
                    value={logisticsQuoteAmount}
                    onChange={(e) => setLogisticsQuoteAmount(e.target.value)}
                    placeholder="Enter delivery quote amount"
                    className="w-full px-3 md:px-4 py-2 md:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-600 focus:border-transparent text-sm"
                  />

                  {/* Delivery Type Selection */}
                  <label className="block text-xs md:text-sm font-medium text-gray-700 mt-4 mb-2">Delivery Type</label>
                  <div className="space-y-2">
                    {['bike', 'car', 'van'].map((type) => (
                      <label key={type} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="deliveryType"
                          value={type}
                          checked={logisticsDeliveryType === type}
                          onChange={(e) => setLogisticsDeliveryType(e.target.value)}
                          className="w-4 h-4 rounded border-gray-300 text-orange-600 focus:ring-orange-600"
                        />
                        <span className="text-xs md:text-sm text-gray-700 capitalize">{type}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bank Details Card */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 md:p-6 space-y-4 border-2 border-blue-300">
                <div>
                  <h4 className="font-semibold text-gray-900 text-sm md:text-base mb-3">🏦 Bank Details</h4>
                  
                  {/* Bank Name */}
                  <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">Bank Name</label>
                  <input
                    type="text"
                    value={logisticsBankName}
                    onChange={(e) => setLogisticsBankName(e.target.value)}
                    placeholder="E.g., First Bank"
                    className="w-full px-3 md:px-4 py-2 md:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-sm mb-3"
                  />

                  {/* Account Number */}
                  <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">Account Number</label>
                  <input
                    type="text"
                    value={logisticsAccountNumber}
                    onChange={(e) => setLogisticsAccountNumber(e.target.value)}
                    placeholder="Account number"
                    className="w-full px-3 md:px-4 py-2 md:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-sm mb-3"
                  />

                  {/* Account Holder */}
                  <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">Account Holder</label>
                  <input
                    type="text"
                    value={logisticsAccountHolder}
                    onChange={(e) => setLogisticsAccountHolder(e.target.value)}
                    placeholder="Account holder name"
                    className="w-full px-3 md:px-4 py-2 md:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Note */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 md:p-4">
              <p className="text-xs md:text-sm text-gray-700">
                <strong>Note:</strong> The customer will see this delivery quote and can proceed with payment once approved.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 md:gap-3 pt-4">
              <button
                onClick={() => setShowLogisticsQuoteForm(false)}
                className="flex-1 py-2 md:py-3 px-4 rounded-lg font-semibold text-sm md:text-base border border-gray-300 text-gray-700 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={sendLogisticsQuote}
                disabled={isSubmittingLogisticsQuote || !logisticsQuoteAmount.trim()}
                className="flex-1 py-2 md:py-3 px-4 rounded-lg font-semibold text-sm md:text-base bg-orange-600 hover:bg-orange-700 disabled:bg-gray-300 text-white transition flex items-center justify-center gap-2"
              >
                <DollarSign className="h-4 w-4" />
                Send Quote
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pickup Address Selection Modal */}
      {isAdmin && isLogisticsTeam && deliveryOption === 'pickup' && showAddressModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[60] flex items-center justify-center p-2 md:p-4 pointer-events-auto" onClick={() => setShowAddressModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-4 md:p-6 space-y-4 md:space-y-6" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg md:text-xl font-bold text-gray-900">Select Pickup Address</h3>
                <p className="text-xs md:text-sm text-gray-600 mt-1">Order #{order.orderNumber}</p>
              </div>
              <button
                onClick={() => setShowAddressModal(false)}
                className="text-gray-600 hover:text-gray-900 p-2 rounded-lg transition"
              >
                <X className="h-5 w-5 md:h-6 md:w-6" />
              </button>
            </div>

            {/* Address Options */}
            <div className="space-y-2 md:space-y-3">
              {pickupAddresses.map((address, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedPickupAddress(address)}
                  className={`w-full p-3 md:p-4 rounded-lg border-2 transition text-left ${
                    selectedPickupAddress === address
                      ? 'border-lime-600 bg-lime-50'
                      : 'border-gray-200 bg-gray-50 hover:border-lime-400'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      selectedPickupAddress === address
                        ? 'border-lime-600 bg-lime-600'
                        : 'border-gray-300'
                    }`}>
                      {selectedPickupAddress === address && (
                        <div className="h-2 w-2 bg-white rounded-full"></div>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-xs md:text-sm font-semibold text-gray-900">📍 Pickup Location {index + 1}</p>
                      <p className="text-sm md:text-base font-medium text-gray-700 mt-1">{address}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Note */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 md:p-4">
              <p className="text-xs md:text-sm text-blue-700">
                <strong>Note:</strong> The customer will receive this pickup location and can confirm their order.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 md:gap-3 pt-4">
              <button
                onClick={() => {
                  setShowAddressModal(false);
                  setSelectedPickupAddress('');
                }}
                className="flex-1 py-2 md:py-3 px-4 rounded-lg font-semibold text-sm md:text-base border border-gray-300 text-gray-700 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => sendPickupAddress(selectedPickupAddress)}
                disabled={isSubmittingAddress || !selectedPickupAddress.trim()}
                className="flex-1 py-2 md:py-3 px-4 rounded-lg font-semibold text-sm md:text-base bg-lime-600 hover:bg-lime-700 disabled:bg-gray-300 text-white transition flex items-center justify-center gap-2"
              >
                <MapPin className="h-4 w-4" />
                Send Address
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pickup Confirmation Modal */}
      {isLogisticsTeam && showPickupConfirmModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[70] flex items-center justify-center p-2 md:p-4 pointer-events-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-4 md:p-6 space-y-4 md:space-y-6" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg md:text-xl font-bold text-gray-900">Confirm Pickup</h3>
                <p className="text-xs md:text-sm text-gray-600 mt-1">Order #{order.orderNumber}</p>
              </div>
              <button
                onClick={() => setShowPickupConfirmModal(false)}
                className="text-gray-600 hover:text-gray-900 p-2 rounded-lg transition"
              >
                <X className="h-5 w-5 md:h-6 md:w-6" />
              </button>
            </div>

            {/* Confirmation Message */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 md:p-4">
              <p className="text-sm md:text-base text-gray-800">
                <span className="font-semibold text-blue-900">Are you sure</span> that <span className="font-bold">{order.fullName}</span> has picked up the costumes?
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 md:gap-3 pt-4">
              <button
                onClick={() => setShowPickupConfirmModal(false)}
                className="flex-1 py-2 md:py-3 px-4 rounded-lg font-semibold text-sm md:text-base border border-gray-300 text-gray-700 hover:bg-gray-50 transition"
              >
                No
              </button>
              <button
                onClick={(e) => {
                  console.log('[ChatModal Button] ✓ Yes, Picked Up button clicked!');
                  e.preventDefault();
                  confirmPickup();
                }}
                disabled={isSubmittingPickupConfirm}
                className="flex-1 py-2 md:py-3 px-4 rounded-lg font-semibold text-sm md:text-base bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white transition flex items-center justify-center gap-2"
              >
                {isSubmittingPickupConfirm ? '...' : '✓ Yes, Picked Up'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Chat Modal - Full Screen on Mobile, Centered on Desktop */}
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-2 md:p-4" onClick={onClose}>
        <div className="bg-white rounded-none md:rounded-2xl shadow-2xl w-full md:max-w-2xl h-full md:max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
          
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
                  <div key={msg._id} className="w-full">
                    {msg.messageType === 'quote' && msg.content && msg.content.trim().startsWith('{') ? (
                      (() => {
                        try {
                          // Try to parse as JSON if content starts with {
                          let quoteData = null;
                          if (msg.content.trim().startsWith('{')) {
                            quoteData = JSON.parse(msg.content);
                          }
                          
                          if (quoteData) {
                            // Determine if it's a delivery quote (has transportType) or product quote (has quotedPrice)
                            const isDeliveryQuote = quoteData.transportType || quoteData.amount;
                            
                            if (isDeliveryQuote) {
                              // Delivery quote from logistics
                              return (
                                <div className={`flex ${msg.senderType === 'customer' ? 'justify-end' : 'justify-start'} mb-4`}>
                                  <div className="bg-gradient-to-br from-lime-50 to-green-50 border-2 border-lime-600 rounded-xl p-3 space-y-2 w-full max-w-xs">
                                    <div className="text-center border-b border-lime-200 pb-2">
                                      <p className="text-xs font-semibold text-gray-600 mb-0.5">📨 {msg.senderName}</p>
                                      <h2 className="text-base font-bold text-lime-700">🚚 DELIVERY QUOTE</h2>
                                    </div>
                                    
                                    <div className="bg-white rounded-lg p-2.5 space-y-1.5">
                                      <div>
                                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Amount</p>
                                        <p className="text-lg font-bold text-lime-600">₦{parseInt(quoteData.amount).toLocaleString()}</p>
                                      </div>
                                      <div>
                                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Type</p>
                                        <p className="text-sm font-semibold text-gray-900 capitalize">{quoteData.transportType}</p>
                                      </div>
                                    </div>

                                    <div className="bg-white rounded-lg p-2.5 space-y-1">
                                      <p className="text-xs font-bold text-lime-700 uppercase">Bank Details</p>
                                      
                                      <div className="border-b border-gray-200 pb-1">
                                        <p className="text-xs font-bold text-gray-500 uppercase">Bank</p>
                                        <p className="text-xs font-semibold text-gray-900">{quoteData.bankName}</p>
                                      </div>

                                      <div className="border-b border-gray-200 pb-1">
                                        <p className="text-xs font-bold text-gray-500 uppercase">Account</p>
                                        <p className="text-xs font-mono font-semibold text-gray-900">{quoteData.accountNumber}</p>
                                      </div>

                                      <div>
                                        <p className="text-xs font-bold text-gray-500 uppercase">Holder</p>
                                        <p className="text-xs font-semibold text-gray-900">{quoteData.accountHolder}</p>
                                      </div>
                                    </div>

                                    <div className="bg-lime-100 border-l-4 border-lime-600 p-2 rounded text-center">
                                      <p className="text-xs font-semibold text-lime-900">✓ Confirm to proceed</p>
                                    </div>
                                  </div>
                                </div>
                              );
                            } else {
                              // Product quote (original format)
                              return (
                                <div className={`flex ${msg.senderType === 'customer' ? 'justify-end' : 'justify-start'} mb-4`}>
                                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-500 rounded-2xl p-6 space-y-4 w-full max-w-md">
                                    <div className="text-center border-b-2 border-green-200 pb-4">
                                      <p className="text-xs font-semibold text-gray-600 mb-1">📨 {msg.senderName}</p>
                                      <h2 className="text-2xl font-bold text-green-700">💰 QUOTE</h2>
                                    </div>
                                    
                                    <div className="bg-white rounded-xl p-4 space-y-3">
                                      <div>
                                        <p className="text-xs font-bold text-gray-600 uppercase tracking-wide">Amount Due</p>
                                        <p className="text-3xl font-bold text-green-600">₦{quoteData.amount.toLocaleString()}</p>
                                      </div>
                                      <div>
                                        <p className="text-xs font-bold text-gray-600 uppercase tracking-wide">Transport Type</p>
                                        <p className="text-lg font-semibold text-gray-900">{quoteData.transportType}</p>
                                      </div>
                                    </div>

                                    <div className="bg-white rounded-xl p-4 space-y-3">
                                      <p className="text-sm font-bold text-green-700 uppercase">Bank Details</p>
                                      
                                      <div className="border-b border-gray-200 pb-3">
                                        <p className="text-xs font-bold text-gray-600 uppercase">Bank Name</p>
                                        <p className="text-base font-semibold text-gray-900">{quoteData.bankName}</p>
                                      </div>

                                      <div className="border-b border-gray-200 pb-3">
                                        <p className="text-xs font-bold text-gray-600 uppercase">Account Number</p>
                                        <p className="text-base font-mono font-semibold text-gray-900">{quoteData.accountNumber}</p>
                                      </div>

                                      <div>
                                        <p className="text-xs font-bold text-gray-600 uppercase">Account Holder</p>
                                        <p className="text-base font-semibold text-gray-900">{quoteData.accountHolder}</p>
                                      </div>
                                    </div>

                                    <div className="bg-blue-100 border-l-4 border-blue-600 p-3 rounded">
                                      <p className="text-sm font-semibold text-blue-900">✓ Please confirm to proceed with payment</p>
                                    </div>
                                  </div>
                                </div>
                              );
                            }
                          } else {
                            // Not JSON, show as regular message
                            throw new Error('Not JSON format');
                          }
                        } catch (e) {
                          // Fallback: show as regular message
                          return (
                            <div className={`flex ${msg.senderType === 'customer' ? 'justify-end' : 'justify-start'}`}>
                              <div className="bg-gray-100 text-gray-900 rounded-2xl rounded-bl-none px-3 md:px-4 py-2 md:py-3 text-sm max-w-xs md:max-w-sm break-words">{msg.content}</div>
                            </div>
                          );
                        }
                      })()
                    ) : (
                      <div className={`flex ${msg.senderType === 'customer' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-xs md:max-w-sm px-3 md:px-4 py-2 md:py-3 rounded-2xl ${
                          msg.senderType === 'customer'
                            ? 'bg-lime-600 text-white rounded-br-none'
                            : 'bg-gray-100 text-gray-900 rounded-bl-none'
                        }`}>
                          {/* Sender Name for Admin Messages (to show "Logistics Team" or other admin senders) */}
                          {msg.senderType === 'admin' && (
                            <p className="text-xs font-semibold text-blue-700 mb-1">👤 {msg.senderName}</p>
                          )}
                          {/* Message Content or Quote */}
                          {(msg.messageType === 'quote' || (msg.quotedPrice && msg.senderType === 'admin')) ? (
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
                              <p className="text-xs md:text-sm opacity-90 mt-2">New Total:</p>
                              <p className="text-sm md:text-base font-bold">{formatPrice((msg.quantityChangeData as any)?.newTotal || 0)}</p>
                              {(msg.quantityChangeData as any)?.discountPercentage && (msg.quantityChangeData as any)?.discountPercentage > 0 && (
                                <>
                                  <p className="text-xs md:text-sm opacity-90 mt-2">Discount ({(msg.quantityChangeData as any)?.discountPercentage}%):</p>
                                  <p className="text-sm md:text-base font-bold text-green-300">-{formatPrice((msg.quantityChangeData as any)?.discountAmount || 0)}</p>
                                </>
                              )}
                              <p className="text-xs md:text-sm opacity-90 mt-2">VAT (7.5%):</p>
                              <p className="text-sm md:text-base font-bold text-yellow-300">{formatPrice((msg.quantityChangeData as any)?.vat || 0)}</p>
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
                      ) : msg.messageType === 'system' && msg.content && msg.content.includes('DELIVERY OPTIONS') ? (
                        <div className="space-y-3 md:space-y-4">
                          <p className="text-sm md:text-base font-semibold">{msg.content}</p>
                          {/* Show buttons if admin sent this (message from admin means customer can select) */}
                          {msg.senderType === 'admin' ? (
                            <div className="space-y-2">
                              <p className="text-xs text-gray-600 font-semibold mb-2">Select your preferred option:</p>
                              <button
                                onClick={() => selectDeliveryOption('pickup')}
                                className="w-full px-4 py-3 rounded-lg font-semibold text-sm transition border-2 bg-white text-gray-900 border-blue-300 hover:bg-blue-50 hover:border-blue-500 flex items-center justify-center gap-2"
                              >
                                📍 Personal Pickup
                              </button>
                              <button
                                onClick={() => selectDeliveryOption('delivery')}
                                className="w-full px-4 py-3 rounded-lg font-semibold text-sm transition border-2 bg-white text-gray-900 border-green-300 hover:bg-green-50 hover:border-green-500 flex items-center justify-center gap-2"
                              >
                                🚚 Empi Delivery
                              </button>
                            </div>
                          ) : null}
                        </div>
                      ) : msg.messageType === 'system' && msg.deliveryOption ? (
                        <div className="space-y-2">
                          <p className="text-sm md:text-base font-semibold">{msg.content}</p>
                          <div className={`px-3 md:px-4 py-2 md:py-3 rounded-lg font-semibold text-sm ${
                            msg.deliveryOption === 'pickup'
                              ? 'bg-blue-100 text-blue-700 border border-blue-300'
                              : 'bg-green-100 text-green-700 border border-green-300'
                          }`}>
                            ✓ {msg.deliveryOption === 'pickup' ? '📍 Personal Pickup' : '🚚 Empi Delivery'}
                          </div>
                        </div>
                      ) : msg.messageType === 'review-request' && msg.content ? (
                        (() => {
                          try {
                            let reviewData = null;
                            if (msg.content.trim().startsWith('{')) {
                              reviewData = JSON.parse(msg.content);
                            }
                            
                            if (reviewData && reviewData.type === 'review_request') {
                              // For customers (non-admin): show input form to submit review
                              // For admin: show waiting message
                              if (!isAdmin && msg.senderType === 'admin') {
                                // Customer viewing the review request - show input form
                                return (
                                  <div className={`flex justify-start mb-4`}>
                                    <div className="w-full max-w-md">
                                      <div className="bg-gradient-to-br from-lime-50 via-green-50 to-emerald-50 border-2 border-lime-400 rounded-2xl p-5 space-y-4 shadow-md">
                                        {/* Header */}
                                        <div className="text-center">
                                          <h3 className="text-lg font-bold text-lime-900">{reviewData.heading}</h3>
                                        </div>

                                        {/* Thank you message */}
                                        <div className="bg-white rounded-xl p-4 border border-lime-100">
                                          <p className="text-sm font-semibold text-gray-900 leading-relaxed">
                                            {reviewData.thankYouMessage}
                                          </p>
                                        </div>

                                        {/* Feedback prompt */}
                                        <div className="bg-lime-100 rounded-xl p-3 border-l-4 border-lime-400">
                                          <p className="text-sm text-lime-900 font-medium">{reviewData.feedbackPrompt}</p>
                                        </div>

                                        {/* Star Rating */}
                                        <div className="space-y-2">
                                          <label className="text-sm font-semibold text-lime-900">Rate your experience: ⭐</label>
                                          <div className="flex justify-center gap-2">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                              <button
                                                key={star}
                                                onClick={() => setReviewRating(star)}
                                                onMouseEnter={() => setHoverRating(star)}
                                                onMouseLeave={() => setHoverRating(0)}
                                                className="text-3xl transition transform hover:scale-110"
                                              >
                                                {star <= (hoverRating || reviewRating) ? '⭐' : '☆'}
                                              </button>
                                            ))}
                                          </div>
                                          <p className="text-xs text-center text-lime-700 font-medium">
                                            {reviewRating === 5 && 'Excellent!'}
                                            {reviewRating === 4 && 'Very Good'}
                                            {reviewRating === 3 && 'Good'}
                                            {reviewRating === 2 && 'Fair'}
                                            {reviewRating === 1 && 'Poor'}
                                          </p>
                                        </div>

                                        {/* Review text input */}
                                        <div className="space-y-2">
                                          <textarea
                                            value={reviewText}
                                            onChange={(e) => setReviewText(e.target.value)}
                                            placeholder="Share your feedback here..."
                                            rows={3}
                                            className="w-full px-4 py-3 border-2 border-lime-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500 text-sm resize-none bg-white"
                                          />
                                          <button
                                            onClick={handleSubmitReview}
                                            disabled={isSubmittingReview || !reviewText.trim()}
                                            className="w-full py-2 px-4 bg-gradient-to-r from-lime-400 to-green-400 hover:from-lime-500 hover:to-green-500 disabled:opacity-50 text-white font-bold rounded-lg text-center transition text-sm"
                                          >
                                            Send Feedback
                                          </button>
                                        </div>

                                        {/* Footer note */}
                                        <p className="text-xs text-lime-700 text-center">Your feedback means the world to us! 🙏</p>
                                      </div>
                                    </div>
                                  </div>
                                );
                              } else {
                                // For admin: show the review request card with waiting message
                                return (
                                  <div className={`flex justify-start mb-4`}>
                                    <div className="w-full max-w-md">
                                      <div className="bg-gradient-to-br from-lime-50 via-green-50 to-emerald-50 border-2 border-lime-400 rounded-2xl p-5 space-y-4 shadow-md">
                                        {/* Header */}
                                        <div className="text-center">
                                          <h3 className="text-lg font-bold text-lime-900">{reviewData.heading}</h3>
                                        </div>

                                        {/* Thank you message */}
                                        <div className="bg-white rounded-xl p-4 border border-lime-100">
                                          <p className="text-sm font-semibold text-gray-900 leading-relaxed">
                                            {reviewData.thankYouMessage}
                                          </p>
                                        </div>

                                        {/* Feedback prompt */}
                                        <div className="bg-lime-100 rounded-xl p-3 border-l-4 border-lime-400">
                                          <p className="text-sm text-lime-900 font-medium">{reviewData.feedbackPrompt}</p>
                                        </div>

                                        {/* Footer note */}
                                        <p className="text-xs text-lime-700 text-center">Waiting for customer feedback...</p>
                                      </div>
                                    </div>
                                  </div>
                                );
                              }
                            }
                            return null;
                          } catch (e) {
                            console.error('[ChatModal] Error parsing review request data:', e);
                            return null;
                          }
                        })()
                      ) : msg.messageType === 'review' && msg.content && msg.senderType === 'customer' ? (
                        // Customer review display (shown to admin)
                        (() => {
                          try {
                            let reviewData = null;
                            if (msg.content.trim().startsWith('{')) {
                              reviewData = JSON.parse(msg.content);
                            }

                            if (reviewData && reviewData.feedback) {
                              return (
                                <div className={`flex justify-end mb-4`}>
                                  <div className="w-full max-w-md">
                                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-400 rounded-xl p-4 space-y-3 shadow-md">
                                      {/* Header with customer name and rating */}
                                      <div className="flex items-center justify-between">
                                        <div>
                                          <p className="text-xs font-semibold text-blue-600 uppercase">Customer Review</p>
                                          <p className="text-sm font-bold text-gray-900">{msg.senderName}</p>
                                        </div>
                                        <div className="flex gap-1">
                                          {[1, 2, 3, 4, 5].map((star) => (
                                            <span key={star} className="text-lg">
                                              {star <= (reviewData.rating || 0) ? '⭐' : '☆'}
                                            </span>
                                          ))}
                                        </div>
                                      </div>

                                      {/* Rating text */}
                                      <div className="text-xs font-semibold text-blue-700">
                                        {reviewData.rating === 5 && '5/5 - Excellent!'}
                                        {reviewData.rating === 4 && '4/5 - Very Good'}
                                        {reviewData.rating === 3 && '3/5 - Good'}
                                        {reviewData.rating === 2 && '2/5 - Fair'}
                                        {reviewData.rating === 1 && '1/5 - Poor'}
                                      </div>

                                      {/* Review feedback */}
                                      <div className="bg-white rounded-lg p-3 border border-blue-100">
                                        <p className="text-sm text-gray-900 leading-relaxed">{reviewData.feedback}</p>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            }
                            // Fallback for old review format (plain text)
                            return (
                              <div className={`flex justify-end mb-4`}>
                                <div className="w-full max-w-md">
                                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-400 rounded-xl p-4 space-y-3 shadow-md">
                                    <div className="flex items-center gap-2">
                                      <span className="text-xl">⭐</span>
                                      <p className="text-xs font-semibold text-blue-600 uppercase">Customer Review</p>
                                    </div>
                                    <div className="bg-white rounded-lg p-3 border border-blue-100">
                                      <p className="text-sm text-gray-900 leading-relaxed">{msg.content}</p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          } catch (e) {
                            console.error('[ChatModal] Error parsing review data:', e);
                            return (
                              <div className={`flex justify-end mb-4`}>
                                <div className="w-full max-w-md">
                                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-400 rounded-xl p-4 space-y-3 shadow-md">
                                    <div className="flex items-center gap-2">
                                      <span className="text-xl">⭐</span>
                                      <p className="text-xs font-semibold text-blue-600 uppercase">Customer Review</p>
                                    </div>
                                    <div className="bg-white rounded-lg p-3 border border-blue-100">
                                      <p className="text-sm text-gray-900 leading-relaxed">{msg.content}</p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          }
                        })()
                      ) : msg.messageType === 'address' && msg.content ? (
                        (() => {
                          try {
                            let addressData = null;
                            if (msg.content.trim().startsWith('{')) {
                              addressData = JSON.parse(msg.content);
                            }
                            
                            if (addressData && addressData.pickupLocation) {
                              return (
                                <div className={`flex ${msg.senderType === 'customer' ? 'justify-end' : 'justify-start'} mb-4`}>
                                  <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-500 rounded-xl p-3 space-y-2 w-full max-w-xs">
                                    <div className="text-center border-b border-blue-200 pb-2">
                                      <p className="text-xs font-semibold text-gray-600 mb-0.5">📨 {msg.senderName}</p>
                                      <h2 className="text-base font-bold text-blue-700">📍 PICKUP ADDRESS</h2>
                                    </div>
                                    
                                    <div className="bg-white rounded-lg p-3 space-y-2">
                                      <p className="text-xs font-bold text-blue-600 uppercase tracking-wide">Location</p>
                                      <p className="text-sm font-semibold text-gray-900 leading-relaxed">{addressData.pickupLocation}</p>
                                    </div>

                                    {/* Help Contact Section */}
                                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-2.5">
                                      <p className="text-xs font-semibold text-orange-600 mb-1">📞 Need Help?</p>
                                      <p className="text-sm font-bold text-gray-900">{order.phone}</p>
                                      <p className="text-xs text-gray-600 mt-1">Call this number if you need assistance</p>
                                    </div>

                                    <div className="bg-blue-100 border-l-4 border-blue-600 p-2 rounded text-center">
                                      <p className="text-xs font-semibold text-blue-900">✓ Pickup location confirmed</p>
                                    </div>

                                    {/* Picked Up Button - Only show for logistics team */}
                                    {isLogisticsTeam && (
                                      <button
                                        onClick={() => setShowPickupConfirmModal(true)}
                                        className="w-full mt-2 py-2 px-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold text-sm transition"
                                      >
                                        ✓ Picked Up
                                      </button>
                                    )}
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          } catch (e) {
                            console.error('[ChatModal] Error parsing address data:', e);
                            return null;
                          }
                        })()
                      ) : (
                        <div className="text-sm md:text-base leading-relaxed break-words whitespace-pre-wrap">
                          {renderMessageContent(msg.content)}
                        </div>
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
                    )}
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

            {/* Admin action buttons (varies by order status) */}
            {isAdmin && !finalMessage && (
              currentOrderStatus === 'completed' ? (
                <div className="flex gap-2 w-full">
                  <button
                    onClick={sendReviewRequest}
                    disabled={isSubmitting}
                    className="flex-1 py-2 px-4 rounded-lg font-medium text-sm md:text-base transition flex items-center justify-center gap-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 border border-emerald-300"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Request Review
                  </button>
                </div>
              ) : (
                // Show Send Quote / Decline for statuses where it's allowed
                currentOrderStatus !== 'ready' && currentOrderStatus !== 'approved' && currentOrderStatus !== 'in-progress' && (
                  <div className="grid grid-cols-2 gap-2 w-full">
                    <button
                      onClick={() => setShowQuoteForm(true)}
                      className="py-2 px-4 rounded-lg font-medium text-sm md:text-base transition flex items-center justify-center gap-2 bg-blue-100 hover:bg-blue-200 text-blue-700 border border-blue-300"
                    >
                      <DollarSign className="h-4 w-4" />
                      Send Quote
                    </button>
                    <button
                      onClick={() => setShowDeclineModal(true)}
                      className="py-2 px-4 rounded-lg font-medium text-sm md:text-base transition flex items-center justify-center gap-2 bg-red-100 hover:bg-red-200 text-red-700 border border-red-300"
                    >
                      <X className="h-4 w-4" />
                      Decline
                    </button>
                  </div>
                )
              )
            )}

            {/* Logistics Quote/Address Button & Message Input - Side by Side for Logistics */}
            {isAdmin && isLogisticsTeam && currentOrderStatus === 'ready' ? (
              <form onSubmit={sendMessage} className="flex gap-2 items-center">
                {/* Conditional button: Quote for delivery, Address for pickup */}
                {deliveryOption === 'pickup' ? (
                  <button
                    type="button"
                    onClick={() => setShowAddressModal(true)}
                    disabled={isSubmitting}
                    className="flex-shrink-0 py-2 px-3 md:px-4 rounded-lg font-medium text-xs md:text-sm transition flex items-center justify-center gap-1 bg-lime-100 hover:bg-lime-200 text-lime-700 border border-lime-300 disabled:opacity-50 whitespace-nowrap"
                  >
                    <MapPin className="h-4 w-4" />
                    <span className="hidden md:inline">Address</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowLogisticsQuoteForm(true)}
                    disabled={isSubmitting}
                    className="flex-shrink-0 py-2 px-3 md:px-4 rounded-lg font-medium text-xs md:text-sm transition flex items-center justify-center gap-1 bg-orange-100 hover:bg-orange-200 text-orange-700 border border-orange-300 disabled:opacity-50 whitespace-nowrap"
                  >
                    <DollarSign className="h-4 w-4" />
                    <span className="hidden md:inline">Quote</span>
                  </button>
                )}
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
            ) : (
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
            )}
          </div>
        </div>
      </div>

      {/* Decline Reason Modal */}
      {showDeclineModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => { setShowDeclineModal(false); setDeclineReason(''); }}>
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Decline Order</h3>
              <button
                onClick={() => {
                  setShowDeclineModal(false);
                  setDeclineReason('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-sm text-gray-600">
              Please provide a reason for declining this order. The buyer will see this reason.
            </p>

            <textarea
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value)}
              placeholder="Enter reason for declining (e.g., Out of stock, Cannot meet deadline, etc.)"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
              rows={4}
            />

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setShowDeclineModal(false);
                  setDeclineReason('');
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!declineReason.trim()) {
                    alert('Please provide a reason for declining');
                    return;
                  }

                  setIsSubmittingDecline(true);
                  try {
                    // Send decline message to buyer
                    const messageResponse = await fetch('/api/messages', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        orderId: order._id,
                        senderEmail: userEmail,
                        senderName: adminName,
                        senderType: 'admin',
                        content: `Order Declined: ${declineReason}`,
                        messageType: 'system',
                        recipientType: 'all'
                      })
                    });

                    if (!messageResponse.ok) {
                      console.error('Failed to send decline message:', await messageResponse.text());
                    }

                    // Update order status
                    await fetch(`/api/custom-orders?id=${order._id}`, {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ 
                        status: 'rejected',
                        declineReason: declineReason
                      })
                    });

                    setShowDeclineModal(false);
                    setDeclineReason('');
                    alert('Order declined and buyer has been notified');
                    onClose();
                  } catch (error) {
                    console.error('Error declining order:', error);
                    alert('Failed to decline order. Please try again.');
                  } finally {
                    setIsSubmittingDecline(false);
                  }
                }}
                disabled={isSubmittingDecline}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg font-medium transition"
              >
                {isSubmittingDecline ? 'Declining...' : 'Decline Order'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Review Request Warning Dialog */}
      {showReviewWarning && (
        <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-6 border border-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-yellow-100 rounded-full p-2">
                <svg className="h-6 w-6 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900">Review Already Sent</h3>
            </div>

            <p className="text-gray-700 mb-6">
              A review request has already been sent to this customer. Are you sure you want to send another one?
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowReviewWarning(false)}
                className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  await performSendReviewRequest();
                }}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-medium rounded-lg transition"
              >
                {isSubmitting ? 'Sending...' : 'Send Again'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

