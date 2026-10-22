export type ManualPaymentProvider = 'MPESA' | 'ORANGE_MONEY';

export const VOICE_PRICE_CDF = 500;
export const MIN_VOICES_PER_PAYMENT = 1;
export const MAX_VOICES_PER_PAYMENT = 300;

const providerConfig = {
  MPESA: {
    key: 'MPESA' as const,
    label: 'M-Pesa',
    operator: 'Vodacom RDC',
    phoneEnvKey: 'MPESA_MERCHANT_PHONE',
  },
  ORANGE_MONEY: {
    key: 'ORANGE_MONEY' as const,
    label: 'Orange Money',
    operator: 'Orange RDC',
    phoneEnvKey: 'ORANGE_MONEY_MERCHANT_PHONE',
  },
};

export const isManualPaymentProvider = (value: unknown): value is ManualPaymentProvider =>
  value === 'MPESA' || value === 'ORANGE_MONEY';

export const getProviderInfo = (provider: ManualPaymentProvider) => {
  const config = providerConfig[provider];
  return {
    key: config.key,
    label: config.label,
    operator: config.operator,
    phone: (process.env[config.phoneEnvKey] || '').trim(),
  };
};

export const getManualPaymentMethods = () => ({
  merchantName: (process.env.PAYMENT_MERCHANT_NAME || 'KINGABWA AWARDS').trim(),
  currency: 'CDF',
  pricePerVoice: VOICE_PRICE_CDF,
  minVoicesPerPayment: MIN_VOICES_PER_PAYMENT,
  maxVoicesPerPayment: MAX_VOICES_PER_PAYMENT,
  providers: (Object.keys(providerConfig) as ManualPaymentProvider[]).map((provider) =>
    getProviderInfo(provider)
  ),
});
