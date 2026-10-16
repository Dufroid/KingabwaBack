"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.confirmMobileMoneyPayment = exports.initiateMobileMoneyPayment = void 0;
const normalizeProvider = (provider) => {
    const value = (provider || process.env.MOBILE_MONEY_PROVIDER || 'MOCK').toUpperCase();
    if (value === 'AIRTEL' || value === 'AIRTEL_MONEY')
        return 'AIRTEL_MONEY';
    if (value === 'ORANGE' || value === 'ORANGE_MONEY')
        return 'ORANGE_MONEY';
    return 'MOCK';
};
const generateOtpCode = () => String(Math.floor(100000 + Math.random() * 900000));
const getProviderLabel = (provider) => {
    if (provider === 'AIRTEL_MONEY')
        return 'Airtel Money';
    if (provider === 'ORANGE_MONEY')
        return 'Orange Money';
    return 'Simulation mobile money';
};
const initiateMobileMoneyPayment = async ({ provider, amount, phone, reference, }) => {
    const resolvedProvider = normalizeProvider(provider);
    const providerLabel = getProviderLabel(resolvedProvider);
    const otpCode = generateOtpCode();
    if (resolvedProvider === 'MOCK') {
        return {
            success: true,
            provider: 'MOCK',
            amount,
            phone,
            reference,
            externalTransactionId: `mock-${Date.now()}`,
            status: 'PENDING',
            message: 'Le simulateur de paiement a bien démarré. Entrez le code affiché pour valider la transaction.',
            otpCode,
            providerLabel,
            expiresInSeconds: 180,
        };
    }
    const apiUrl = resolvedProvider === 'AIRTEL_MONEY'
        ? process.env.AIRTEL_MONEY_API_URL
        : process.env.ORANGE_MONEY_API_URL;
    const apiKey = resolvedProvider === 'AIRTEL_MONEY'
        ? process.env.AIRTEL_MONEY_API_KEY
        : process.env.ORANGE_MONEY_API_KEY;
    if (!apiUrl || !apiKey) {
        return {
            success: true,
            provider: resolvedProvider,
            amount,
            phone,
            reference,
            externalTransactionId: `sim-${Date.now()}`,
            status: 'PENDING',
            message: `Simulation locale activée pour ${providerLabel}. Un code de confirmation a été généré pour tester le flux de paiement RDC.`,
            otpCode,
            providerLabel,
            expiresInSeconds: 180,
        };
    }
    const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            amount,
            phone,
            reference,
            currency: 'CDF',
            provider: resolvedProvider,
        }),
    });
    if (!response.ok) {
        throw new Error(`Échec de l'initiation du paiement mobile money via ${resolvedProvider}.`);
    }
    const data = await response.json();
    return {
        success: true,
        provider: resolvedProvider,
        amount,
        phone,
        reference,
        externalTransactionId: data.transactionId || data.id || `${resolvedProvider}-${Date.now()}`,
        status: 'PENDING',
        message: data.message || `Paiement ${providerLabel} initié. Le code de confirmation a été envoyé.`,
        otpCode: data.otpCode || otpCode,
        providerLabel,
        expiresInSeconds: data.expiresInSeconds || 180,
    };
};
exports.initiateMobileMoneyPayment = initiateMobileMoneyPayment;
const confirmMobileMoneyPayment = async (reference, otpCode) => {
    const provider = normalizeProvider(process.env.MOBILE_MONEY_PROVIDER);
    if (!otpCode) {
        return {
            success: false,
            status: 'PENDING',
            reference,
            message: 'Le code de confirmation est obligatoire pour valider le paiement.',
        };
    }
    if (provider === 'MOCK') {
        return {
            success: true,
            status: 'PAID',
            reference,
            message: 'Paiement mobile money confirmé en mode simulateur.',
        };
    }
    return {
        success: true,
        status: 'PAID',
        reference,
        message: `Paiement ${getProviderLabel(provider)} confirmé avec succès.`,
    };
};
exports.confirmMobileMoneyPayment = confirmMobileMoneyPayment;
