import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IInvoiceItem {
  id?: string;
  productId?: string;
  name: string;
  quantity: number;
  price: number;
  mode?: 'buy' | 'rent';
}

export interface IInvoice extends Document {
  invoiceNumber: string;
  orderNumber?: string;
  buyerId?: Types.ObjectId;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress?: string;
  customerCity?: string;
  customerState?: string;
  customerPostalCode?: string;
  subtotal: number;
  bulkDiscountPercentage?: number;
  bulkDiscountAmount?: number;
  subtotalAfterDiscount?: number;
  cautionFee?: number;
  subtotalWithCaution?: number;
  shippingCost: number;
  taxAmount: number;
  totalAmount: number;
  items: IInvoiceItem[];
  invoiceDate: Date;
  dueDate?: Date;
  currency: string;
  currencySymbol: string;
  taxRate: number;
  type: 'automatic' | 'manual';
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  createdAt: Date;
  updatedAt: Date;
}

const invoiceItemSchema = new Schema<IInvoiceItem>({
  id: String,
  productId: String,
  name: { type: String, required: true },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true },
  mode: String,
});

const invoiceSchema = new Schema<IInvoice>(
  {
    invoiceNumber: { type: String, required: true, unique: true },
    orderNumber: String,
    buyerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Buyer' },
    customerName: { type: String, required: true },
    customerEmail: { type: String, required: true },
    customerPhone: { type: String, required: true },
    customerAddress: String,
    customerCity: String,
    customerState: String,
    customerPostalCode: String,
    subtotal: { type: Number, required: true },
    bulkDiscountPercentage: { type: Number },
    bulkDiscountAmount: { type: Number },
    subtotalAfterDiscount: { type: Number },
    cautionFee: { type: Number },
    subtotalWithCaution: { type: Number },
    shippingCost: { type: Number, required: true, default: 0 },
    taxAmount: { type: Number, required: true },
    totalAmount: { type: Number, required: true },
    items: [invoiceItemSchema],
    invoiceDate: { type: Date, default: Date.now },
    dueDate: Date,
    currency: { type: String, default: 'NGN' },
    currencySymbol: { type: String, default: '₦' },
    taxRate: { type: Number, default: 7.5 },
    type: { type: String, enum: ['automatic', 'manual'], default: 'automatic' },
    status: { type: String, enum: ['draft', 'sent', 'paid', 'overdue'], default: 'sent' },
  },
  { timestamps: true }
);

invoiceSchema.index({ buyerId: 1 });
invoiceSchema.index({ type: 1 });
invoiceSchema.index({ status: 1 });
invoiceSchema.index({ createdAt: -1 });

export default mongoose.models.Invoice || mongoose.model<IInvoice>('Invoice', invoiceSchema);
