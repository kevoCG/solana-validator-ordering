import { Connection, Keypair, VersionedTransaction } from '@solana/web3.js';
import { CONFIG } from '../config/constants';

export interface SpendTracker {
  totalSpentLamports: number;
  maxCapLamports: number;
  txsDispatched: number;
}

export class TransactionDispatcher {
  private tracker: SpendTracker;

  constructor(maxCapSol: number = CONFIG.MAX_SPEND_CAP_SOL) {
    this.tracker = {
      totalSpentLamports: 0,
      maxCapLamports: Math.round(maxCapSol * 1e9),
      txsDispatched: 0
    };
  }

  public getStatus(): SpendTracker {
    return { ...this.tracker };
  }

  /**
   * Enforces spend cap and handles dry-run vs live dispatch.
   */
  public async dispatchTransaction(
    connection: Connection,
    tx: VersionedTransaction,
    estimatedFeeLamports: number,
    isDryRun: boolean = true
  ): Promise<{ signature?: string; simulated: boolean; allowed: boolean; reason?: string }> {
    // Check spend cap
    if (this.tracker.totalSpentLamports + estimatedFeeLamports > this.tracker.maxCapLamports) {
      return {
        simulated: isDryRun,
        allowed: false,
        reason: `Exceeds spend cap: attempted ${this.tracker.totalSpentLamports + estimatedFeeLamports} lamports > max ${this.tracker.maxCapLamports} lamports (${CONFIG.MAX_SPEND_CAP_SOL} SOL)`
      };
    }

    if (isDryRun) {
      // Dry-run mode: Simulate execution without broadcasting on-chain
      this.tracker.totalSpentLamports += estimatedFeeLamports;
      this.tracker.txsDispatched++;
      return {
        simulated: true,
        allowed: true,
        signature: 'simulated_dry_run_sig_' + Buffer.from(tx.signatures[0]).toString('hex').slice(0, 16)
      };
    }

    // Live mode: Broadcast with confirmation
    try {
      const rawTx = tx.serialize();
      const signature = await connection.sendRawTransaction(rawTx, {
        skipPreflight: false,
        preflightCommitment: 'processed'
      });

      this.tracker.totalSpentLamports += estimatedFeeLamports;
      this.tracker.txsDispatched++;

      return {
        signature,
        simulated: false,
        allowed: true
      };
    } catch (error: any) {
      return {
        simulated: false,
        allowed: false,
        reason: `RPC broadcast failed: ${error.message}`
      };
    }
  }
}
