"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getManualPaymentMethods = exports.getProviderInfo = exports.isManualPaymentProvider = exports.MAX_VOICES_PER_PAYMENT = exports.MIN_VOICES_PER_PAYMENT = exports.VOICE_PRICE_CDF = void 0;
exports.VOICE_PRICE_CDF = 500;
exports.MIN_VOICES_PER_PAYMENT = 1;
exports.MAX_VOICES_PER_PAYMENT = 300;
const providerConfig = {
    MPESA: {
        key: 'MPESA',
        label: 'M-Pesa',
        operator: 'Vodacom RDC',
        phoneEnvKey: 'MPESA_MERCHANT_PHONE',
    },
    ORANGE_MONEY: {
        key: 'ORANGE_MONEY',
        label: 'Orange Money',
        operator: 'Orange RDC',
        phoneEnvKey: 'ORANGE_MONEY_MERCHANT_PHONE',
    },
};
const isManualPaymentProvider = (value) => value === 'MPESA' || value === 'ORANGE_MONEY';
exports.isManualPaymentProvider = isManualPaymentProvider;
const getProviderInfo = (provider) => {
    const config = providerConfig[provider];
    return {
        key: config.key,
        label: config.label,
        operator: config.operator,
        phone: (process.env[config.phoneEnvKey] || '').trim(),
    };
};
exports.getProviderInfo = getProviderInfo;
const getManualPaymentMethods = () => ({
    merchantName: (process.env.PAYMENT_MERCHANT_NAME || 'KINGABWA AWARDS').trim(),
    currency: 'CDF',
    pricePerVoice: exports.VOICE_PRICE_CDF,
    minVoicesPerPayment: exports.MIN_VOICES_PER_PAYMENT,
    maxVoicesPerPayment: exports.MAX_VOICES_PER_PAYMENT,
    providers: Object.keys(providerConfig).map((provider) => (0, exports.getProviderInfo)(provider)),
});
exports.getManualPaymentMethods = getManualPaymentMethods;
