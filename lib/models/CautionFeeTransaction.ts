import mongoose, { Document, Schema } from 'mongoose';

export interface ICautionFeeTimeline {
  collectedAt: Date;
  returnedAt?: Date;
  refundedAt?: Date;
  refundProcessedAt?: Date;
}

export interface ICautionFeeTransaction extends Document {
  rentalOrderId: mongoose.Types.ObjectId;
  buyerId?: mongoose.Types.ObjectId;
  buyerEmail?: string;
  buyerName?: string;
  amount: number;
  status: 'collected' | 'pending_return' | 'refunded' | 'partially_refunded' | 'forfeited';
  costumeCondition?: 'good' | 'damaged' | 'lost';
  deductionAmount?: number;
  deductionReason?: string;
  refundAmount?: number;
  notes?: string;
  timeline: ICautionFeeTimeline;
  createdAt: Date;
  updatedAt: Date;
}

const CautionFeeTransactionSchema = new Schema<ICautionFeeTransaction>(
  {
    rentalOrderId: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      index: true,
    },
    buyerId: {
      type: Schema.Types.ObjectId,
      ref: 'Buyer',
      index: true,
    },
    buyerEmail: String,
    buyerName: String,
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ['collected', 'pending_return', 'refunded', 'partially_refunded', 'forfeited'],
      default: 'collected',
      index: true,
    },
    costumeCondition: {
      type: String,
      enum: ['good', 'damaged', 'lost'],
    },
    deductionAmount: {
      type: Number,
      min: 0,
    },
    deductionReason: String,
    refundAmount: {
      type: Number,
      min: 0,
    },
    notes: String,
    timeline: {
      collectedAt: {
        type: Date,
        required: true,
        default: Date.now,
      },
      returnedAt: Date,
      refundedAt: Date,
      refundProcessedAt: Date,
    },
  },
  { timestamps: true }
);

// Index for querying by buyer and status
CautionFeeTransactionSchema.index({ buyerId: 1, status: 1 });
CautionFeeTransactionSchema.index({ buyerEmail: 1, status: 1 });
CautionFeeTransactionSchema.index({ rentalOrderId: 1 });
CautionFeeTransactionSchema.index({ status: 1 });
CautionFeeTransactionSchema.index({ createdAt: -1 });

const CautionFeeTransaction =
  mongoose.models.CautionFeeTransaction ||
  mongoose.model<ICautionFeeTransaction>('CautionFeeTransaction', CautionFeeTransactionSchema);

export default CautionFeeTransaction;
