import mongoose, { Schema, Document } from 'mongoose';

export interface IVote extends Document {
  userId: mongoose.Types.ObjectId;
  editionId: mongoose.Types.ObjectId;
  categoryId: mongoose.Types.ObjectId;
  nomineeId: mongoose.Types.ObjectId;
  voteType: 'FREE' | 'PAID';
  points: number;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED';
  paymentReference?: string;
  confirmedAt?: Date;
  createdAt: Date;
}

const VoteSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    editionId: { type: Schema.Types.ObjectId, ref: 'AwardEdition', required: true },
    categoryId: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    nomineeId: { type: Schema.Types.ObjectId, ref: 'Nominee', required: true },
    voteType: { type: String, enum: ['FREE', 'PAID'], default: 'FREE' },
    points: { type: Number, default: 1 },
    status: { type: String, enum: ['PENDING', 'CONFIRMED', 'CANCELLED'], default: 'CONFIRMED' },
    paymentReference: { type: String, default: '' },
    confirmedAt: { type: Date, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// Free votes remain unique per user/category/edition. Paid votes are allowed as separate payment-confirmed increments.
VoteSchema.index({ userId: 1, categoryId: 1, editionId: 1, voteType: 1 }, { unique: false });

export const Vote = mongoose.model<IVote>('Vote', VoteSchema);
