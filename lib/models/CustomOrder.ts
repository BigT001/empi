import mongoose, { Schema, Document } from 'mongoose';

export interface ICustomOrder extends Document {
  orderNumber: string;
  fullName: string;
  email: string;
  phone: string;
  address?: string;
  city: string;
  state?: string;
  costumeType: string;
  description: string;
  designUrl?: string;
  budget?: number;
  deliveryDate?: Date;
  status: 'pending' | 'approved' | 'in-progress' | 'ready' | 'completed' | 'rejected';
  notes?: string;
  quotedPrice?: number;
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
    costumeType: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    designUrl: String,
    budget: Number,
    deliveryDate: Date,
    status: {
      type: String,
      enum: ['pending', 'approved', 'in-progress', 'ready', 'completed', 'rejected'],
      default: 'pending',
      index: true,
    },
    notes: String,
    quotedPrice: Number,
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
