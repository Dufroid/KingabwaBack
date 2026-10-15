import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { registerSchema, loginSchema } from '../validators/index.js';
import { AuthRequest } from '../types/index.js';

const JWT_SECRET = process.env.JWT_SECRET || 'kingabwa_awards_secret_jwt_key_2026_super_secure';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'kingabwa_awards_refresh_secret_jwt_key_2026';

const normalizePhone = (value: string = '') => value.replace(/\s+/g, '').replace(/[^\d+]/g, '');

const findUserByIdentifier = async (identifier: string) => {
  const trimmedIdentifier = identifier.trim();
  const normalizedPhone = normalizePhone(trimmedIdentifier);

  return User.findOne({
    $or: [{ phone: normalizedPhone }, { phone: trimmedIdentifier }],
  });
};

export const register = async (req: Request, res: Response) => {
  try {
    const validatedData = registerSchema.parse(req.body);
    const normalizedPhone = normalizePhone(validatedData.phone || '');

    const existingUser = await User.findOne({ phone: normalizedPhone });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Un compte avec ce numéro de téléphone existe déjà.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(validatedData.password, salt);

    const newUser = await User.create({
      firstName: validatedData.firstName,
      lastName: validatedData.lastName,
      phone: normalizedPhone,
      password: hashedPassword,
      role: 'VOTER',
      isVerified: true,
    });

    const token = jwt.sign(
      { userId: newUser._id, phone: newUser.phone || '', role: newUser.role },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    const refreshToken = jwt.sign(
      { userId: newUser._id },
      JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      success: true,
      message: 'Compte créé avec succès !',
      token,
      refreshToken,
      user: {
        id: newUser._id,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        phone: newUser.phone || '',
        role: newUser.role,
      },
    });
  } catch (error: any) {
    if (error.errors) {
      return res.status(400).json({ success: false, message: error.errors[0].message });
    }
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const validatedData = loginSchema.parse(req.body);

    const user = await findUserByIdentifier(validatedData.identifier);
    if (!user) {
      return res.status(400).json({ success: false, message: 'Identifiants invalides.' });
    }

    const isMatch = await bcrypt.compare(validatedData.password, user.password || '');
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Identifiants invalides.' });
    }

    const token = jwt.sign(
      { userId: user._id, phone: user.phone || '', role: user.role },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    const refreshToken = jwt.sign(
      { userId: user._id },
      JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      success: true,
      message: 'Connexion réussie !',
      token,
      refreshToken,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone || '',
        role: user.role,
      },
    });
  } catch (error: any) {
    if (error.errors) {
      return res.status(400).json({ success: false, message: error.errors[0].message });
    }
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const refreshToken = async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(400).json({ success: false, message: 'Refresh token requis.' });
  }

  try {
    const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as any;
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Utilisateur non trouvé.' });
    }

    const newToken = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    return res.json({ success: true, token: newToken });
  } catch (error) {
    return res.status(403).json({ success: false, message: 'Refresh token invalide.' });
  }
};

export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.user?.userId).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'Utilisateur introuvable.' });
    }
    return res.json({ success: true, user });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
