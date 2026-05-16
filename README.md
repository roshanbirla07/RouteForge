# RouteForge

A C++-powered graph algorithm visualizer and pathfinding engine with a modern interactive graph editor.
<img width="1580" height="899" alt="image" src="https://github.com/user-attachments/assets/34014f51-e6a0-4a7f-a7c4-22a9427a452c" />
<img width="3824" height="1729" alt="image" src="https://github.com/user-attachments/assets/255571b5-2c45-46f7-8df9-122bb84eaa3e" />



---

## Overview

RouteForge combines:

* A high-performance **C++ graph engine**
* A **Node.js orchestration backend**
* A modern **React-based graph editor**
* A scalable **algorithm visualization system**

The goal is to create a platform for:

* graph algorithm exploration
* DSA visualization
* shortest path discovery
* step-by-step traversal playback
* performance benchmarking
* algorithm experimentation

---

# Core Vision

RouteForge is designed as:

```text
Graph IDE + C++ Algorithm Engine
```

The frontend exists to interact with the engine — not replace it.

The project prioritizes:

* performance
* modularity
* scalability
* clean visualization architecture
* future algorithm extensibility

---

# Features

## Interactive Graph Builder

* Add/remove nodes dynamically
* Drag nodes freely across canvas
* **Click-to-connect** edge creation mode
* Drag-to-connect for quick linking
* Weighted edges with visual feedback
* Infinite canvas feel
* Dynamic graph editing
* Source/Destination node selection
* Modern, responsive graph UI

---

## Pathfinding Algorithms

### Currently Implemented

* **Dijkstra** — guaranteed shortest path
* **A\*** — heuristic-optimized pathfinding (zero heuristic for graph generality)

### Planned

* BFS
* DFS
* Bellman Ford
* Floyd Warshall
* Prim
* Kruskal
* Strongly Connected Components
* Topological Sort
* Flow Networks

---

## Visualization & Playback

* Step-by-step algorithm execution
* Node visitation tracking
* Edge relaxation visualization
* Final path highlighting
* Play/Pause controls
* Forward/Backward stepping
* Speed control

---

# Tech Stack

| Layer            | Technology              |
| ---------------- | ----------------------- |
| Frontend         | React + Vite            |
| Graph Rendering  | React Flow              |
| State Management | Zustand                 |
| Styling          | Tailwind CSS            |
| Backend          | Node.js + Express       |
| Core Engine      | C++17                   |
| Build System     | CMake                   |
| IPC              | JSON File Communication |

---

# Architecture

```text
┌──────────────────────────┐
│      React Frontend      │
│ Graph Editor + Playback  │
└────────────┬─────────────┘
             │ REST API
┌────────────▼─────────────┐
│    Node.js + Express     │
│ Validation + Orchestration
└────────────┬─────────────┘
             │ JSON IPC (temp files)
┌────────────▼─────────────┐
│      C++ Core Engine     │
│ Dijkstra / A* / Future   │
└──────────────────────────┘
```

---

# Project Structure

```text
RouteForge/
│
├── frontend/              # React graph editor + playback UI
│   ├── src/
│   │   ├── components/    # GraphEditor, GraphNode, EdgeComponent
│   │   ├── store/         # Zustand stores (graph, UI, playback)
│   │   ├── api/           # routeApi (REST client)
│   │   └── styles/        # Tailwind + custom CSS
│   ├── vite.config.js     # Vite config with HMR + proxy
│   └── package.json
│
├── backend/               # Express API server
│   ├── controllers/       # routeController (validation)
│   ├── services/          # routeService (IPC orchestration)
│   ├── routes/
│   ├── middleware/
│   └── server.js
│
├── cpp-engine/            # C++ pathfinding core
│   ├── src/
│   │   ├── main.cpp       # CLI entry point (accepts file paths)
│   │   ├── graph.cpp      # Graph data structure
│   │   ├── dijkstra.cpp   # Dijkstra implementation
│   │   └── astar.cpp      # A* with zero heuristic
│   ├── include/           # Headers (.h files)
│   ├── CMakeLists.txt     # CMake build config
│   └── build/             # Compiled binary output
│
└── README.md
```

---

# Execution Flow

```text
Frontend (React)
   ↓ POST /route
Backend (Express)
   ↓ validates input
Creates temp files
   ↓ unique per request (no race conditions)
Executes C++ binary
   ↓ ./route_planner <input.json> <output.json>
Reads result.json
   ↓ cleans up temp files
Returns visualization data
   ↓
Frontend renders path
   ↓ playback events
User steps through algorithm
```

---

# Installation

## 1. Clone Repository

```bash
git clone <repo-url>
cd RouteForge
```

---

## 2. Build C++ Engine

### Prerequisites

* **CMake** (3.10+) — [Download](https://cmake.org/download/)
* **C++ Compiler** (GCC/Clang/MSVC)

### Windows (PowerShell)

```powershell
cd cpp-engine
mkdir build -ErrorAction SilentlyContinue
cd build
cmake ..
cmake --build . --config Release
```

### macOS/Linux

```bash
cd cpp-engine
mkdir -p build
cd build
cmake ..
make
```

Binary output: `cpp-engine/build/route_planner` (or `.exe` on Windows)

---

## 3. Backend Setup

```bash
cd backend
npm install
npm run dev
```

Backend runs on: `http://localhost:3000`

**Environment Variables:**
```env
PORT=3000
NODE_ENV=development
```

---

## 4. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on: `http://localhost:5173`

**Features:**
* Vite dev proxy to backend (`/route` → `http://localhost:3000`)
* HMR (Hot Module Replacement) enabled
* No CORS issues in dev mode

---

# API Reference

## POST `/route`

Create and visualize a route using the specified algorithm.

### Request Body

```json
{
  "vertices": 6,
  "edges": [
    { "from": 0, "to": 1, "weight": 4 },
    { "from": 1, "to": 2, "weight": 3 },
    { "from": 2, "to": 5, "weight": 1 },
    { "from": 0, "to": 3, "weight": 2 },
    { "from": 3, "to": 5, "weight": 5 }
  ],
  "source": 0,
  "destination": 5,
  "algorithm": "dijkstra"
}
```

### Response

```json
{
  "path": [0, 1, 2, 5],
  "distance": 8,
  "events": [
    { "type": "visit_node", "nodeId": 0 },
    { "type": "relax_edge", "edgeId": "0-1" },
    { "type": "visit_node", "nodeId": 1 },
    { "type": "relax_edge", "edgeId": "1-2" },
    { "type": "visit_node", "nodeId": 2 },
    { "type": "relax_edge", "edgeId": "2-5" },
    { "type": "visit_node", "nodeId": 5 },
    { "type": "path_found", "path": [0, 1, 2, 5], "distance": 8, "pathEdgeIds": ["0-1", "1-2", "2-5"] }
  ]
}
```

### Parameters

| Parameter   | Type     | Required | Description                        |
| ----------- | -------- | -------- | ---------------------------------- |
| vertices    | integer  | ✓        | Number of nodes (0 to vertices-1)  |
| edges       | array    | ✓        | Edge objects with from/to/weight   |
| source      | integer  | ✓        | Start node ID                      |
| destination | integer  | ✓        | End node ID                        |
| algorithm   | string   | ✓        | "dijkstra" or "astar"              |

---

# Recent Updates (v0.2.0)

## 🔴 Critical Fixes

1. **Click-to-Connect UX** — Added state machine for edge creation
   - First click sets source node
   - Second click on different node creates edge
   - Escape key cancels selection

2. **Race Condition Fix** — Concurrent requests now use unique temp files
   - Each request gets `rf_<timestamp>_<random>_input.json`
   - Prevents data corruption on simultaneous calls
   - Automatic cleanup in finally block

3. **A* Heuristic Fix** — Zero heuristic guarantees optimality
   - Replaced meaningless node-index heuristic
   - Now equivalent to Dijkstra (safe for graph-agnostic use)
   - Ready for spatial heuristic upgrade when coords available

4. **Binary CLI Args** — C++ engine now accepts file paths
   - `./route_planner <input> <output>` instead of hardcoded paths
   - Backward compatible with legacy mode

## 🟡 Improvements

1. **Vite Proxy** — No CORS issues in development
   - `/route` proxied to backend automatically
   - No env vars needed

2. **Playback Engine** — Full event handling
   - `visit_node`, `relax_edge`, `path_found` events
   - Step forward/backward with state restoration
   - Energized edges highlighting

3. **Handle Sizing** — Increased from 12px to 16px
   - Much easier to grab for drag-to-connect

4. **Visual Feedback** — Source node shows "FROM →" badge
   - Blue border + glow when selected
   - Clear UX feedback

---

# Current Status

## ✅ Completed

* Interactive graph editor with click-to-connect
* Dynamic node/edge creation
* Weighted edge support
* Backend validation layer
* Dijkstra algorithm
* A* algorithm (zero heuristic)
* C++ compilation via CMake
* Per-request temp file IPC
* Step-by-step playback
* Event-based visualization
* Visual path highlighting
* Source node selection UI

## 🚧 In Progress

* Advanced graph interactions
* Multi-graph support
* Algorithm comparison mode
* Performance profiling UI

## 📋 Planned

* Remaining algorithms (BFS, DFS, etc.)
* Large-scale graph benchmarking
* WebAssembly C++ engine
* Dark mode UI
* Export/import graphs
* Collaboration features

---

# Why C++?

RouteForge is intentionally C++-heavy because:

* **Performance** — Handle large graphs at scale
* **STL** — Powerful graph data structures
* **Competitive Programming Ecosystem** — Aligns with DSA workflows
* **Portability** — Compile to WebAssembly, native binaries, etc.
* **Future Extensibility** — Systems-level optimizations

---

# Troubleshooting

### CMake not found

Install CMake: https://cmake.org/download/

### Port 3000 or 5173 already in use

Kill the process:

**Windows:**
```powershell
Get-Process -Name node | Stop-Process -Force
```

**macOS/Linux:**
```bash
lsof -ti:3000 | xargs kill -9
```

### "Binary not found" error

Rebuild the C++ engine:

```bash
cd cpp-engine/build
cmake ..
cmake --build . --config Release
```

### WebSocket connection failed

Restart frontend with proper HMR config:

```bash
cd frontend
npm run dev
```

---

# Long-Term Vision

RouteForge aims to evolve into:

* **Graph Systems Playground** — Experiment with algorithms safely
* **Algorithm Visualization Platform** — Understand complex DSA visually
* **DSA Learning Environment** — Interactive algorithm tutorials
* **High-Performance Toolkit** — Benchmark and optimize graph code

Powered by a **reusable, production-grade C++ computation engine**.

---

# Contributing

Pull requests welcome! Please:

1. Fork the repo
2. Create a feature branch
3. Test locally (frontend + backend + C++ engine)
4. Submit PR with clear description

---

# Support

Issues? Questions? Open a GitHub issue with:

* Steps to reproduce
* Expected vs. actual behavior
* Screenshots/logs

---
