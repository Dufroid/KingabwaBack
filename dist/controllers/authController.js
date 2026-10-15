"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMe = exports.refreshToken = exports.login = exports.register = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_js_1 = require("../models/User.js");
const index_js_1 = require("../validators/index.js");
const JWT_SECRET = process.env.JWT_SECRET || 'kingabwa_awards_secret_jwt_key_2026_super_secure';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'kingabwa_awards_refresh_secret_jwt_key_2026';
const register = async (req, res) => {
    try {
        const validatedData = index_js_1.registerSchema.parse(req.body);
        const existingUser = await User_js_1.User.findOne({ email: validatedData.email.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'Un compte avec cette adresse e-mail existe déjà.' });
        }
        const salt = await bcryptjs_1.default.genSalt(10);
        const hashedPassword = await bcryptjs_1.default.hash(validatedData.password, salt);
        const newUser = await User_js_1.User.create({
            firstName: validatedData.firstName,
            lastName: validatedData.lastName,
            email: validatedData.email.toLowerCase(),
            password: hashedPassword,
            role: 'VOTER',
            isVerified: true,
        });
        const token = jsonwebtoken_1.default.sign({ userId: newUser._id, email: newUser.email, role: newUser.role }, JWT_SECRET, { expiresIn: '1d' });
        const refreshToken = jsonwebtoken_1.default.sign({ userId: newUser._id }, JWT_REFRESH_SECRET, { expiresIn: '7d' });
        return res.status(201).json({
            success: true,
            message: 'Compte créé avec succès !',
            token,
            refreshToken,
            user: {
                id: newUser._id,
                firstName: newUser.firstName,
                lastName: newUser.lastName,
                email: newUser.email,
                role: newUser.role,
            },
        });
    }
    catch (error) {
        if (error.errors) {
            return res.status(400).json({ success: false, message: error.errors[0].message });
        }
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.register = register;
const login = async (req, res) => {
    try {
        const validatedData = index_js_1.loginSchema.parse(req.body);
        const user = await User_js_1.User.findOne({ email: validatedData.email.toLowerCase() });
        if (!user) {
            return res.status(400).json({ success: false, message: 'Identifiants invalides.' });
        }
        const isMatch = await bcryptjs_1.default.compare(validatedData.password, user.password || '');
        if (!isMatch) {
            return res.status(400).json({ success: false, message: 'Identifiants invalides.' });
        }
        const token = jsonwebtoken_1.default.sign({ userId: user._id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '1d' });
        const refreshToken = jsonwebtoken_1.default.sign({ userId: user._id }, JWT_REFRESH_SECRET, { expiresIn: '7d' });
        return res.json({
            success: true,
            message: 'Connexion réussie !',
            token,
            refreshToken,
            user: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                role: user.role,
            },
        });
    }
    catch (error) {
        if (error.errors) {
            return res.status(400).json({ success: false, message: error.errors[0].message });
        }
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.login = login;
const refreshToken = async (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken) {
        return res.status(400).json({ success: false, message: 'Refresh token requis.' });
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(refreshToken, JWT_REFRESH_SECRET);
        const user = await User_js_1.User.findById(decoded.userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'Utilisateur non trouvé.' });
        }
        const newToken = jsonwebtoken_1.default.sign({ userId: user._id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '1d' });
        return res.json({ success: true, token: newToken });
    }
    catch (error) {
        return res.status(403).json({ success: false, message: 'Refresh token invalide.' });
    }
};
exports.refreshToken = refreshToken;
const getMe = async (req, res) => {
    try {
        const user = await User_js_1.User.findById(req.user?.userId).select('-password');
        if (!user) {
            return res.status(404).json({ success: false, message: 'Utilisateur introuvable.' });
        }
        return res.json({ success: true, user });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.getMe = getMe;
