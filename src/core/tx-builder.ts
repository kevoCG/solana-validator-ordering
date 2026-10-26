import {
  ComputeBudgetProgram,
  Keypair,
  PublicKey,
  SystemProgram,
  TransactionMessage,
  VersionedTransaction
} from '@solana/web3.js';

export interface TestTxTier {
  tierName: string;
  computeUnitPriceMicroLamports: number;
  computeUnitLimit: number;
}

export const TEST_FEE_TIERS: TestTxTier[] = [
  { tierName: 'Baseline-Zero', computeUnitPriceMicroLamports: 0, computeUnitLimit: 50_000 },
  { tierName: 'Low-Priority', computeUnitPriceMicroLamports: 1_000, computeUnitLimit: 50_000 },
  { tierName: 'Medium-Priority', computeUnitPriceMicroLamports: 10_000, computeUnitLimit: 50_000 },
  { tierName: 'High-Priority', computeUnitPriceMicroLamports: 50_000, computeUnitLimit: 50_000 },
  { tierName: 'Ultra-Priority', computeUnitPriceMicroLamports: 200_000, computeUnitLimit: 50_000 }
];

/**
 * Builds a versioned test transaction with a specific priority fee and compute limit.
 */
export function buildTestTransaction(
  payer: Keypair,
  recipient: PublicKey,
  recentBlockhash: string,
  tier: TestTxTier
): VersionedTransaction {
  const instructions = [
    ComputeBudgetProgram.setComputeUnitLimit({ units: tier.computeUnitLimit }),
    ComputeBudgetProgram.setComputeUnitPrice({ microLamports: tier.computeUnitPriceMicroLamports }),
    // Micro-transfer of 1 lamport to self/recipient for deterministic state modification
    SystemProgram.transfer({
      fromPubkey: payer.publicKey,
      toPubkey: recipient,
      lamports: 1
    })
  ];

  const messageV0 = new TransactionMessage({
    payerKey: payer.publicKey,
    recentBlockhash,
    instructions
  }).compileToV0Message();

  const tx = new VersionedTransaction(messageV0);
  tx.sign([payer]);

  return tx;
}
