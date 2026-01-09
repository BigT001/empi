import { Calendar, Clock, Package } from "lucide-react";

interface OrderInfoProps {
  orderNumber: string;
  isPaid: boolean;
  rentalDays?: number;
  cautionFee?: number;
  formatCurrency: (amount: number) => string;
}

export function OrderInfo({
  orderNumber,
  isPaid,
  rentalDays,
  cautionFee,
  formatCurrency,
}: OrderInfoProps) {
  return (
    <div className="pt-3 border-t border-red-200">
      <p className="text-xs font-semibold text-gray-600 mb-3 uppercase tracking-wider">Order Info</p>
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <Calendar className="h-3.5 w-3.5" />
          <span>Order: {orderNumber}</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <Clock className="h-3.5 w-3.5" />
          {isPaid ? (
            <span className="text-green-600 font-semibold flex items-center gap-1">
              <span>✅ Payment Received</span>
            </span>
          ) : (
            <span className="text-yellow-600 font-semibold">Status: Awaiting Payment</span>
          )}
        </div>
        {/* Rental Days & Caution Fee */}
        <div className="mt-2 text-xs text-gray-600 space-y-1">
          {rentalDays && (
            <div className="flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5" />
              <span>Rental Days: {rentalDays} day{rentalDays > 1 ? 's' : ''}</span>
            </div>
          )}
          {cautionFee ? (
            <div className="flex items-center gap-2">
              <Package className="h-3.5 w-3.5" />
              <span>🔒 Caution Fee: {formatCurrency(cautionFee)}</span>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
