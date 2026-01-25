import Image from "next/image";

interface OrderItem {
  productId?: string;
  name: string;
  quantity: number;
  price?: number;
  unitPrice?: number; // Alternative field name from schema
  mode?: string;
  imageUrl?: string;
  image?: string; // Alternative field name for image
}

interface ProductItemsListProps {
  items: OrderItem[];
  hidePrice?: boolean; // Hide prices for logistics view
}

export function ProductItemsList({ items, hidePrice = false }: ProductItemsListProps) {
  if (!items || items.length === 0) return null;

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-gray-600 uppercase">Products Ordered</p>
      <div className="space-y-2">
        {items.map((item, idx) => {
          // Get price from either field, ensure it's a valid number
          const itemPrice = item.price ?? item.unitPrice ?? 0;
          const safePrice = typeof itemPrice === 'number' && !isNaN(itemPrice) ? itemPrice : 0;
          
          // Get image from either field
          const itemImage = item.image ?? item.imageUrl;

          return (
            <div
              key={`item-${idx}`}
              className="flex gap-3 bg-white rounded-lg p-3 border border-red-200"
            >
              {/* Product Image */}
              <div className="relative aspect-square bg-gray-100 rounded border border-red-300 overflow-hidden shrink-0 w-16 h-16">
                {itemImage ? (
                  <Image
                    src={itemImage}
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
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold text-gray-900">{item.name}</p>
                  {/* Mode Badge - ONLY show if mode is explicitly set */}
                  {item.mode === 'rent' && (
                    <span className="text-xs px-2 py-1 rounded font-bold whitespace-nowrap bg-purple-100 text-purple-700 border border-purple-300">
                      🔄 RENTAL
                    </span>
                  )}
                  {item.mode === 'buy' && (
                    <span className="text-xs px-2 py-1 rounded font-bold whitespace-nowrap bg-green-100 text-green-700 border border-green-300">
                      🛍️ BUY
                    </span>
                  )}
                  {!item.mode && (
                    <span className="text-xs px-2 py-1 rounded font-bold whitespace-nowrap bg-red-100 text-red-700 border border-red-300">
                      ⚠️ MODE MISSING
                    </span>
                  )}
                </div>
                <div className="flex gap-2 items-center justify-between">
                  <span className="text-xs text-gray-600">Qty: {item.quantity}</span>
                  {!hidePrice && (
                    <p className="text-sm font-bold text-red-600">₦{safePrice.toLocaleString('en-NG')}</p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
