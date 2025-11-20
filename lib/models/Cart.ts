import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ICartItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
  rentPrice?: number;
  mode: 'buy' | 'rent';
  selectedSize?: string;
  rentalDays: number;
  image: string;
}

export interface ICart extends Document {
  sessionId: string;
  items: ICartItem[];
  createdAt: Date;
  updatedAt: Date;
}

const cartItemSchema = new Schema<ICartItem>({
  productId: { type: String, required: true },
  name: { type: String, required: true },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true },
  rentPrice: Number,
  mode: { type: String, enum: ['buy', 'rent'], required: true },
  selectedSize: String,
  rentalDays: { type: Number, default: 0 },
  image: { type: String, required: true },
});

const cartSchema = new Schema<ICart>(
  {
    sessionId: { type: String, required: true, unique: true },
    items: [cartItemSchema],
  },
  { timestamps: true }
);

export default mongoose.models.Cart || mongoose.model<ICart>('Cart', cartSchema);
