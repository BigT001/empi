import mongoose, { Schema, Document } from 'mongoose';

export interface IDailyExpense extends Document {
  description: string;
  category: string; // 'supplies', 'utilities', 'rent', 'salaries', 'shipping', 'marketing', 'maintenance', 'other'
  vendorName: string;
  amount: number; // Expense amount
  vat: number; // VAT amount (if applicable)
  isVATApplicable: boolean; // Whether VAT applies to this expense
  status: string; // 'pending', 'approved', 'rejected'
  date: Date; // Date of expense
  receiptNumber?: string; // Receipt/invoice number
  notes?: string; // Additional notes
  createdAt: Date;
  updatedAt: Date;
}

const dailyExpenseSchema = new Schema<IDailyExpense>(
  {
    description: { type: String, required: true },
    category: {
      type: String,
      enum: ['supplies', 'utilities', 'rent', 'salaries', 'shipping', 'marketing', 'maintenance', 'other'],
      required: true,
    },
    vendorName: { type: String, required: true },
    amount: { type: Number, required: true, min: 0 },
    vat: { type: Number, default: 0, min: 0 },
    isVATApplicable: { type: Boolean, default: false },
    status: { 
      type: String, 
      enum: ['pending', 'approved', 'rejected'], 
      default: 'pending' 
    },
    date: { type: Date, default: Date.now },
    receiptNumber: String,
    notes: String,
  },
  { timestamps: true }
);

// Index for common queries
dailyExpenseSchema.index({ date: -1 });
dailyExpenseSchema.index({ category: 1 });
dailyExpenseSchema.index({ status: 1 });

export default mongoose.models.DailyExpense || mongoose.model<IDailyExpense>('DailyExpense', dailyExpenseSchema);
