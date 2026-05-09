import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IContact extends Document {
  userId: mongoose.Types.ObjectId;
  email: string;
  firstName?: string;
  lastName?: string;
  companyName?: string;
  ceoName?: string;
  companyEmail?: string;
  companyNumber?: string;
  website?: string;
  status: 'subscribed' | 'unsubscribed' | 'bounced';
  createdAt: Date;
  updatedAt: Date;
}

const ContactSchema = new Schema<IContact>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    firstName: {
      type: String,
      trim: true,
    },
    lastName: {
      type: String,
      trim: true,
    },
    companyName: {
      type: String,
      trim: true,
    },
    ceoName: {
      type: String,
      trim: true,
    },
    companyEmail: {
      type: String,
      lowercase: true,
      trim: true,
    },
    companyNumber: {
      type: String,
      trim: true,
    },
    website: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['subscribed', 'unsubscribed', 'bounced'],
      default: 'subscribed',
    },
  },
  {
    timestamps: true,
  }
);

// Ensure an email is unique per user
ContactSchema.index({ userId: 1, email: 1 }, { unique: true });

const Contact: Model<IContact> = mongoose.models.Contact || mongoose.model<IContact>('Contact', ContactSchema);

export default Contact;
