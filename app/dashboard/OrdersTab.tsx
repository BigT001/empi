'use client';

import { OrderCard } from './OrderCard';
import { UserCustomOrderCard } from './CustomOrderCard';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Package } from 'lucide-react';

interface CustomOrder {
  _id: string;
  orderNumber: string;
  fullName: string;
  email: string;
  phone: string;
  address?: string;
  city: string;
  state?: string;
  description: string;
  designUrl?: string;
  designUrls?: string[];
  quantity?: number;
  deliveryDate?: string;
  proposedDeliveryDate?: string;
  buyerAgreedToDate?: boolean;
  status: "pending" | "paid" | "approved" | "in-progress" | "ready" | "completed" | "rejected";
  notes?: string;
  quotedPrice?: number;
  quoteItems?: Array<{ itemName: string; quantity: number; unitPrice: number }>;
  productId?: string;
  deadlineDate?: string;
  timerStartedAt?: string;
  timerDurationDays?: number;
  createdAt: string;
  updatedAt: string;
}

interface RegularOrder {
  _id: string;
  orderNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country: string;
  items: Array<{
    productId: string;
    product?: any;
    name: string;
    quantity: number;
    price: number;
    mode: 'buy' | 'rent';
    selectedSize?: string;
    imageUrl?: string;
  }>;
  status: string;
  subtotal: number;
  vat: number;
  total: number;
  shippingType: string;
  shippingCost: number;
  pricing?: {
    subtotal?: number;
    discount?: number;
    discountPercentage?: number;
    subtotalAfterDiscount?: number;
    tax?: number;
    total?: number;
  };
  createdAt: string;
  updatedAt: string;
}

interface OrdersTabProps {
  customOrders: CustomOrder[];
  regularOrders: RegularOrder[];
  messageCountPerOrder: Record<string, { total: number; unread: number }>;
  setChatModalOpen: (id: string) => void;
  setImageModalOpen: (state: { orderId: string; index: number } | null) => void;
}

export function OrdersTab({
  customOrders,
  regularOrders,
  messageCountPerOrder,
  setChatModalOpen,
  setImageModalOpen,
}: OrdersTabProps) {
  const router = useRouter();

  const handleProceedToPayment = (orderId: string, price: number, items: Array<{ itemName: string; quantity: number; unitPrice: number }> = []) => {
    // Calculate VAT (7.5% on quoted price without VAT)
    const VAT_RATE = 0.075;
    const quotedPrice = price / (1 + VAT_RATE); // Back-calculate the base price from total
    const quotedVAT = price - quotedPrice;
    
    // Store the complete custom order quote data for payment processing
    // The structure matches what the checkout page expects
    const quoteData = {
      orderId,
      quotedPrice,
      quotedVAT,
      quotedTotal: price,
      items, // Store quote items for display
    };
    
    console.log('[OrdersTab] Proceeding to payment with quote:', quoteData);
    sessionStorage.setItem('customOrderQuote', JSON.stringify(quoteData));
    router.push('/checkout?customOrder=true');
  };

  const allOrders = customOrders.length + regularOrders.length;

  return (
    <div className="columns-1 sm:columns-2 md:columns-3 gap-6">
      {allOrders === 0 ? (
        <div className="text-center py-12 w-full">
          <p className="text-gray-400 text-sm">No orders to display</p>
        </div>
      ) : (
        <>
          {/* REGULAR ORDERS */}
          {regularOrders.length > 0 && (
            <>
              {regularOrders.map((order) => {
                const messageCount = messageCountPerOrder[order._id] || {
                  total: 0,
                  unread: 0,
                };

                return (
                  <div key={order._id} className="break-inside-avoid mb-6">
                    {/* REGULAR ORDER CARD - Standard product orders */}
                    <OrderCard
                      order={order as any}
                      messageCount={messageCount}
                      onChat={() => setChatModalOpen(order._id)}
                      onViewImages={() => {}}
                    />
                  </div>
                );
              })}
            </>
          )}

          {/* CUSTOM ORDERS */}
          {customOrders.length > 0 && (
            <>
              {customOrders.map((order) => {
                const messageCount = messageCountPerOrder[order._id] || {
                  total: 0,
                  unread: 0,
                };

                return (
                  <div key={order._id} className="break-inside-avoid mb-6">
                    {/* CUSTOM ORDER CARD - Shows quote from admin */}
                    <UserCustomOrderCard
                      orderId={order._id}
                      orderNumber={order.orderNumber}
                      description={order.description}
                      quantity={order.quantity || 1}
                      status={order.status}
                      quotedPrice={order.quotedPrice}
                      quoteItems={order.quoteItems}
                      email={order.email}
                      phone={order.phone}
                      designUrls={order.designUrls || []}
                      onChat={() => setChatModalOpen(order._id)}
                      onProceedToPayment={handleProceedToPayment}
                    />
                  </div>
                );
              })}
            </>
          )}
        </>
      )}
    </div>
  );
}

