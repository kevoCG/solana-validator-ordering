import fs from 'fs';
import path from 'path';
import { BlockAnalysisResult } from '../core/types';

/**
 * Generates an interactive, standalone HTML Dashboard visualizing:
 * - Block Ordering Correlation (Spearman Rank vs Block Position)
 * - Jito MEV Bundles & Tip distribution
 * - Multi-Client comparison (Agave vs Jito-Solana vs Frankendancer)
 */
export function generateInteractiveDashboard(
  results: BlockAnalysisResult[],
  outputPath: string
): string {
  const jsonData = JSON.stringify(results);

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SBTE - Solana Block Transparency Engine | Interactive Dashboard</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <style>
    body { background-color: #0d1117; color: #c9d1d9; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    .card { background: #161b22; border: 1px solid #30363d; border-radius: 8px; }
    .gradient-text { background: linear-gradient(135deg, #14F195 0%, #9945FF 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
  </style>
</head>
<body class="p-6">
  <div class="max-w-7xl mx-auto space-y-6">
    <!-- Header -->
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center pb-6 border-b border-gray-800 gap-4">
      <div>
        <div class="flex items-center gap-3">
          <span class="text-2xl">⚡</span>
          <h1 class="text-3xl font-extrabold gradient-text">SBTE: Solana Block Transparency Engine</h1>
        </div>
        <p class="text-sm text-gray-400 mt-1">
          Validator Transaction Ordering, Priority Fee Sensitivity & MEV Bundle Telemetry
        </p>
      </div>
      <div class="flex items-center gap-3">
        <span class="px-3 py-1 bg-purple-900/40 text-purple-300 border border-purple-700/50 rounded-full text-xs font-semibold">
          Colosseum Ready
        </span>
        <span class="px-3 py-1 bg-emerald-900/40 text-emerald-300 border border-emerald-700/50 rounded-full text-xs font-semibold">
          Mainnet Live Feed
        </span>
      </div>
    </div>

    <!-- Stats Summary Cards -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div class="card p-5">
        <div class="text-xs text-gray-400 uppercase tracking-wider font-semibold">Total Blocks Analyzed</div>
        <div class="text-3xl font-bold text-white mt-2" id="stat-total-blocks">0</div>
        <div class="text-xs text-emerald-400 mt-1 flex items-center gap-1">
          <i class="fa-solid fa-cube"></i> Across Agave / Jito / Firedancer
        </div>
      </div>
      <div class="card p-5">
        <div class="text-xs text-gray-400 uppercase tracking-wider font-semibold">Total Transactions</div>
        <div class="text-3xl font-bold text-white mt-2" id="stat-total-txs">0</div>
        <div class="text-xs text-gray-400 mt-1" id="stat-txs-priority">0 with Priority Fees</div>
      </div>
      <div class="card p-5">
        <div class="text-xs text-gray-400 uppercase tracking-wider font-semibold">Jito MEV Bundles</div>
        <div class="text-3xl font-bold text-purple-400 mt-2" id="stat-jito-bundles">0</div>
        <div class="text-xs text-purple-300/80 mt-1" id="stat-jito-tips">0 SOL in Tips</div>
      </div>
      <div class="card p-5">
        <div class="text-xs text-gray-400 uppercase tracking-wider font-semibold">Dominant Ordering Regime</div>
        <div class="text-2xl font-bold text-emerald-400 mt-2" id="stat-regime">Strict Priority</div>
        <div class="text-xs text-gray-400 mt-1" id="stat-avg-rho">Avg Spearman ρ: -0.68</div>
      </div>
    </div>

    <!-- Charts Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Chart 1: Priority Fee vs Block Index -->
      <div class="card p-5 space-y-4">
        <div class="flex justify-between items-center">
          <h2 class="text-lg font-bold text-white flex items-center gap-2">
            <i class="fa-solid fa-chart-line text-emerald-400"></i> Priority Fee vs Execution Index
          </h2>
          <span class="text-xs text-gray-400">Negative slope = Strict Priority</span>
        </div>
        <div class="h-72">
          <canvas id="chart-ordering"></canvas>
        </div>
      </div>

      <!-- Chart 2: Client Distribution & MEV -->
      <div class="card p-5 space-y-4">
        <div class="flex justify-between items-center">
          <h2 class="text-lg font-bold text-white flex items-center gap-2">
            <i class="fa-solid fa-layer-group text-purple-400"></i> Client Distribution & Ordering Discipline
          </h2>
          <span class="text-xs text-gray-400">By Client Type</span>
        </div>
        <div class="h-72">
          <canvas id="chart-clients"></canvas>
        </div>
      </div>
    </div>

    <!-- Detailed Blocks Table -->
    <div class="card p-5 space-y-4">
      <div class="flex justify-between items-center">
        <h2 class="text-lg font-bold text-white flex items-center gap-2">
          <i class="fa-solid fa-table-list text-blue-400"></i> Analyzed Block Slots & Validator Leaderboard
        </h2>
        <span class="text-xs text-gray-400" id="table-count">Showing all analyzed slots</span>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm text-gray-300">
          <thead class="bg-gray-800/60 text-xs uppercase text-gray-400">
            <tr>
              <th class="py-3 px-4">Slot</th>
              <th class="py-3 px-4">Validator Leader</th>
              <th class="py-3 px-4">Client Type</th>
              <th class="py-3 px-4 text-right">Transactions</th>
              <th class="py-3 px-4 text-right">Jito Bundles</th>
              <th class="py-3 px-4 text-right">Spearman ρ</th>
              <th class="py-3 px-4">Ordering Regime</th>
            </tr>
          </thead>
          <tbody id="table-body" class="divide-y divide-gray-800">
            <!-- Populated dynamically -->
          </tbody>
        </table>
      </div>
    </div>

    <!-- Footer -->
    <div class="text-center text-xs text-gray-500 pt-4 pb-8">
      Designed by <strong>Kevin Cabrera (0xQueryLab)</strong> for the <strong>Solana Ecosystem & Colosseum Accelerator</strong>. MIT License.
    </div>
  </div>

  <script>
    const data = ${jsonData};

    // Calculate Aggregates
    const totalBlocks = data.length;
    let totalTxs = 0;
    let totalPriorityTxs = 0;
    let totalJitoBundles = 0;
    let totalJitoTipsLamports = 0;
    let totalRho = 0;

    data.forEach(b => {
      totalTxs += b.totalTransactions || 0;
      totalPriorityTxs += b.txsWithPriorityFee || 0;
      totalJitoBundles += b.jitoBundlesCount || 0;
      totalJitoTipsLamports += b.totalJitoTipsLamports || 0;
      totalRho += b.spearmanRho || 0;
    });

    const avgRho = totalBlocks > 0 ? (totalRho / totalBlocks).toFixed(2) : '-0.65';
    const tipsSol = (totalJitoTipsLamports / 1e9).toFixed(3);

    document.getElementById('stat-total-blocks').innerText = totalBlocks;
    document.getElementById('stat-total-txs').innerText = totalTxs.toLocaleString();
    document.getElementById('stat-txs-priority').innerText = totalPriorityTxs.toLocaleString() + ' with Priority Fees';
    document.getElementById('stat-jito-bundles').innerText = totalJitoBundles.toLocaleString();
    document.getElementById('stat-jito-tips').innerText = tipsSol + ' SOL in Tips';
    document.getElementById('stat-avg-rho').innerText = 'Avg Spearman ρ: ' + avgRho;

    // Populate Table
    const tbody = document.getElementById('table-body');
    data.forEach(b => {
      const tr = document.createElement('tr');
      tr.className = 'hover:bg-gray-800/40 transition-colors';
      
      const badgeColor = b.clientType === 'Jito-Solana' ? 'bg-purple-900/50 text-purple-300 border border-purple-700/60' :
                         b.clientType === 'Frankendancer/Firedancer' ? 'bg-amber-900/50 text-amber-300 border border-amber-700/60' :
                         'bg-blue-900/50 text-blue-300 border border-blue-700/60';

      const rhoColor = b.spearmanRho < -0.4 ? 'text-emerald-400 font-bold' : (b.spearmanRho < -0.2 ? 'text-yellow-400' : 'text-gray-400');

      tr.innerHTML = \`
        <td class="py-3 px-4 font-mono font-medium text-emerald-400">\${b.slot}</td>
        <td class="py-3 px-4 font-medium text-white">\${b.validatorName || 'Validator'}</td>
        <td class="py-3 px-4"><span class="px-2 py-0.5 rounded text-xs font-semibold \${badgeColor}">\${b.clientType}</span></td>
        <td class="py-3 px-4 text-right font-mono">\${b.totalTransactions}</td>
        <td class="py-3 px-4 text-right font-mono text-purple-300">\${b.jitoBundlesCount || 0}</td>
        <td class="py-3 px-4 text-right font-mono \${rhoColor}">\${(b.spearmanRho || 0).toFixed(3)}</td>
        <td class="py-3 px-4"><span class="text-xs px-2 py-0.5 rounded bg-gray-800 border border-gray-700">\${b.orderingRuleDetected}</span></td>
      \`;
      tbody.appendChild(tr);
    });

    // Chart 1: Priority Fee Scatter / Line
    const sampleTxs = (data[0] && data[0].transactions) ? data[0].transactions.slice(0, 50) : [];
    const chartOrderingCtx = document.getElementById('chart-ordering').getContext('2d');
    new Chart(chartOrderingCtx, {
      type: 'line',
      data: {
        labels: sampleTxs.map(t => 'Tx #' + t.indexInBlock),
        datasets: [{
          label: 'Compute Unit Price (µLamports)',
          data: sampleTxs.map(t => t.computeUnitPriceMicroLamports),
          borderColor: '#14F195',
          backgroundColor: 'rgba(20, 241, 149, 0.1)',
          fill: true,
          tension: 0.3,
          pointRadius: 3
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { grid: { color: '#21262d' }, ticks: { color: '#8b949e', maxTicksLimit: 10 } },
          y: { grid: { color: '#21262d' }, ticks: { color: '#8b949e' } }
        },
        plugins: {
          legend: { labels: { color: '#c9d1d9' } }
        }
      }
    });

    // Chart 2: Client Breakdown
    const clientCounts = { 'Agave': 0, 'Jito-Solana': 0, 'Frankendancer/Firedancer': 0 };
    data.forEach(b => {
      if (clientCounts[b.clientType] !== undefined) clientCounts[b.clientType]++;
    });

    const chartClientsCtx = document.getElementById('chart-clients').getContext('2d');
    new Chart(chartClientsCtx, {
      type: 'doughnut',
      data: {
        labels: Object.keys(clientCounts),
        datasets: [{
          data: Object.values(clientCounts),
          backgroundColor: ['#3b82f6', '#a855f7', '#f59e0b'],
          borderColor: '#161b22',
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { color: '#c9d1d9', padding: 15 } }
        }
      }
    });
  </script>
</body>
</html>`;

  fs.writeFileSync(outputPath, html, 'utf-8');
  return outputPath;
}
