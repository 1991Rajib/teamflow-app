import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ITenant extends Document {
  name: string;
  slug: string;
  ownerId: mongoose.Types.ObjectId;
  isActive: boolean;
  logo?: string;
  description?: string;
  companyName?: string;
  website?: string;
  industry?: string;
  companySize?: string;
  contactEmail?: string;
  timezone: string;
  dateFormat: string;
  status: 'ACTIVE' | 'ARCHIVED' | 'SUSPENDED';
  createdAt: Date;
  updatedAt: Date;
}

const TenantSchema = new Schema<ITenant>(
  {
    name: { type: String, required: true, trim: true },
    slug: {
      type: String,
      required: true,
      unique: true,
      index: true,
      lowercase: true,
      trim: true,
    },
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    isActive: { type: Boolean, default: true, required: true },
    logo: { type: String, trim: true, default: '' },
    description: { type: String, trim: true, default: '' },
    companyName: { type: String, trim: true, default: '' },
    website: { type: String, trim: true, default: '' },
    industry: { type: String, trim: true, default: '' },
    companySize: { type: String, trim: true, default: '' },
    contactEmail: { type: String, trim: true, default: '' },
    timezone: { type: String, trim: true, default: 'UTC', required: true },
    dateFormat: { type: String, trim: true, default: 'MM/DD/YYYY', required: true },
    status: {
      type: String,
      enum: ['ACTIVE', 'ARCHIVED', 'SUSPENDED'],
      default: 'ACTIVE',
      required: true,
    },
  },
  { timestamps: true }
);

const Tenant: Model<ITenant> = mongoose.models.Tenant || mongoose.model<ITenant>('Tenant', TenantSchema);
export default Tenant;
