<div align="center">

  <img src="https://img.shields.io/badge/MemoClaw-v1.0-blue?style=for-the-badge&logo=data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAMAAABEpIrGAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAABJQTFRF////MTAwMzMzMzMzMzMzMzMzMzMzMzMzMzMzMz///////////////////////////////////////////////////////////////////////////8nOTRvAAAAF10Uk5TAAAAAAAAAAAAAAAClZ4nOAAAAA0hSURBVHja7NVZDoMgDEbxPfP+G5cWv6ZxgFyC2sQ5k2fH3d6mO8LAAAAAElFTkSuQmCC&logo=Color" alt="MemoClaw v1.0">

  <h1>MemoClaw - Agent Memory Infrastructure</h1>

  <p>
    <strong>Long-term, multimodal, evidence-backed memory for AI agents.</strong>
  </p>

  <p>
    <strong>MemoClaw 是 AI Agent 的长期、多模态、证据型记忆层，让 AI 真正记得、会回忆、可解释、可治理。</strong>
  </p>

  <p>
    <a href="#benchmark-proof">Benchmark Proof</a> •
    <a href="#what-makes-memoclaw-different">Why MemoClaw</a> •
    <a href="#architecture">Architecture</a> •
    <a href="#quick-start">Quick Start</a> •
    <a href="./MEMOCLAW_PUBLIC_BENCHMARK_REPORT_2026-05-18.md">Benchmark Report</a> •
    <a href="./MEMOCLAW_3_MINUTE_DEMO_SCRIPT_2026-05-18.md">Demo Script</a>
  </p>

  <p>
    <a href="https://github.com/Mosqu1to3zZ/MemoClaw/stargazers">
      <img src="https://img.shields.io/github/stars/Mosqu1to3zZ/MemoClaw?style=social" alt="GitHub Stars" />
    </a>
    <a href="https://github.com/Mosqu1to3zZ/MemoClaw/network/members">
      <img src="https://img.shields.io/github/forks/Mosqu1to3zZ/MemoClaw?style=social" alt="GitHub Forks" />
    </a>
    <a href="https://github.com/Mosqu1to3zZ/MemoClaw/issues">
      <img src="https://img.shields.io/github/issues/Mosqu1to3zZ/MemoClaw" alt="GitHub Issues" />
    </a>
    <a href="https://github.com/Mosqu1to3zZ/MemoClaw/blob/main/LICENSE">
      <img src="https://img.shields.io/badge/License-Apache%202.0-blue?style=flat-square" alt="Apache-2.0" />
    </a>
  </p>

  <img src="https://img.shields.io/badge/LoCoMo-98.7%25-10b981?style=for-the-badge" alt="LoCoMo 98.7%">
  <img src="https://img.shields.io/badge/LongMemEval-95.2%25-06b6d4?style=for-the-badge" alt="LongMemEval 95.2%">
  <img src="https://img.shields.io/badge/License-Apache%202.0-blue?style=for-the-badge" alt="Apache-2.0">

</div>

---

## 🌟 About

**MemoClaw** is the long-term, multimodal, evidence-backed memory layer for AI agents.

It is built for agents that need more than a bigger context window or a vector search call. MemoClaw combines fast candidate recall, evidence-first memory reasoning, and product-grade governance so agents can remember long-running work with source visibility and control.

### Benchmark Proof

| Dataset | Main path | Judge | Total | Passed | Accuracy |
|---|---|---:|---:|---:|---:|
| LoCoMo Cat1-4 | SG-RNM -> Yijing Runtime | LLM | 1540 | 1520 | 98.7% |
| LongMemEval Full | SG-RNM + answer synthesis | LLM | 500 | 476 | 95.2% |

Combined current score: `1996 / 2040 = 97.84%`.

Public proof page: `/memory-proof` in the web app.

---

## What Makes MemoClaw Different

MemoClaw is not a generic RAG wrapper and not only a vector database.

| Layer | Role |
|---|---|
| SG-RNM | Recall and candidate generation for direct agent memory |
| Yijing Runtime | Evidence planning, verification, and answer generation |
| ProductMemory | Governance, auditability, policy, deletion, and lifecycle control |
| Multimodal Memory Graph | Text, screenshots, files, images, audio summaries, code, and project artifacts |

Core thesis:

- Memory is not context.
- Memory is not only retrieval.
- Agent memory must be evidence-backed.
- Agent memory must be governable.
- Agent memory will become multimodal.

### Primary Use Cases

- Developer and coding agents that need durable project memory.
- Personal AI assistants that need long-term user memory with controls.
- Customer support and sales agents that need customer history with evidence.
- Enterprise AI agents that need governed, auditable memory.
- Research and analysis agents that need long-running experiment memory.

---

## 🏗️ Architecture

```
Agent / App
  -> MemoClaw SDK / API
  -> SG-RNM recall and candidate generation
  -> Yijing Runtime evidence planning / verification / generation
  -> ProductMemory governance
  -> Multimodal Memory Graph
```

### Core Components

- **SG-RNM**: Fast memory recall and candidate generation.
- **Yijing Runtime**: Evidence-first memory reasoning for complex, temporal, identity-sensitive, and high-value questions.
- **ProductMemory**: Product-safe memory lifecycle, governance, deletion, audit, and policy control.
- **Web Dashboard**: Memory inspection, evidence view, API keys, benchmark visibility, and product operations.

---

## 🚀 Quick Start

### Prerequisites

- Node.js >= 16.0
- npm >= 8.0

### Installation

```bash
# Clone the repository
git clone https://github.com/Mosqu1to3zZ/MemoClaw.git
cd MemoClaw

# Install dependencies
cd server && npm install
cd ../web && npm install

# Build the frontend
cd web && npm run build

# Start the server
cd ../server && npm start
```

### Access

- **Web UI**: http://localhost:3001
- **API**: http://localhost:3001/api

### Optional Shadow Mode

To compare the current `hybrid` retrieval path with `SG-RNM` without changing user-facing results, start the server with shadow mode enabled:

```bash
MEMOCLAW_MEMORY_ENGINE_MODE=shadow \
MEMOCLAW_SHADOW_LOGGING=true \
MEMOCLAW_SHADOW_LOG_FILE=./logs/memoclaw-shadow.jsonl \
node server/server.js
```

This keeps API responses on the primary `hybrid` path while writing shadow comparisons to a local JSONL file.

Analyze the resulting shadow log:

```bash
npm run shadow:analyze -- ./logs/memoclaw-shadow.jsonl
```

Recommended checklist when reviewing the report:

- Focus on `disagreeCount` and inspect the top mismatches first
- Watch for `primaryEmptyCount > 0` because it usually signals missing lexical hits or shallow recall
- Watch for `shadowEmptyCount > 0` because it usually signals SG-RNM hydration or recall gaps
- Prioritize queries related to conflict, long context, preferences, and multi-value aggregation
- Compare `avgDurationMs` before considering any future cutover
- For aggregate queries, inspect the reported `aggregateQueries` section instead of relying on `top1` alone

Run a small end-to-end replay against the API in shadow mode:

```bash
npm run shadow:replay -- \
  http://localhost:3001 \
  your-api-key \
  ./logs/memoclaw-shadow.jsonl \
  ./logs/memoclaw-shadow-report.json
```

This script seeds a small sample dataset through the API, replays a few representative queries, and emits a combined replay + shadow-analysis report.

### Optional Candidate Fallback Trial

To keep `hybrid` as the default path while allowing `SG-RNM` to fill only empty results for a narrow set of current-state single-value queries:

```bash
MEMOCLAW_ENABLE_SGRNM_FALLBACK=true \
MEMOCLAW_FALLBACK_LOGGING=true \
MEMOCLAW_FALLBACK_LOG_FILE=./logs/memoclaw-fallback.jsonl \
node server/server.js
```

This trial does not change non-empty `hybrid` results and does not apply to aggregate queries.

Analyze the resulting fallback log:

```bash
npm run fallback:analyze -- ./logs/memoclaw-fallback.jsonl
```

Recommended checklist when reviewing the fallback report:

- Confirm `triggeredCount` only comes from `current_state_single_value`
- Confirm there are no entries in `violations`
- Inspect `reasonCounts` to ensure aggregate and open-ended queries stay blocked
- Watch `primaryNonEmptyCount` to confirm non-empty `hybrid` paths remain untouched
- Review `triggeredQueries` for top1 quality before widening the trial scope

Run a small end-to-end replay against the API in fallback mode:

```bash
npm run fallback:replay -- \
  http://localhost:3001 \
  your-api-key \
  ./logs/memoclaw-fallback.jsonl \
  ./logs/memoclaw-fallback-report.json
```

This replay covers both allowed current-state single-value queries and explicitly blocked queries, then emits a combined replay + fallback-analysis report.

---

## ⚡ Performance

### Benchmarks

| Metric | Target | Actual |
|--------|--------|--------|
| API Response Time | < 50ms | ✅ ~30ms |
| Search Response Time | < 200ms | ✅ ~150ms |
| Compression Accuracy | > 85% | ✅ ~90% |
| Token Savings | 30-50% | ✅ ~35% |
| Cache Hit Rate | > 70% | ✅ ~75% |

### Optimization Techniques

- **Redis Caching**: 5-minute TTL for statistics
- **Database Indexes**: Optimized queries
- **Code Splitting**: Lazy loading for faster initial load
- **Gzip Compression**: Reduced bundle sizes

---

## 🥊 Competitive Analysis

See our detailed [Competitive Analysis](COMPETITIVE_ANALYSIS.md) for in-depth comparison with:

- 📊 Market size and growth trends
- 🔍 Competitor breakdown (Mem0, LangChain, MemGPT, ChatGPT)
- ⚔️ Competitive matrix with feature comparison
- 🎯 MemoClaw competitive advantages
- 📈 Market positioning and go-to-market strategy

**Key Highlights**:
- ✅ **#1 in OpenClaw memory optimization**
- ✅ **30% cheaper than Mem0** (¥99 vs $20/month)
- ✅ **90%+ retrieval accuracy** (vs 75% for Mem0)
- ✅ **30-50% token savings**
- ✅ **Zero coding required** (vs. competitors)
- ✅ **Native OpenClaw integration**

**Market Opportunity**: ¥50 billion TAM, 20-25% annual growth

---

## 📖 API Documentation

### Core Endpoints

#### Statistics
```http
GET /api/stats
```

#### Memory Management
```http
GET /api/memories
POST /api/memories
DELETE /api/memories/:id
```

#### Search
```http
POST /api/memories/search
```

#### Compression
```http
POST /api/compress
```

#### Value Analysis
```http
GET /api/memories/value-scores
```

#### Archive Management
```http
POST /api/memories/batch-archive
POST /api/memories/batch-unarchive
```

---

## 🎯 Use Cases

### AI Agents
- Optimize agent memory for reduced token consumption
- Improve retrieval accuracy for better responses
- Maintain long-term context efficiently

### Knowledge Workers
- Organize and compress personal knowledge base
- Smart search for quick information retrieval
- Automated memory cleanup and optimization

### Development Teams
- Shared memory for collaborative AI projects
- Version-controlled memory snapshots
- Team-wide memory analysis and optimization

---

## 🗺️ Roadmap

### Phase 1: Current ✅
- ✅ Intelligent memory compression
- ✅ Hybrid retrieval engine
- ✅ Value scoring system
- ✅ Web UI
- ✅ REST API

### Phase 2: Q2 2026 🚧
- ⏳ Advanced compression algorithms
- ⏳ Multi-tenant architecture
- ⏳ API service open
- ⏳ Value scoring optimization

### Phase 3: Q3 2026 📋
- ⏳ OpenClaw deep integration
- ⏳ Enterprise features
- ⏳ Third-party integrations
- ⏳ Plugin system

### Phase 4: Q4 2026 📋
- ⏳ Memory-as-a-Service
- ⏳ Developer API
- ⏳ Community features
- ⏳ Global deployment

---

## 🤝 Contributing

We welcome contributions! Please check our [Contributing Guidelines](CONTRIBUTING.md) for details.

### Development Setup

```bash
# Install development dependencies
npm install

# Run development server
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

---

## 📝 License

This project is licensed under the Apache-2.0 License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- Built with [React](https://reactjs.org/), [Express](https://expressjs.com/), and [SQLite3](https://www.sqlite.org/)
- Inspired by the need for efficient AI memory management
- Powered by the amazing OpenClaw community

---

## 📧 Contact

- **Issues**: [GitHub Issues](https://github.com/Mosqu1to3zZ/MemoClaw/issues)
- **Discussions**: [GitHub Discussions](https://github.com/Mosqu1to3zZ/MemoClaw/discussions)

---

<div align="center">

  <p>
    <strong>⭐ Star this project to show your support!</strong>
  </p>
  <p>
    Made with ❤️ by the MemoClaw Team
  </p>

  <a href="#top">⬆️ Back to Top</a>

</div>
