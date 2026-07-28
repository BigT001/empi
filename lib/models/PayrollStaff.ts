import mongoose, { Document, Schema } from "mongoose";

export interface IPayrollStaff extends Document {
  employeeId: string;
  fullName: string;
  email?: string;
  phone?: string;
  jobTitle: string;
  department: string;
  employmentType: "full_time" | "part_time" | "contract";
  payFrequency: "monthly" | "biweekly" | "weekly";
  baseSalary: number;
  defaultAllowance: number;
  defaultDeduction: number;
  defaultOvertime: number;
  defaultAirtime: number;
  defaultBonus: number;
  defaultIncrease: number;
  defaultTax: number;
  defaultOwings: number;
  defaultDismissalPayout: number;
  nextPayDate: Date;
  bankName?: string;
  accountName?: string;
  accountNumber?: string;
  status: "active" | "inactive";
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const payrollStaffSchema = new Schema<IPayrollStaff>(
  {
    employeeId: { type: String, required: true, unique: true, trim: true, uppercase: true },
    fullName: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    jobTitle: { type: String, required: true, trim: true },
    department: { type: String, required: true, trim: true },
    employmentType: {
      type: String,
      enum: ["full_time", "part_time", "contract"],
      default: "full_time",
    },
    payFrequency: {
      type: String,
      enum: ["monthly", "biweekly", "weekly"],
      default: "monthly",
    },
    baseSalary: { type: Number, required: true, min: 0 },
    defaultAllowance: { type: Number, default: 0, min: 0 },
    defaultDeduction: { type: Number, default: 0, min: 0 },
    defaultOvertime: { type: Number, default: 0, min: 0 },
    defaultAirtime: { type: Number, default: 0, min: 0 },
    defaultBonus: { type: Number, default: 0, min: 0 },
    defaultIncrease: { type: Number, default: 0, min: 0 },
    defaultTax: { type: Number, default: 0, min: 0 },
    defaultOwings: { type: Number, default: 0, min: 0 },
    defaultDismissalPayout: { type: Number, default: 0, min: 0 },
    nextPayDate: { type: Date, required: true },
    bankName: { type: String, trim: true },
    accountName: { type: String, trim: true },
    accountNumber: { type: String, trim: true },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    createdBy: { type: Schema.Types.ObjectId, ref: "Admin", required: true },
  },
  { timestamps: true }
);

payrollStaffSchema.index({ status: 1, nextPayDate: 1 });

export default mongoose.models.PayrollStaff ||
  mongoose.model<IPayrollStaff>("PayrollStaff", payrollStaffSchema);
