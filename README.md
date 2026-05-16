# RouteForge
RouteForge is evolving into a modular graph algorithm runtime and visualization platform.

Today the repo contains:
- a C++ execution engine
- a Node.js orchestration API
- a React-based graph editor and playback surface

The long-term product direction is engine-first:
- algorithms execute in the C++ runtime
- plugins register algorithms without core `if/else` dispatch
- executions emit generic events and timelines
- the frontend replays state transitions instead of embedding algorithm logic
