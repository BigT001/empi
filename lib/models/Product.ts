import mongoose, { Schema, Document } from 'mongoose';

export interface IProduct extends Document {
  name: string;
  description: string;
  sellPrice: number;
  rentPrice: number;
  category: string;
  costumeType?: string; // Sub-category: Angel, Carnival, Superhero, Traditional, Cosplay, etc.
  badge?: string;
  imageUrl: string;
  imageUrls: string[];
  sizes?: string;
  color?: string;
  material?: string;
  condition?: string;
  careInstructions?: string;
  // Availability flags
  availableForBuy?: boolean; // Can be purchased
  availableForRent?: boolean; // Can be rented
  // Delivery metadata
  deliverySize?: 'SMALL' | 'MEDIUM' | 'LARGE';
  weight?: number; // in kg
  fragile?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    sellPrice: { type: Number, required: true },
    rentPrice: { type: Number, default: 0 },
    category: { type: String, required: true },
    costumeType: { 
      type: String, 
      enum: ['Angel', 'Carnival', 'Superhero', 'Traditional', 'Cosplay', 'Other'],
      default: 'Other'
    },
    badge: String,
    imageUrl: { type: String, required: true },
    imageUrls: [String],
    sizes: String,
    color: String,
    material: String,
    condition: String,
    careInstructions: String,
    // Availability flags
    availableForBuy: { type: Boolean, default: true },
    availableForRent: { type: Boolean, default: true },
    // Delivery metadata
    deliverySize: { type: String, enum: ['SMALL', 'MEDIUM', 'LARGE'], default: 'MEDIUM' },
    weight: { type: Number, default: 0.5 }, // in kg
    fragile: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Indexes for faster queries
productSchema.index({ category: 1 });
productSchema.index({ costumeType: 1 });
productSchema.index({ category: 1, costumeType: 1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ name: 'text' }); // text search index

export default mongoose.models.Product || mongoose.model<IProduct>('Product', productSchema);
