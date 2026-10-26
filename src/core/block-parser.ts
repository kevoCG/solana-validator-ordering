import { Connection, VersionedBlockResponse } from '@solana/web3.js';
import bs58 from 'bs58';
import { CONFIG } from '../config/constants';
import { BlockAnalysisResult, ParsedBlockTx, ValidatorClientType } from './types';
import { calculateSpearmanRankCorrelation } from '../stats/spearman';

/**
 * Extracts compute budget instructions from compiled / versioned transaction instructions.
 */
function extractComputeBudget(
  instructions: any[],
  accountKeys: string[]
): { computeUnitPriceMicroLamports: number; computeUnitLimit: number } {
  let computeUnitPrice = 0;
  let computeUnitLimit = 200_000; // Default Solana compute unit limit

  for (const ix of instructions) {
    const programId = accountKeys[ix.programIdIndex];
    if (programId === CONFIG.COMPUTE_BUDGET_PROGRAM_ID) {
      const rawData = typeof ix.data === 'string' ? bs58.decode(ix.data) : Buffer.from(ix.data);
      const data = Buffer.from(rawData);
      if (data.length > 0) {
        const disc = data[0];
        // Disc 2: SetComputeUnitLimit (u32 little-endian)
        if (disc === 2 && data.length >= 5) {
          computeUnitLimit = data.readUInt32LE(1);
        }
        // Disc 3: SetComputeUnitPrice (u64 little-endian)
        if (disc === 3 && data.length >= 9) {
          // Read 64-bit integer
          const low = data.readUInt32LE(1);
          const high = data.readUInt32LE(5);
          computeUnitPrice = high * 4294967296 + low;
        }
      }
    }
  }

  return { computeUnitPriceMicroLamports: computeUnitPrice, computeUnitLimit };
}

/**
 * Parses a Solana block and analyzes transaction ordering vs compute unit price.
 */
export function parseBlockForOrdering(
  slot: number,
  block: VersionedBlockResponse,
  validatorName: string,
  clientType: ValidatorClientType
): BlockAnalysisResult {
  const leaderIdentity = block.rewards?.find(r => r.rewardType === 'Fee')?.pubkey || 'UnknownLeader';
  const transactions: ParsedBlockTx[] = [];

  const rawTxs = block.transactions || [];

  for (let idx = 0; idx < rawTxs.length; idx++) {
    const txObj = rawTxs[idx];
    const signature = txObj.transaction.signatures[0] || 'UnknownSig';
    const isSuccessful = txObj.meta?.err === null;
    const feeLamports = txObj.meta?.fee || 5000;

    // Resolve account keys (handles address table lookups)
    let accountKeys: string[] = [];
    if ('staticAccountKeys' in txObj.transaction.message) {
      accountKeys = txObj.transaction.message.staticAccountKeys.map(k => k.toBase58());
      // Loaded addresses from ALTs if present
      if (txObj.meta?.loadedAddresses) {
        accountKeys.push(...txObj.meta.loadedAddresses.writable.map(k => k.toBase58()));
        accountKeys.push(...txObj.meta.loadedAddresses.readonly.map(k => k.toBase58()));
      }
    } else {
      accountKeys = (txObj.transaction.message as any).accountKeys.map((k: any) =>
        typeof k === 'string' ? k : k.toBase58()
      );
    }

    const { computeUnitPriceMicroLamports, computeUnitLimit } = extractComputeBudget(
      txObj.transaction.message.compiledInstructions,
      accountKeys
    );

    // Number of write-locked accounts
    const header = txObj.transaction.message.header;
    const writeLockedCount = (header?.numRequiredSignatures || 0) + (header?.numReadonlySignedAccounts || 0);

    transactions.push({
      indexInBlock: idx,
      signature,
      feeLamports,
      computeUnitPriceMicroLamports,
      computeUnitLimit,
      isSuccessful,
      numInstructions: txObj.transaction.message.compiledInstructions.length,
      writeLockedAccountsCount: writeLockedCount
    });
  }

  // Filter txs with priority fees for correlation analysis
  const txsWithPriority = transactions.filter(t => t.computeUnitPriceMicroLamports > 0);
  const txsWithPriorityCount = txsWithPriority.length;

  const priorityPrices = transactions.map(t => t.computeUnitPriceMicroLamports);
  const blockIndices = transactions.map(t => t.indexInBlock);

  // Compute Spearman rank correlation between price and block index
  const { rho, pValueApprox } = calculateSpearmanRankCorrelation(priorityPrices, blockIndices);

  // Calculate median priority fee
  const sortedFees = [...priorityPrices].sort((a, b) => a - b);
  const medianPriorityFee = sortedFees.length > 0 ? sortedFees[Math.floor(sortedFees.length / 2)] : 0;

  // Rule classification:
  // Note: Since index 0 is first, higher price at index 0 => negative correlation
  let orderingRuleDetected: BlockAnalysisResult['orderingRuleDetected'] = 'Uncorrelated-Noise';
  if (rho <= -0.55 && pValueApprox < 0.05) {
    orderingRuleDetected = 'Strict-Priority';
  } else if (rho < -0.25) {
    orderingRuleDetected = 'Weak-Priority';
  } else if (Math.abs(rho) <= 0.25) {
    orderingRuleDetected = 'FIFO/Round-Robin';
  }

  return {
    slot,
    blockTime: block.blockTime ?? null,
    leaderIdentity,
    validatorName,
    clientType,
    totalTransactions: transactions.length,
    analyzedTransactions: transactions.length,
    txsWithPriorityFee: txsWithPriorityCount,
    medianPriorityFee,
    spearmanRho: rho,
    pValueEstimate: pValueApprox,
    orderingRuleDetected,
    transactions
  };
}

/**
 * Fetches and analyzes a specific block slot from RPC with error resilience.
 */
export async function fetchAndAnalyzeSlot(
  connection: Connection,
  slot: number,
  validatorName: string,
  clientType: ValidatorClientType
): Promise<BlockAnalysisResult | null> {
  try {
    const block = await connection.getBlock(slot, {
      maxSupportedTransactionVersion: 1 as any,
      rewards: true,
      transactionDetails: 'full'
    });

    if (!block) return null;

    return parseBlockForOrdering(slot, block, validatorName, clientType);
  } catch (error: any) {
    console.error(`[BlockParser] Error reading slot ${slot}: ${error?.message || error}`);
    return null;
  }
}
