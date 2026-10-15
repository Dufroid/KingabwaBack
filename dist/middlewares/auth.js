"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorizeRoles = exports.authenticateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
    if (!token) {
        return res.status(401).json({ success: false, message: 'Accès refusé. Jeton non fourni.' });
    }
    try {
        const secret = process.env.JWT_SECRET || 'kingabwa_awards_secret_jwt_key_2026_super_secure';
        const decoded = jsonwebtoken_1.default.verify(token, secret);
        req.user = decoded;
        next();
    }
    catch (error) {
        return res.status(403).json({ success: false, message: 'Jeton invalide ou expiré.' });
    }
};
exports.authenticateToken = authenticateToken;
const authorizeRoles = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ success: false, message: 'Utilisateur non authentifié.' });
        }
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Accès interdit. Privilèges insuffisants.',
            });
        }
        next();
    };
};
exports.authorizeRoles = authorizeRoles;
