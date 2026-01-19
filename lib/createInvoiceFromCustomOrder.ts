import Invoice from '@/lib/models/Invoice';
import { ICustomOrder } from '@/lib/models/CustomOrder';
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
 * Creates an invoice from a custom order and saves it to database
 * Then sends invoice email to customer and admin
 */
export async function createInvoiceFromCustomOrder(customOrder: ICustomOrder): Promise<any> {
  try {
    console.log(`📄 Creating invoice for custom order: ${customOrder.orderNumber}`);
    
    // Ensure database connection
    await connectDB();
    console.log(`📡 Database connected for custom order invoice creation`);

    // Generate invoice number
    const invoiceNumber = generateInvoiceNumber();
    const invoiceDate = new Date();
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30); // 30 days payment term

    // Calculate VAT (7.5%)
    const VAT_RATE = 0.075;
    const subtotal = customOrder.quotedPrice || 0;
    const vat = subtotal * VAT_RATE;
    const totalAmount = subtotal + vat;

    // Map quote items to invoice items
    const invoiceItems = (customOrder.quoteItems || []).map((item: any, idx: number) => ({
      productId: `CUSTOM-${idx}`,
      name: item.itemName,
      quantity: item.quantity,
      price: item.unitPrice,
      mode: 'buy',
      rentalDays: 0,
    }));

    // Create invoice document
    const invoice = new Invoice({
      invoiceNumber,
      orderNumber: customOrder.orderNumber,
      buyerId: customOrder.buyerId,
      customerName: customOrder.fullName,
      customerEmail: customOrder.email,
      customerPhone: customOrder.phone || '',
      customerAddress: customOrder.address || '',
      customerCity: customOrder.city || '',
      customerState: customOrder.state || '',
      customerPostalCode: '',
      subtotal: subtotal,
      subtotalWithCaution: subtotal,
      cautionFee: 0,
      bulkDiscountPercentage: 0,
      bulkDiscountAmount: 0,
      shippingCost: 0,
      taxAmount: vat,
      totalAmount: totalAmount,
      items: invoiceItems.length > 0 ? invoiceItems : [{
        productId: 'CUSTOM-ORDER',
        name: customOrder.description,
        quantity: customOrder.quantity,
        price: customOrder.quotedPrice || 0,
        mode: 'buy',
        rentalDays: 0,
      }],
      invoiceDate,
      dueDate,
      currency: 'NGN',
      currencySymbol: '₦',
      taxRate: 7.5,
      type: 'automatic',
      status: 'sent',
    });

    // Save invoice
    await invoice.save();
    console.log(`✅ Invoice created for custom order: ${invoiceNumber}`);

    // Generate professional invoice HTML and send emails to customer and admin
    const invoiceForEmail = invoice.toObject ? invoice.toObject() : invoice;
    const invoiceHtml = generateProfessionalInvoiceHTML(invoiceForEmail as any);
    await sendInvoiceEmail(
      invoice.customerEmail, 
      invoice.customerName, 
      invoice.invoiceNumber, 
      invoiceHtml, 
      invoice.orderNumber
    );

    console.log(`📧 Invoice email sent to ${invoice.customerEmail}`);

    return {
      success: true,
      invoiceNumber: invoice.invoiceNumber,
      invoice: invoice,
    };
  } catch (error) {
    console.error(`❌ Error creating invoice for custom order:`, error);
    throw error;
  }
}
