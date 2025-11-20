import mongoose, { Schema, Document } from 'mongoose';

export interface IProduct extends Document {
  name: string;
  description: string;
  sellPrice: number;
  rentPrice: number;
  category: string;
  badge?: string;
  imageUrl: string;
  imageUrls: string[];
  sizes?: string;
  color?: string;
  material?: string;
  condition?: string;
  careInstructions?: string;
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
    badge: String,
    imageUrl: { type: String, required: true },
    imageUrls: [String],
    sizes: String,
    color: String,
    material: String,
    condition: String,
    careInstructions: String,
  },
  { timestamps: true }
);

productSchema.index({ category: 1 });

export default mongoose.models.Product || mongoose.model<IProduct>('Product', productSchema);
