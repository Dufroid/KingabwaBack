"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRateLimiter = exports.voteRateLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
exports.voteRateLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // Max 20 vote attempts per 15 minutes per IP
    message: {
        success: false,
        message: 'Trop de requêtes de vote. Veuillez réessayer dans 15 minutes.',
    },
    standardHeaders: true,
    legacyHeaders: false,
});
exports.authRateLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 15,
    message: {
        success: false,
        message: 'Trop de tentatives de connexion/inscription. Veuillez réessayer plus tard.',
    },
});
