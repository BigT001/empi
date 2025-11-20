import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IInvoiceItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
  mode: 'buy' | 'rent';
}

export interface IInvoice extends Document {
  invoiceNumber: string;
  orderNumber: string;
  buyerId?: Types.ObjectId;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress?: string;
  customerCity?: string;
  customerState?: string;
  customerPostalCode?: string;
  subtotal: number;
  shippingCost: number;
  taxAmount: number;
  totalAmount: number;
  items: IInvoiceItem[];
  invoiceDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

const invoiceItemSchema = new Schema<IInvoiceItem>({
  productId: { type: String, required: true },
  name: { type: String, required: true },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true },
  mode: { type: String, enum: ['buy', 'rent'], required: true },
});

const invoiceSchema = new Schema<IInvoice>(
  {
    invoiceNumber: { type: String, required: true, unique: true },
    orderNumber: { type: String, required: true, unique: true },
    buyerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Buyer' },
    customerName: { type: String, required: true },
    customerEmail: { type: String, required: true },
    customerPhone: { type: String, required: true },
    customerAddress: String,
    customerCity: String,
    customerState: String,
    customerPostalCode: String,
    subtotal: { type: Number, required: true },
    shippingCost: { type: Number, required: true },
    taxAmount: { type: Number, required: true },
    totalAmount: { type: Number, required: true },
    items: [invoiceItemSchema],
    invoiceDate: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

invoiceSchema.index({ buyerId: 1 });
invoiceSchema.index({ invoiceNumber: 1 });

export default mongoose.models.Invoice || mongoose.model<IInvoice>('Invoice', invoiceSchema);
