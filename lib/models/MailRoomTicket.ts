import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IMailRoomTicket extends Document {
  ticketNumber: string;
  subject: string;
  customerName: string;
  customerEmail: string;
  status: 'open' | 'pending' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  department: string; // References EmailService email
  assignedTo: Types.ObjectId | null; // References Admin
  lastMessageAt: Date;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

const mailRoomTicketSchema = new Schema<IMailRoomTicket>(
  {
    ticketNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    customerName: {
      type: String,
      default: '',
      trim: true,
    },
    customerEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['open', 'pending', 'resolved', 'closed'],
      default: 'open',
      index: true,
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
      index: true,
    },
    department: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: 'Admin',
      default: null,
      index: true,
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    tags: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
    collection: 'mail_room_tickets',
  }
);

const MailRoomTicket =
  mongoose.models?.MailRoomTicket ||
  mongoose.model<IMailRoomTicket>('MailRoomTicket', mailRoomTicketSchema);

export default MailRoomTicket;
