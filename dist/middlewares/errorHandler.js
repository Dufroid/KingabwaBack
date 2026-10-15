"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const errorHandler = (err, req, res, next) => {
    console.error('[Error Handler]', err);
    const statusCode = res.statusCode !== 200 ? res.statusCode : 500;
    res.status(statusCode).json({
        success: false,
        message: err.message || 'Une erreur interne est survenue sur le serveur.',
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
};
exports.errorHandler = errorHandler;
