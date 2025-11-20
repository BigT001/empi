import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IBuyer extends Document {
  email: string;
  phone: string;
  password: string;
  fullName: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const buyerSchema = new Schema<IBuyer>(
  {
    email: { type: String, required: true, unique: true, lowercase: true },
    phone: { type: String, required: true },
    password: { type: String, required: true },
    fullName: { type: String, required: true },
    address: String,
    city: String,
    state: String,
    postalCode: String,
    lastLogin: Date,
  },
  { timestamps: true }
);

buyerSchema.index({ email: 1 });
buyerSchema.index({ phone: 1 });

// Hash password before saving
buyerSchema.pre('save', async function(next) {
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
buyerSchema.methods.comparePassword = async function(candidatePassword: string) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Don't return password in JSON
buyerSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

export default mongoose.models.Buyer || mongoose.model<IBuyer>('Buyer', buyerSchema);
