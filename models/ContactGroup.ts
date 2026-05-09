import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IContactGroup extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  contacts: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const ContactGroupSchema = new Schema<IContactGroup>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    description: { type: String },
    contacts: [{ type: Schema.Types.ObjectId, ref: 'Contact' }],
  },
  { timestamps: true }
);

// Index for performance and uniqueness per user
ContactGroupSchema.index({ userId: 1, name: 1 });

const ContactGroup: Model<IContactGroup> = mongoose.models.ContactGroup || mongoose.model<IContactGroup>('ContactGroup', ContactGroupSchema);

export default ContactGroup;
