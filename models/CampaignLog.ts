import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICampaignLog extends Document {
  campaignId: mongoose.Types.ObjectId;
  contactId: mongoose.Types.ObjectId;
  status: 'Pending' | 'Sent' | 'Failed';
  errorMessage?: string;
  opened: boolean;
  openCount: number;
  opens: {
    timestamp: Date;
    ip?: string;
    country?: string;
    userAgent?: string;
    acceptLanguage?: string;
    isProxy?: boolean;
    proxyType?: string;
  }[];
  clicked: boolean;
  clickCount: number;
  clicks: {
    timestamp: Date;
    ip?: string;
    country?: string;
    userAgent?: string;
    url?: string;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const CampaignLogSchema = new Schema<ICampaignLog>(
  {
    campaignId: { type: Schema.Types.ObjectId, ref: 'Campaign', required: true },
    contactId: { type: Schema.Types.ObjectId, ref: 'Contact', required: true },
    status: { 
      type: String, 
      enum: ['Pending', 'Sent', 'Failed'], 
      default: 'Pending' 
    },
    errorMessage: { type: String },
    opened: { type: Boolean, default: false },
    openCount: { type: Number, default: 0 },
    opens: [{
      timestamp: { type: Date, default: Date.now },
      ip: { type: String },
      country: { type: String },
      userAgent: { type: String },
      acceptLanguage: { type: String },
      isProxy: { type: Boolean, default: false },
      proxyType: { type: String }
    }],
    clicked: { type: Boolean, default: false },
    clickCount: { type: Number, default: 0 },
    clicks: [{
      timestamp: { type: Date, default: Date.now },
      ip: { type: String },
      country: { type: String },
      userAgent: { type: String },
      url: { type: String }
    }]
  },
  { timestamps: true }
);

// Index to quickly find logs by campaign and status
CampaignLogSchema.index({ campaignId: 1, status: 1 });

const CampaignLog: Model<ICampaignLog> = mongoose.models.CampaignLog || mongoose.model<ICampaignLog>('CampaignLog', CampaignLogSchema);

export default CampaignLog;
