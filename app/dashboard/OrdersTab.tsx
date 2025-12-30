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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {void (customOrders.length > 0 &&
        console.log(
          '[Dashboard:Render] ✅ Rendering',
          customOrders.length,
          'custom order cards'
        ))}
      {customOrders.length === 0 ? (
        <div className="col-span-1 md:col-span-2 lg:col-span-3 text-center py-12">
          <p className="text-gray-400 text-sm">No orders to display</p>
        </div>
      ) : (
        customOrders.map((order) => {
          const messageCount = messageCountPerOrder[order._id] || {
            total: 0,
            unread: 0,
          };

          return (
            <OrderCard
              key={order._id}
              order={order}
              messageCount={messageCount}
              onChat={() => setChatModalOpen(order._id)}
              onViewImages={() =>
                setImageModalOpen({ orderId: order._id, index: 0 })
              }
            />
          );
        })
      )}
    </div>
  );
}
