/**
 * ORDER FLOW TYPES
 * ================
 * Central type definitions for distinguishing custom vs regular orders
 * 
 * Import from this file to ensure type safety across the app
 */

/**
 * Order source - where the order came from
 */
export type OrderSource = 'custom' | 'regular';

/**
 * Custom Order Type - for orders made through custom order form
 */
export interface ICustomOrderData {
  orderNumber: string;
  fullName: string;
  email: string;
  phone: string;
  description: string;
  costumeType?: string;
  quantity: number;
  quotedPrice?: number;
  quoteItems?: Array<{
    itemName: string;
    quantity: number;
    unitPrice: number;
  }>;
  designUrl?: string;
  designUrls?: string[];
  status: 'pending' | 'approved' | 'in-progress' | 'ready' | 'completed' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Regular Order Type - for orders made through product cart
 */
export interface IRegularOrderData {
  orderNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  orderType: 'rental' | 'sales' | 'mixed';
  source: 'regular';
  items: Array<{
    productId: string;
    name: string;
    quantity: number;
    price: number;
    mode: 'buy' | 'rent';
    rentalDays?: number;
  }>;
  status: 'pending' | 'awaiting_payment' | 'payment_confirmed' | 'completed' | 'cancelled';
  total: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Union type for any order
 */
export type AnyOrder = ICustomOrderData | IRegularOrderData;

/**
 * Type guard for custom orders
 */
export function isCustomOrderData(order: any): order is ICustomOrderData {
  return (
    'description' in order &&
    'fullName' in order &&
    !('items' in order && Array.isArray(order.items))
  );
}

/**
 * Type guard for regular orders
 */
export function isRegularOrderData(order: any): order is IRegularOrderData {
  return (
    'items' in order &&
    Array.isArray(order.items) &&
    'orderType' in order
  );
}
