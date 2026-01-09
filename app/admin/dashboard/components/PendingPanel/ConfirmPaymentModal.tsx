import { AlertCircle, Check, X } from "lucide-react";

interface ConfirmPaymentModalProps {
  isOpen: boolean;
  orderNumber: string;
  isPaid: boolean;
  total: number;
  onClose: () => void;
  onApprove: () => void;
  formatCurrency: (amount: number) => string;
}

export function ConfirmPaymentModal({
  isOpen,
  orderNumber,
  isPaid,
  total,
  onClose,
  onApprove,
  formatCurrency,
}: ConfirmPaymentModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-sm mx-4 p-6 space-y-4">
        <div className={`flex items-center justify-center w-12 h-12 rounded-full mx-auto ${
          isPaid ? 'bg-green-100' : 'bg-yellow-100'
        }`}>
          {isPaid ? (
            <Check className="h-6 w-6 text-green-600" />
          ) : (
            <AlertCircle className="h-6 w-6 text-yellow-600" />
          )}
        </div>
        
        <h2 className="text-xl font-bold text-center text-gray-900">
          {isPaid ? 'Payment Confirmed' : 'Verify Payment'}
        </h2>
        
        <div className="space-y-3">
          <p className="text-center text-gray-600">
            Order <span className="font-semibold">{orderNumber}</span>
          </p>
          
          <div className={`border rounded-lg p-4 ${
            isPaid ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'
          }`}>
            <p className={`text-sm font-semibold mb-2 ${
              isPaid ? 'text-green-700' : 'text-yellow-700'
            }`}>
              Payment Status:
            </p>
            <p className={`text-lg font-bold ${
              isPaid ? 'text-green-600' : 'text-yellow-600'
            }`}>
              {isPaid ? '✅ Payment Received' : '⏳ Awaiting Payment'}
            </p>
          </div>
          
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <p className="text-sm text-gray-600">
              <span className="font-semibold">Amount:</span> {formatCurrency(total)}
            </p>
          </div>
        </div>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm text-blue-700">
            {isPaid 
              ? '✅ Payment has been verified. You can now approve this order.'
              : '⚠️ No payment detected yet. Please ensure payment has been received before approving.'}
          </p>
        </div>
        
        <div className="flex gap-3 pt-2">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition"
          >
            {isPaid ? 'Cancel' : 'Go Back'}
          </button>
          <button
            onClick={onApprove}
            disabled={!isPaid}
            className={`flex-1 px-4 py-2 text-white font-semibold rounded-lg transition ${
              isPaid
                ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700'
                : 'bg-gray-400 cursor-not-allowed'
            }`}
          >
            {isPaid ? 'Approve Order' : 'Waiting for Payment'}
          </button>
        </div>
      </div>
    </div>
  );
}
