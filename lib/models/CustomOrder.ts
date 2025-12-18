import mongoose, { Schema, Document } from 'mongoose';

export interface ICustomOrder extends Document {
  orderNumber: string;
  fullName: string;
  email: string;
  phone: string;
  address?: string;
  city: string;
  state?: string;
  costumeType?: string; // Optional - kept for backwards compatibility
  description: string;
  productId?: string; // Reference to product being ordered
  designUrl?: string;
  designUrls?: string[]; // Multiple design images
  quantity: number;
  deliveryDate?: Date;
  proposedDeliveryDate?: Date; // Admin's proposed production ready date
  buyerAgreedToDate?: boolean; // Whether buyer agreed to the proposed date
  productionStartedAt?: Date; // When production actually started
  status: 'pending' | 'approved' | 'in-progress' | 'ready' | 'completed' | 'rejected';
  notes?: string;
  quotedPrice?: number;
  unitPrice?: number; // Unit price per item (for auto-recalculation when quantity changes)
  // Countdown timer fields
  deadlineDate?: Date; // When the costume must be delivered
  timerStartedAt?: Date; // When the countdown timer was started (after payment)
  timerDurationDays?: number; // Duration in days (0-30 typically)
  // Logistics handoff fields
  currentHandler?: 'production' | 'logistics'; // Who is currently handling the order
  handoffAt?: Date; // When logistics took over
  logisticsCanViewFullHistory?: boolean; // Super admin grants permission to view full chat history
  deliveryOption?: 'pickup' | 'delivery'; // Customer's delivery preference
  createdAt: Date;
  updatedAt: Date;
}

const customOrderSchema = new Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    fullName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      index: true,
    },
    phone: {
      type: String,
      required: true,
    },
    address: String,
    city: {
      type: String,
      required: true,
    },
    state: String,
    costumeType: String,
    description: {
      type: String,
      required: true,
    },
    productId: String, // Reference to product being ordered
    designUrl: String,
    designUrls: [String], // Array of design image URLs
    quantity: {
      type: Number,
      required: true,
      default: 1,
      min: 1,
    },
    deliveryDate: Date,
    proposedDeliveryDate: Date,
    buyerAgreedToDate: {
      type: Boolean,
      default: false,
    },
    productionStartedAt: Date,
    status: {
      type: String,
      enum: ['pending', 'approved', 'in-progress', 'ready', 'completed', 'rejected'],
      default: 'pending',
      index: true,
    },
    notes: String,
    quotedPrice: Number,
    unitPrice: Number, // Unit price per item (for auto-recalculation when quantity changes)
    // Countdown timer fields
    deadlineDate: Date,
    timerStartedAt: Date,
    timerDurationDays: Number,
    // Logistics handoff fields
    currentHandler: {
      type: String,
      enum: ['production', 'logistics'],
      default: 'production',
      index: true,
    },
    handoffAt: Date,
    logisticsCanViewFullHistory: {
      type: Boolean,
      default: false,
    },
    deliveryOption: {
      type: String,
      enum: ['pickup', 'delivery'],
      default: null,
    },
  },
  {
    timestamps: true,
    collection: 'custom_orders',
  }
);

// Prevent model override on hot reload
const CustomOrder =
  mongoose.models?.CustomOrder ||
  mongoose.model<ICustomOrder>('CustomOrder', customOrderSchema);

export default CustomOrder;
