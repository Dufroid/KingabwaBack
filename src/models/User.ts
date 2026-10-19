import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  firstName: string;
  lastName: string;
 
  phone?: string;
  password?: string;
  role: 'VISITOR' | 'VOTER' | 'ADMIN' | 'SUPER_ADMIN';
  profileImage?: string;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
   
    phone: { type: String, unique: true, sparse: true, trim: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ['VISITOR', 'VOTER', 'ADMIN', 'SUPER_ADMIN'],
      default: 'VOTER',
    },
    profileImage: { type: String, default: '' },
    isVerified: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const User = mongoose.model<IUser>('User', UserSchema);
