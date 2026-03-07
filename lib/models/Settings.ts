import mongoose, { Schema, Document } from 'mongoose';

export interface IBankAccount {
  _id?: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  bankCode?: string;
  sortCode?: string;
  instructions?: string;
  isActive: boolean;
}

export interface ISettings extends Document {
  // Legacy single bank support (kept for backwards compatibility)
  bankAccountName?: string;
  bankAccountNumber?: string;
  bankName?: string;
  bankCode?: string;
  transferInstructions?: string;

  // Multi-bank support
  bankAccounts?: IBankAccount[];

  // Payment Visibility Settings
  paymentMethods?: {
    manual: boolean;
    paystack: boolean;
  };

  updatedAt: Date;
  createdAt: Date;
}

const bankAccountSchema = new Schema<IBankAccount>(
  {
    bankName: { type: String, required: true },
    accountName: { type: String, required: true },
    accountNumber: { type: String, required: true },
    bankCode: { type: String, required: false },
    sortCode: String,
    instructions: String,
    isActive: { type: Boolean, default: false },
  },
  { _id: true }
);

const settingsSchema = new Schema<ISettings>(
  {
    // Legacy single bank support
    bankAccountName: String,
    bankAccountNumber: String,
    bankName: String,
    bankCode: { type: String, required: false },
    transferInstructions: String,

    // Multi-bank support
    bankAccounts: [bankAccountSchema],

    // Payment Visibility Settings
    paymentMethods: {
      manual: { type: Boolean, default: true },
      paystack: { type: Boolean, default: true }
    },
  },
  { timestamps: true }
);

if (mongoose.models.Settings) {
  delete mongoose.models.Settings;
}

export default mongoose.model<ISettings>('Settings', settingsSchema);
