'use client';

interface Message {
  _id: string;
  quotedPrice?: number;
  quotedQuantity?: number;
  discountPercentage?: number;
  discountAmount?: number;
  quotedVAT?: number;
  quotedTotal?: number;
  quotedDeliveryDate?: string;
  isFinalPrice?: boolean;
  senderType: string;
  content?: string;
}

interface QuoteDisplayProps {
  msg: Message;
}

export default function QuoteDisplay({ msg }: QuoteDisplayProps) {
  if (!msg.quotedPrice) return null;

  return (
    <div className={`space-y-1 md:space-y-2 pt-2 md:pt-3 border-t ${
      msg.senderType === 'customer' ? 'border-white/30' : 'border-gray-300'
    }`}>
      {msg.quotedQuantity && (
        <div className="flex justify-between text-xs md:text-sm gap-3 font-semibold">
          <span className="opacity-90">Quantity:</span>
          <span>×{msg.quotedQuantity}</span>
        </div>
      )}

      <div className="flex justify-between text-xs md:text-sm gap-3">
        <span className="opacity-90">Unit Price:</span>
        <span className="font-semibold">₦{Math.round(msg.quotedPrice).toLocaleString()}</span>
      </div>

      {msg.quotedQuantity && (
        <div className="flex justify-between text-xs md:text-sm gap-3 bg-gray-100/30 px-2 py-1 rounded">
          <span className="opacity-90">Subtotal ({msg.quotedQuantity} × ₦{Math.round(msg.quotedPrice).toLocaleString()}):</span>
          <span className="font-semibold">₦{Math.round(msg.quotedPrice * msg.quotedQuantity).toLocaleString()}</span>
        </div>
      )}

      {msg.discountPercentage && msg.discountPercentage > 0 && (
        <div className={`flex justify-between text-xs md:text-sm gap-3 ${
          msg.senderType === 'customer' ? 'text-green-100' : 'text-green-600'
        }`}>
          <span className="opacity-90">Discount ({msg.discountPercentage}%):</span>
          <span className="font-semibold">-₦{Math.round(msg.discountAmount || 0).toLocaleString()}</span>
        </div>
      )}

      <div className="flex justify-between text-xs md:text-sm gap-3">
        <span className="opacity-90">VAT (7.5%):</span>
        <span className="font-semibold">₦{Math.round(msg.quotedVAT || 0).toLocaleString()}</span>
      </div>

      <div className={`flex justify-between text-sm md:text-base font-bold border-t pt-1 md:pt-2 gap-3 ${
        msg.senderType === 'customer' ? 'border-white/30' : 'border-gray-300'
      }`}>
        <span>Total:</span>
        <span>₦{Math.round(msg.quotedTotal || 0).toLocaleString()}</span>
      </div>

      {msg.quotedDeliveryDate && (
        <div className={`border-t pt-2 md:pt-3 ${
          msg.senderType === 'customer' ? 'border-white/30' : 'border-gray-300'
        }`}>
          <div className="bg-gradient-to-r from-orange-100/50 to-amber-100/50 rounded-lg p-2 md:p-3 border border-orange-200">
            <p className="text-xs text-gray-700 font-semibold mb-1">📅 Proposed Delivery Date:</p>
            <p className={`text-sm md:text-base font-bold ${
              msg.senderType === 'customer' ? 'text-white' : 'text-orange-700'
            }`}>
              {new Date(msg.quotedDeliveryDate).toLocaleDateString('en-NG', {
                weekday: 'short',
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
