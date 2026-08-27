import mongoose, { Schema, Document } from 'mongoose';

export interface INominationProposal extends Document {
  nomineeName: string;
  proposedCategory: string;
  profession: string;
  biography: string;
  achievements: string;
  reason: string;
  referenceLinks?: string;
  proposerInformation: {
    fullName: string;
    email: string;
    phone?: string;
  };
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  createdAt: Date;
}

const NominationProposalSchema: Schema = new Schema(
  {
    nomineeName: { type: String, required: true, trim: true },
    proposedCategory: { type: String, required: true, trim: true },
    profession: { type: String, required: true, trim: true },
    biography: { type: String, required: true },
    achievements: { type: String, required: true },
    reason: { type: String, required: true },
    referenceLinks: { type: String, default: '' },
    proposerInformation: {
      fullName: { type: String, required: true, trim: true },
      email: { type: String, required: true, lowercase: true, trim: true },
      phone: { type: String, default: '' },
    },
    status: { type: String, enum: ['PENDING', 'ACCEPTED', 'REJECTED'], default: 'PENDING' },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const NominationProposal = mongoose.model<INominationProposal>('NominationProposal', NominationProposalSchema);
