import mongoose, { Schema, Document } from 'mongoose';

export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'CANCELLED';
export type MobileMoneyProvider = 'MPESA' | 'ORANGE_MONEY' | 'AIRTEL_MONEY' | 'AFRIMONEY' | 'MOCK';

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
    increments?: number;
    amountCdf?: number;
    providerLabel?: string;
    merchantPhone?: string;
    payerPhone?: string;
    declaredTransactionId?: string;
    declaredAt?: Date;
    validatedBy?: string;
    validatedAt?: Date;
    rejectedBy?: string;
    rejectedAt?: Date;
    rejectionReason?: string;
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
      enum: ['MPESA', 'ORANGE_MONEY', 'AIRTEL_MONEY', 'AFRIMONEY', 'MOCK'],
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
      increments: { type: Number, default: 0 },
      amountCdf: { type: Number, default: 0 },
      providerLabel: { type: String, default: '' },
      merchantPhone: { type: String, default: '' },
      payerPhone: { type: String, default: '' },
      declaredTransactionId: { type: String, default: '' },
      declaredAt: { type: Date, default: null },
      validatedBy: { type: String, default: '' },
      validatedAt: { type: Date, default: null },
      rejectedBy: { type: String, default: '' },
      rejectedAt: { type: Date, default: null },
      rejectionReason: { type: String, default: '' },
    },
  },
  { timestamps: true }
);

export const PaymentTransaction = mongoose.model<IPaymentTransaction>('PaymentTransaction', PaymentTransactionSchema);
