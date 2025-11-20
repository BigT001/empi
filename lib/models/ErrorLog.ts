import mongoose, { Schema, Document } from 'mongoose';

export interface IErrorLog extends Document {
  type: string;
  message: string;
  stack?: string;
  context?: string;
  userAgent?: string;
  url?: string;
  timestamp: Date;
}

const errorLogSchema = new Schema<IErrorLog>(
  {
    type: { type: String, required: true },
    message: { type: String, required: true },
    stack: String,
    context: { type: String, default: null },
    userAgent: String,
    url: String,
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

errorLogSchema.index({ type: 1 });
errorLogSchema.index({ timestamp: 1 });

export default mongoose.models.ErrorLog || mongoose.model<IErrorLog>('ErrorLog', errorLogSchema);
