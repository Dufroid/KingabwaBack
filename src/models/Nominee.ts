import mongoose, { Schema, Document } from 'mongoose';

export interface INominee extends Document {
  editionId: mongoose.Types.ObjectId;
  categoryId: mongoose.Types.ObjectId;
  fullName: string;
  slug: string;
  profileImage: string;
  shortBio?: string;
  biography?: string;
  achievements: string[];
  socialLinks: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    linkedin?: string;
    youtube?: string;
  };
  status: 'ACTIVE' | 'DISQUALIFIED';
  voteCount: number;
  createdAt: Date;
}

const NomineeSchema: Schema = new Schema(
  {
    editionId: { type: Schema.Types.ObjectId, ref: 'AwardEdition', required: true },
    categoryId: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    fullName: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    profileImage: { type: String, required: true },
    shortBio: { type: String, default: '' },
    biography: { type: String, default: '' },
    achievements: [{ type: String }],
    socialLinks: {
      facebook: { type: String, default: '' },
      twitter: { type: String, default: '' },
      instagram: { type: String, default: '' },
      linkedin: { type: String, default: '' },
      youtube: { type: String, default: '' },
    },
    status: { type: String, enum: ['ACTIVE', 'DISQUALIFIED'], default: 'ACTIVE' },
    voteCount: { type: Number, default: 0 },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const Nominee = mongoose.model<INominee>('Nominee', NomineeSchema);
