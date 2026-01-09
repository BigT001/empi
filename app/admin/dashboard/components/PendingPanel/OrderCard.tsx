import { OrderCardHeader } from "./OrderCardHeader";
import { ProductItemsList } from "./ProductItemsList";
import { OrderStats } from "./OrderStats";
import { OrderInfo } from "./OrderInfo";
import { ActionButtons } from "./ActionButtons";

interface OrderItem {
  productId?: string;
  name: string;
  quantity: number;
  price: number;
  mode?: 'buy' | 'rent';
  imageUrl?: string;
}

interface OrderCardProps {
  orderId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  items: OrderItem[];
  total: number;
  orderNumber: string;
  isPaid: boolean;
  isApproving: boolean;
  rentalDays?: number;
  cautionFee?: number;
  onApprove: (orderId: string) => void;
  onChat: (orderId: string) => void;
  onDelete: (orderId: string) => void;
  formatCurrency: (amount: number) => string;
}

export function OrderCard({
  orderId,
  firstName,
  lastName,
  email,
  phone,
  items,
  total,
  orderNumber,
  isPaid,
  isApproving,
  rentalDays,
  cautionFee,
  onApprove,
  onChat,
  onDelete,
  formatCurrency,
}: OrderCardProps) {
  return (
    <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-2xl border-2 border-red-200 overflow-hidden shadow-md hover:shadow-xl hover:border-red-300 transition-all flex flex-col">
      <OrderCardHeader
        firstName={firstName}
        lastName={lastName}
        email={email}
        phone={phone}
      />

      <div className="p-5 space-y-4 flex-1 flex flex-col">
        <ProductItemsList items={items} />

        <OrderStats
          itemCount={items?.length || 0}
          total={total}
          isPaid={isPaid}
          items={items}
          rentalDays={rentalDays}
          cautionFee={cautionFee}
        />

        <OrderInfo
          orderNumber={orderNumber}
          isPaid={isPaid}
          rentalDays={rentalDays}
          cautionFee={cautionFee}
          formatCurrency={formatCurrency}
        />

        <ActionButtons
          orderId={orderId}
          isPaid={isPaid}
          isApproving={isApproving}
          onApprove={onApprove}
          onChat={onChat}
          onDelete={onDelete}
        />
      </div>
    </div>
  );
}
