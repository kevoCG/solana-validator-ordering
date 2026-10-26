export type ValidatorClientType = 'Agave' | 'Jito-Solana' | 'Frankendancer/Firedancer' | 'Unknown';

export interface TargetValidator {
  identity: string;
  voteAccount: string;
  name: string;
  clientType: ValidatorClientType;
  version: string;
  stakeSol: number;
}

export interface ParsedBlockTx {
  indexInBlock: number;
  signature: string;
  feeLamports: number;
  computeUnitPriceMicroLamports: number;
  computeUnitLimit: number;
  isSuccessful: boolean;
  numInstructions: number;
  writeLockedAccountsCount: number;
}

export interface BlockAnalysisResult {
  slot: number;
  blockTime: number | null;
  leaderIdentity: string;
  validatorName: string;
  clientType: ValidatorClientType;
  totalTransactions: number;
  analyzedTransactions: number;
  txsWithPriorityFee: number;
  medianPriorityFee: number;
  spearmanRho: number; // Correlation between priority fee and block position
  pValueEstimate: number;
  orderingRuleDetected: 'Strict-Priority' | 'Weak-Priority' | 'FIFO/Round-Robin' | 'Uncorrelated-Noise';
  transactions: ParsedBlockTx[];
}

export interface ExperimentSummary {
  executionDate: string;
  alpenglowContext: string;
  totalBlocksAnalyzed: number;
  validatorsEvaluated: {
    clientType: ValidatorClientType;
    validatorName: string;
    identity: string;
    sampleSlots: number[];
    avgSpearmanRho: number;
    behaviorSummary: string;
  }[];
  comparativeMatrix: {
    client: ValidatorClientType;
    schedulerObserved: string;
    prioritySensitivity: string;
    noiseRatio: string;
  }[];
}
