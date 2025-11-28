import mongoose, { Schema, Document } from 'mongoose';

export interface IExpense extends Document {
  description: string;
  category: 'supplier' | 'utilities' | 'rent' | 'transport' | 'packaging' | 'other';
  amount: number;           // Amount before VAT
  vat: number;             // VAT amount (7.5% of amount)
  vatRate: number;         // VAT rate (7.5%)
  total: number;           // amount + vat
  invoiceNumber?: string;
  supplierName?: string;
  paymentMethod: string;
  status: 'paid' | 'pending' | 'verified';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const expenseSchema = new Schema<IExpense>(
  {
    description: { type: String, required: true },
    category: {
      type: String,
      enum: ['supplier', 'utilities', 'rent', 'transport', 'packaging', 'other'],
      required: true,
    },
    amount: { type: Number, required: true },
    vat: { type: Number, required: true },     // Input VAT (deductible)
    vatRate: { type: Number, default: 7.5 },
    total: { type: Number, required: true },   // amount + vat
    invoiceNumber: String,
    supplierName: String,
    paymentMethod: {
      type: String,
      enum: ['cash', 'bank_transfer', 'cheque', 'card'],
      required: true,
    },
    status: {
      type: String,
      enum: ['paid', 'pending', 'verified'],
      default: 'pending',
    },
    notes: String,
  },
  { timestamps: true }
);

// Index for date-based queries
expenseSchema.index({ createdAt: 1 });
// Index for status queries
expenseSchema.index({ status: 1 });
// Index for category queries
expenseSchema.index({ category: 1 });

export default mongoose.models.Expense || mongoose.model<IExpense>('Expense', expenseSchema);
