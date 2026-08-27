import mongoose, { Schema, Document } from 'mongoose';

export interface IGalleryMedia extends Document {
  title: string;
  type: 'PHOTO' | 'VIDEO';
  url: string;
  thumbnailUrl?: string;
  category: 'CEREMONY' | 'RED_CARPET' | 'BEHIND_SCENES' | 'WINNERS';
  editionYear: number;
  description?: string;
  createdAt: Date;
}

const GalleryMediaSchema: Schema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    type: { type: String, enum: ['PHOTO', 'VIDEO'], required: true },
    url: { type: String, required: true },
    thumbnailUrl: { type: String, default: '' },
    category: {
      type: String,
      enum: ['CEREMONY', 'RED_CARPET', 'BEHIND_SCENES', 'WINNERS'],
      default: 'CEREMONY',
    },
    editionYear: { type: Number, default: 2026 },
    description: { type: String, default: '' },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const GalleryMedia = mongoose.model<IGalleryMedia>('GalleryMedia', GalleryMediaSchema);
