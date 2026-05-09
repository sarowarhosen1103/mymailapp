import mongoose, { Schema, Document } from 'mongoose';

export interface ITemplate extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  subject: string;
  content: string;
  category: string;
  status: string;
  attachmentPath?: string;
  attachmentName?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TemplateSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    subject: { type: String, required: true },
    content: { type: String, required: true },
    category: { type: String, default: 'Marketing' },
    status: { type: String, enum: ['Active', 'Draft'], default: 'Draft' },
    attachmentPath: { type: String },
    attachmentName: { type: String },
  },
  { timestamps: true }
);

export default mongoose.models.Template || mongoose.model<ITemplate>('Template', TemplateSchema);
