/**
 * Computes the Spearman rank correlation coefficient between two arrays of numbers.
 * In block transaction ordering:
 * - If higher priority fees land earlier (indices 0, 1, 2...), there is a negative correlation
 *   between computeUnitPrice and indexInBlock.
 * - Rho close to -1.0 indicates strong deterministic priority fee ordering.
 * - Rho close to 0 indicates banking stage thread interleaving / arrival order noise.
 */
export function calculateSpearmanRankCorrelation(x: number[], y: number[]): { rho: number; pValueApprox: number } {
  if (x.length !== y.length || x.length < 3) {
    return { rho: 0, pValueApprox: 1 };
  }

  const n = x.length;

  const rankX = getRanks(x);
  const rankY = getRanks(y);

  // Pearson correlation of ranks
  const meanX = rankX.reduce((a, b) => a + b, 0) / n;
  const meanY = rankY.reduce((a, b) => a + b, 0) / n;

  let numerator = 0;
  let denomX = 0;
  let denomY = 0;

  for (let i = 0; i < n; i++) {
    const diffX = rankX[i] - meanX;
    const diffY = rankY[i] - meanY;
    numerator += diffX * diffY;
    denomX += diffX * diffX;
    denomY += diffY * diffY;
  }

  const denominator = Math.sqrt(denomX * denomY);
  if (denominator === 0) {
    return { rho: 0, pValueApprox: 1 };
  }

  const rho = numerator / denominator;

  // Approximate t-statistic for p-value
  const t = rho * Math.sqrt((n - 2) / Math.max(1e-9, 1 - rho * rho));
  // Standard normal approximation for large n
  const pValueApprox = 2 * (1 - normalCdf(Math.abs(t)));

  return {
    rho: parseFloat(rho.toFixed(4)),
    pValueApprox: parseFloat(pValueApprox.toFixed(5))
  };
}

function getRanks(arr: number[]): number[] {
  const indexed = arr.map((val, idx) => ({ val, idx }));
  indexed.sort((a, b) => a.val - b.val);

  const ranks = new Array(arr.length);
  let i = 0;
  while (i < indexed.length) {
    let j = i;
    while (j < indexed.length - 1 && indexed[j + 1].val === indexed[j].val) {
      j++;
    }
    const tieCount = j - i + 1;
    const avgRank = (i + 1 + (j + 1)) / 2;
    for (let k = i; k <= j; k++) {
      ranks[indexed[k].idx] = avgRank;
    }
    i = j + 1;
  }
  return ranks;
}

function normalCdf(x: number): number {
  // Approximation of standard normal CDF
  const t = 1 / (1 + 0.2316419 * Math.abs(x));
  const d = 0.3989423 * Math.exp((-x * x) / 2);
  const prob = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return x > 0 ? 1 - prob : prob;
}
