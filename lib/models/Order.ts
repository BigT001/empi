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
  total: number;
  paymentMethod: string;
  status: string;
  items: IOrderItem[];
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
    total: { type: Number, required: true },
    paymentMethod: { type: String, required: true },
    status: { type: String, default: 'confirmed' },
    items: [orderItemSchema],
  },
  { timestamps: true }
);

orderSchema.index({ buyerId: 1 });

export default mongoose.models.Order || mongoose.model<IOrder>('Order', orderSchema);
