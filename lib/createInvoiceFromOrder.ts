import Invoice from '@/lib/models/Invoice';
import { IOrder } from '@/lib/models/Order';
import { sendEmail } from '@/lib/email';
import connectDB from '@/lib/mongodb';

/**
 * Generate a unique invoice number
 */
function generateInvoiceNumber(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `INV-${timestamp}-${random}`;
}

/**
 * Creates an invoice from an order and saves it to database
 * Then sends invoice email to customer
 */
export async function createInvoiceFromOrder(order: IOrder): Promise<any> {
  try {
    console.log(`📄 Creating invoice for order: ${order.orderNumber}`);
    
    // Ensure database connection
    await connectDB();
    console.log(`📡 Database connected for invoice creation`);

    // Generate invoice number
    const invoiceNumber = generateInvoiceNumber();
    const invoiceDate = new Date();
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30); // 30 days payment term

    // Map order items to invoice items
    const invoiceItems = order.items.map((item) => ({
      productId: item.productId,
      name: item.name,
      quantity: item.quantity,
      price: item.price,
      mode: item.mode,
    }));

    // Create invoice document
    const invoice = new Invoice({
      invoiceNumber,
      orderNumber: order.orderNumber,
      buyerId: order.buyerId,
      customerName: `${order.firstName} ${order.lastName}`,
      customerEmail: order.email,
      customerPhone: order.phone || '',
      customerAddress: order.address || '',
      customerCity: order.city || '',
      customerState: order.state || '',
      customerPostalCode: order.zipCode || '',
      subtotal: order.subtotal,
      shippingCost: order.shippingCost || 0,
      cautionFee: order.cautionFee || 0,
      taxAmount: order.vat || 0,
      totalAmount: order.total,
      items: invoiceItems,
      invoiceDate,
      dueDate,
      currency: 'NGN',
      currencySymbol: '₦',
      taxRate: order.vatRate || 7.5,
      type: 'automatic',
      status: 'sent',
    });

    // Save invoice
    await invoice.save();
    console.log(`✅ Invoice created: ${invoiceNumber}`);

    // Send invoice email
    await sendInvoiceEmail(order, invoice);

    return {
      success: true,
      invoiceNumber: invoice.invoiceNumber,
      invoiceId: invoice._id,
    };
  } catch (error) {
    console.error('❌ Error creating invoice from order:', error);
    // Don't throw - allow order confirmation to succeed even if invoice creation fails
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send invoice email to customer
 */
async function sendInvoiceEmail(order: IOrder, invoice: any): Promise<boolean> {
  try {
    const itemsTableHtml = invoice.items
      .map(
        (item: any) => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${item.name}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: right;">₦${item.price.toLocaleString()}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: right;">₦${(item.price * item.quantity).toLocaleString()}</td>
      </tr>
    `
      )
      .join('');

    const html = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 650px; margin: 0 auto;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #84cc16 0%, #65a30d 100%); padding: 30px; border-radius: 10px 10px 0 0; color: white;">
          <h1 style="margin: 0 0 10px 0; font-size: 28px;">EMPI COSTUMES</h1>
          <p style="margin: 0; font-size: 14px; opacity: 0.9;">Professional Costume Rental & Sales</p>
        </div>

        <!-- Content -->
        <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
          <p style="color: #374151; margin: 0 0 20px 0;">Hi <strong>${order.firstName} ${order.lastName}</strong>,</p>
          
          <p style="color: #374151; margin: 0 0 20px 0;">Your payment has been confirmed! 🎉 Here is your invoice for order <strong>${order.orderNumber}</strong>.</p>

          <!-- Invoice Details Box -->
          <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
              <div>
                <p style="margin: 0 0 5px 0; color: #6b7280; font-size: 13px;">INVOICE NUMBER</p>
                <p style="margin: 0; color: #1f2937; font-weight: 600; font-size: 16px;">${invoice.invoiceNumber}</p>
              </div>
              <div>
                <p style="margin: 0 0 5px 0; color: #6b7280; font-size: 13px;">ORDER NUMBER</p>
                <p style="margin: 0; color: #1f2937; font-weight: 600; font-size: 16px;">${order.orderNumber}</p>
              </div>
              <div>
                <p style="margin: 0 0 5px 0; color: #6b7280; font-size: 13px;">INVOICE DATE</p>
                <p style="margin: 0; color: #1f2937; font-weight: 600;">${new Date(invoice.invoiceDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
              <div>
                <p style="margin: 0 0 5px 0; color: #6b7280; font-size: 13px;">STATUS</p>
                <p style="margin: 0; color: #10b981; font-weight: 600;">✓ PAID</p>
              </div>
            </div>
          </div>

          <!-- Items Table -->
          <h3 style="color: #1f2937; margin: 25px 0 15px 0; font-size: 16px;">Order Items</h3>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <thead>
              <tr style="background: #f3f4f6; border-bottom: 2px solid #e5e7eb;">
                <th style="padding: 12px; text-align: left; color: #374151; font-weight: 600;">Item</th>
                <th style="padding: 12px; text-align: center; color: #374151; font-weight: 600;">Qty</th>
                <th style="padding: 12px; text-align: right; color: #374151; font-weight: 600;">Price</th>
                <th style="padding: 12px; text-align: right; color: #374151; font-weight: 600;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsTableHtml}
            </tbody>
          </table>

          <!-- Summary -->
          <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <div style="display: grid; grid-template-columns: 200px 1fr; gap: 15px; row-gap: 12px;">
              <p style="margin: 0; color: #6b7280;">Subtotal:</p>
              <p style="margin: 0; text-align: right; color: #1f2937; font-weight: 600;">₦${invoice.subtotal.toLocaleString()}</p>
              
              ${
                invoice.cautionFee
                  ? `
                <p style="margin: 0; color: #6b7280;">Caution Fee:</p>
                <p style="margin: 0; text-align: right; color: #1f2937;">₦${invoice.cautionFee.toLocaleString()}</p>
              `
                  : ''
              }
              
              <p style="margin: 0; color: #6b7280;">Shipping:</p>
              <p style="margin: 0; text-align: right; color: #1f2937;">₦${invoice.shippingCost.toLocaleString()}</p>
              
              <p style="margin: 0; color: #6b7280;">Tax (7.5%):</p>
              <p style="margin: 0; text-align: right; color: #1f2937;">₦${invoice.taxAmount.toLocaleString()}</p>
              
              <p style="margin: 0; padding-top: 10px; border-top: 2px solid #e5e7eb; color: #1f2937; font-weight: 700; font-size: 18px;">TOTAL:</p>
              <p style="margin: 0; padding-top: 10px; border-top: 2px solid #e5e7eb; text-align: right; color: #10b981; font-weight: 700; font-size: 18px;">₦${invoice.totalAmount.toLocaleString()}</p>
            </div>
          </div>

          <!-- Next Steps -->
          <div style="background: #f0fdf4; border-left: 4px solid #10b981; padding: 15px; border-radius: 4px; margin: 20px 0;">
            <h3 style="color: #166534; margin: 0 0 10px 0; font-size: 15px;">Next Steps</h3>
            <ul style="color: #166534; margin: 0; padding-left: 20px;">
              <li>Your order is now confirmed and will be processed shortly</li>
              <li>You'll receive updates about your order via email</li>
              <li>Save this invoice for your records</li>
            </ul>
          </div>

          <!-- Support -->
          <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h3 style="color: #1f2937; margin: 0 0 10px 0; font-size: 15px;">Questions?</h3>
            <p style="color: #6b7280; margin: 0 0 8px 0;">Contact our support team:</p>
            <p style="color: #1f2937; margin: 0 0 5px 0;">
              <strong>Email:</strong> ${process.env.STORE_EMAIL || 'support@empicostumes.com'}
            </p>
            <p style="color: #1f2937; margin: 0;">
              <strong>Phone:</strong> ${process.env.STORE_PHONE || '+234 123 456 7890'}
            </p>
          </div>
        </div>

        <!-- Footer -->
        <div style="background: #1f2937; color: white; padding: 20px; border-radius: 0 0 10px 10px; text-align: center; font-size: 13px;">
          <p style="margin: 0 0 8px 0;">© ${new Date().getFullYear()} EMPI Costumes. All rights reserved.</p>
          <p style="color: #d1d5db; margin: 0; font-size: 12px;">
            This is an automated message. Please do not reply directly. Contact us if you have questions.
          </p>
        </div>
      </div>
    `;

    const result = await sendEmail({
      to: order.email,
      subject: `Invoice ${invoice.invoiceNumber} - Order ${order.orderNumber} | EMPI Costumes`,
      html,
    });

    if (result) {
      console.log(`✅ Invoice email sent to ${order.email}`);
    }
    return result;
  } catch (error) {
    console.error('❌ Error sending invoice email:', error);
    return false;
  }
}
