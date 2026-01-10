import { Check, Phone, Trash2, Truck } from "lucide-react";
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
  onShipped?: () => void;
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
  onShipped,
  disableShippedButton = false,
  onDeleteConfirm,
}: ActionButtonsProps) {
  const router = useRouter();
  const [sentToLogistics, setSentToLogistics] = useState<boolean>(() => {
    // Load persisted state from sessionStorage on mount
    try {
      const stored = sessionStorage.getItem(`order_sent_to_logistics_${orderId}`);
      return stored === 'true';
    } catch {
      return false;
    }
  });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleReadyClick = () => {
    if (orderData) {
      // Get existing orders from sessionStorage or create new array
      const existingOrders = sessionStorage.getItem('logistics_orders');
      const ordersArray = existingOrders ? JSON.parse(existingOrders) : [];
      
      // Check if order already exists to avoid duplicates
      const orderExists = ordersArray.some((order: any) => order._id === orderData._id);
      
      if (!orderExists) {
        ordersArray.push(orderData);
        sessionStorage.setItem('logistics_orders', JSON.stringify(ordersArray));
      }
      
      // Update order status to "ready" in the database
      updateOrderStatus(orderData._id, 'ready');
      
      // Mark as sent and persist to sessionStorage
      setSentToLogistics(true);
      sessionStorage.setItem(`order_sent_to_logistics_${orderId}`, 'true');
      console.log(`[ActionButtons] ✅ Persisted "Sent to Logistics" state for order ${orderId}`);
    } else {
      onApprove(orderId);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      console.log(`[ActionButtons] 🔄 Updating order ${orderId} to status: ${newStatus}`);
      console.log(`[ActionButtons] Order ID length: ${orderId.length}`);
      
      const response = await fetch(`/api/custom-orders/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      console.log(`[ActionButtons] Custom-orders endpoint - Status: ${response.status} ${response.statusText}`);

      if (response.ok) {
        console.log(`✅ Order ${orderId} status updated to ${newStatus} via custom-orders endpoint`);
        return;
      }

      if (response.status === 404) {
        console.log('[ActionButtons] ⚠️ Order not found in custom-orders, trying orders endpoint...');
        
        const altResponse = await fetch(`/api/orders/${orderId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status: newStatus }),
        });
        
        console.log(`[ActionButtons] Orders endpoint - Status: ${altResponse.status} ${altResponse.statusText}`);
        
        if (altResponse.ok) {
          console.log(`✅ Order ${orderId} status updated to ${newStatus} via orders endpoint`);
          return;
        } else {
          const errorData = await altResponse.json().catch(() => ({}));
          console.error(`[ActionButtons] Failed to update via orders endpoint:`, errorData);
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error(`[ActionButtons] Failed to update via custom-orders endpoint:`, errorData);
      }
    } catch (error) {
      console.error('[ActionButtons] Error updating order status:', error);
    }
  };

  const handleDeleteClick = async () => {
    try {
      setIsDeleting(true);
      if (onDeleteConfirm) {
        await onDeleteConfirm(orderId);
      } else {
        onDelete(orderId);
      }
      setShowDeleteModal(false);
    } catch (error) {
      console.error('[ActionButtons] Error deleting order:', error);
    } finally {
      setIsDeleting(false);
    }
  };
  // Show different buttons for approved orders
  if (isApproved) {
    return (
      <div className="flex gap-2 pt-4 border-t border-green-200 mt-auto">
        {!hideReadyButton && (
          <button
            onClick={handleReadyClick}
            disabled={isApproving || sentToLogistics}
            className={`flex-1 text-white font-semibold py-2 px-4 rounded-lg transition-all flex items-center justify-center gap-2 ${
              sentToLogistics
                ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700'
                : 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 disabled:from-gray-400 disabled:to-gray-400'
            }`}
          >
            {isApproving && !sentToLogistics ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                Sending...
              </>
            ) : sentToLogistics ? (
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
        {!hideDeleteButton && (
          <>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold py-2 px-4 rounded-lg transition-all flex items-center justify-center gap-2"
              title="Delete order"
            >
              <Trash2 className="h-4 w-4" />
            </button>
            {showDeleteModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 max-w-sm mx-4 shadow-xl">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Confirm Delete</h3>
                  <p className="text-gray-600 mb-6">
                    Are you sure you want to delete this order? This will remove it from both the admin dashboard and logistics page. This action cannot be undone.
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowDeleteModal(false)}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDeleteClick}
                      disabled={isDeleting}
                      className="flex-1 px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold rounded-lg hover:from-red-700 hover:to-red-800 disabled:from-gray-400 disabled:to-gray-400"
                    >
                      {isDeleting ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        {hideDeleteButton && (
          <button
            onClick={() => {
              if (onShipped) {
                onShipped();
              } else {
                alert('Order marked as shipped!');
              }
            }}
            disabled={disableShippedButton}
            className={`bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-2 px-4 rounded-lg transition-all flex items-center justify-center gap-2 ${
              disableShippedButton ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            title="Mark as shipped"
          >
            <Check className="h-4 w-4" />
            Shipped
          </button>
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
      <>
        <button
          onClick={() => setShowDeleteModal(true)}
          className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold py-2 px-4 rounded-lg transition-all flex items-center justify-center gap-2"
          title="Delete order"
        >
          <Trash2 className="h-4 w-4" />
        </button>
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-sm mx-4 shadow-xl">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Confirm Delete</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete this order? This will remove it from both the admin dashboard and logistics page. This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteClick}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold rounded-lg hover:from-red-700 hover:to-red-800 disabled:from-gray-400 disabled:to-gray-400"
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    </div>
  );
}
