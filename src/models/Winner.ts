import mongoose, { Schema, Document } from 'mongoose';

export interface IWinner extends Document {
  editionYear: number;
  editionName: string;
  categoryName: string;
  winnerName: string;
  winnerImage: string;
  description: string;
  achievements: string;
  announcedAt: Date;
}

const WinnerSchema: Schema = new Schema(
  {
    editionYear: { type: Number, required: true },
    editionName: { type: String, required: true },
    categoryName: { type: String, required: true },
    winnerName: { type: String, required: true },
    winnerImage: { type: String, required: true },
    description: { type: String, required: true },
    achievements: { type: String, required: true },
    announcedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const Winner = mongoose.model<IWinner>('Winner', WinnerSchema);
