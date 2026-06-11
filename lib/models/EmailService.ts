import mongoose, { Schema, Document } from 'mongoose';

export interface IEmailService extends Document {
  email: string;
  name: string;
  provider: 'simulated' | 'imap_smtp';
  settings?: {
    imapHost?: string;
    imapPort?: number;
    imapSecure?: boolean;
    smtpHost?: string;
    smtpPort?: number;
    smtpSecure?: boolean;
    username?: string;
    password?: string;
  };
  isActive: boolean;
  allowedRoles: string[];  // e.g. ['finance_admin'] or empty for all
  allowedAdmins: mongoose.Types.ObjectId[];  // specific admins
  createdAt: Date;
  updatedAt: Date;
}

const emailServiceSchema = new Schema<IEmailService>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    provider: {
      type: String,
      enum: ['simulated', 'imap_smtp'],
      default: 'simulated',
      required: true,
    },
    settings: {
      type: {
        imapHost: String,
        imapPort: Number,
        imapSecure: Boolean,
        smtpHost: String,
        smtpPort: Number,
        smtpSecure: Boolean,
        username: String,
        password: String,
      },
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    allowedRoles: {
      type: [String],
      default: [], // Empty array = public access for all admin roles
    },
    allowedAdmins: {
      type: [Schema.Types.ObjectId],
      ref: 'Admin',
      default: [], // Empty array = no specific user limitations unless roles are set
    },
  },
  {
    timestamps: true,
    collection: 'email_services',
  }
);

const EmailService =
  mongoose.models?.EmailService ||
  mongoose.model<IEmailService>('EmailService', emailServiceSchema);

export default EmailService;
