import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IAdmin extends Document {
  email: string;
  password: string;
  fullName: string;
  role: 'super_admin' | 'admin';
  permissions: string[];
  isActive: boolean;
  lastLogin?: Date;
  sessionToken?: string;    // Secure session token
  sessionExpiry?: Date;     // Session expiration time
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const adminSchema = new Schema<IAdmin>(
  {
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    fullName: { type: String, required: true },
    role: { type: String, enum: ['super_admin', 'admin'], default: 'admin' },
    permissions: {
      type: [String],
      default: ['view_dashboard', 'view_products', 'view_orders', 'view_finance', 'view_invoices', 'view_settings'],
    },
    isActive: { type: Boolean, default: true },
    lastLogin: Date,
    sessionToken: { type: String, default: null },   // Secure session token
    sessionExpiry: { type: Date, default: null },    // When session expires
  },
  { timestamps: true }
);

// Hash password before saving
adminSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err: any) {
    next(err);
  }
});

// Method to compare passwords
adminSchema.methods.comparePassword = async function(candidatePassword: string) {
  return await bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.models.Admin || mongoose.model<IAdmin>('Admin', adminSchema);
