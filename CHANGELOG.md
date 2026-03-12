# Changelog

## [0.7.0] - 2026-03-12

### Added
- **Recorder** — structured data collection from simulation runs
  - Attach to any Environment to capture model-level and agent-level metrics
  - `interval: 'tick' | 'manual' | number` controls when data is collected
  - `agentFilter` limits agent recording to a subset of agents
  - `getModelData()`, `getAgentData()`, `latest()` for data access
  - `toCSV()` and `toJSON()` for export
  - `reset()` clears collected data and resumes recording cleanly
  - `detach()` unsubscribes from the environment
- **Experiment** — batch parameter sweeps with replications
  - Define a `parameters` space using arrays, `{ min, max, step }` ranges, or constants
  - Cartesian product of all parameter combinations is run automatically
  - `replications` runs each combination multiple times with distinct seeds
  - `stopCondition` for early termination per run
  - `onProgress` and `onRunComplete` callbacks for streaming results
  - `ExperimentResults` with `filter()`, `groupBy()`, `aggregate()`, `toCSV()`, `toJSON()`
- `Environment.events` is now auto-initialized — every Environment gets an EventBus without needing to pass one explicitly

### Removed
- `Agent.enqueue()` — deprecated since v0.5.14; use `agent.set('queue', fn)` instead
- `Agent.addRule()` — use `agent.set('tick', fn)` instead
- `enqueue` Rule DSL operator — depended on the removed `Agent.enqueue()` method

## [0.6.3] - 2026-02-16

### Added
- `random` operator in Rule DSL for generating random numbers
  - `["random"]` — returns float between 0 and 1
  - `["random", max]` — returns integer between 0 and max
  - `["random", min, max]` — returns integer between min and max
  - Uses seeded PRNG if `utils.seed()` was called

## [0.6.2] - 2026-02-01

### Fixed
- `removeAgent()` null guard — was throwing when passed null agent

### Changed
- `tick()` now defaults to `randomizeOrder: true` (warned since v0.5)
- Removed randomizeOrder deprecation warning

## [0.6.1] - 2026-02-01

### Removed
- Removed deprecated classes (marked since v0.4.0):
  - `GridEnvironment` — use Environment + Terrain
  - `ASCIIRenderer` — use CanvasRenderer + Terrain
  - `Cell` — only used by GridEnvironment

## [0.6.0] - 2026-01-31

### Added
- **EventBus** — pub-sub messaging between agents (`agent.on()`, `agent.emit()`)
- **Schedulers** — pluggable agent activation strategies
  - `DefaultScheduler` — interval-based (tickInterval, tickProbability)
  - `PriorityScheduler` — discrete event simulation with priority queue
- **Self-scheduling** — agents call `scheduleAt(time)` / `scheduleIn(delay)`
- **Time-skipping** — `env.tickNext()` jumps to next scheduled event
