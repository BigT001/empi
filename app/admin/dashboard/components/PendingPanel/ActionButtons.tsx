import { Check, MessageCircle, Trash2 } from "lucide-react";

interface ActionButtonsProps {
  orderId: string;
  isPaid: boolean;
  isApproving: boolean;
  onApprove: (orderId: string) => void;
  onChat: (orderId: string) => void;
  onDelete: (orderId: string) => void;
}

export function ActionButtons({
  orderId,
  isPaid,
  isApproving,
  onApprove,
  onChat,
  onDelete,
}: ActionButtonsProps) {
  return (
    <div className="flex gap-2 pt-4 border-t border-red-200 mt-auto">
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
        onClick={() => onChat(orderId)}
        className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold py-2 px-4 rounded-lg transition-all flex items-center justify-center gap-2"
      >
        <MessageCircle className="h-4 w-4" />
        Chat
      </button>
      <button
        onClick={() => {
          if (window.confirm('Are you sure you want to delete this order? This action cannot be undone.')) {
            onDelete(orderId);
          }
        }}
        className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold py-2 px-4 rounded-lg transition-all flex items-center justify-center gap-2"
        title="Delete order"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
