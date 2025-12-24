export interface LogisticsOrder {
  _id: string;
  orderNumber: string;
  fullName: string;
  email: string;
  phone: string;
  address?: string;
  city: string;
  state?: string;
  description?: string;
  quantity: number;
  status: string;
  deliveryDate?: string;
  createdAt: string;
  updatedAt: string;
  deliveryOption?: 'pickup' | 'delivery';
  shippingType?: 'self' | 'empi' | 'standard';
  currentHandler?: 'production' | 'logistics';
  handoffAt?: string;
  images?: string[];
  designUrls?: string[];
  productId?: string;
  paymentConfirmedAt?: string;
  items?: any[];
  _isCustomOrder?: boolean; // Flag to identify if order is from custom orders or regular orders
}

export interface Message {
  _id: string;
  orderId: string;
  senderEmail: string;
  senderName: string;
  senderType: 'admin' | 'customer' | 'system';
  content: string;
  messageType: 'text' | 'quote' | 'negotiation' | 'system' | 'quantity-update';
  isRead: boolean;
  createdAt: string;
}
