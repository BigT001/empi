import mongoose, { Schema, Document } from 'mongoose';

export interface IBankAccount {
  _id?: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  bankCode: string;
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
  
  // New multi-bank support
  bankAccounts?: IBankAccount[];
  
  updatedAt: Date;
  createdAt: Date;
}

const bankAccountSchema = new Schema<IBankAccount>(
  {
    bankName: { type: String, required: true },
    accountName: { type: String, required: true },
    accountNumber: { type: String, required: true },
    bankCode: { type: String, required: true },
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
    bankCode: String,
    transferInstructions: String,
    
    // New multi-bank support
    bankAccounts: [bankAccountSchema],
  },
  { timestamps: true }
);

export default mongoose.models.Settings || mongoose.model<ISettings>('Settings', settingsSchema);
