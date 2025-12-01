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
}

export interface IRentalSchedule {
  pickupDate: string; // ISO date (YYYY-MM-DD)
  pickupTime: string; // HH:MM format
  returnDate: string; // ISO date (YYYY-MM-DD)
  pickupLocation: string; // "22 Ejire Street, Surulere"
  rentalDays: number; // Number of days
}

export interface IOrder extends Document {
  buyerId?: string;
  orderNumber: string;
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
  total: number;
  paymentMethod: string;
  status: string;
  items: IOrderItem[];
  isOffline?: boolean; // Mark as offline/manual order
  // Delivery fields
  deliveryState?: string;
  deliveryFee?: number;
  estimatedDeliveryDays?: { min: number; max: number };
  vehicleType?: string;
  // Rental schedule (shared for all rental items)
  rentalSchedule?: IRentalSchedule;
  cautionFee?: number; // 50% of total rental amount
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
    total: { type: Number, required: true },
    paymentMethod: { type: String, required: true },
    status: { type: String, default: 'confirmed' },
    items: [orderItemSchema],
    isOffline: { type: Boolean, default: false }, // Mark as offline/manual order
    // Delivery fields
    deliveryState: String,
    deliveryFee: { type: Number, default: 0 },
    estimatedDeliveryDays: {
      min: Number,
      max: Number,
    },
    vehicleType: String,
    // Rental schedule (shared for all rental items)
    rentalSchedule: rentalScheduleSchema,
    cautionFee: { type: Number, default: 0 }, // 50% of total rental amount
  },
  { timestamps: true }
);

orderSchema.index({ buyerId: 1 });

export default mongoose.models.Order || mongoose.model<IOrder>('Order', orderSchema);
