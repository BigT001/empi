import Image from "next/image";

interface OrderItem {
  productId?: string;
  name: string;
  quantity: number;
  price: number;
  mode?: string;
  imageUrl?: string;
}

interface ProductItemsListProps {
  items: OrderItem[];
}

export function ProductItemsList({ items }: ProductItemsListProps) {
  if (!items || items.length === 0) return null;

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-gray-600 uppercase">Products Ordered</p>
      <div className="space-y-2">
        {items.map((item, idx) => (
          <div
            key={`item-${idx}`}
            className="flex gap-3 bg-white rounded-lg p-3 border border-red-200"
          >
            {/* Product Image */}
            <div className="relative aspect-square bg-gray-100 rounded border border-red-300 overflow-hidden shrink-0 w-16 h-16">
              {item.imageUrl ? (
                <Image
                  src={item.imageUrl}
                  alt={item.name}
                  fill
                  className="object-cover"
                  unoptimized={true}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-200">
                  <span className="text-xs text-gray-600">No Image</span>
                </div>
              )}
            </div>
    
            {/* Product Details */}
            <div className="flex-1 flex flex-col justify-center gap-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{item.name}</p>
              <div className="flex gap-2 items-center justify-between">
                <div className="flex gap-2 items-center">
                  <span className="text-xs text-gray-600">Qty: {item.quantity}</span>
                  {item.mode && (
                    <span className={`text-xs px-2 py-0.5 rounded font-semibold ${
                      item.mode === 'rent'
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-green-100 text-green-700'
                    }`}>
                      {item.mode === 'rent' ? '🔄 Rental' : '🛍️ Buy'}
                    </span>
                  )}
                </div>
                <p className="text-sm font-bold text-red-600">₦{Number(item.price).toLocaleString('en-NG')}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
