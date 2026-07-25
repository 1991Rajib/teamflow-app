import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPlan extends Document {
  name: string;
  code: 'FREE' | 'PRO';
  price: number;
  currency: string;
  billingInterval: 'MONTHLY' | 'YEARLY' | 'NONE';
  features: string[];
  limits: {
    maxMembers: number; // -1 represents unlimited
    maxProjects: number; // -1 represents unlimited
    maxTasksPerProject: number; // -1 represents unlimited
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PlanSchema = new Schema<IPlan>(
  {
    name: { type: String, required: true, trim: true },
    code: {
      type: String,
      enum: ['FREE', 'PRO'],
      required: true,
      unique: true,
      index: true,
    },
    price: { type: Number, required: true, default: 0 },
    currency: { type: String, required: true, default: 'USD', trim: true },
    billingInterval: {
      type: String,
      enum: ['MONTHLY', 'YEARLY', 'NONE'],
      default: 'NONE',
      required: true,
    },
    features: [{ type: String, trim: true }],
    limits: {
      maxMembers: { type: Number, required: true, default: 3 },
      maxProjects: { type: Number, required: true, default: 2 },
      maxTasksPerProject: { type: Number, required: true, default: 10 },
    },
    isActive: { type: Boolean, default: true, required: true },
  },
  { timestamps: true }
);

const Plan: Model<IPlan> = mongoose.models.Plan || mongoose.model<IPlan>('Plan', PlanSchema);
export default Plan;
