import mongoose, { Schema, Document } from 'mongoose';

export interface IVATHistory extends Document {
  month: number; // 0-11
  year: number;
  startDate: Date;
  endDate: Date; // 21st of the month
  currentMonthVAT: number;
  totalOutputVAT: number;
  totalInputVAT: number;
  vatPayable: number;
  annualVATTotal: number;
  vatRate: number; // 7.5%
  totalSalesAmount: number;
  deductibleExpensesAmount: number;
  status: 'active' | 'submitted' | 'paid' | 'archived';
  submittedAt?: Date;
  paidAt?: Date;
  archivedAt?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const VATHistorySchema = new Schema<IVATHistory>(
  {
    month: {
      type: Number,
      required: true,
      min: 0,
      max: 11,
    },
    year: {
      type: Number,
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    currentMonthVAT: {
      type: Number,
      required: true,
      default: 0,
    },
    totalOutputVAT: {
      type: Number,
      required: true,
      default: 0,
    },
    totalInputVAT: {
      type: Number,
      required: true,
      default: 0,
    },
    vatPayable: {
      type: Number,
      required: true,
      default: 0,
    },
    annualVATTotal: {
      type: Number,
      required: true,
      default: 0,
    },
    vatRate: {
      type: Number,
      required: true,
      default: 7.5,
    },
    totalSalesAmount: {
      type: Number,
      required: true,
      default: 0,
    },
    deductibleExpensesAmount: {
      type: Number,
      required: true,
      default: 0,
    },
    status: {
      type: String,
      enum: ['active', 'submitted', 'paid', 'archived'],
      default: 'active',
    },
    submittedAt: {
      type: Date,
    },
    paidAt: {
      type: Date,
    },
    archivedAt: {
      type: Date,
    },
    notes: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient querying
VATHistorySchema.index({ month: 1, year: 1 }, { unique: true });
VATHistorySchema.index({ status: 1 });
VATHistorySchema.index({ year: 1 });

export default mongoose.models.VATHistory ||
  mongoose.model<IVATHistory>('VATHistory', VATHistorySchema);
