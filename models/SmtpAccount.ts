import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ISmtpAccount extends Document {
  userId: Types.ObjectId;
  host: string;
  port: number;
  email: string;
  password?: string; // App Password
  secure: boolean;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SmtpAccountSchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    host: {
      type: String,
      required: true,
    },
    port: {
      type: Number,
      required: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    secure: {
      type: Boolean,
      default: false,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export default mongoose.models.SmtpAccount || mongoose.model<ISmtpAccount>('SmtpAccount', SmtpAccountSchema);
