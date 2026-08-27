import mongoose, { Schema, Document } from 'mongoose';

export interface IBlogCategory extends Document {
  name: string;
  slug: string;
  description?: string;
  createdAt: Date;
}

const BlogCategorySchema: Schema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, default: '' },
  },
  { timestamps: true }
);

export const BlogCategory = mongoose.model<IBlogCategory>('BlogCategory', BlogCategorySchema);
