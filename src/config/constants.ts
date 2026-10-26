import dotenv from 'dotenv';
dotenv.config();

export const CONFIG = {
  // High-throughput public RPC fallback
  RPC_URL: process.env.SOLANA_RPC_URL || 'https://solana-rpc.publicnode.com',
  FALLBACK_RPC_URLS: [
    'https://solana-rpc.publicnode.com',
    'https://api.mainnet-beta.solana.com'
  ],
  MAX_SPEND_CAP_SOL: parseFloat(process.env.SPEND_CAP_SOL || '0.05'),
  COMPUTE_BUDGET_PROGRAM_ID: 'ComputeBudget111111111111111111111111111111',
  DEFAULT_SAMPLE_BLOCKS_PER_VALIDATOR: 5,
  DATA_RAW_DIR: './data/raw',
  DATA_PROCESSED_DIR: './data/processed',
  REPORT_FILE: './report/REPORT.md'
};
