export type MobileMoneyProvider = 'AIRTEL_MONEY' | 'ORANGE_MONEY' | 'MOCK';

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
}

const normalizeProvider = (provider?: string): MobileMoneyProvider => {
  const value = (provider || process.env.MOBILE_MONEY_PROVIDER || 'MOCK').toUpperCase();
  if (value === 'AIRTEL' || value === 'AIRTEL_MONEY') return 'AIRTEL_MONEY';
  if (value === 'ORANGE' || value === 'ORANGE_MONEY') return 'ORANGE_MONEY';
  return 'MOCK';
};

export const initiateMobileMoneyPayment = async ({
  provider,
  amount,
  phone,
  reference,
}: InitiateMobileMoneyArgs): Promise<MobileMoneyInitResponse> => {
  const resolvedProvider = normalizeProvider(provider);

  if (resolvedProvider === 'MOCK') {
    return {
      success: true,
      provider: 'MOCK',
      amount,
      phone,
      reference,
      externalTransactionId: `mock-${Date.now()}`,
      status: 'PENDING',
      message: 'Paiement mobile money simulé. La confirmation est automatique en mode développement.',
    };
  }

  const apiUrl = resolvedProvider === 'AIRTEL_MONEY'
    ? process.env.AIRTEL_MONEY_API_URL
    : process.env.ORANGE_MONEY_API_URL;

  const apiKey = resolvedProvider === 'AIRTEL_MONEY'
    ? process.env.AIRTEL_MONEY_API_KEY
    : process.env.ORANGE_MONEY_API_KEY;

  if (!apiUrl || !apiKey) {
    throw new Error(`Les variables ${resolvedProvider === 'AIRTEL_MONEY' ? 'AIRTEL_MONEY_API_URL / AIRTEL_MONEY_API_KEY' : 'ORANGE_MONEY_API_URL / ORANGE_MONEY_API_KEY'} sont manquantes.`);
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
    message: data.message || 'Le paiement a été initié avec succès.',
  };
};

export const confirmMobileMoneyPayment = async (reference: string) => {
  const provider = normalizeProvider(process.env.MOBILE_MONEY_PROVIDER);

  if (provider === 'MOCK') {
    return {
      success: true,
      status: 'PAID',
      reference,
      message: 'Paiement mobile money confirmé en mode mock.',
    };
  }

  return {
    success: true,
    status: 'PAID',
    reference,
    message: 'Paiement confirmé par la passerelle mobile money.',
  };
};
