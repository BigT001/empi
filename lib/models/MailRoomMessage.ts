import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IMailRoomMessage extends Document {
  ticketId: Types.ObjectId;
  direction: 'inbound' | 'outbound';
  senderEmail: string;
  senderName: string;
  recipientEmail: string;
  content: string; // The HTML or plaintext email body
  externalMessageId?: string; // For tracking Resend or other provider message IDs
  createdAt: Date;
  updatedAt: Date;
}

const mailRoomMessageSchema = new Schema<IMailRoomMessage>(
  {
    ticketId: {
      type: Schema.Types.ObjectId,
      ref: 'MailRoomTicket',
      required: true,
      index: true,
    },
    direction: {
      type: String,
      enum: ['inbound', 'outbound'],
      required: true,
      index: true,
    },
    senderEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    senderName: {
      type: String,
      required: true,
      trim: true,
    },
    recipientEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
    },
    externalMessageId: {
      type: String,
      sparse: true,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: 'mail_room_messages',
  }
);

const MailRoomMessage =
  mongoose.models?.MailRoomMessage ||
  mongoose.model<IMailRoomMessage>('MailRoomMessage', mailRoomMessageSchema);

export default MailRoomMessage;
