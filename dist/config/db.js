"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.closeDB = exports.connectDB = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const mongodb_memory_server_1 = require("mongodb-memory-server");
const User_js_1 = require("../models/User.js");
let mongoMemoryServer = null;
const connectDB = async () => {
    const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/kingabwa_awards';
    try {
        // Attempt standard connection with 3s timeout
        await mongoose_1.default.connect(uri, {
            serverSelectionTimeoutMS: 3000,
        });
        console.log(`[DB] Connected successfully to MongoDB: ${mongoose_1.default.connection.host}`);
    }
    catch (error) {
        console.warn(`[DB] Connection to standard MongoDB failed (${error.message}). Falling back to MongoMemoryServer...`);
        try {
            mongoMemoryServer = await mongodb_memory_server_1.MongoMemoryServer.create();
            const mongoUri = mongoMemoryServer.getUri();
            await mongoose_1.default.connect(mongoUri);
            console.log(`[DB] Connected successfully to MongoMemoryServer (In-Memory Fallback): ${mongoUri}`);
        }
        catch (memError) {
            console.error('[DB] MongoMemoryServer error:', memError);
            process.exit(1);
        }
    }
    try {
        // Removes obsolete indexes from previous schemas (e.g. unique email_1)
        await User_js_1.User.syncIndexes();
    }
    catch (syncError) {
        console.warn(`[DB] User index synchronization failed: ${syncError.message}`);
    }
};
exports.connectDB = connectDB;
const closeDB = async () => {
    await mongoose_1.default.disconnect();
    if (mongoMemoryServer) {
        await mongoMemoryServer.stop();
    }
};
exports.closeDB = closeDB;
