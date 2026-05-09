import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICampaign extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  templateId: mongoose.Types.ObjectId;
  groupId: mongoose.Types.ObjectId;
  status: 'Draft' | 'Sending' | 'Completed' | 'Paused';
  totalContacts: number;
  sentCount: number;
  failedCount: number;
  attachmentPath?: string;
  attachmentName?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CampaignSchema = new Schema<ICampaign>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    templateId: { type: Schema.Types.ObjectId, ref: 'Template', required: true },
    groupId: { type: Schema.Types.ObjectId, ref: 'ContactGroup', required: true },
    status: { 
      type: String, 
      enum: ['Draft', 'Sending', 'Completed', 'Paused'], 
      default: 'Draft' 
    },
    totalContacts: { type: Number, default: 0 },
    sentCount: { type: Number, default: 0 },
    failedCount: { type: Number, default: 0 },
    attachmentPath: { type: String },
    attachmentName: { type: String },
  },
  { timestamps: true }
);

const Campaign: Model<ICampaign> = mongoose.models.Campaign || mongoose.model<ICampaign>('Campaign', CampaignSchema);

export default Campaign;
