import rateLimit from 'express-rate-limit';

export const voteRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Max 20 vote attempts per 15 minutes per IP
  message: {
    success: false,
    message: 'Trop de requêtes de vote. Veuillez réessayer dans 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: {
    success: false,
    message: 'Trop de tentatives de connexion/inscription. Veuillez réessayer plus tard.',
  },
});
