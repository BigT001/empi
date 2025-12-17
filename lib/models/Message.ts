import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IMessage extends Document {
  orderId: Types.ObjectId;
  orderNumber: string;
  senderEmail: string;
  senderName: string;
  senderType: 'admin' | 'customer' | 'system';
  content: string;
  isFinalPrice?: boolean;
  quotedPrice?: number;
  quotedDeliveryDate?: Date; // Admin's proposed production ready date
  quotedVAT?: number;
  quotedTotal?: number;
  discountPercentage?: number;
  discountAmount?: number;
  messageType: 'text' | 'quote' | 'negotiation' | 'system' | 'quantity-update';
  quantityChangeData?: {
    oldQty: number;
    newQty: number;
    unitPrice: number;
    newTotal: number;
  };
  recipientType?: 'admin' | 'buyer' | 'all'; // Who should see this message (admin-only, buyer-only, or both)
  isRead: boolean;
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema<IMessage>(
  {
    orderId: {
      type: Schema.Types.ObjectId,
      ref: 'CustomOrder',
      required: true,
      index: true,
    },
    orderNumber: {
      type: String,
      required: true,
      index: true,
    },
    senderEmail: {
      type: String,
      required: true,
      index: true,
    },
    senderName: {
      type: String,
      required: true,
    },
    senderType: {
      type: String,
      enum: ['admin', 'customer', 'system'],
      required: true,
      index: true,
    },
    content: {
      type: String,
      required: true,
    },
    isFinalPrice: {
      type: Boolean,
      default: false,
    },
    quotedPrice: {
      type: Number,
      default: null,
    },
    quotedDeliveryDate: {
      type: Date,
      default: null,
    },
    quotedVAT: {
      type: Number,
      default: null,
    },
    quotedTotal: {
      type: Number,
      default: null,
    },
    discountPercentage: {
      type: Number,
      default: 0,
    },
    discountAmount: {
      type: Number,
      default: 0,
    },
    messageType: {
      type: String,
      enum: ['text', 'quote', 'negotiation', 'system', 'quantity-update'],
      default: 'text',
      index: true,
    },
    quantityChangeData: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    recipientType: {
      type: String,
      enum: ['admin', 'buyer', 'all'],
      default: 'all',
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: 'messages',
  }
);

// Prevent model override on hot reload
const Message =
  mongoose.models?.Message ||
  mongoose.model<IMessage>('Message', messageSchema);

export default Message;
