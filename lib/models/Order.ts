import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IOrderItem {
  productId: string;
  product?: any;
  name: string;
  quantity: number;
  price: number;
  rentPrice?: number;
  mode: 'buy' | 'rent';
  selectedSize?: string;
  rentalDays: number;
  imageUrl?: string; // Product image URL for display in pending orders
}

export interface IRentalSchedule {
  pickupDate: string; // ISO date (YYYY-MM-DD)
  pickupTime: string; // HH:MM format
  returnDate: string; // ISO date (YYYY-MM-DD)
  pickupLocation: string; // "22 Ejire Street, Surulere"
  rentalDays: number; // Number of days
}

export interface IDeliveryDetails {
  address: string; // Delivery address
  location: string; // Chrome, Zest, or nearest bus stop
  state: string; // State
  localGovernment: string; // Local Government Area
  phone?: string; // Optional alternative phone number
}

export interface IOrder extends Document {
  buyerId?: string;
  orderNumber: string;
  orderType: 'rental' | 'sales' | 'mixed'; // Explicit categorization
  source?: 'custom' | 'regular'; // CRITICAL: Track order origin (prevents mixing)
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address?: string;
  busStop?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country: string;
  shippingType: string;
  shippingCost: number;
  subtotal: number;
  vat: number; // VAT amount (7.5% of subtotal)
  vatRate: number; // VAT rate percentage (7.5)
  discountPercentage?: number; // Discount percentage (for bulk orders, etc)
  discountAmount?: number; // Discount amount in currency
  subtotalAfterDiscount?: number; // Subtotal after discount applied
  total: number;
  paymentMethod: string;
  status: string; // 'pending', 'awaiting_payment', 'payment_confirmed', 'completed', 'cancelled'
  items: IOrderItem[];
  isOffline?: boolean; // Mark as offline/manual order
  offlineType?: string; // 'sale' or 'rental' for offline orders
  isCustomOrder?: boolean; // Mark as payment for custom order (should not show in regular orders tab)
  customOrderId?: string; // Reference to the CustomOrder being paid for
  // Payment tracking
  paymentStatus?: 'pending' | 'awaiting_payment' | 'confirmed' | 'failed';
  paymentProofUrl?: string; // URL to payment proof screenshot
  paymentProofUploadedAt?: Date;
  paymentConfirmedAt?: Date;
  paymentConfirmedBy?: string; // Admin ID
  // Delivery fields
  deliveryState?: string;
  deliveryFee?: number;
  estimatedDeliveryDays?: { min: number; max: number };
  vehicleType?: string;
  deliveryOption?: 'pickup' | 'empi'; // Customer's delivery preference for regular orders
  deliveryDetails?: IDeliveryDetails; // Buyer's delivery details for EMPI delivery
  // Rental schedule (shared for all rental items)
  rentalSchedule?: IRentalSchedule;
  cautionFee?: number; // 50% of total rental amount
  cautionFeeTransactionId?: string; // Reference to CautionFeeTransaction for tracking
  // Pricing breakdown
  pricing?: {
    subtotal?: number;
    goodsSubtotal?: number;
    cautionFee?: number;
    tax?: number;
    shipping?: number;
    total?: number;
    discount?: number;
    discountPercentage?: number;
    subtotalAfterDiscount?: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const orderItemSchema = new Schema<IOrderItem>({
  productId: { type: String, required: true },
  name: { type: String, required: true },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true },
  rentPrice: Number,
  mode: { type: String, enum: ['buy', 'rent'], required: true },
  selectedSize: String,
  rentalDays: { type: Number, default: 0 },
  imageUrl: String, // Product image URL for display
});

const rentalScheduleSchema = new Schema<IRentalSchedule>({
  pickupDate: { type: String, required: true },
  pickupTime: { type: String, required: true },
  returnDate: { type: String, required: true },
  pickupLocation: { type: String, default: "22 Ejire Street, Surulere" },
  rentalDays: { type: Number, required: true },
}, { _id: false });

const orderSchema = new Schema<IOrder>(
  {
    buyerId: { type: Schema.Types.ObjectId, ref: 'Buyer' },
    orderNumber: { type: String, required: true, unique: true },
    orderType: {
      type: String,
      enum: ['rental', 'sales', 'mixed'],
      default: 'sales',
      required: true,
      index: true,
    },
    source: {
      type: String,
      enum: ['custom', 'regular'],
      default: 'regular',
      index: true,
    },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true },
    phone: String,
    address: String,
    busStop: String,
    city: String,
    state: String,
    zipCode: String,
    country: { type: String, required: true },
    shippingType: { type: String, required: true },
    shippingCost: { type: Number, default: 0 },
    subtotal: { type: Number, required: true },
    vat: { type: Number, default: 0 }, // VAT amount (7.5% of subtotal)
    vatRate: { type: Number, default: 7.5 }, // VAT rate percentage
    discountPercentage: { type: Number, default: 0 }, // Discount percentage (for bulk orders, etc)
    discountAmount: { type: Number, default: 0 }, // Discount amount in currency
    subtotalAfterDiscount: { type: Number, default: 0 }, // Subtotal after discount applied
    total: { type: Number, required: true },
    paymentMethod: { type: String, required: true },
    status: { type: String, default: 'pending' }, // 'pending', 'awaiting_payment', 'payment_confirmed', 'completed', 'cancelled'
    items: [orderItemSchema],
    isOffline: { type: Boolean, default: false }, // Mark as offline/manual order
    offlineType: { type: String }, // 'sale' or 'rental' for offline orders
    isCustomOrder: { type: Boolean, default: false }, // Mark as payment for custom order
    customOrderId: { type: Schema.Types.ObjectId, ref: 'CustomOrder' }, // Reference to CustomOrder
    // Payment tracking
    paymentStatus: { type: String, enum: ['pending', 'awaiting_payment', 'confirmed', 'failed'], default: 'pending' },
    paymentProofUrl: String,
    paymentProofUploadedAt: Date,
    paymentConfirmedAt: Date,
    paymentConfirmedBy: { type: Schema.Types.ObjectId, ref: 'Admin' },
    // Delivery fields
    deliveryState: String,
    deliveryFee: { type: Number, default: 0 },
    estimatedDeliveryDays: {
      min: Number,
      max: Number,
    },
    vehicleType: String,
    deliveryOption: {
      type: String,
      enum: ['pickup', 'empi'],
    },
    deliveryDetails: {
      address: String,
      location: String, // Chrome, Zest, or nearest bus stop
      state: String,
      localGovernment: String,
      phone: String, // Optional alternative phone number
    },
    // Rental schedule (shared for all rental items)
    rentalSchedule: rentalScheduleSchema,
    cautionFee: { type: Number, default: 0 }, // 50% of total rental amount
    cautionFeeTransactionId: { type: Schema.Types.ObjectId, ref: 'CautionFeeTransaction' }, // Link to caution fee tracking
    // Pricing breakdown
    pricing: {
      subtotal: Number,
      goodsSubtotal: Number,
      cautionFee: Number,
      tax: Number,
      shipping: Number,
      total: Number,
      discount: Number,
      discountPercentage: Number,
      subtotalAfterDiscount: Number,
    },
  },
  { timestamps: true }
);

orderSchema.index({ buyerId: 1 });

export default mongoose.models.Order || mongoose.model<IOrder>('Order', orderSchema);
