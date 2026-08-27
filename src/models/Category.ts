import mongoose, { Schema, Document } from 'mongoose';

export interface ICategory extends Document {
  editionId: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  description: string;
  icon?: string;
  image?: string;
  votingEnabled: boolean;
  order: number;
  createdAt: Date;
}

const CategorySchema: Schema = new Schema(
  {
    editionId: { type: Schema.Types.ObjectId, ref: 'AwardEdition', required: true },
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, required: true },
    icon: { type: String, default: 'Award' },
    image: { type: String, default: '' },
    votingEnabled: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const Category = mongoose.model<ICategory>('Category', CategorySchema);
