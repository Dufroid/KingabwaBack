import mongoose, { Schema, Document } from 'mongoose';

export interface IAwardEdition extends Document {
  name: string;
  year: number;
  description: string;
  location?: string;
  image?: string;
  startDate: Date;
  ceremonyDate: Date;
  votingStartDate: Date;
  votingEndDate: Date;
  status: 'UPCOMING' | 'OPEN' | 'CLOSED' | 'RESULTS_PUBLISHED';
  createdAt: Date;
}

const AwardEditionSchema: Schema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    year: { type: Number, required: true, unique: true },
    description: { type: String, required: true },
    location: { type: String, default: '', trim: true },
    image: { type: String, default: '', trim: true },
    startDate: { type: Date, required: true },
    ceremonyDate: { type: Date, required: true },
    votingStartDate: { type: Date, required: true },
    votingEndDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ['UPCOMING', 'OPEN', 'CLOSED', 'RESULTS_PUBLISHED'],
      default: 'OPEN',
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const AwardEdition = mongoose.model<IAwardEdition>('AwardEdition', AwardEditionSchema);
