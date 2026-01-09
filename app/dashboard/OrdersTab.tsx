'use client';

import { OrderCard } from './OrderCard';
import Link from 'next/link';
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
  status: "pending" | "approved" | "in-progress" | "ready" | "completed" | "rejected";
  notes?: string;
  quotedPrice?: number;
  productId?: string;
  deadlineDate?: string;
  timerStartedAt?: string;
  timerDurationDays?: number;
  createdAt: string;
  updatedAt: string;
}

interface OrdersTabProps {
  customOrders: CustomOrder[];
  messageCountPerOrder: Record<string, { total: number; unread: number }>;
  setChatModalOpen: (id: string) => void;
  setImageModalOpen: (state: { orderId: string; index: number } | null) => void;
}

export function OrdersTab({
  customOrders,
  messageCountPerOrder,
  setChatModalOpen,
  setImageModalOpen,
}: OrdersTabProps) {
  return (
    <div className="columns-1 sm:columns-2 md:columns-3 gap-6">
      {void (customOrders.length > 0 &&
        console.log(
          '[Dashboard:Render] ✅ Rendering',
          customOrders.length,
          'custom order cards'
        ))}
      {customOrders.length === 0 ? (
        <div className="text-center py-12 w-full">
          <p className="text-gray-400 text-sm">No orders to display</p>
        </div>
      ) : (
        customOrders.map((order) => {
          const messageCount = messageCountPerOrder[order._id] || {
            total: 0,
            unread: 0,
          };

          return (
            <div key={order._id} className="break-inside-avoid mb-6">
              <OrderCard
                order={order}
                messageCount={messageCount}
                onChat={() => setChatModalOpen(order._id)}
                onViewImages={() =>
                  setImageModalOpen({ orderId: order._id, index: 0 })
                }
              />
            </div>
          );
        })
      )}
    </div>
  );
}
