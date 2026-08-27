import mongoose, { Schema, Document } from 'mongoose';

export interface IVote extends Document {
  userId: mongoose.Types.ObjectId;
  editionId: mongoose.Types.ObjectId;
  categoryId: mongoose.Types.ObjectId;
  nomineeId: mongoose.Types.ObjectId;
  createdAt: Date;
}

const VoteSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    editionId: { type: Schema.Types.ObjectId, ref: 'AwardEdition', required: true },
    categoryId: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    nomineeId: { type: Schema.Types.ObjectId, ref: 'Nominee', required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// Prevent user from voting multiple times in the same category for the same edition
VoteSchema.index({ userId: 1, categoryId: 1, editionId: 1 }, { unique: true });

export const Vote = mongoose.model<IVote>('Vote', VoteSchema);
