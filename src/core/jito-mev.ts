/**
 * Known Jito MEV Tip Payment Program and Tip Accounts
 * Reference: https://jito-foundation.gitbook.io/mev/mev-payment-and-distribution/on-chain-addresses
 */
export const JITO_TIP_PROGRAM_ID = 'T1pyen8girALnn5hhdujhQU58gsMx8qY45SgzNX56zb';

export const JITO_TIP_ACCOUNTS = new Set([
  '96gYZGLnJYVFmbjzopPSU6QiEV5fGqZNyN9nmNhvrZU5',
  'HFqU5x63VTxvQssQn138i2NN7MQNV6CtP9KA1nPczW27',
  'Cw8CFyM9FkoMi7K7Crf6HNQqf4uEMzpKw6QNghXLvLkY',
  'ADaUMid9yfUytqMBgopwjb2DTLSokTSzL1zt6iGPaS49',
  'DfXygSm4jCyNCybVYYK6DwvWqjKee8pbDmJGcLWNDXjh',
  'ADuUkR4vqLUMWXxW9gh6D6L8pMSawimctcNZ5pGwDcEt',
  'DttWaMuVvTiduZRnguLF7jNxTgiMBZ1hyAumKUiL2KRL',
  '3AVi9Tg9Uo68tJfuvoKvqKNWKkC5wPdSSdeBnizKZ6jT'
]);

export interface JitoTipInfo {
  isJitoBundle: boolean;
  tipAccount?: string;
  tipLamports: number;
}

/**
 * Inspects transaction account keys and transfer instructions to detect Jito tip payments.
 */
export function detectJitoTip(
  accountKeys: string[],
  instructions: any[],
  metaPostBalances?: number[],
  metaPreBalances?: number[]
): JitoTipInfo {
  let tipLamports = 0;
  let tipAccount: string | undefined;

  for (let i = 0; i < accountKeys.length; i++) {
    const key = accountKeys[i];
    if (JITO_TIP_ACCOUNTS.has(key)) {
      tipAccount = key;
      if (metaPostBalances && metaPreBalances && metaPostBalances[i] > metaPreBalances[i]) {
        tipLamports += metaPostBalances[i] - metaPreBalances[i];
      }
    }
  }

  const isJitoBundle = !!tipAccount;
  return {
    isJitoBundle,
    tipAccount,
    tipLamports
  };
}
