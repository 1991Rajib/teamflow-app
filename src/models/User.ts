import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash?: string;
  platformRole: 'USER' | 'PLATFORM_ADMIN';
  avatarUrl?: string;
  isActive: boolean;
  status: 'ACTIVE' | 'SUSPENDED';
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      index: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: { type: String },
    platformRole: {
      type: String,
      enum: ['USER', 'PLATFORM_ADMIN'],
      default: 'USER',
      required: true,
    },
    avatarUrl: { type: String, trim: true },
    isActive: { type: Boolean, default: true, required: true },
    status: {
      type: String,
      enum: ['ACTIVE', 'SUSPENDED'],
      default: 'ACTIVE',
      required: true,
    },
  },
  { timestamps: true }
);

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
export default User;
