'use client';

import { Check, Phone, MessageCircle, Truck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface OrderData {
  _id: string;
  orderNumber: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phone?: string;
  items?: any[];
  total: number;
  isPaid?: boolean;
  [key: string]: any;
}

interface ActionButtonsProps {
  orderId: string;
  isPaid: boolean;
  isApproving: boolean;
  onApprove: (orderId: string) => void;
  onChat: (orderId: string) => void;
  onDelete: (orderId: string) => void;
  isApproved?: boolean;
  orderData?: OrderData;
  hideReadyButton?: boolean;
  hideDeleteButton?: boolean;
  hidePaymentStatus?: boolean;
  logisticsMode?: boolean;
  onShipped?: () => Promise<void>;
  disableShippedButton?: boolean;
  onDeleteConfirm?: (orderId: string) => Promise<void>;
}

export function ActionButtons({
  orderId,
  isPaid,
  isApproving,
  onApprove,
  onChat,
  onDelete,
  isApproved = false,
  orderData,
  hideReadyButton = false,
  hideDeleteButton = false,
  hidePaymentStatus = false,
  logisticsMode = false,
  onShipped,
  disableShippedButton = false,
  onDeleteConfirm,
}: ActionButtonsProps) {
  const router = useRouter();
  const [sentToLogistics, setSentToLogistics] = useState<boolean>(false);
  const [showReadyForDeliveryModal, setShowReadyForDeliveryModal] = useState(false);

  const handleReadyClick = async () => {
    console.log('[ActionButtons] 🟢 handleReadyClick TRIGGERED');
    console.log('[ActionButtons] orderData:', orderData);
    console.log('[ActionButtons] orderId:', orderId);
    
    if (orderData) {
      console.log('[ActionButtons] 📦 OrderData exists, updating database status...');
      
      // Update order status to "ready_for_delivery" in the database
      try {
        console.log('[ActionButtons] 🔄 Updating order status in database...');
        const response = await fetch(`/api/orders/unified/${orderData._id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status: 'ready_for_delivery' }),
        });

        console.log('[ActionButtons] Response status:', response.status);

        if (response.ok) {
          // Mark as sent for UI feedback
          setSentToLogistics(true);
          sessionStorage.setItem(`order_sent_to_logistics_${orderId}`, 'true');
          console.log(`[ActionButtons] ✅ Order ${orderId} updated to ready_for_delivery in database`);
        } else {
          console.error('[ActionButtons] ❌ Failed to update order status:', response.statusText);
        }
      } catch (error) {
        console.error('[ActionButtons] ❌ Error updating order status:', error);
      }
    } else {
      console.log('[ActionButtons] ⚠️ No orderData provided');
    }
    setShowReadyForDeliveryModal(false);
    console.log('[ActionButtons] Modal closed');
  };

  // Show different buttons for approved orders
  if (isApproved) {
    return (
      <div className="flex gap-2 pt-4 border-t border-green-200 mt-auto">
        {!hideReadyButton && !logisticsMode && (
          <button
            onClick={() => {
              console.log('[ActionButtons] 🔴 READY BUTTON CLICKED!');
              console.log('[ActionButtons] orderId:', orderId);
              console.log('[ActionButtons] orderData:', orderData);
              console.log('[ActionButtons] sentToLogistics:', sentToLogistics);
              console.log('[ActionButtons] isApproved:', isApproved);
              setShowReadyForDeliveryModal(true);
              console.log('[ActionButtons] ✅ Modal state set to true');
            }}
            disabled={sentToLogistics}
            className="flex-1 px-6 py-2 font-bold text-white rounded-lg transition-all text-base bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 disabled:from-green-600 disabled:to-emerald-600 disabled:hover:from-green-600 disabled:hover:to-emerald-600 flex items-center justify-center gap-2"
          >
            {sentToLogistics ? (
              <>
                <Check className="h-4 w-4" />
                Sent to Logistics
              </>
            ) : (
              <>
                <Truck className="h-4 w-4" />
                Ready
              </>
            )}
          </button>
        )}
        <button
          onClick={() => {
            if (orderData?.phone) {
              window.location.href = `tel:${orderData.phone}`;
            } else {
              alert('Phone number not available');
            }
          }}
          className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-2 px-4 rounded-lg transition-all flex items-center justify-center gap-2"
        >
          <Phone className="h-4 w-4" />
          Call
        </button>
        
        {/* Mark Delivered Button for Logistics Mode */}
        {logisticsMode && onShipped && (
          <button
            onClick={onShipped}
            disabled={disableShippedButton}
            className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 disabled:from-gray-400 disabled:to-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition-all flex items-center justify-center gap-2"
          >
            <Truck className="h-4 w-4" />
            Mark Delivered?
          </button>
        )}
        
        {/* Ready for Delivery Confirmation Modal - INSIDE isApproved block */}
        {showReadyForDeliveryModal && (
          <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
            <div className="bg-white rounded-3xl p-8 max-w-sm mx-4 border-4 border-lime-500 shadow-2xl">
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-lime-100 rounded-full flex items-center justify-center">
                  <Check className="h-8 w-8 text-lime-600" strokeWidth={3} />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-center text-gray-900 mb-4">
                Order Items Ready & Completed?
              </h3>
              <p className="text-center text-gray-600 mb-8 text-base leading-relaxed">
                Are you sure the order items are ready and completed? This will move the order to logistics for delivery.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    console.log('[Modal] Cancel button clicked');
                    setShowReadyForDeliveryModal(false);
                  }}
                  className="flex-1 px-4 py-3 bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold rounded-xl transition-colors text-base"
                >
                  No, Cancel
                </button>
                <button
                  onClick={() => {
                    console.log('[Modal] YES READY button clicked - calling handleReadyClick');
                    handleReadyClick();
                  }}
                  className="flex-1 px-4 py-3 bg-lime-500 hover:bg-lime-600 text-white font-bold rounded-xl transition-colors text-base"
                >
                  Yes, Ready
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Original buttons for pending orders
  return (
    <div className="flex gap-2 pt-4 border-t border-lime-200 mt-auto">
      <button
        onClick={() => onApprove(orderId)}
        disabled={isApproving}
        className={`flex-1 text-white font-semibold py-2 px-4 rounded-lg transition-all flex items-center justify-center gap-2 ${
          isPaid
            ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800'
            : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700'
        } disabled:from-gray-400 disabled:to-gray-400`}
      >
        {isApproving ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
            {isPaid ? 'Confirming...' : 'Approving...'}
          </>
        ) : (
          <>
            <Check className="h-4 w-4" />
            Approve
          </>
        )}
      </button>
      <button
        onClick={() => {
          if (orderData?.phone) {
            window.location.href = `tel:${orderData.phone}`;
          } else {
            alert('Phone number not available');
          }
        }}
        className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-2 px-4 rounded-lg transition-all flex items-center justify-center gap-2"
      >
        <Phone className="h-4 w-4" />
        Call
      </button>
    </div>
  );
}
