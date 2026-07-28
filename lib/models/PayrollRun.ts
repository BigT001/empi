import mongoose, { Document, Schema } from "mongoose";

export interface IPayrollRun extends Document {
  staff: mongoose.Types.ObjectId;
  employeeId: string;
  staffName: string;
  jobTitle: string;
  periodLabel: string;
  scheduledDate: Date;
  baseSalary: number;
  overtime: number;
  airtime: number;
  bonus: number;
  increase: number;
  tax: number;
  owings: number;
  dismissalPayout: number;
  netPay: number;
  status: "pending" | "paid" | "cancelled";
  paymentMethod?: string;
  paymentReference?: string;
  notes?: string;
  paidAt?: Date;
  createdBy: mongoose.Types.ObjectId;
  paidBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const payrollRunSchema = new Schema<IPayrollRun>(
  {
    staff: { type: Schema.Types.ObjectId, ref: "PayrollStaff", required: true, index: true },
    employeeId: { type: String, required: true },
    staffName: { type: String, required: true },
    jobTitle: { type: String, required: true },
    periodLabel: { type: String, required: true, trim: true },
    scheduledDate: { type: Date, required: true },
    baseSalary: { type: Number, required: true, min: 0 },
    overtime: { type: Number, default: 0, min: 0 },
    airtime: { type: Number, default: 0, min: 0 },
    bonus: { type: Number, default: 0, min: 0 },
    increase: { type: Number, default: 0, min: 0 },
    tax: { type: Number, default: 0, min: 0 },
    owings: { type: Number, default: 0, min: 0 },
    dismissalPayout: { type: Number, default: 0, min: 0 },
    netPay: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ["pending", "paid", "cancelled"], default: "pending" },
    paymentMethod: { type: String, trim: true },
    paymentReference: { type: String, trim: true },
    notes: { type: String, trim: true, maxlength: 1000 },
    paidAt: Date,
    createdBy: { type: Schema.Types.ObjectId, ref: "Admin", required: true },
    paidBy: { type: Schema.Types.ObjectId, ref: "Admin" },
  },
  { timestamps: true }
);

payrollRunSchema.index({ staff: 1, periodLabel: 1 }, { unique: true });
payrollRunSchema.index({ status: 1, scheduledDate: -1 });

export default mongoose.models.PayrollRun ||
  mongoose.model<IPayrollRun>("PayrollRun", payrollRunSchema);
