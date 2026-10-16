import mongoose, { Schema, Document } from 'mongoose';

export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'CANCELLED';
export type MobileMoneyProvider = 'AIRTEL_MONEY' | 'ORANGE_MONEY' | 'MOCK';

export interface IPaymentTransaction extends Document {
  userId: mongoose.Types.ObjectId;
  voteId?: mongoose.Types.ObjectId;
  provider: MobileMoneyProvider;
  amount: number;
  currency: string;
  phone: string;
  status: PaymentStatus;
  reference: string;
  externalTransactionId?: string;
  metadata?: {
    editionId?: string;
    categoryId?: string;
    nomineeId?: string;
    otpCode?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const PaymentTransactionSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    voteId: { type: Schema.Types.ObjectId, ref: 'Vote', default: null },
    provider: {
      type: String,
      enum: ['AIRTEL_MONEY', 'ORANGE_MONEY', 'MOCK'],
      required: true,
    },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'CDF' },
    phone: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ['PENDING', 'PAID', 'FAILED', 'CANCELLED'],
      default: 'PENDING',
    },
    reference: { type: String, required: true, unique: true },
    externalTransactionId: { type: String, default: '' },
    metadata: {
      editionId: { type: String, default: '' },
      categoryId: { type: String, default: '' },
      nomineeId: { type: String, default: '' },
      otpCode: { type: String, default: '' },
    },
  },
  { timestamps: true }
);

export const PaymentTransaction = mongoose.model<IPaymentTransaction>('PaymentTransaction', PaymentTransactionSchema);
