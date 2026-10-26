import fs from 'fs';
import path from 'path';
import { ParsedBlockTx, ValidatorClientType } from '../core/types';

/**
 * Generates a clean, publication-grade SVG scatter plot of Transaction Position vs Priority Fee.
 */
export function generateScatterSvg(
  txs: ParsedBlockTx[],
  slot: number,
  clientType: ValidatorClientType,
  outputPath: string
): void {
  const width = 840;
  const height = 460;
  const padding = { top: 55, right: 40, bottom: 65, left: 100 };

  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;

  // Filter txs to those with priority fees > 0 for readable scatter
  const dataPoints = txs.filter(t => t.computeUnitPriceMicroLamports > 0);
  if (dataPoints.length === 0) return;

  const maxIndex = Math.max(...dataPoints.map(d => d.indexInBlock), 100);
  const maxFee = Math.max(...dataPoints.map(d => d.computeUnitPriceMicroLamports), 1000);

  // Use log10 scale for fee axis
  const minLog = 0;
  const maxLog = Math.ceil(Math.log10(Math.max(maxFee, 10)));

  const pointsSvg = dataPoints
    .map(d => {
      const x = padding.left + (d.indexInBlock / maxIndex) * plotWidth;
      const logVal = Math.log10(Math.max(1, d.computeUnitPriceMicroLamports));
      const y = padding.top + plotHeight - (logVal / maxLog) * plotHeight;
      return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3" fill="#06b6d4" opacity="0.8" />`;
    })
    .join('\n    ');

  // Y-axis grid ticks (powers of 10)
  const yTicks: string[] = [];
  for (let p = 0; p <= maxLog; p += 2) {
    const y = (padding.top + plotHeight - (p / maxLog) * plotHeight).toFixed(1);
    const label = p === 0 ? '0' : `10^${p}`;
    yTicks.push(`
      <line x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}" stroke="#334155" stroke-dasharray="3,3" />
      <text x="${padding.left - 14}" y="${(parseFloat(y) + 4).toFixed(1)}" fill="#94a3b8" font-size="11" font-family="monospace" text-anchor="end">${label}</text>
    `);
  }

  // X-axis ticks
  const xTicks: string[] = [];
  const xStep = Math.max(100, Math.floor(maxIndex / 5));
  for (let xVal = 0; xVal <= maxIndex; xVal += xStep) {
    const x = (padding.left + (xVal / maxIndex) * plotWidth).toFixed(1);
    xTicks.push(`
      <line x1="${x}" y1="${padding.top}" x2="${x}" y2="${padding.top + plotHeight}" stroke="#334155" stroke-dasharray="3,3" />
      <text x="${x}" y="${padding.top + plotHeight + 22}" fill="#94a3b8" font-size="11" font-family="monospace" text-anchor="middle">${xVal}</text>
    `);
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="100%" height="100%">
  <rect width="${width}" height="${height}" fill="#0f172a" rx="8"/>
  
  <!-- Header -->
  <text x="${padding.left}" y="32" fill="#f8fafc" font-size="15" font-weight="600" font-family="system-ui, sans-serif">
    Slot ${slot} Ordering: Position in Block vs. Priority Fee (${clientType})
  </text>
  <text x="${width - padding.right}" y="32" fill="#64748b" font-size="12" font-family="monospace" text-anchor="end">
    ${dataPoints.length} txs plotted
  </text>

  <!-- Grid & Ticks -->
  ${yTicks.join('\n')}
  ${xTicks.join('\n')}

  <!-- Axes -->
  <line x1="${padding.left}" y1="${padding.top}" x2="${padding.left}" y2="${padding.top + plotHeight}" stroke="#475569" stroke-width="1.5" />
  <line x1="${padding.left}" y1="${padding.top + plotHeight}" x2="${width - padding.right}" y2="${padding.top + plotHeight}" stroke="#475569" stroke-width="1.5" />

  <!-- Axis Labels -->
  <text x="${padding.left + plotWidth / 2}" y="${height - 18}" fill="#cbd5e1" font-size="12" font-family="system-ui, sans-serif" text-anchor="middle">
    Execution Position in Block (0 = Earliest, N = Latest)
  </text>
  <text transform="rotate(-90)" x="${-(padding.top + plotHeight / 2)}" y="28" fill="#cbd5e1" font-size="12" font-family="system-ui, sans-serif" text-anchor="middle">
    Priority Fee (μ-lamports / log10)
  </text>

  <!-- Data Scatter Points -->
  <g id="points">
    ${pointsSvg}
  </g>
</svg>`;

  fs.writeFileSync(outputPath, svg, 'utf-8');
}

/**
 * Generates an SVG bar chart comparing Spearman rho correlation across the 3 clients.
 */
export function generateClientComparisonSvg(
  metrics: { client: string; avgRho: number; color: string }[],
  outputPath: string
): void {
  const width = 760;
  const height = 350;
  const padding = { top: 65, right: 45, bottom: 50, left: 210 };

  const chartWidth = width - padding.left - padding.right;
  const barHeight = 36;
  const gap = 28;

  const bars = metrics
    .map((m, idx) => {
      const y = padding.top + idx * (barHeight + gap);
      const absVal = Math.min(1, Math.abs(m.avgRho));
      const barW = Math.max(12, absVal * chartWidth);

      return `
      <!-- Row: ${m.client} -->
      <text x="${padding.left - 18}" y="${y + barHeight / 2 + 5}" fill="#f1f5f9" font-size="13" font-family="system-ui, sans-serif" font-weight="500" text-anchor="end">
        ${m.client}
      </text>
      <rect x="${padding.left}" y="${y}" width="${barW.toFixed(1)}" height="${barHeight}" rx="5" fill="${m.color}" />
      <text x="${(padding.left + barW + 12).toFixed(1)}" y="${y + barHeight / 2 + 5}" fill="#e2e8f0" font-size="13" font-family="monospace" font-weight="600">
        ρ = ${m.avgRho.toFixed(4)}
      </text>
    `;
    })
    .join('\n');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="100%" height="100%">
  <rect width="${width}" height="${height}" fill="#0f172a" rx="8"/>
  
  <text x="${padding.left}" y="32" fill="#f8fafc" font-size="16" font-weight="600" font-family="system-ui, sans-serif">
    Mean Spearman Rank Correlation (ρ) by Client Architecture
  </text>
  <text x="${padding.left}" y="50" fill="#94a3b8" font-size="12" font-family="system-ui, sans-serif">
    More negative ρ = stronger priority fee sorting; ρ near 0 = multi-thread / arrival order noise
  </text>

  <!-- Base axis -->
  <line x1="${padding.left}" y1="${padding.top - 10}" x2="${padding.left}" y2="${height - padding.bottom}" stroke="#475569" stroke-width="1.5" />

  <!-- Bars -->
  ${bars}

  <!-- Footer annotation -->
  <text x="${padding.left}" y="${height - 18}" fill="#64748b" font-size="11" font-family="monospace">
    Measurements on Solana Mainnet (post-Alpenglow)
  </text>
</svg>`;

  fs.writeFileSync(outputPath, svg, 'utf-8');
}
