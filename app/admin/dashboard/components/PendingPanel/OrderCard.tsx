import { OrderCardHeader } from "./OrderCardHeader";
import { ProductItemsList } from "./ProductItemsList";
import { OrderStats } from "./OrderStats";
import { OrderInfo } from "./OrderInfo";
import { ActionButtons } from "./ActionButtons";
import Image from "next/image";

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
  items?: OrderItem[];
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
  // Custom order fields
  description?: string;
  designUrls?: string[];
  quantity?: number;
  quotedPrice?: number;
  isCustomOrder?: boolean;
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
  description,
  designUrls,
  quantity,
  quotedPrice,
  isCustomOrder,
}: OrderCardProps) {
  const isCustom = isCustomOrder || (description && !items?.length);
  
  return (
    <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-2xl border-2 border-red-200 overflow-hidden shadow-md hover:shadow-xl hover:border-red-300 transition-all flex flex-col">
      <OrderCardHeader
        firstName={firstName}
        lastName={lastName}
        email={email}
        phone={phone}
      />

      <div className="p-5 space-y-4 flex-1 flex flex-col">
        {/* Show items for regular orders */}
        {!isCustom && items?.length ? (
          <ProductItemsList items={items} />
        ) : null}

        {/* Show custom order details */}
        {isCustom && (
          <div className="space-y-3">
            {/* Design Images */}
            {designUrls && designUrls.length > 0 && (
              <div className="bg-white rounded-lg p-3 border border-red-200">
                <p className="text-xs font-semibold text-gray-600 uppercase mb-2">Design Images</p>
                <div className="grid grid-cols-2 gap-2">
                  {designUrls.slice(0, 4).map((url, idx) => (
                    <div
                      key={idx}
                      className="relative aspect-square bg-gray-100 rounded border border-red-300 overflow-hidden"
                    >
                      <Image
                        src={url}
                        alt={`Design ${idx + 1}`}
                        fill
                        className="object-cover"
                        unoptimized={true}
                        onError={(e) => {
                          const img = e.target as HTMLImageElement;
                          img.style.display = 'none';
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Description */}
            {description && (
              <div className="bg-white rounded-lg p-3 border border-red-200">
                <p className="text-xs font-semibold text-gray-600 uppercase mb-1">Description</p>
                <p className="text-sm text-gray-900 line-clamp-3">{description}</p>
              </div>
            )}

            {/* Quantity */}
            {quantity && (
              <div className="bg-white rounded-lg p-3 border border-red-200">
                <p className="text-xs font-semibold text-gray-600 uppercase mb-1">Quantity</p>
                <p className="text-sm text-gray-900">{quantity} piece(s)</p>
              </div>
            )}
          </div>
        )}

        {/* Show stats for regular orders */}
        {!isCustom && (
          <OrderStats
            itemCount={items?.length || 0}
            total={total}
            isPaid={isPaid}
            items={items}
            rentalDays={rentalDays}
            cautionFee={cautionFee}
          />
        )}

        {/* Show custom order pricing */}
        {isCustom && (
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border-2 border-emerald-200 p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Quoted Price</span>
              <span className="font-semibold text-gray-900">{formatCurrency(quotedPrice || 0)}</span>
            </div>
            <div className="pt-2 border-t border-emerald-200 flex justify-between text-lg">
              <span className="font-bold text-gray-900">Total</span>
              <span className="font-bold text-emerald-600">{formatCurrency(total)}</span>
            </div>
          </div>
        )}

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
