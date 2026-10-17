export type MobileMoneyProvider = 'MPESA' | 'ORANGE_MONEY' | 'AIRTEL_MONEY' | 'AFRIMONEY' | 'MOCK';

export interface InitiateMobileMoneyArgs {
  provider: MobileMoneyProvider;
  amount: number;
  phone: string;
  reference: string;
}

export interface MobileMoneyInitResponse {
  success: boolean;
  provider: MobileMoneyProvider;
  amount: number;
  phone: string;
  reference: string;
  externalTransactionId: string;
  status: 'PENDING' | 'PAID';
  message: string;
  otpCode?: string;
  providerLabel?: string;
  expiresInSeconds?: number;
}

const normalizeProvider = (provider?: string): MobileMoneyProvider => {
  const value = (provider || process.env.MOBILE_MONEY_PROVIDER || 'MPESA').toUpperCase();
  if (value === 'MPESA' || value === 'M_PESA') return 'MPESA';
  if (value === 'AIRTEL' || value === 'AIRTEL_MONEY') return 'AIRTEL_MONEY';
  if (value === 'ORANGE' || value === 'ORANGE_MONEY') return 'ORANGE_MONEY';
  if (value === 'AFRIMONEY' || value === 'AFRI_MONEY') return 'AFRIMONEY';
  return 'MOCK';
};

const generateOtpCode = () => String(Math.floor(100000 + Math.random() * 900000));

const getProviderLabel = (provider: MobileMoneyProvider) => {
  if (provider === 'MPESA') return 'M-Pesa';
  if (provider === 'AIRTEL_MONEY') return 'Airtel Money';
  if (provider === 'ORANGE_MONEY') return 'Orange Money';
  if (provider === 'AFRIMONEY') return 'AfriMoney';
  return 'Simulation mobile money';
};

export const initiateMobileMoneyPayment = async ({
  provider,
  amount,
  phone,
  reference,
}: InitiateMobileMoneyArgs): Promise<MobileMoneyInitResponse> => {
  const resolvedProvider = normalizeProvider(provider);
  const providerLabel = getProviderLabel(resolvedProvider);
  const otpCode = generateOtpCode();
  const gatewayProvider = process.env.PAYMENT_GATEWAY_PROVIDER || 'MFS_AFRICA';
  const gatewayUrl = process.env.PAYMENT_GATEWAY_BASE_URL || '';
  const gatewayApiKey = process.env.PAYMENT_GATEWAY_API_KEY || '';

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

  const apiUrl =
   resolvedProvider === 'MPESA'
     ? process.env.MPESA_API_URL || gatewayUrl
     : resolvedProvider === 'AIRTEL_MONEY'
       ? process.env.AIRTEL_MONEY_API_URL || gatewayUrl
       : resolvedProvider === 'ORANGE_MONEY'
         ? process.env.ORANGE_MONEY_API_URL || gatewayUrl
         : resolvedProvider === 'AFRIMONEY'
           ? process.env.AFRIMONEY_API_URL || gatewayUrl
           : gatewayUrl;

  const apiKey =
   resolvedProvider === 'MPESA'
     ? process.env.MPESA_API_KEY || gatewayApiKey
     : resolvedProvider === 'AIRTEL_MONEY'
       ? process.env.AIRTEL_MONEY_API_KEY || gatewayApiKey
       : resolvedProvider === 'ORANGE_MONEY'
         ? process.env.ORANGE_MONEY_API_KEY || gatewayApiKey
         : resolvedProvider === 'AFRIMONEY'
           ? process.env.AFRIMONEY_API_KEY || gatewayApiKey
           : gatewayApiKey;

  if (!apiUrl || !apiKey) {
   return {
     success: true,
     provider: resolvedProvider,
     amount,
     phone,
     reference,
     externalTransactionId: `sim-${Date.now()}`,
     status: 'PENDING',
     message: `Simulation locale activée pour ${providerLabel}. Un code de confirmation a été généré pour tester le flux de paiement via la passerelle ${gatewayProvider}.`,
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
   message: data.message || `Paiement ${providerLabel} initié. Le code de confirmation a été envoyé.` ,
   otpCode: data.otpCode || otpCode,
   providerLabel,
   expiresInSeconds: data.expiresInSeconds || 180,
  };
};

export const confirmMobileMoneyPayment = async (reference: string, otpCode?: string) => {
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
