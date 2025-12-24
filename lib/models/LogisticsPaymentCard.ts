import mongoose, { Schema, Document } from 'mongoose';

export interface ILogisticsPaymentCard extends Document {
  bankName: string;
  accountNumber: string;
  accountHolderName: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const logisticsPaymentCardSchema = new Schema<ILogisticsPaymentCard>(
  {
    bankName: {
      type: String,
      required: true,
      trim: true,
    },
    accountNumber: {
      type: String,
      required: true,
      trim: true,
    },
    accountHolderName: {
      type: String,
      required: true,
      trim: true,
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const LogisticsPaymentCard =
  mongoose.models.LogisticsPaymentCard ||
  mongoose.model<ILogisticsPaymentCard>('LogisticsPaymentCard', logisticsPaymentCardSchema);

export default LogisticsPaymentCard;
