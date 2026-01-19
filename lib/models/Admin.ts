import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IAdminSession {
  token: string;
  createdAt: Date;
  lastActivity: Date;
  expiresAt: Date;
}

export interface IAdmin extends Document {
  email: string;
  password: string;
  fullName: string;
  role: 'super_admin' | 'admin' | 'finance_admin' | 'logistics_admin';
  permissions: string[];
  isActive: boolean;
  department?: 'general' | 'finance' | 'logistics';
  lastLogin?: Date;
  lastLogout?: Date;
  sessions: IAdminSession[];  // Multiple concurrent sessions
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const adminSchema = new Schema<IAdmin>(
  {
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    fullName: { type: String, required: true },
    role: { 
      type: String, 
      enum: ['super_admin', 'admin', 'finance_admin', 'logistics_admin'], 
      default: 'admin',
      required: true,
    },
    permissions: {
      type: [String],
      default: ['view_dashboard', 'view_products', 'view_orders', 'view_finance', 'view_invoices', 'view_settings'],
    },
    isActive: { type: Boolean, default: true },
    department: { 
      type: String, 
      enum: ['general', 'finance', 'logistics'], 
      default: 'general' 
    },
    lastLogin: Date,
    lastLogout: Date,
    sessions: [{
      token: { type: String, required: true },
      createdAt: { type: Date, default: Date.now },
      lastActivity: { type: Date, default: Date.now },
      expiresAt: { type: Date, required: true },
    }],
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

// Ensure the model is properly defined with the correct schema
// Use type assertion to safely access mongoose.models
const Admin = (mongoose.models?.Admin as any) || mongoose.model<IAdmin>('Admin', adminSchema);

export default Admin;
