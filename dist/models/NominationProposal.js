"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.NominationProposal = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const NominationProposalSchema = new mongoose_1.Schema({
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
}, { timestamps: { createdAt: true, updatedAt: false } });
exports.NominationProposal = mongoose_1.default.model('NominationProposal', NominationProposalSchema);
