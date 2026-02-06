# Proposal 002: Scheduling and Event System

## Summary

Flocc's current tick cycle is uniform — all agents activate once per tick in sequence. Real-world ABMs often need heterogeneous timing (some agents act more frequently than others) and event-driven behavior (agents react to stimuli rather than polling). This proposal introduces a flexible scheduling system and an event bus.

## Problem

```js
// Current: Everyone ticks at the same rate
environment.tick(); // Agent A, B, C, D all act once

// But what if:
// - Agent A should act every tick (fast predator)
// - Agent B should act every 5 ticks (slow grazer)
// - Agent C should only act when food is nearby (reactive)
// - Agent D should act at t=100, t=250, t=400 (scheduled meetings)
```

Current workarounds are awkward:

```js
// Workaround 1: Internal counters (boilerplate)
agent.set('tick', (a) => {
  a.set('counter', (a.get('counter') || 0) + 1);
  if (a.get('counter') % 5 !== 0) return; // Skip 4 out of 5 ticks
  // Actual behavior...
});

// Workaround 2: Polling for events (inefficient)
agent.set('tick', (a) => {
  const food = a.environment.getAgents()
    .filter(x => x.get('type') === 'food')
    .find(f => distance(a, f) < 10);
  if (!food) return; // Wasteful check every tick
  // React to food...
});
```

## Proposed API

### 1. Agent Scheduling

```js
import { Agent, Environment } from 'flocc';

const environment = new Environment();

// Schedule agent to tick every N environment ticks
const fastAgent = new Agent({ tickInterval: 1 }); // Every tick (default)
const slowAgent = new Agent({ tickInterval: 5 }); // Every 5th tick

// Schedule agent to tick at specific times
const scheduledAgent = new Agent({
  tickAt: [100, 250, 400], // Specific tick numbers
});

// Schedule agent with probability per tick
const stochasticAgent = new Agent({
  tickProbability: 0.3, // 30% chance to act each tick
});

// Dynamic scheduling (agent can reschedule itself)
agent.set('tick', (a) => {
  // Do something...
  
  // Schedule next activation
  a.scheduleAt(a.environment.time + 10); // Tick again in 10 steps
  a.scheduleIn(10); // Equivalent shorthand
});
```

### 2. Priority Queue Scheduler

```js
import { Environment, PriorityScheduler } from 'flocc';

// Use a priority queue for event-driven scheduling
const scheduler = new PriorityScheduler();
const environment = new Environment({ scheduler });

// Agents schedule their next activation
agent.set('tick', (a) => {
  const energyCost = a.get('speed') * 2;
  a.set('energy', a.get('energy') - energyCost);
  
  // Faster agents have shorter intervals
  const nextTick = a.environment.time + (10 / a.get('speed'));
  a.scheduleAt(nextTick);
});

// Environment advances to next scheduled event
environment.tickNext(); // Jumps to next scheduled agent
environment.tickUntil(1000); // Run until time = 1000
```

### 3. Event Bus

```js
import { Environment, EventBus } from 'flocc';

const events = new EventBus();
const environment = new Environment({ events });

// Agents subscribe to events
predator.on('prey:spotted', (event) => {
  const { prey, location } = event.data;
  predator.set('target', prey);
  predator.set('state', 'hunting');
});

// Agents emit events
prey.set('tick', (a) => {
  // Emit event when moving (nearby predators will react)
  a.emit('prey:moved', { 
    location: a.get('position'),
    prey: a,
  });
});

// Environment-level events
environment.on('tick:start', () => console.log('Tick starting...'));
environment.on('tick:end', () => console.log('Tick complete'));
environment.on('agent:added', (e) => console.log('New agent:', e.agent));
environment.on('agent:removed', (e) => console.log('Agent left:', e.agent));

// Spatial events (integration with KDTree)
environment.on('proximity', {
  radius: 10,
  filter: (a, b) => a.get('type') === 'predator' && b.get('type') === 'prey',
  handler: (predator, prey) => {
    predator.emit('prey:spotted', { prey, location: prey.get('position') });
  },
});
```

### 4. Reactive Agents (Event-Driven Only)

```js
// Agent that ONLY acts in response to events (no tick function)
const reactiveAgent = new Agent({
  tick: null, // No periodic tick
  on: {
    'food:appeared': (agent, event) => {
      agent.set('target', event.data.location);
      agent.set('state', 'foraging');
    },
    'predator:nearby': (agent, event) => {
      agent.set('state', 'fleeing');
      agent.scheduleIn(1); // Activate next tick to flee
    },
  },
});
```

### 5. Scheduled Actions (One-Shot Timers)

```js
// Schedule a one-time action
environment.scheduleAt(500, () => {
  console.log('Halfway point!');
  environment.addAgent(reinforcements);
});

// Schedule relative to current time
environment.scheduleIn(100, () => {
  environment.emit('weather:change', { type: 'storm' });
});

// Agent-level scheduled actions
agent.scheduleAction(50, () => {
  agent.set('state', 'mature');
  agent.set('canReproduce', true);
});
```

## Implementation Details

### Scheduler Interface

```typescript
interface Scheduler {
  /**
   * Add an agent to the schedule.
   */
  schedule(agent: Agent, time: number): void;
  
  /**
   * Remove an agent from the schedule.
   */
  unschedule(agent: Agent): void;
  
  /**
   * Get agents scheduled for the given tick.
   */
  getAgentsForTick(time: number): Agent[];
  
  /**
   * Get the next scheduled time (for event-driven mode).
   */
  nextScheduledTime(): number | null;
  
  /**
   * Advance the schedule after a tick.
   */
  advance(time: number): void;
}
```

### Default Scheduler (Interval-Based)

```typescript
class IntervalScheduler implements Scheduler {
  private intervals: Map<Agent, number> = new Map();
  private offsets: Map<Agent, number> = new Map();
  
  schedule(agent: Agent, interval: number, offset: number = 0): void {
    this.intervals.set(agent, interval);
    this.offsets.set(agent, offset);
  }
  
  getAgentsForTick(time: number): Agent[] {
    const result: Agent[] = [];
    for (const [agent, interval] of this.intervals) {
      const offset = this.offsets.get(agent) || 0;
      if ((time - offset) % interval === 0) {
        result.push(agent);
      }
    }
    return result;
  }
}
```

### Priority Queue Scheduler

```typescript
class PriorityScheduler implements Scheduler {
  private queue: PriorityQueue<{ agent: Agent; time: number }>;
  
  constructor() {
    this.queue = new PriorityQueue((a, b) => a.time - b.time);
  }
  
  schedule(agent: Agent, time: number): void {
    // Remove existing entry for this agent
    this.unschedule(agent);
    this.queue.insert({ agent, time });
  }
  
  getAgentsForTick(time: number): Agent[] {
    const result: Agent[] = [];
    while (this.queue.peek()?.time === time) {
      result.push(this.queue.pop()!.agent);
    }
    return result;
  }
  
  nextScheduledTime(): number | null {
    return this.queue.peek()?.time ?? null;
  }
}
```

### Event Bus Implementation

```typescript
type EventHandler<T = any> = (event: FloccEvent<T>) => void;

interface FloccEvent<T = any> {
  type: string;
  source: Agent | Environment | null;
  data: T;
  time: number;
  propagationStopped: boolean;
  stopPropagation(): void;
}

class EventBus {
  private handlers: Map<string, Set<EventHandler>> = new Map();
  private spatialHandlers: SpatialEventHandler[] = [];
  
  on<T>(type: string, handler: EventHandler<T>): () => void {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set());
    }
    this.handlers.get(type)!.add(handler);
    
    // Return unsubscribe function
    return () => this.handlers.get(type)?.delete(handler);
  }
  
  emit<T>(type: string, data: T, source: Agent | Environment | null = null): void {
    const event: FloccEvent<T> = {
      type,
      source,
      data,
      time: this.environment?.time ?? 0,
      propagationStopped: false,
      stopPropagation() { this.propagationStopped = true; },
    };
    
    const handlers = this.handlers.get(type);
    if (handlers) {
      for (const handler of handlers) {
        if (event.propagationStopped) break;
        handler(event);
      }
    }
  }
  
  // Spatial event checking (called each tick)
  checkSpatialEvents(environment: Environment): void {
    for (const spatial of this.spatialHandlers) {
      const pairs = environment.kdTree.findPairsWithinRadius(spatial.radius);
      for (const [a, b] of pairs) {
        if (spatial.filter(a, b)) {
          spatial.handler(a, b);
        }
      }
    }
  }
}
```

### Integration with Agent

```typescript
class Agent {
  private eventHandlers: Map<string, EventHandler[]> = new Map();
  private scheduledActions: Array<{ time: number; action: () => void }> = [];
  
  // Event subscription
  on(type: string, handler: EventHandler): () => void {
    if (!this.eventHandlers.has(type)) {
      this.eventHandlers.set(type, []);
    }
    this.eventHandlers.get(type)!.push(handler);
    
    // Also register with environment's event bus
    return this.environment?.events?.on(type, (event) => {
      handler.call(this, this, event);
    }) ?? (() => {});
  }
  
  // Event emission
  emit<T>(type: string, data: T): void {
    this.environment?.events?.emit(type, data, this);
  }
  
  // Self-scheduling
  scheduleAt(time: number): void {
    this.environment?.scheduler?.schedule(this, time);
  }
  
  scheduleIn(ticks: number): void {
    this.scheduleAt((this.environment?.time ?? 0) + ticks);
  }
  
  // One-shot action scheduling
  scheduleAction(delay: number, action: () => void): void {
    const time = (this.environment?.time ?? 0) + delay;
    this.scheduledActions.push({ time, action });
  }
}
```

## Codebase Impact

### Files to Modify

| File | Changes |
|------|---------|
| `src/environments/Environment.ts` | Add scheduler integration, event bus, `tickNext()`, `tickUntil()` |
| `src/agents/Agent.ts` | Add `on()`, `emit()`, `scheduleAt()`, `scheduleIn()`, scheduling options |
| `src/main.ts` | Export new classes |

### New Files

| File | Purpose |
|------|---------|
| `src/scheduling/Scheduler.ts` | Scheduler interface |
| `src/scheduling/IntervalScheduler.ts` | Default interval-based scheduler |
| `src/scheduling/PriorityScheduler.ts` | Event-driven priority queue scheduler |
| `src/events/EventBus.ts` | Event bus implementation |
| `src/events/FloccEvent.ts` | Event type definitions |
| `src/utils/PriorityQueue.ts` | Heap-based priority queue |

### Breaking Changes

None — default behavior unchanged. New features are opt-in.

### Backward Compatibility

```js
// Old code continues to work
environment.tick(); // All agents tick as before

// New code opts in
const environment = new Environment({
  scheduler: new PriorityScheduler(),
  events: new EventBus(),
});
```

## Integration with Existing Features

### With Rules DSL

```js
// New operators for event handling
const rule = new Rule(environment, [
  "on", "food:nearby", [
    "set", "state", "eating"
  ]
]);

// Emit from rules
const emitRule = new Rule(environment, [
  "emit", "predator:hunting", [
    "get", "position"
  ]
]);

// Schedule from rules
const scheduleRule = new Rule(environment, [
  "schedule-in", 10, [
    "set", "state", "rested"
  ]
]);
```

### With Network

```js
// Events propagate through network connections
const network = new Network(environment);
network.connect(agentA, agentB);

// When A emits, connected agents receive it
agentA.emit('message', { text: 'Hello!' });
// agentB's 'message' handler is automatically called

// Configure propagation
environment.events.configurePropagation({
  'message': { mode: 'network' },      // Only to connected agents
  'alarm': { mode: 'spatial', radius: 50 }, // To nearby agents
  'broadcast': { mode: 'all' },        // To everyone
});
```

### With KDTree (Spatial Events)

```js
// Efficient spatial event checking using KDTree
environment.on('proximity', {
  radius: 5,
  types: ['collision'],
  handler: (a, b) => {
    a.emit('collision', { other: b });
    b.emit('collision', { other: a });
  },
});

// The KDTree's range query is used internally
// Much faster than O(n²) pairwise distance checks
```

## Real-World Use Case: Epidemic Model with Heterogeneous Behavior

```js
import { Environment, PriorityScheduler, EventBus, Agent } from 'flocc';

const scheduler = new PriorityScheduler();
const events = new EventBus();
const env = new Environment({ scheduler, events });

// Different agent types have different activity patterns
class Person extends Agent {
  constructor(type) {
    super();
    this.set('type', type);
    this.set('infected', false);
    this.set('immune', false);
    
    // Set up activity schedule based on type
    if (type === 'worker') {
      // Workers are active during work hours
      this.set('tickInterval', 1);
      this.set('activeHours', [9, 17]);
    } else if (type === 'elderly') {
      // Elderly move less frequently
      this.set('tickInterval', 3);
    } else if (type === 'child') {
      // Children are very active
      this.set('tickInterval', 1);
      this.set('tickProbability', 0.8);
    }
    
    // React to exposure events
    this.on('exposure', (agent, event) => {
      if (agent.get('immune')) return;
      
      const exposureDose = event.data.dose;
      const susceptibility = agent.get('type') === 'elderly' ? 0.8 : 0.3;
      
      if (Math.random() < exposureDose * susceptibility) {
        agent.set('infected', true);
        agent.set('infectiousAt', env.time + 2); // Latent period
        agent.scheduleAt(env.time + 14); // Recovery scheduled
      }
    });
    
    // React to recovery timer
    this.on('self:scheduled', (agent) => {
      if (agent.get('infected')) {
        agent.set('infected', false);
        agent.set('immune', true);
      }
    });
  }
}

// Infected agents emit exposure events when they move
env.on('agent:moved', (event) => {
  const agent = event.source;
  if (!agent.get('infected')) return;
  if (env.time < agent.get('infectiousAt')) return;
  
  // Emit exposure to nearby agents
  const nearby = env.getAgentsWithinRadius(agent, 2);
  for (const other of nearby) {
    if (other !== agent) {
      other.emit('exposure', { 
        dose: 0.1, 
        source: agent 
      });
    }
  }
});

// Environmental events
env.scheduleAt(100, () => {
  env.emit('policy:lockdown', { severity: 0.5 });
});

env.on('policy:lockdown', (event) => {
  // Reduce movement frequency for all agents
  for (const agent of env.getAgents()) {
    const current = agent.get('tickInterval') || 1;
    agent.set('tickInterval', current * 2);
  }
});

// Create population
for (let i = 0; i < 1000; i++) {
  const type = weightedRandom(['worker', 'elderly', 'child'], [0.6, 0.2, 0.2]);
  env.addAgent(new Person(type));
}

// Seed initial infections
for (let i = 0; i < 5; i++) {
  const patient = sample(env.getAgents());
  patient.set('infected', true);
  patient.set('infectiousAt', env.time);
}

// Run simulation
while (env.time < 365) {
  env.tickNext(); // Event-driven: jumps to next scheduled action
}
```

## Performance Considerations

### Event Bus Overhead

- **Subscription**: O(1) amortized (hash map insert)
- **Emission**: O(k) where k = number of handlers for that event type
- **Spatial events**: O(n log n) using KDTree range queries vs O(n²) naive

### Scheduler Overhead

- **IntervalScheduler**: O(n) per tick (check all agents)
- **PriorityScheduler**: O(log n) per schedule/unschedule, O(k) per tick (k = agents scheduled for this tick)

For models where most agents tick every step, `IntervalScheduler` is simpler. For models with sparse, heterogeneous timing, `PriorityScheduler` is more efficient.

## Open Questions

1. Should events be synchronous (immediate handling) or queued (processed at end of tick)?

2. How should event handlers interact with batched updates (Proposal 001)?

3. Should there be a "time dilation" feature where high-priority agents perceive time differently?

4. Should events support "bubbling" through spatial/network hierarchies?

## References

- [MASON Scheduling](https://cs.gmu.edu/~eclab/projects/mason/manual.pdf) - Java ABM with sophisticated scheduling
- [SimPy](https://simpy.readthedocs.io/) - Python discrete-event simulation
- [Repast](https://repast.github.io/) - Schedule-based ABM framework
- [EventEmitter3](https://github.com/primus/eventemitter3) - Fast event emitter pattern reference
