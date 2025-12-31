import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
  type: 'order_approved' | 'order_completed' | 'order_rejected' | 'payment_received' | 'chat_message';
  target: 'admin' | 'buyer'; // Who receives the notification
  targetId?: mongoose.Types.ObjectId; // Admin ID or Buyer ID
  title: string;
  message: string;
  orderId?: mongoose.Types.ObjectId;
  orderNumber?: string;
  read: boolean;
  soundEnabled: boolean;
  smsEnabled: boolean;
  smsSent?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    type: {
      type: String,
      enum: ['order_approved', 'order_completed', 'order_rejected', 'payment_received', 'chat_message'],
      required: true,
      index: true,
    },
    target: {
      type: String,
      enum: ['admin', 'buyer'],
      required: true,
      index: true,
    },
    targetId: {
      type: Schema.Types.ObjectId,
      index: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    orderId: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      index: true,
    },
    orderNumber: {
      type: String,
      index: true,
    },
    read: {
      type: Boolean,
      default: false,
      index: true,
    },
    soundEnabled: {
      type: Boolean,
      default: true,
    },
    smsEnabled: {
      type: Boolean,
      default: false,
    },
    smsSent: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export default mongoose.models.Notification ||
  mongoose.model<INotification>('Notification', notificationSchema);
