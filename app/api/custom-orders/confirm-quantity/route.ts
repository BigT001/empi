import connectDB from '@/lib/mongodb';
import CustomOrder from '@/lib/models/CustomOrder';
import Message from '@/lib/models/Message';
import { calculatePrice, extractUnitPriceFromOrder } from '@/lib/priceCalculations';

export async function POST(request: Request) {
  try {
    await connectDB();

    const body = await request.json();
    const { orderId, orderNumber, newQuantity, adminEmail, adminName } = body;

    console.log('[confirm-quantity API] 📊 Processing quantity confirmation:', {
      orderId,
      orderNumber,
      newQuantity,
    });

    // Get the order
    const order = await CustomOrder.findById(orderId);
    if (!order) {
      return Response.json({ error: 'Order not found' }, { status: 404 });
    }

    // Use centralized price calculation utility
    const unitPrice = extractUnitPriceFromOrder(order);
    const priceBreakdown = calculatePrice(unitPrice, newQuantity);

    console.log('[confirm-quantity API] 💰 Quote calculations:', {
      unitPrice: priceBreakdown.unitPrice,
      quantity: newQuantity,
      subtotal: priceBreakdown.subtotal,
      vat: priceBreakdown.vat,
      quotedTotal: priceBreakdown.total,
    });

    // Create a new quote message from admin
    const quoteMessage = await Message.create({
      orderId: orderId,
      orderNumber: orderNumber,
      senderEmail: adminEmail,
      senderName: adminName,
      senderType: 'admin',
      content: `New quote based on updated quantity of ${newQuantity} units`,
      messageType: 'quote',
      quotedPrice: priceBreakdown.unitPrice,
      quotedVAT: priceBreakdown.vat,
      quotedTotal: priceBreakdown.total,
      isRead: false,
      createdAt: new Date(),
    });

    console.log('[confirm-quantity API] ✅ Quote message created:', {
      messageId: quoteMessage._id,
      quotedTotal: priceBreakdown.total,
    });

    // Update the order with new quantity and store the total price
    order.quantity = newQuantity;
    order.quotedPrice = Math.round(priceBreakdown.total); // Store total price as integer
    order.unitPrice = Math.round(priceBreakdown.unitPrice); // Store unit price as integer
    await order.save();

    console.log('[confirm-quantity API] ✅ Order updated with new quantity:', {
      orderId,
      newQuantity,
      unitPrice: priceBreakdown.unitPrice,
      quotedPrice: priceBreakdown.total,
    });

    return Response.json({
      success: true,
      message: 'Quote generated and sent successfully',
      quote: {
        messageId: quoteMessage._id,
        unitPrice: priceBreakdown.unitPrice,
        subtotal: priceBreakdown.subtotal,
        vat: priceBreakdown.vat,
        quotedTotal: priceBreakdown.total,
        quantity: newQuantity,
      },
    });
  } catch (error) {
    console.error('[confirm-quantity API] ❌ Error:', error);
    return Response.json(
      { error: 'Failed to process quantity confirmation' },
      { status: 500 }
    );
  }
}
