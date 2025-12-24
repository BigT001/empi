/**
 * Payment notification message helper
 * Sends customized messages to buyer and admin for payment events
 * Buyer message: includes invoice link for buyer
 * Admin message: includes order details and admin invoice link
 */

import Message from './models/Message';
import connectDB from './mongodb';

export interface PaymentNotificationParams {
  orderId?: string;
  orderNumber: string;
  buyerEmail: string;
  buyerName: string;
  amount: number;
  invoiceId?: string;
  paymentReference?: string;
  isCustomOrder?: boolean; // Flag to identify if payment is for custom or regular order
}

/**
 * Send payment success message to BUYER
 * Customized: focuses on order confirmation and provides buyer invoice link
 */
export async function sendPaymentSuccessMessageToBuyer(params: PaymentNotificationParams) {
  try {
    await connectDB();

    const { orderId, orderNumber, buyerName, amount, invoiceId, paymentReference } = params;

    let content = `Thank you for choosing EMPI! 🎉\n\n`;
    content += `We're pleased to confirm that your payment has been received and is being verified.\n\n`;
    content += `💵 Amount: ₦${Math.round(amount).toLocaleString()}\n`;
    content += `🔖 Payment Reference: ${paymentReference || 'N/A'}\n\n`;
    content += `Once payment verification is complete, we would start production. You can always check your order status on your purchase card.\n\n`;
    content += `💡 Pro Tip: Always check your order card for important messages and updates from our team.\n\n`;
    
    if (invoiceId) {
      content += `📄 [View Your Invoice](/api/invoices/${invoiceId}/download)\n\n`;
    }
    
    content += `We appreciate your business and look forward to serving you!`;

    const message = await Message.create({
      orderId: orderId || null,
      orderNumber: orderNumber,
      senderEmail: 'system@empi.com',
      senderName: 'Empi Costumes',
      senderType: 'system',
      content: content,
      messageType: 'system',
      recipientType: 'buyer',
      isRead: false,
    });

    console.log('[PaymentNotifications] ✅ Success message sent to BUYER:', {
      messageId: message._id,
      orderNumber,
      buyerName,
      recipientType: message.recipientType,
      messageType: message.messageType,
      saved: true,
    });

    return message;
  } catch (error) {
    console.error('[PaymentNotifications] ❌ Failed to send success message to buyer:', error);
    throw error;
  }
}

/**
 * Send payment success message to ADMIN
 * Customized: focuses on order details and provides admin invoice link
 */
export async function sendPaymentSuccessMessageToAdmin(params: PaymentNotificationParams) {
  try {
    await connectDB();

    const { orderId, orderNumber, buyerEmail, buyerName, amount, paymentReference, invoiceId, isCustomOrder } = params;

    let content = `💰 Payment Received!\n\n`;
    content += `✅ Payment confirmed for order #${orderNumber}\n\n`;
    content += `👤 Customer: ${buyerName}\n`;
    content += `📧 Email: ${buyerEmail}\n`;
    content += `💵 Amount: ₦${Math.round(amount).toLocaleString()}\n`;
    content += `🔖 Payment Reference: ${paymentReference || 'N/A'}\n`;
    
    if (invoiceId) {
      content += `\n📄 [View Admin Invoice](/api/invoices/${invoiceId}/download)\n`;
    }
    
    // Add logistics message for regular orders only
    if (!isCustomOrder) {
      content += `\n📞 Logistics team will get in touch with you shortly to process your order.`;
    }
    
    content += `\nOrder is ready for processing. 🚀`;

    const message = await Message.create({
      orderId: orderId || null,
      orderNumber: orderNumber,
      senderEmail: 'system@empi.com',
      senderName: 'System',
      senderType: 'system',
      content: content,
      messageType: 'system',
      recipientType: 'admin',
      isRead: false,
    });

    console.log('[PaymentNotifications] ✅ Success message sent to ADMIN:', {
      messageId: message._id,
      orderNumber,
      amount,
      recipientType: message.recipientType,
      messageType: message.messageType,
      saved: true,
    });

    return message;
  } catch (error) {
    console.error('[PaymentNotifications] ❌ Failed to send success message to admin:', error);
    throw error;
  }
}

/**
 * Send payment failed message to BUYER
 */
export async function sendPaymentFailedMessageToBuyer(params: {
  orderNumber: string;
  buyerName: string;
  amount: number;
  reason?: string;
  orderId?: string;
}) {
  try {
    await connectDB();

    const { orderId, orderNumber, buyerName, amount, reason } = params;

    let content = `❌ Payment Failed\n\n`;
    content += `We encountered an issue processing your payment of ₦${Math.round(amount).toLocaleString()} for order #${orderNumber}.\n\n`;
    
    if (reason) {
      content += `Reason: ${reason}\n\n`;
    }
    
    content += `Please try again or contact our support team.\n📞 Support: support@empi.com`;

    const message = await Message.create({
      orderId: orderId || null,
      orderNumber: orderNumber,
      senderEmail: 'system@empi.com',
      senderName: 'Empi Costumes',
      senderType: 'system',
      content: content,
      messageType: 'system',
      recipientType: 'buyer',
      isRead: false,
    });

    console.log('[PaymentNotifications] ⚠️ Failed message sent to BUYER:', {
      messageId: message._id,
      orderNumber,
      reason,
    });

    return message;
  } catch (error) {
    console.error('[PaymentNotifications] ❌ Failed to send failed message to buyer:', error);
    throw error;
  }
}

/**
 * Send payment failed message to ADMIN
 */
export async function sendPaymentFailedMessageToAdmin(params: {
  orderNumber: string;
  buyerEmail: string;
  buyerName: string;
  amount: number;
  reason?: string;
  orderId?: string;
}) {
  try {
    await connectDB();

    const { orderId, orderNumber, buyerEmail, buyerName, amount, reason } = params;

    let content = `⚠️ Payment Failed Alert\n\n`;
    content += `Order #${orderNumber} - payment failed\n\n`;
    content += `👤 Customer: ${buyerName}\n`;
    content += `📧 Email: ${buyerEmail}\n`;
    content += `💵 Amount: ₦${Math.round(amount).toLocaleString()}\n`;
    
    if (reason) {
      content += `❌ Reason: ${reason}\n`;
    }
    
    content += `\nPlease follow up with the customer.`;

    const message = await Message.create({
      orderId: orderId || null,
      orderNumber: orderNumber,
      senderEmail: 'system@empi.com',
      senderName: 'System',
      senderType: 'system',
      content: content,
      messageType: 'system',
      recipientType: 'admin',
      isRead: false,
    });

    console.log('[PaymentNotifications] ⚠️ Failed message sent to ADMIN:', {
      messageId: message._id,
      orderNumber,
    });

    return message;
  } catch (error) {
    console.error('[PaymentNotifications] ❌ Failed to send failed message to admin:', error);
    throw error;
  }
}
