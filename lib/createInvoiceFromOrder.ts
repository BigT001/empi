import Invoice from '@/lib/models/Invoice';
import { IOrder } from '@/lib/models/Order';
import { sendInvoiceEmail } from '@/lib/email';
import { generateProfessionalInvoiceHTML } from '@/lib/professionalInvoice';
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

    // Prefer structured pricing if present (from checkout payload)
    const pricing = (order as any).pricing || {};
    const goodsSubtotal = pricing.goodsSubtotal ?? order.subtotal ?? 0;
    const cautionFee = pricing.cautionFee ?? order.cautionFee ?? 0;
    const taxAmount = pricing.tax ?? order.vat ?? 0;
    
    // Extract discount information from pricing
    const discountPercentage = pricing.discountPercentage ?? 0;
    const discountAmount = pricing.discount ?? 0;
    const subtotalAfterDiscount = pricing.subtotalAfterDiscount ?? goodsSubtotal;

    // Map order items to invoice items (include rentalDays if present)
    const invoiceItems = (order.items || []).map((item: any) => ({
      productId: item.productId,
      name: item.name,
      quantity: item.quantity,
      price: item.price,
      mode: item.mode,
      rentalDays: item.rentalDays || 0,
    }));

    // Compute totals for invoice (exclude shipping)
    const subtotal = goodsSubtotal;
    const subtotalWithCaution = subtotalAfterDiscount + (cautionFee || 0);
    const totalAmount = subtotalWithCaution + (taxAmount || 0);

    // Create invoice document (shipping intentionally set to 0)
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
      subtotal: subtotal,
      subtotalWithCaution: subtotalWithCaution,
      cautionFee: cautionFee,
      bulkDiscountPercentage: discountPercentage,
      bulkDiscountAmount: discountAmount,
      shippingCost: 0,
      taxAmount: taxAmount,
      totalAmount: totalAmount,
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

    // Generate professional invoice HTML and send emails to customer and admin
    const invoiceForEmail = invoice.toObject ? invoice.toObject() : invoice;
    const invoiceHtml = generateProfessionalInvoiceHTML(invoiceForEmail as any);
    await sendInvoiceEmail(invoice.customerEmail, invoice.customerName, invoice.invoiceNumber, invoiceHtml, invoice.orderNumber);

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


