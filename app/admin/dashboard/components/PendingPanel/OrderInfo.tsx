import { Calendar, Clock, Package, Phone, Mail, MapPin } from "lucide-react";

interface OrderInfoProps {
  orderNumber: string;
  isPaid: boolean;
  rentalDays?: number;
  cautionFee?: number;
  rentalSchedule?: {
    pickupDate: string;
    pickupTime: string;
    returnDate: string;
    pickupLocation: 'iba' | 'surulere';
    rentalDays: number;
  };
  rentalPolicyAgreed?: boolean;
  formatCurrency: (amount: number) => string;
  isApproved?: boolean;
  hidePaymentStatus?: boolean;
  // Logistics mode props
  logisticsMode?: boolean;
  phone?: string;
  email?: string;
  deliveryDetails?: {
    address?: string;
    city?: string;
    state?: string;
    location?: string;
  };
}

export function OrderInfo({
  orderNumber,
  isPaid,
  rentalDays,
  cautionFee,
  rentalSchedule,
  rentalPolicyAgreed,
  formatCurrency,
  isApproved = false,
  hidePaymentStatus = false,
  logisticsMode = false,
  phone = '',
  email = '',
  deliveryDetails = {},
}: OrderInfoProps) {
  return (
    <div className="pt-3 border-t border-lime-200">
      {/* LOGISTICS MODE: Show Contact Info & Delivery Details */}
      {logisticsMode && (
        <>
          {/* Contact Information */}
          <div className="mb-3">
            <p className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wider">📞 Contact Information</p>
            <div className="space-y-1.5">
              {phone && (
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <Phone className="h-4 w-4 text-gray-600" />
                  <span>{phone}</span>
                </div>
              )}
              {email && (
                <div className="flex items-center gap-2 text-sm text-gray-700 truncate">
                  <Mail className="h-4 w-4 text-gray-600 flex-shrink-0" />
                  <span className="truncate">{email}</span>
                </div>
              )}
            </div>
          </div>

          {/* Delivery Details */}
          {deliveryDetails && (
            <div className="mb-3">
              <p className="text-xs font-semibold text-red-600 mb-2 uppercase tracking-wider">🚚 Delivery Details</p>
              <div className="space-y-1.5 text-sm">
                {/* Always show address - it's critical for delivery */}
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0 font-bold" />
                  <div className="flex-1">
                    <span className="font-semibold text-gray-900">Address:</span>
                    <div className="text-gray-700 font-medium">{deliveryDetails.address || 'Not provided'}</div>
                  </div>
                </div>
                {deliveryDetails.city && deliveryDetails.city !== 'Not provided' && (
                  <div className="text-gray-700"><span className="font-semibold">City:</span> {deliveryDetails.city}</div>
                )}
                {deliveryDetails.state && deliveryDetails.state !== 'Not provided' && (
                  <div className="text-gray-700"><span className="font-semibold">State:</span> {deliveryDetails.state}</div>
                )}
                {deliveryDetails.location && deliveryDetails.location !== 'Not provided' && (
                  <div className="text-gray-700"><span className="font-semibold">Location:</span> {deliveryDetails.location}</div>
                )}
              </div>
            </div>
          )}

          {/* RENTAL SCHEDULE - Show in logistics mode */}
          {rentalSchedule && (
            <div className="mt-2.5 p-2 bg-blue-50 border border-blue-200 rounded-lg space-y-1.5 text-xs">
              <div className="font-semibold text-blue-700 flex items-center gap-1.5 mb-1.5">
                <Calendar className="h-4 w-4" />
                📅 Rental Schedule
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="text-gray-700">
                  <span className="font-semibold">Pickup:</span>
                  <div className="text-gray-900 font-medium">{rentalSchedule.pickupDate}</div>
                  <div className="text-gray-700">{rentalSchedule.pickupTime}</div>
                </div>
                <div className="text-gray-700">
                  <span className="font-semibold">Return:</span>
                  <div className="text-gray-900 font-medium">{rentalSchedule.returnDate}</div>
                </div>
                <div className="text-gray-700">
                  <span className="font-semibold">Duration:</span>
                  <div className="text-blue-700 font-bold">{rentalSchedule.rentalDays} day{rentalSchedule.rentalDays > 1 ? 's' : ''}</div>
                </div>
                <div className="text-gray-700">
                  <span className="font-semibold">Location:</span>
                  <div className="text-gray-900 font-medium capitalize">{rentalSchedule.pickupLocation === 'iba' ? 'Ibafo' : 'Surulere'}</div>
                </div>
              </div>
              {rentalPolicyAgreed && (
                <div className="flex items-center gap-1 text-green-700 bg-green-50 px-2 py-1 rounded text-xs font-semibold border border-green-300 mt-1.5">
                  ✅ Rental Policy Agreed
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* NORMAL MODE: Show Order Info */}
      {!logisticsMode && (
        <>
      <p className="text-xs font-semibold text-gray-600 mb-3 uppercase tracking-wider">Order Info</p>
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <Calendar className="h-3.5 w-3.5" />
          <span>Order: {orderNumber}</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <Clock className="h-3.5 w-3.5" />
          {!hidePaymentStatus && (
            <>
              {(isPaid || isApproved) ? (
                <span className="text-green-600 font-semibold flex items-center gap-1">
                  <span>✅ Payment Received</span>
                </span>
              ) : (
                <span className="text-yellow-600 font-semibold">Status: Awaiting Payment</span>
              )}
            </>
          )}
        </div>
        
        {/* RENTAL SCHEDULE SECTION - Display all rental details */}
        {rentalSchedule && (
          <div className="mt-2.5 p-2 bg-blue-50 border border-blue-200 rounded-lg space-y-1.5 text-xs">
            <div className="font-semibold text-blue-700 flex items-center gap-1.5 mb-1.5">
              <Calendar className="h-4 w-4" />
              📅 Rental Schedule
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="text-gray-700">
                <span className="font-semibold">Pickup:</span>
                <div className="text-gray-900 font-medium">{rentalSchedule.pickupDate}</div>
                <div className="text-gray-700">{rentalSchedule.pickupTime}</div>
              </div>
              <div className="text-gray-700">
                <span className="font-semibold">Return:</span>
                <div className="text-gray-900 font-medium">{rentalSchedule.returnDate}</div>
              </div>
              <div className="text-gray-700">
                <span className="font-semibold">Duration:</span>
                <div className="text-blue-700 font-bold">{rentalSchedule.rentalDays} day{rentalSchedule.rentalDays > 1 ? 's' : ''}</div>
              </div>
              <div className="text-gray-700">
                <span className="font-semibold">Location:</span>
                <div className="text-gray-900 font-medium capitalize">{rentalSchedule.pickupLocation === 'iba' ? 'Ibafo' : 'Surulere'}</div>
              </div>
            </div>
            {rentalPolicyAgreed && (
              <div className="flex items-center gap-1 text-green-700 bg-green-50 px-2 py-1 rounded text-xs font-semibold border border-green-300 mt-1.5">
                ✅ Rental Policy Agreed
              </div>
            )}
          </div>
        )}
        
        {/* Rental Days & Caution Fee */}
        <div className="mt-2 text-xs text-gray-600 space-y-1">
          {rentalDays && !rentalSchedule && (
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
        </>
      )}
    </div>
  );
}
