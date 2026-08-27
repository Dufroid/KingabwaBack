import mongoose, { Schema, Document } from 'mongoose';

export interface IPartner extends Document {
  name: string;
  logo: string;
  description: string;
  website: string;
  level: 'PLATINUM' | 'GOLD' | 'SILVER' | 'BRONZE';
  order: number;
  active: boolean;
  createdAt: Date;
}

const PartnerSchema: Schema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    logo: { type: String, required: true },
    description: { type: String, default: '' },
    website: { type: String, default: '#' },
    level: { type: String, enum: ['PLATINUM', 'GOLD', 'SILVER', 'BRONZE'], default: 'GOLD' },
    order: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const Partner = mongoose.model<IPartner>('Partner', PartnerSchema);
