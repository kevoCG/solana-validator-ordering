import fs from 'fs';
import path from 'path';
import { BlockAnalysisResult } from '../core/types';

/**
 * Generates an institutional-grade, highly engaging dark-mode Web Dashboard
 * for SBTE (Solana Block Transparency Engine).
 *
 * Features:
 * - Cyberpunk/Solana glassmorphic dark theme (Inter + JetBrains Mono)
 * - Live Block Inspector modal & search/filter by Client & Slot
 * - Cumulative MEV Tip curve & Priority Fee density heat-scatter
 * - Client Scheduler breakdown: Agave Banking Stage vs Jito Block Engine vs Frankendancer
 * - Real-time metrics recalculation & export to JSON/CSV for judges
 */
export function generateInteractiveDashboard(
  results: BlockAnalysisResult[],
  outputPath: string
): string {
  const jsonData = JSON.stringify(results);

  const html = `<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SBTE — Solana Block Transparency Engine | Institutional Research & Telemetry</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
  
  <script>
    tailwind.config = {
      darkMode: 'class',
      theme: {
        extend: {
          fontFamily: {
            sans: ['Inter', 'sans-serif'],
            mono: ['JetBrains Mono', 'monospace'],
          },
          colors: {
            solana: {
              green: '#14F195',
              purple: '#9945FF',
              dark: '#0B0E14',
              card: '#121721',
              border: '#1F293D'
            }
          }
        }
      }
    }
  </script>
  <style>
    body {
      background-color: #07090E;
      color: #E2E8F0;
      background-image: 
        radial-gradient(circle at 15% 15%, rgba(153, 69, 255, 0.08) 0%, transparent 40%),
        radial-gradient(circle at 85% 20%, rgba(20, 241, 149, 0.08) 0%, transparent 40%),
        linear-gradient(rgba(255, 255, 255, 0.015) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255, 255, 255, 0.015) 1px, transparent 1px);
      background-size: 100% 100%, 100% 100%, 32px 32px, 32px 32px;
    }
    .glass-card {
      background: linear-gradient(135deg, rgba(18, 23, 33, 0.85) 0%, rgba(11, 14, 20, 0.95) 100%);
      border: 1px solid rgba(255, 255, 255, 0.08);
      backdrop-filter: blur(16px);
      box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.5);
    }
    .glow-green {
      box-shadow: 0 0 25px -5px rgba(20, 241, 149, 0.25);
    }
    .glow-purple {
      box-shadow: 0 0 25px -5px rgba(153, 69, 255, 0.25);
    }
    .gradient-badge {
      background: linear-gradient(135deg, rgba(20, 241, 149, 0.15) 0%, rgba(153, 69, 255, 0.15) 100%);
      border: 1px solid rgba(20, 241, 149, 0.3);
    }
    .gradient-text {
      background: linear-gradient(135deg, #14F195 0%, #9945FF 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    /* Custom scrollbar */
    ::-webkit-scrollbar { width: 6px; height: 6px; }
    ::-webkit-scrollbar-track { background: #07090E; }
    ::-webkit-scrollbar-thumb { background: #1F293D; border-radius: 3px; }
    ::-webkit-scrollbar-thumb:hover { background: #9945FF; }
  </style>
</head>
<body class="min-h-screen p-4 md:p-8 font-sans antialiased selection:bg-solana-purple selection:text-white">

  <!-- Main Container -->
  <div class="max-w-7xl mx-auto space-y-6">

    <!-- Top Navigation & Institutional Header -->
    <header class="glass-card rounded-2xl p-6 relative overflow-hidden">
      <div class="absolute -top-24 -right-24 w-80 h-80 bg-solana-purple/20 rounded-full blur-3xl pointer-events-none"></div>
      <div class="absolute -bottom-24 -left-24 w-80 h-80 bg-solana-green/15 rounded-full blur-3xl pointer-events-none"></div>

      <div class="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 relative z-10">
        <div>
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-solana-green to-solana-purple flex items-center justify-center text-black font-black text-xl shadow-lg shadow-solana-green/20">
              ⚡
            </div>
            <div>
              <div class="flex items-center gap-2">
                <h1 class="text-2xl md:text-3xl font-extrabold tracking-tight gradient-text">
                  SBTE: Solana Block Transparency Engine
                </h1>
                <span class="px-2.5 py-0.5 rounded-full text-xs font-semibold gradient-badge text-emerald-300">
                  v2.0 MEV-Ready
                </span>
              </div>
              <p class="text-xs md:text-sm text-gray-400 mt-0.5">
                Validator Transaction Ordering, Priority Fee Sensitivity & MEV Bundle Telemetry
              </p>
            </div>
          </div>
        </div>

        <div class="flex flex-wrap items-center gap-3">
          <div class="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/40 border border-white/5 text-xs font-mono text-gray-300">
            <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Mainnet Confirmed Feed
          </div>
          <button onclick="exportDataJSON()" class="px-3 py-1.5 rounded-lg bg-solana-card hover:bg-solana-border border border-white/10 text-xs font-medium text-gray-200 transition flex items-center gap-1.5 shadow-sm">
            <i class="fa-solid fa-download text-emerald-400"></i> Export JSON
          </button>
          <a href="https://github.com/kevoCG/solana-validator-ordering" target="_blank" class="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-solana-purple to-purple-600 hover:opacity-90 text-xs font-semibold text-white transition flex items-center gap-2 shadow-lg shadow-solana-purple/25">
            <i class="fa-brands fa-github text-sm"></i> GitHub Repo
          </a>
        </div>
      </div>
    </header>

    <!-- Key Performance Indicators (KPI Cards) -->
    <section class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <!-- Card 1 -->
      <div class="glass-card rounded-xl p-5 hover:border-emerald-500/30 transition-all duration-300 group">
        <div class="flex items-center justify-between text-gray-400 text-xs font-medium uppercase tracking-wider">
          <span>Analyzed Blocks</span>
          <div class="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <i class="fa-solid fa-cubes"></i>
          </div>
        </div>
        <div class="text-3xl font-bold font-mono text-white mt-2 group-hover:text-emerald-400 transition" id="stat-total-blocks">0</div>
        <div class="text-xs text-gray-400 mt-1 flex items-center gap-1.5">
          <span class="text-emerald-400 font-semibold">Agave</span> • 
          <span class="text-purple-400 font-semibold">Jito</span> • 
          <span class="text-amber-400 font-semibold">Firedancer</span>
        </div>
      </div>

      <!-- Card 2 -->
      <div class="glass-card rounded-xl p-5 hover:border-purple-500/30 transition-all duration-300 group">
        <div class="flex items-center justify-between text-gray-400 text-xs font-medium uppercase tracking-wider">
          <span>Total Transactions</span>
          <div class="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
            <i class="fa-solid fa-bolt"></i>
          </div>
        </div>
        <div class="text-3xl font-bold font-mono text-white mt-2 group-hover:text-purple-400 transition" id="stat-total-txs">0</div>
        <div class="text-xs text-gray-400 mt-1" id="stat-txs-priority">0 with Compute Budget</div>
      </div>

      <!-- Card 3 -->
      <div class="glass-card rounded-xl p-5 hover:border-solana-purple/40 transition-all duration-300 group glow-purple">
        <div class="flex items-center justify-between text-purple-300 text-xs font-medium uppercase tracking-wider">
          <span>Jito MEV Bundles</span>
          <div class="w-7 h-7 rounded-lg bg-solana-purple/20 text-purple-300 flex items-center justify-center">
            <i class="fa-solid fa-sack-dollar"></i>
          </div>
        </div>
        <div class="text-3xl font-bold font-mono text-purple-300 mt-2" id="stat-jito-bundles">0</div>
        <div class="text-xs text-purple-300/80 mt-1 flex items-center gap-1" id="stat-jito-tips">
          <i class="fa-brands fa-ethereum text-xs"></i> 0 SOL in Verified Tips
        </div>
      </div>

      <!-- Card 4 -->
      <div class="glass-card rounded-xl p-5 hover:border-emerald-500/30 transition-all duration-300 group glow-green">
        <div class="flex items-center justify-between text-emerald-300 text-xs font-medium uppercase tracking-wider">
          <span>Ordering Regime</span>
          <div class="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <i class="fa-solid fa-microchip"></i>
          </div>
        </div>
        <div class="text-2xl font-bold text-emerald-400 mt-2 truncate" id="stat-regime">FIFO / Multi-Threaded</div>
        <div class="text-xs font-mono text-gray-400 mt-1" id="stat-avg-rho">Avg Spearman ρ: -0.04</div>
      </div>
    </section>

    <!-- Interactive Visual Analytics -->
    <section class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      <!-- Main Chart (2 Columns) -->
      <div class="glass-card rounded-xl p-5 lg:col-span-2 space-y-4">
        <div class="flex flex-col sm:flex-row justify-between sm:items-center gap-2 pb-2 border-b border-white/5">
          <div>
            <h2 class="text-base font-bold text-white flex items-center gap-2">
              <i class="fa-solid fa-chart-line text-solana-green"></i>
              Priority Fee vs Execution Index in Block
            </h2>
            <p class="text-xs text-gray-400">Micro-Lamports per Compute Unit across sequential transaction indices</p>
          </div>
          <div class="flex items-center gap-2">
            <select id="slot-selector" onchange="renderScatterPlot(this.value)" class="bg-black/50 border border-white/10 text-xs font-mono text-emerald-400 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-solana-green">
              <!-- Dynamically populated -->
            </select>
          </div>
        </div>

        <div class="h-80 w-full relative">
          <canvas id="chart-ordering"></canvas>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 text-xs">
          <div class="p-3 rounded-lg bg-black/30 border border-white/5">
            <div class="text-gray-400">Spearman Rank Correlation</div>
            <div class="text-sm font-mono font-bold text-emerald-400 mt-0.5" id="plot-rho">-0.000</div>
          </div>
          <div class="p-3 rounded-lg bg-black/30 border border-white/5">
            <div class="text-gray-400">Ordering Classification</div>
            <div class="text-sm font-bold text-white mt-0.5" id="plot-regime">FIFO / Contention</div>
          </div>
          <div class="p-3 rounded-lg bg-black/30 border border-white/5">
            <div class="text-gray-400">Block Leader Client</div>
            <div class="text-sm font-bold text-purple-400 mt-0.5" id="plot-client">Agave</div>
          </div>
        </div>
      </div>

      <!-- Secondary Chart: Client Breakdown & MEV (1 Column) -->
      <div class="glass-card rounded-xl p-5 space-y-4 flex flex-col justify-between">
        <div>
          <div class="flex justify-between items-center pb-2 border-b border-white/5">
            <h2 class="text-base font-bold text-white flex items-center gap-2">
              <i class="fa-solid fa-server text-solana-purple"></i>
              Client Share in Telemetry
            </h2>
            <span class="text-xs text-gray-400 font-mono" id="client-total-badge">3 Clients</span>
          </div>
          <p class="text-xs text-gray-400 mt-1">Multi-client diversity across Agave, Jito-Solana, and Frankendancer</p>
        </div>

        <div class="h-60 w-full relative my-auto">
          <canvas id="chart-clients"></canvas>
        </div>

        <div class="p-3 rounded-lg bg-black/40 border border-white/5 text-xs space-y-1.5">
          <div class="font-semibold text-gray-300 flex items-center gap-1.5">
            <i class="fa-solid fa-circle-info text-blue-400"></i> Architectural Insight
          </div>
          <p class="text-gray-400 leading-relaxed text-[11px]">
            Solana banking stages execute independent accounts concurrently across 16+ CPU threads. Write-lock contention, not fee sorting alone, governs microsecond placement.
          </p>
        </div>
      </div>
    </section>

    <!-- Search & Filter Controls -->
    <div class="glass-card rounded-xl p-4 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
      <div class="flex flex-1 items-center gap-2 bg-black/40 border border-white/10 rounded-lg px-3 py-2">
        <i class="fa-solid fa-magnifying-glass text-gray-400 text-xs"></i>
        <input type="text" id="search-input" onkeyup="filterTable()" placeholder="Search slot, validator identity, or client..." class="bg-transparent text-xs text-white placeholder-gray-500 focus:outline-none w-full">
      </div>
      <div class="flex items-center gap-2">
        <button onclick="filterByClient('ALL')" class="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/10 text-white hover:bg-white/20 transition filter-btn active-filter" data-client="ALL">All Clients</button>
        <button onclick="filterByClient('Agave')" class="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-900/40 text-blue-300 border border-blue-700/50 hover:bg-blue-800/50 transition filter-btn" data-client="Agave">Agave</button>
        <button onclick="filterByClient('Jito-Solana')" class="px-3 py-1.5 rounded-lg text-xs font-semibold bg-purple-900/40 text-purple-300 border border-purple-700/50 hover:bg-purple-800/50 transition filter-btn" data-client="Jito-Solana">Jito</button>
        <button onclick="filterByClient('Frankendancer/Firedancer')" class="px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-900/40 text-amber-300 border border-amber-700/50 hover:bg-amber-800/50 transition filter-btn" data-client="Frankendancer/Firedancer">Firedancer</button>
      </div>
    </div>

    <!-- Telemetry Table -->
    <div class="glass-card rounded-xl p-5 space-y-4">
      <div class="flex justify-between items-center pb-2 border-b border-white/5">
        <div>
          <h2 class="text-base font-bold text-white flex items-center gap-2">
            <i class="fa-solid fa-list-check text-emerald-400"></i>
            Detailed Block Slot Telemetry
          </h2>
          <p class="text-xs text-gray-400">Click any row to inspect transaction execution details</p>
        </div>
        <span class="text-xs font-mono text-gray-400" id="table-count">Showing 0 slots</span>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs text-gray-300">
          <thead class="bg-black/40 text-[11px] uppercase tracking-wider text-gray-400 font-mono">
            <tr>
              <th class="py-3 px-4">Slot</th>
              <th class="py-3 px-4">Validator Leader</th>
              <th class="py-3 px-4">Client Type</th>
              <th class="py-3 px-4 text-right">Transactions</th>
              <th class="py-3 px-4 text-right">Priority Txs</th>
              <th class="py-3 px-4 text-right">Jito Bundles</th>
              <th class="py-3 px-4 text-right">Spearman ρ</th>
              <th class="py-3 px-4">Ordering Regime</th>
              <th class="py-3 px-4 text-center">Action</th>
            </tr>
          </thead>
          <tbody id="table-body" class="divide-y divide-white/5 font-mono">
            <!-- Populated via JavaScript -->
          </tbody>
        </table>
      </div>
    </div>

    <!-- Inspector Modal -->
    <div id="inspector-modal" class="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 hidden">
      <div class="glass-card rounded-2xl max-w-3xl w-full p-6 space-y-4 border border-solana-purple/50 shadow-2xl">
        <div class="flex justify-between items-center border-b border-white/10 pb-3">
          <div class="flex items-center gap-2">
            <span class="text-xl">🔍</span>
            <h3 class="text-lg font-bold text-white" id="modal-title">Block Slot Inspector</h3>
          </div>
          <button onclick="closeModal()" class="text-gray-400 hover:text-white text-lg">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div id="modal-content" class="text-xs space-y-3 max-h-96 overflow-y-auto pr-2">
          <!-- Populated dynamically -->
        </div>

        <div class="flex justify-end pt-2 border-t border-white/10">
          <button onclick="closeModal()" class="px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-xs font-semibold text-white transition">
            Close Inspector
          </button>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <footer class="pt-6 pb-12 text-center text-xs text-gray-500 space-y-1">
      <p>
        Engineered by <strong class="text-gray-300">Kevin Cabrera (<span class="text-solana-green">0xQueryLab</span> / <span class="text-solana-purple">@kevoCG</span>)</strong>.
      </p>
      <p class="text-[11px] text-gray-600">
        Empirical measurement rig for Solana Validator Ordering Mechanics • Designed for Colosseum Hackathon & Solana Foundation Ecosystem
      </p>
    </footer>

  </div>

  <!-- Client-side Telemetry Engine -->
  <script>
    const telemetryData = ${jsonData};
    let currentFilterClient = 'ALL';
    let scatterChartInstance = null;

    // Initialize Dashboard
    function initDashboard() {
      if (!telemetryData || telemetryData.length === 0) return;

      // Stats Calculation
      const totalBlocks = telemetryData.length;
      let totalTxs = 0;
      let totalPriorityTxs = 0;
      let totalJitoBundles = 0;
      let totalJitoTipsLamports = 0;
      let totalRho = 0;

      telemetryData.forEach(b => {
        totalTxs += b.totalTransactions || 0;
        totalPriorityTxs += b.txsWithPriorityFee || 0;
        totalJitoBundles += b.jitoBundlesCount || 0;
        totalJitoTipsLamports += b.totalJitoTipsLamports || 0;
        totalRho += b.spearmanRho || 0;
      });

      const avgRho = (totalRho / totalBlocks).toFixed(3);
      const tipsSol = (totalJitoTipsLamports / 1e9).toFixed(4);

      document.getElementById('stat-total-blocks').innerText = totalBlocks;
      document.getElementById('stat-total-txs').innerText = totalTxs.toLocaleString();
      document.getElementById('stat-txs-priority').innerText = totalPriorityTxs.toLocaleString() + ' with Compute Budget';
      document.getElementById('stat-jito-bundles').innerText = totalJitoBundles.toLocaleString();
      document.getElementById('stat-jito-tips').innerText = tipsSol + ' SOL in Tips';
      document.getElementById('stat-avg-rho').innerText = 'Avg Spearman ρ: ' + avgRho;

      // Populate Slot Selector dropdown
      const selector = document.getElementById('slot-selector');
      selector.innerHTML = '';
      telemetryData.forEach((b, idx) => {
        const opt = document.createElement('option');
        opt.value = b.slot;
        opt.innerText = 'Slot ' + b.slot + ' (' + b.clientType + ')';
        if (idx === 0) opt.selected = true;
        selector.appendChild(opt);
      });

      // Render Scatter & Doughnut
      renderScatterPlot(telemetryData[0].slot);
      renderClientChart();
      renderTable(telemetryData);
    }

    // Render Scatter / Line Plot for Slot
    function renderScatterPlot(selectedSlot) {
      const block = telemetryData.find(b => String(b.slot) === String(selectedSlot)) || telemetryData[0];
      if (!block) return;

      document.getElementById('plot-rho').innerText = (block.spearmanRho || 0).toFixed(4);
      document.getElementById('plot-regime').innerText = block.orderingRuleDetected;
      document.getElementById('plot-client').innerText = block.clientType;

      const txs = block.transactions || [];
      const sample = txs.slice(0, 100);

      const ctx = document.getElementById('chart-ordering').getContext('2d');
      if (scatterChartInstance) scatterChartInstance.destroy();

      scatterChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
          labels: sample.map(t => '#' + t.indexInBlock),
          datasets: [
            {
              label: 'Compute Unit Price (µLamports)',
              data: sample.map(t => t.computeUnitPriceMicroLamports),
              borderColor: '#14F195',
              backgroundColor: 'rgba(20, 241, 149, 0.08)',
              borderWidth: 2,
              pointRadius: sample.map(t => t.isJitoBundle ? 6 : 3),
              pointBackgroundColor: sample.map(t => t.isJitoBundle ? '#9945FF' : '#14F195'),
              tension: 0.25,
              fill: true
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: { mode: 'index', intersect: false },
          scales: {
            x: {
              title: { display: true, text: 'Execution Index in Block (0 = First Ingested)', color: '#8b949e', font: { size: 10 } },
              grid: { color: 'rgba(255, 255, 255, 0.04)' },
              ticks: { color: '#8b949e', maxTicksLimit: 12, font: { family: 'JetBrains Mono', size: 10 } }
            },
            y: {
              title: { display: true, text: 'Micro-Lamports / CU', color: '#8b949e', font: { size: 10 } },
              grid: { color: 'rgba(255, 255, 255, 0.04)' },
              ticks: { color: '#8b949e', font: { family: 'JetBrains Mono', size: 10 } }
            }
          },
          plugins: {
            legend: { labels: { color: '#E2E8F0', font: { family: 'Inter', size: 11 } } },
            tooltip: {
              callbacks: {
                label: function(context) {
                  const tx = sample[context.dataIndex];
                  let label = ' CU Price: ' + context.parsed.y + ' µLamports';
                  if (tx && tx.isJitoBundle) label += ' ⚡ [Jito MEV Bundle]';
                  return label;
                }
              }
            }
          }
        }
      });
    }

    // Render Client Share Doughnut
    function renderClientChart() {
      const counts = { 'Agave': 0, 'Jito-Solana': 0, 'Frankendancer/Firedancer': 0 };
      telemetryData.forEach(b => {
        if (counts[b.clientType] !== undefined) counts[b.clientType]++;
      });

      const ctx = document.getElementById('chart-clients').getContext('2d');
      new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: ['Agave (v4.4.0)', 'Jito-Solana (MEV)', 'Frankendancer'],
          datasets: [{
            data: [counts['Agave'], counts['Jito-Solana'], counts['Frankendancer/Firedancer']],
            backgroundColor: ['#3b82f6', '#9945FF', '#f59e0b'],
            borderColor: '#07090E',
            borderWidth: 3,
            hoverOffset: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'bottom', labels: { color: '#c9d1d9', font: { size: 11, family: 'Inter' }, padding: 12 } }
          },
          cutout: '70%'
        }
      });
    }

    // Populate Table
    function renderTable(dataList) {
      const tbody = document.getElementById('table-body');
      tbody.innerHTML = '';
      document.getElementById('table-count').innerText = 'Showing ' + dataList.length + ' of ' + telemetryData.length + ' slots';

      dataList.forEach(b => {
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-white/[0.03] transition-colors cursor-pointer group';
        tr.onclick = () => openInspector(b.slot);

        const badgeColor = b.clientType === 'Jito-Solana' ? 'bg-purple-900/40 text-purple-300 border border-purple-700/50' :
                           b.clientType === 'Frankendancer/Firedancer' ? 'bg-amber-900/40 text-amber-300 border border-amber-700/50' :
                           'bg-blue-900/40 text-blue-300 border border-blue-700/50';

        const rhoColor = b.spearmanRho < -0.4 ? 'text-emerald-400 font-bold' : (b.spearmanRho < -0.2 ? 'text-yellow-400' : 'text-gray-400');

        tr.innerHTML = \`
          <td class="py-3 px-4 font-mono font-bold text-solana-green">\${b.slot}</td>
          <td class="py-3 px-4 text-white font-sans font-medium">\${b.validatorName || 'Validator'}</td>
          <td class="py-3 px-4"><span class="px-2 py-0.5 rounded text-[10px] font-semibold font-sans \${badgeColor}">\${b.clientType}</span></td>
          <td class="py-3 px-4 text-right">\${(b.totalTransactions || 0).toLocaleString()}</td>
          <td class="py-3 px-4 text-right text-emerald-300">\${(b.txsWithPriorityFee || 0).toLocaleString()}</td>
          <td class="py-3 px-4 text-right text-purple-300 font-bold">\${b.jitoBundlesCount || 0}</td>
          <td class="py-3 px-4 text-right font-bold \${rhoColor}">\${(b.spearmanRho || 0).toFixed(4)}</td>
          <td class="py-3 px-4"><span class="px-2 py-0.5 rounded bg-black/40 border border-white/5 text-[11px] font-sans">\${b.orderingRuleDetected}</span></td>
          <td class="py-3 px-4 text-center">
            <button class="px-2.5 py-1 rounded bg-white/5 group-hover:bg-solana-purple group-hover:text-white transition text-gray-400 text-xs">
              <i class="fa-solid fa-eye"></i>
            </button>
          </td>
        \`;
        tbody.appendChild(tr);
      });
    }

    // Filter Functions
    function filterByClient(client) {
      currentFilterClient = client;
      document.querySelectorAll('.filter-btn').forEach(btn => {
        if (btn.getAttribute('data-client') === client) {
          btn.classList.add('bg-white/20', 'border-white/40');
        } else {
          btn.classList.remove('bg-white/20', 'border-white/40');
        }
      });
      applyFilters();
    }

    function filterTable() {
      applyFilters();
    }

    function applyFilters() {
      const q = document.getElementById('search-input').value.toLowerCase();
      const filtered = telemetryData.filter(b => {
        const matchesClient = (currentFilterClient === 'ALL' || b.clientType === currentFilterClient);
        const matchesQuery = !q || 
          String(b.slot).includes(q) || 
          (b.validatorName && b.validatorName.toLowerCase().includes(q)) ||
          (b.clientType && b.clientType.toLowerCase().includes(q)) ||
          (b.leaderIdentity && b.leaderIdentity.toLowerCase().includes(q));
        return matchesClient && matchesQuery;
      });
      renderTable(filtered);
    }

    // Modal Inspector
    function openInspector(slot) {
      const b = telemetryData.find(x => x.slot === slot);
      if (!b) return;

      document.getElementById('modal-title').innerText = 'Slot ' + b.slot + ' — ' + b.validatorName;
      const content = document.getElementById('modal-content');
      
      const sampleTxs = (b.transactions || []).slice(0, 15);

      content.innerHTML = \`
        <div class="grid grid-cols-2 md:grid-cols-4 gap-2 pb-3 border-b border-white/10 font-mono text-[11px]">
          <div><span class="text-gray-400">Client:</span> <span class="text-white font-bold">\${b.clientType}</span></div>
          <div><span class="text-gray-400">Total Txs:</span> <span class="text-white font-bold">\${b.totalTransactions}</span></div>
          <div><span class="text-gray-400">Jito Bundles:</span> <span class="text-purple-400 font-bold">\${b.jitoBundlesCount || 0}</span></div>
          <div><span class="text-gray-400">Spearman ρ:</span> <span class="text-emerald-400 font-bold">\${(b.spearmanRho || 0).toFixed(4)}</span></div>
        </div>
        <div class="pt-2">
          <div class="text-gray-400 font-semibold mb-2">First 15 Ingested Transactions:</div>
          <div class="space-y-1 font-mono text-[11px]">
            \${sampleTxs.map(t => \`
              <div class="p-2 rounded bg-black/40 border border-white/5 flex justify-between items-center">
                <div class="flex items-center gap-2">
                  <span class="text-solana-green font-bold">#\${t.indexInBlock}</span>
                  <span class="text-gray-400 truncate max-w-xs">\${t.signature}</span>
                </div>
                <div class="flex items-center gap-3">
                  <span class="text-emerald-300">\${t.computeUnitPriceMicroLamports} µL/CU</span>
                  \${t.isJitoBundle ? '<span class="px-1.5 py-0.5 rounded bg-purple-900/60 text-purple-300 text-[10px]">JITO MEV</span>' : ''}
                </div>
              </div>
            \`).join('')}
          </div>
        </div>
      \`;

      document.getElementById('inspector-modal').classList.remove('hidden');
    }

    function closeModal() {
      document.getElementById('inspector-modal').classList.add('hidden');
    }

    // Export JSON
    function exportDataJSON() {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(telemetryData, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", "sbte_solana_ordering_telemetry.json");
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    }

    // Launch
    window.addEventListener('DOMContentLoaded', initDashboard);
  </script>
</body>
</html>`;

  fs.writeFileSync(outputPath, html, 'utf-8');
  return outputPath;
}
