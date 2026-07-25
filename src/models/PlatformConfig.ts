import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPlatformConfig extends Document {
  key: string;
  value: any;
  createdAt: Date;
  updatedAt: Date;
}

const PlatformConfigSchema = new Schema<IPlatformConfig>(
  {
    key: { type: String, required: true, unique: true, index: true },
    value: { type: Schema.Types.Mixed, required: true },
  },
  { timestamps: true }
);

const PlatformConfig: Model<IPlatformConfig> =
  mongoose.models.PlatformConfig || mongoose.model<IPlatformConfig>('PlatformConfig', PlatformConfigSchema);

export default PlatformConfig;
