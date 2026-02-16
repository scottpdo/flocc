# Changelog

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
