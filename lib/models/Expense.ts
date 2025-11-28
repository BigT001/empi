import mongoose, { Schema, Document } from 'mongoose';

export interface IExpense extends Document {
  description: string;
  category: 'supplies' | 'inventory' | 'utilities' | 'rent' | 'equipment' | 'services' | 'delivery' | 'other' | 'supplier' | 'transport' | 'packaging' | 'office-supplies' | 'office_supplies';
  amount: number;           // Amount before VAT
  vat: number;             // VAT amount (7.5% of amount if applicable)
  vatRate: number;         // VAT rate (7.5%)
  isVATApplicable: boolean; // Whether this expense is subject to VAT
  total?: number;          // amount + vat
  invoiceNumber?: string;
  receiptNumber?: string;
  supplierName?: string;
  vendorName?: string;
  paymentMethod?: string;
  status: 'paid' | 'pending' | 'verified';
  notes?: string;
  isOffline?: boolean;     // Track if this is an offline expense
  date?: Date;             // Date of expense (for offline tracking)
  createdAt: Date;
  updatedAt: Date;
}

const expenseSchema = new Schema<IExpense>(
  {
    description: { type: String, required: true },
    category: {
      type: String,
      enum: ['supplies', 'inventory', 'utilities', 'rent', 'equipment', 'services', 'delivery', 'other', 'supplier', 'transport', 'packaging', 'office-supplies', 'office_supplies'],
      required: true,
    },
    amount: { type: Number, required: true },
    vat: { type: Number, required: true },     // Input VAT (deductible)
    vatRate: { type: Number, default: 7.5 },
    isVATApplicable: { type: Boolean, default: true }, // Whether VAT applies to this expense
    total: { type: Number, default: null },   // amount + vat (optional, can be calculated)
    invoiceNumber: String,
    receiptNumber: String,
    supplierName: String,
    vendorName: String,
    paymentMethod: {
      type: String,
      enum: ['cash', 'bank_transfer', 'cheque', 'card', null],
      default: 'cash',
    },
    status: {
      type: String,
      enum: ['paid', 'pending', 'verified'],
      default: 'verified', // Offline expenses are auto-verified
    },
    notes: String,
    isOffline: {
      type: Boolean,
      default: false,
      index: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Index for date-based queries
expenseSchema.index({ createdAt: 1 });
expenseSchema.index({ date: 1 });
// Index for status queries
expenseSchema.index({ status: 1 });
// Index for category queries
expenseSchema.index({ category: 1 });
// Index for offline expenses
expenseSchema.index({ isOffline: 1 });

export default mongoose.models.Expense || mongoose.model<IExpense>('Expense', expenseSchema);
