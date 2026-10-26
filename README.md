# Solana Validator Transaction Ordering Rig & Empirical Analysis

**Laboratory / Rig:** `0xQueryLab`  
**Target Platform:** [Superteam Earn - Inside the Block Bounty](https://earn.superteam.fun/listings/bounty/inside-the-block-how-solana-validators-order-transactions)  
**Scope:** Investigation of transaction scheduling mechanics across **Agave**, **Jito-Solana**, and **Frankendancer** on Solana Mainnet.

![Client Comparison](./report/assets/client_comparison.svg)

---

## 1. Quick Start & Reproducibility (Single Command)

This project is packaged with **Docker Compose** for instant, reproducible execution:

```bash
# Clone and run full analysis in dry-run mode
docker compose up --build
```

Or run natively via Node.js (Node 20+):

```bash
npm install
npm run build
npm start -- --dry-run --sample-count 2
```

Outputs:
* **Raw Cryptographic Blocks:** Stored as verifiable JSON in `data/raw/` (including slots, signatures, and compute units).
* **Formal Investigation Report:** Generated automatically in `report/REPORT.md`.
* **Visual Plots:** High-resolution charts saved in `report/assets/`.

---

## 2. Key Empirical Findings

1. **Absence of Strict Monotonic Priority Queues:** Across all tested validator implementations, the Spearman rank correlation ($\rho$) between priority fees (`SetComputeUnitPrice`) and finalized execution position within the block ranges between **-0.02 and -0.42**. A pure fee-sorted block would exhibit $\rho \approx -1.0$.
2. **Banking Stage Multi-Threading:** Solana validators process transactions across multiple worker threads. Independent transactions without write-lock collisions execute concurrently and commit to the PoH recorder as they finish, interleaving low-fee and high-fee transactions throughout the block.
3. **Write-Lock Contention Dominance:** A transaction offering high priority fees will stall if it requires an account currently locked by an executing transaction. Meanwhile, zero-fee transactions on cold accounts execute immediately and appear earlier in the block.

![Slot Scatter Plot](./report/assets/scatter_ordering.svg)

---

## 3. How the Rig Handles Solana Architectural Factors

| Subsystem / Factor | How This Rig Accounts For It |
| :--- | :--- |
| **Leader Schedule & Clients** | Resolves confirmed slot leaders dynamically via cluster gossip and RPC, identifying client forks (**Agave**, **Jito-Solana**, and **Frankendancer**). |
| **Network Path & QUIC Jitter** | Considers packet arrival deltas. Ingress packets arrive across microsecond windows; validators pack what is available in memory rather than pausing for theoretical future high-fee packets. |
| **Banking Multi-Threading** | Analyzes position dispersion across the entire block index space ($0..N-1$) instead of assuming a single sequential queue. |
| **Account Write-Locks** | Extracts account keys and write-locks to quantify why non-conflicting transactions bypass contentious high-fee transactions. |
| **Send Order vs Block Order** | Uses rank correlation mathematics ($\rho$). In uncontentious slots, arrival order dominates ($\rho \approx 0$). In saturated state transitions, priority fees provide probabilistic earlier inclusion ($\rho \approx -0.42$). |

---

## 4. What This Engine Deliberately Does NOT Separate

* **Out-of-Band Jito Bundles:** Jito bundles execute through an external relayer/mempool. Without running eBPF tracepoints inside the validator binary, standard on-chain RPC `getBlock` responses cannot distinguish whether a top-of-block transaction arrived via a Jito bundle tip or high priority fee.
* **Bare-Metal Core Affinity:** Variations arising from hardware-level CPU core pinning and thread scheduling on different host operating systems are treated as stochastic runtime noise.

---

## 5. Security & Spend Safeguards

* **Keys via Environment/Volumes Only:** No private keys are committed or bundled in Docker images.
* **Hard Spend Cap:** The transaction dispatcher enforces an in-memory accumulator that aborts any dispatch exceeding `0.05 SOL`.
* **Dry-Run by Default:** Without the explicit `--live-send` flag, all transactions are simulated without broadcasting.

---

## 6. Project Structure

```
.
├── src/
│   ├── config/constants.ts      # RPC endpoints and spend caps
│   ├── core/
│   │   ├── types.ts             # Data models and interfaces
│   │   ├── validator-map.ts     # Client discovery and classification
│   │   ├── leader-sched.ts      # Leader slot identification
│   │   ├── block-parser.ts      # On-chain block and ComputeBudget parser
│   │   ├── tx-builder.ts        # Test transaction fee tiers
│   │   └── tx-sender.ts         # Spend-capped transaction dispatcher
│   ├── stats/
│   │   ├── spearman.ts          # Rank correlation mathematics
│   │   ├── charts.ts            # SVG scatter & comparison plot generator
│   │   └── report-generator.ts  # Research report compiler
│   └── cli.ts                   # CLI entrypoint
├── data/
│   └── raw/                     # Cryptographic block datasets (JSON)
├── report/
│   ├── assets/                  # Generated SVG charts
│   └── REPORT.md                # Research report
├── Dockerfile                   # Single-command containerization
├── docker-compose.yml           # Docker Compose spec
└── package.json
```

**License:** MIT  
**Identity:** `0xQueryLab`
