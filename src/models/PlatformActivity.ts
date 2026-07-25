import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPlatformActivity extends Document {
  activityType:
    | 'WORKSPACE_SUSPENDED'
    | 'WORKSPACE_REACTIVATED'
    | 'WORKSPACE_DELETED'
    | 'USER_SUSPENDED'
    | 'USER_REACTIVATED'
    | 'ADMIN_PROMOTED'
    | 'ADMIN_DEMOTED'
    | 'WORKSPACE_CREATED'
    | 'USER_REGISTERED'
    | 'SUBSCRIPTION_UPGRADED'
    | 'SUBSCRIPTION_DOWNGRADED'
    | 'SUBSCRIPTION_CANCELED';
  description: string;
  adminUserId?: string; // Admin who performed the action
  targetTenantId?: string; // Target workspace
  targetUserId?: string; // Target user
  createdAt: Date;
  updatedAt: Date;
}

const PlatformActivitySchema = new Schema<IPlatformActivity>(
  {
    activityType: {
      type: String,
      required: true,
      enum: [
        'WORKSPACE_SUSPENDED',
        'WORKSPACE_REACTIVATED',
        'WORKSPACE_DELETED',
        'USER_SUSPENDED',
        'USER_REACTIVATED',
        'ADMIN_PROMOTED',
        'ADMIN_DEMOTED',
        'WORKSPACE_CREATED',
        'USER_REGISTERED',
        'SUBSCRIPTION_UPGRADED',
        'SUBSCRIPTION_DOWNGRADED',
        'SUBSCRIPTION_CANCELED',
      ],
      index: true,
    },
    description: { type: String, required: true },
    adminUserId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    targetTenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', index: true },
    targetUserId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
  },
  { timestamps: true }
);

const PlatformActivity: Model<IPlatformActivity> =
  mongoose.models.PlatformActivity ||
  mongoose.model<IPlatformActivity>('PlatformActivity', PlatformActivitySchema);

export default PlatformActivity;
