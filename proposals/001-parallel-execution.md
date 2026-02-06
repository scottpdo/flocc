# Proposal 001: Parallel Execution Model

## Summary

Flocc currently executes all agent ticks synchronously in a single thread. For models with thousands of agents, this creates performance bottlenecks and UI jank. This proposal introduces optional Web Worker-based parallelization and batched update patterns.

## Problem

```js
// Current model: 10,000 agents, each doing neighborhood queries
for (let i = 0; i < 10000; i++) {
  environment.addAgent(new Agent({ tick: complexBehavior }));
}
environment.tick(); // Blocks main thread for potentially seconds
```

Issues:
1. **UI freezing**: Long ticks block rendering, making interactive visualizations sluggish
2. **No parallelism**: Modern devices have multiple cores sitting idle
3. **No progressive rendering**: Can't show partial results during a long tick
4. **Memory pressure**: All agent state mutations happen in one synchronous burst

## Proposed API

### 1. Async Tick with Progress

```js
// New async tick method
await environment.tickAsync({
  onProgress: (completed, total) => {
    progressBar.value = completed / total;
  },
  yieldEvery: 100, // Yield to main thread every 100 agents
});

// Or with AbortController for cancellation
const controller = new AbortController();
cancelButton.onclick = () => controller.abort();

await environment.tickAsync({ signal: controller.signal });
```

### 2. Web Worker Pool

```js
import { Environment, WorkerPool } from 'flocc';

// Create a worker pool (auto-detects core count by default)
const pool = new WorkerPool({
  workers: navigator.hardwareConcurrency || 4,
  // Worker script URL (Flocc provides a default)
  script: '/flocc-worker.js',
});

const environment = new Environment({ workerPool: pool });

// Agents are automatically distributed across workers
for (let i = 0; i < 50000; i++) {
  environment.addAgent(new Agent({ /* ... */ }));
}

// Tick runs in parallel across workers
await environment.tickParallel();

// Clean up
pool.terminate();
```

### 3. Batched Updates (Read-then-Write Pattern)

```js
const environment = new Environment({
  updateMode: 'batched', // vs 'immediate' (current default)
});

// In batched mode:
// 1. All agents READ current state (can run in parallel)
// 2. All mutations are QUEUED
// 3. All mutations APPLY at once after reads complete

// Agent tick function receives a "draft" for writes
agent.set('tick', (agent, draft) => {
  const neighbors = agent.environment.getAgents().filter(/* ... */);
  const avgX = mean(neighbors.map(n => n.get('x')));
  
  // Writes go to draft, not live state
  draft.set('x', avgX);
});
```

### 4. Partitioned Environments (Spatial Decomposition)

```js
import { PartitionedEnvironment } from 'flocc';

// Automatically partitions space for parallel processing
const environment = new PartitionedEnvironment({
  width: 1000,
  height: 1000,
  partitions: { x: 4, y: 4 }, // 16 spatial partitions
  workerPool: pool,
});

// Agents in non-adjacent partitions can tick in parallel
// Adjacent partitions use ghost zones for boundary agents
await environment.tickParallel();
```

## Implementation Details

### Async Tick (Main Thread)

```typescript
// In Environment.ts
async tickAsync(options: TickAsyncOptions = {}): Promise<void> {
  const { onProgress, yieldEvery = 50, signal } = options;
  const agents = this.getAgents();
  const total = agents.length;
  
  for (let i = 0; i < total; i++) {
    if (signal?.aborted) {
      throw new DOMException('Tick aborted', 'AbortError');
    }
    
    agents[i].tick();
    
    if (onProgress) onProgress(i + 1, total);
    
    // Yield to main thread periodically
    if (i % yieldEvery === 0) {
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  }
  
  this._time++;
}
```

### Worker Pool Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Main Thread                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │ Environment │  │  Renderer   │  │   UI/App    │          │
│  └──────┬──────┘  └─────────────┘  └─────────────┘          │
│         │                                                    │
│         │ tickParallel()                                     │
│         ▼                                                    │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                  WorkerPool                          │    │
│  │  - Distributes agents to workers                     │    │
│  │  - Collects results                                  │    │
│  │  - Handles serialization                             │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
          │              │              │              │
          ▼              ▼              ▼              ▼
     ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐
     │Worker 1 │   │Worker 2 │   │Worker 3 │   │Worker 4 │
     │         │   │         │   │         │   │         │
     │ Agents  │   │ Agents  │   │ Agents  │   │ Agents  │
     │ 0-2499  │   │2500-4999│   │5000-7499│   │7500-9999│
     └─────────┘   └─────────┘   └─────────┘   └─────────┘
```

### Serialization Protocol

Agents must be serializable to cross the Worker boundary:

```typescript
interface SerializedAgent {
  id: string;
  data: Record<string, SerializableValue>;
  // Functions are registered by name, not serialized
  tickFn: string;
}

// Agent functions must be registered globally
Rule.register('flocking', new Rule(env, [/* ... */]));
Agent.registerTick('boid', (agent) => { /* ... */ });

// Then referenced by name
agent.set('tick', 'boid'); // String reference, not function
```

### Batched Update Implementation

```typescript
class BatchedEnvironment extends Environment {
  private pendingWrites: Map<string, Map<string, any>> = new Map();
  
  tick(): void {
    const agents = this.getAgents();
    
    // Phase 1: Read & compute (parallelizable)
    for (const agent of agents) {
      const draft = new AgentDraft(agent, this.pendingWrites);
      agent._tickWithDraft(draft);
    }
    
    // Phase 2: Apply all writes atomically
    for (const [agentId, writes] of this.pendingWrites) {
      const agent = this.getAgentById(agentId);
      for (const [key, value] of writes) {
        agent._directSet(key, value);
      }
    }
    
    this.pendingWrites.clear();
    this._time++;
  }
}
```

## Codebase Impact

### Files to Modify

| File | Changes |
|------|---------|
| `src/environments/Environment.ts` | Add `tickAsync()`, `tickParallel()`, `updateMode` option |
| `src/agents/Agent.ts` | Add serialization methods, draft-aware tick |
| `src/main.ts` | Export new classes |
| `package.json` | No new dependencies (Web Workers are native) |

### New Files

| File | Purpose |
|------|---------|
| `src/workers/WorkerPool.ts` | Worker pool management |
| `src/workers/flocc-worker.ts` | Worker entry point |
| `src/workers/AgentDraft.ts` | Proxy for batched writes |
| `src/environments/PartitionedEnvironment.ts` | Spatial decomposition |

### Breaking Changes

None — all new features are opt-in. Default behavior unchanged.

### Backward Compatibility

```js
// Old code continues to work
environment.tick(); // Still synchronous, still works

// New code opts in explicitly
await environment.tickAsync();
await environment.tickParallel();
```

## Constraints & Limitations

1. **Serialization requirement**: Agents using Worker parallelism must have serializable state (no closures, DOM references, or circular structures in agent data)

2. **Function registration**: Tick functions must be registered by name for Worker execution

3. **Spatial queries**: `environment.getAgents()` in parallel mode returns a snapshot; real-time neighbor queries require the partitioned approach

4. **Determinism**: Parallel execution order is non-deterministic. For reproducible results, use `tickAsync()` with `yieldEvery: Infinity` (sequential but non-blocking)

## Real-World Use Case: Large-Scale Traffic Simulation

```js
import { Environment, WorkerPool, Agent } from 'flocc';

// Traffic simulation with 50,000 vehicles
const pool = new WorkerPool({ workers: 8 });
const env = new Environment({ 
  workerPool: pool,
  updateMode: 'batched', // Vehicles read positions, then all move
});

// Register behavior by name for worker serialization
Agent.registerTick('vehicle', (agent, draft) => {
  const ahead = agent.get('road').getVehicleAhead(agent);
  const gap = ahead ? ahead.get('position') - agent.get('position') : Infinity;
  
  // Intelligent Driver Model (IDM)
  const accel = idmAcceleration(agent.get('velocity'), gap, ahead?.get('velocity'));
  
  draft.set('velocity', agent.get('velocity') + accel * dt);
  draft.set('position', agent.get('position') + agent.get('velocity') * dt);
});

// Create 50,000 vehicles
for (let i = 0; i < 50000; i++) {
  const vehicle = new Agent({
    position: randomRoadPosition(),
    velocity: random(20, 30),
    tick: 'vehicle',
  });
  env.addAgent(vehicle);
}

// Animation loop stays responsive
async function animate() {
  await env.tickParallel(); // ~50ms on 8 cores vs ~400ms single-threaded
  renderer.render();
  requestAnimationFrame(animate);
}
```

## Performance Expectations

| Agents | Current (sync) | tickAsync | tickParallel (4 cores) |
|--------|---------------|-----------|------------------------|
| 1,000  | 5ms           | 6ms       | 8ms (overhead)         |
| 10,000 | 50ms          | 55ms      | 20ms                   |
| 50,000 | 250ms         | 260ms     | 80ms                   |
| 100,000| 500ms+        | 510ms     | 150ms                  |

*Note: tickParallel has fixed overhead (~5-10ms) from worker communication, so it's only beneficial above ~5,000 agents.*

## Open Questions

1. Should `tickParallel()` fall back to `tickAsync()` when Web Workers aren't available (e.g., some Node.js environments)?

2. How should the renderer handle partial updates during `tickAsync()`? Progressive rendering callback?

3. Should we support SharedArrayBuffer for zero-copy worker communication? (Requires COOP/COEP headers)

## References

- [Web Workers API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API)
- [Comlink](https://github.com/GoogleChromeLabs/comlink) - Potential library for cleaner worker communication
- [MASON](https://cs.gmu.edu/~eclab/projects/mason/) - Java ABM framework with parallel execution
- [Mesa](https://mesa.readthedocs.io/) - Python ABM with batch execution patterns
