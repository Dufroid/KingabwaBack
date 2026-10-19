import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { User } from '../models/User.js';
import { Vote } from '../models/Vote.js';
import { PaymentTransaction } from '../models/PaymentTransaction.js';

let mongoMemoryServer: MongoMemoryServer | null = null;

export const connectDB = async (): Promise<void> => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/kingabwa_awards';

  try {
    // Attempt standard connection with 3s timeout
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 3000,
    });
    console.log(`[DB] Connected successfully to MongoDB: ${mongoose.connection.host}`);
  } catch (error) {
    console.warn(`[DB] Connection to standard MongoDB failed (${(error as Error).message}). Falling back to MongoMemoryServer...`);
    try {
      mongoMemoryServer = await MongoMemoryServer.create();
      const mongoUri = mongoMemoryServer.getUri();
      await mongoose.connect(mongoUri);
      console.log(`[DB] Connected successfully to MongoMemoryServer (In-Memory Fallback): ${mongoUri}`);
    } catch (memError) {
      console.error('[DB] MongoMemoryServer error:', memError);
      process.exit(1);
    }
  }

  try {
    // Removes obsolete indexes from previous schemas (e.g. unique email_1,
    // unique userId/categoryId/editionId that blocked additional paid votes,
    // unique reference_1 no longer used by payment transactions)
    await Promise.all([User.syncIndexes(), Vote.syncIndexes(), PaymentTransaction.syncIndexes()]);
  } catch (syncError) {
    console.warn(`[DB] Index synchronization failed: ${(syncError as Error).message}`);
  }
};

export const closeDB = async (): Promise<void> => {
  await mongoose.disconnect();
  if (mongoMemoryServer) {
    await mongoMemoryServer.stop();
  }
};
