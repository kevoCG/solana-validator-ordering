import { Connection } from '@solana/web3.js';
import { TargetValidator } from './types';

export interface TargetSlotSchedule {
  slot: number;
  leaderIdentity: string;
  validator: TargetValidator;
}

/**
 * Finds recent or upcoming slots assigned to the target validators.
 */
export async function findSlotsForValidators(
  connection: Connection,
  validators: TargetValidator[],
  slotsBack: number = 300
): Promise<TargetSlotSchedule[]> {
  try {
    const currentSlot = await connection.getSlot('confirmed');
    const startSlot = Math.max(0, currentSlot - slotsBack);

    // Get slot leaders for this window
    const slotLeaders = await connection.getSlotLeaders(startSlot, slotsBack);

    const targetMap = new Map<string, TargetValidator>();
    for (const v of validators) {
      targetMap.set(v.identity, v);
    }

    const scheduled: TargetSlotSchedule[] = [];
    for (let i = 0; i < slotLeaders.length; i++) {
      const slot = startSlot + i;
      const leaderPubkey = slotLeaders[i].toBase58();

      const matchedValidator = targetMap.get(leaderPubkey);
      if (matchedValidator) {
        scheduled.push({
          slot,
          leaderIdentity: leaderPubkey,
          validator: matchedValidator
        });
      }
    }

    return scheduled;
  } catch (error: any) {
    console.warn(`[LeaderSchedule] Error retrieving slot leaders: ${error.message}`);
    return [];
  }
}
