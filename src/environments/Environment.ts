/// <reference path="./EnvironmentOptions.d.ts" />
/// <reference path="./EnvironmentHelper.d.ts" />
/// <reference path="../types/Data.d.ts" />
import { Agent } from "../agents/Agent";
import shuffle from "../utils/shuffle";
import { Network } from "../helpers/Network";
import { KDTree } from "../helpers/KDTree";
import { Terrain } from "../helpers/Terrain";
import type { AbstractRenderer } from "../renderers/AbstractRenderer";
import type { Scheduler } from "../scheduling/Scheduler";
import { EventBus } from "../events/EventBus";
import once from "../utils/once";
import { random, series } from "../utils/utils";
import sample, { sampler, isMultipleSampleFunc } from "../utils/sample";

interface Helpers {
  kdtree: KDTree;
  network: Network;
  terrain: Terrain;
}

export interface TickOptions {
  activation?: "uniform" | "random";
  activationCount?: number;
  count?: number;
  randomizeOrder?: boolean;
}

export const defaultTickOptions: TickOptions = {
  activation: "uniform",
  activationCount: 1,
  count: 1,
  randomizeOrder: false
};

const defaultEnvironmentOptions = {
  torus: true,
  height: 0,
  width: 0
};

interface MemoValue {
  key?: string;
  value: any;
  time: number;
}

const warnOnce = once(console.warn.bind(console));

/**
 * An environment provides the space and time in which Agents interact.
 * Environments are themselves Agents, and can store data in key-value
 * pairs that can be manipulated just like Agent data.
 * @since 0.0.5
 */
class Environment extends Agent {
  /** @hidden */
  agents: Array<Agent> = [];
  /** @hidden */
  agentsById: Map<string, Agent> = new Map();
  /** @hidden */
  environment: Environment = null;
  /** @hidden */
  cache: Map<string, MemoValue> = new Map();
  /** @hidden */
  helpers: Helpers = {
    kdtree: null,
    network: null,
    terrain: null
  };
  /** @hidden */
  id: string;
  /**
   * An array of the renderers associated with this `Environment`.
   * An `Environment` can have multiple renderers, usually one to render
   * the {@linkcode Agent}s spatially and others for data visualization,
   * such as a {@linkcode LineChartRenderer}, {@linkcode Histogram}, etc.
   */
  renderers: AbstractRenderer[] = [];
  /** @hidden */
  opts: EnvironmentOptions;
  width: number;
  height: number;

  /**
   * Whether the `Environment` tick cycle is currently playing.
   * Use {@linkcode pause}, {@linkcode resume}, or {@linkcode toggle}
   * to control playback.
   * @since 0.5.22
   */
  playing: boolean = true;

  /**
   * Optional scheduler for controlling agent activation timing.
   * If set, the scheduler determines which agents tick at each time step.
   * @since 0.6.0
   */
  scheduler: Scheduler | null = null;

  /**
   * Optional event bus for publish-subscribe messaging between agents.
   * @since 0.6.0
   */
  events: EventBus | null = null;

  /** @hidden */
  private _tickIntervalId: ReturnType<typeof setInterval> | null = null;
  /**
   * This property will always equal the number of tick cycles that
   * have passed since the `Environment` was created. If you call
   * {@linkcode tick} so that it goes forward multiple time steps, it will
   * increase the `time` by that value (not by just `1`, even though
   * you only called `tick` once).
   *
   * ```js
   * const environment = new Environment();
   * environment.time; // returns 0
   *
   * environment.tick();
   * environment.time; // returns 1
   *
   * environment.tick(3);
   * environment.time; // returns 4
   * ```
   *
   * @since 0.1.4
   * */
  time: number = 0;

  /**
   * Although `Environment`s inherit {@linkcode Agent} methods
   * like {@linkcode Agent.set}, {@linkcode Agent.get}, etc. they have
   * a different `constructor` signature.
   *
   * Pass in predefined `Environment` options for:
   * - `torus` &mdash; Whether the `Environment` should wrap around in 2d space (with `Agent`s that move off the right reappearing on the left, off the top reappearing on the bottom, etc.)
   * - `width` &mdash; The width of the `Environment` (used when `torus = true`)
   * - `height` &mdash; The height of the `Environment` (used when `torus = true`)
   * - `scheduler` &mdash; Optional scheduler for controlling agent activation (see {@linkcode Scheduler})
   * - `events` &mdash; Optional event bus for pub-sub messaging (see {@linkcode EventBus})
   * @override
   */
  constructor(opts: EnvironmentOptions = defaultEnvironmentOptions) {
    super();
    this.opts = Object.assign({}, defaultEnvironmentOptions);
    this.opts = Object.assign(this.opts, opts);
    this.width = this.opts.width;
    this.height = this.opts.height;

    // Set up scheduler if provided
    if (opts.scheduler) {
      this.scheduler = opts.scheduler;
    }

    // Set up event bus if provided
    if (opts.events) {
      this.events = opts.events;
      this.events.setEnvironment(this);
    }
  }

  /**
   * Add an {@linkcode Agent} to this `Environment`. Once this is called,
   * the `Agent`'s {@link Agent.environment | `environment`} property
   * will automatically be set to this `Environment`.
   * @param rebalance - Whether to rebalance if there is a `KDTree` (defaults to true)
   * @since 0.0.5
   */
  addAgent(agent: Agent, rebalance: boolean = true): void {
    if (!(agent instanceof Agent)) return;
    agent.environment = this;
    this.agents.push(agent);
    this.agentsById.set(agent.id, agent);

    if (this.helpers.kdtree) {
      this.helpers.kdtree.agents.push(agent);
      this.helpers.kdtree.needsUpdating = true;
      if (rebalance) this.helpers.kdtree.rebalance();
    }

    // Notify scheduler of new agent
    if (this.scheduler) {
      this.scheduler.onAgentAdded(agent, this.time);
    }

    // Register agent's event handlers with the event bus
    if (this.events) {
      agent.__registerEventHandlers();
    }

    // Emit agent:added event
    if (this.events) {
      this.events.emit("agent:added", { agent }, this);
    }
  }

  /** @hidden */
  addRule: null;
  /** @hidden */
  enqueue: null;

  /**
   * Remove an agent from the environment.
   * @param {Agent} agent
   * @param {boolean} [rebalance] - Whether to rebalance if there is a KDTree (defaults to true)
   * @since 0.0.8
   */
  removeAgent(agent: Agent, rebalance: boolean = true): void {
    // Guard against null/undefined agent
    if (!agent) return;

    // Emit agent:removed event before removal
    if (this.events) {
      this.events.emit("agent:removed", { agent }, this);
    }

    // Unregister agent's event handlers
    agent.__unregisterEventHandlers();

    // Notify scheduler
    if (this.scheduler) {
      this.scheduler.onAgentRemoved(agent);
    }

    agent.environment = null;
    const index = this.agents.indexOf(agent);
    this.agents.splice(index, 1);
    this.agentsById.delete(agent.id);

    if (this.helpers.kdtree) {
      this.helpers.kdtree.removeAgent(agent, rebalance);
    }
  }

  /**
   * Remove an agent from the environment by its ID.
   * @param {string} id
   * @since 0.1.3
   */
  removeAgentById(id: string): void {
    const agent = this.getAgentById(id);
    if (!agent) return;
    this.removeAgent(agent);
  }

  /**
   * Get an array of all the agents in the environment.
   * @return {Agent[]}
   * @since 0.0.5
   */
  getAgents(): Array<Agent> {
    return this.agents;
  }

  /**
   * Get an agent in the environment by its ID.
   * @param {string} id
   * @returns {Agent|null}
   * @since 0.1.3
   */
  getAgentById(id: string): Agent | null {
    return this.agentsById.get(id) || null;
  }

  /**
   * Remove all agents from the environment.
   * @since 0.1.3
   */
  clear(): void {
    while (this.getAgents().length > 0) {
      const a0 = this.getAgents()[0];
      this.removeAgent(a0);
    }
  }

  /**
   * From the parameter passed to {@linkcode Environment.tick}, get a structured TickOptions object.
   * @hidden
   */
  _getTickOptions(opts?: number | TickOptions): TickOptions {
    const baseOpts = Object.assign({}, defaultTickOptions);

    if (typeof opts === "number") {
      baseOpts.count = opts;
    } else if (!!opts) {
      Object.assign(baseOpts, opts);
    }

    if (
      opts === undefined ||
      (typeof opts !== "number" && !opts.hasOwnProperty("randomizeOrder"))
    ) {
      warnOnce(
        "You called `environment.tick` without specifying a `randomizeOrder` option. Currently this defaults to `false` (i.e. each agent ticks in the order it was added to the environment). However, in **Flocc 0.6.0 this will default to `true`** — agent activation order will default to being randomized."
      );
    }

    return baseOpts;
  }

  /**
   * For all agents passed, execute agent rules
   * @hidden
   */
  _executeAgentRules(agents: Agent[]): void {
    agents.forEach(agent => agent?.executeRules());
  }

  /**
   * For all agents passed, execute enqueued agent rules
   * @hidden
   */
  _executeEnqueuedAgentRules(agents: Agent[]): void {
    agents.forEach(agent => agent?.executeEnqueuedRules());
  }

  /**
   * Runs the `Environment`s tick cycle. Depending on the parameters, one,
   * some, or all of the {@linkcode Agent}s in the `Environment`
   * might be activated, and all renderers associated with the
   * `Environment` will update. After the tick cycle finishes, any rules that were enqueued will be run and the `Environment`'s {@linkcode time} property will have incremented.
   *
   * ```js
   * environment.tick(); // ticks once
   *
   * // To run multiple tick cycles, you can pass a number
   * environment.tick(5); // ticks 5 times
   * ```
   *
   * Passing a configuration object (instead of a number) allows
   * you to have finer control over the tick cycle. The object can
   * have the following keys:
   * - `activation`: Either `"uniform"` or `"random"` (defaults to `"uniform"`).
   *   - `activation = "uniform"` &mdash; All `Agent`s in the `Environment` are activated with every tick cycle.
   *   - `activation = "random"` &mdash; One or more `Agent`s are randomly selected to be activated every tick cycle (see `activationCount` below).
   * - `activationCount`: For `"random"` activation, this many `Agent`s will be activated with each tick cycle. Defaults to `1`. If `activationCount` is greater than the number of `Agent`s in the `Environment`, then all the `Agent`s will be activated exactly once in random order.
   * - `count`: The number of tick cycles to run.
   * - `randomizeOrder`: When `activation = "uniform"`, if `randomizeOrder = true`, `Agent`s will be activated in random order, otherwise in the order they were added to the `Environment`. **This currently defaults to `false` but will default to `true` in v0.6.0.**
   *
   * ```js
   * // Ticks three times, activating 10 random agents with each tick cycle.
   * environment.tick({
   *   activation: "random",
   *   activationCount: 10,
   *   count: 3
   * });
   * ```
   *
   * @since 0.0.5
   */
  tick(opts?: number | TickOptions): void {
    // If paused, skip the tick cycle (use `step()` to advance manually)
    if (!this.playing) return;

    const {
      activation,
      activationCount,
      count,
      randomizeOrder
    } = this._getTickOptions(opts);

    // Emit tick:start event
    if (this.events) {
      this.events.emit("tick:start", { time: this.time }, this);
    }

    // If a scheduler is configured, use it to determine which agents tick
    if (this.scheduler) {
      const agentsToTick = this.scheduler.getAgentsForTick(this.time);
      this._executeAgentRules(agentsToTick);
      this._executeEnqueuedAgentRules(agentsToTick);
    }
    // Otherwise, use the traditional activation modes
    // for uniform activation, every agent is always activated
    else if (activation === "uniform") {
      const agentsInOrder = randomizeOrder ? shuffle(this.agents) : this.agents;
      this._executeAgentRules(agentsInOrder);
      this._executeEnqueuedAgentRules(agentsInOrder);
    }
    // for random activation, the number of agents activated
    // per tick is determined by the `activationCount` option
    else if (activation === "random") {
      if (activationCount === 1) {
        const agent = sample(this.agents);
        if (agent !== null) {
          agent.executeRules();
          agent.executeEnqueuedRules();
        }
      } else if (activationCount > 1) {
        const sampleCount = sampler(activationCount);
        // this safety check should always return `true`
        if (isMultipleSampleFunc(sampleCount)) {
          const agents = sampleCount(this.getAgents());
          this._executeAgentRules(agents);
          this._executeEnqueuedAgentRules(agents);
        }
      } else {
        warnOnce(
          "You passed a zero or negative `activationCount` to the Environment's tick options. No agents will be activated."
        );
      }
    }

    if (this.helpers.kdtree) this.helpers.kdtree.rebalance();

    const { terrain } = this.helpers;
    if (terrain && terrain.rule) {
      if (activation === "uniform") {
        terrain._loop({ randomizeOrder });
      } else if (activation === "random") {
        if (activationCount === 1) {
          const x = random(0, terrain.width);
          const y = random(0, terrain.height);
          terrain._execute(x, y);
        } else if (activationCount > 1) {
          const generator = series(terrain.width * terrain.height);
          const indices: number[] = [];
          while (indices.length < activationCount) {
            const index = generator.next().value;
            const x = index % terrain.width;
            const y = (index / terrain.width) | 0;
            terrain._execute(x, y);
            indices.push(index);
          }
        }

        // in synchronous mode, write the buffer to the data
        if (!terrain.opts.async) {
          terrain.data = new Uint8ClampedArray(terrain.nextData);
        }
      }
    }

    this.time++;

    // Emit tick:end event
    if (this.events) {
      this.events.emit("tick:end", { time: this.time }, this);
    }

    if (count > 1) {
      this.tick(count - 1);
      return;
    }

    this.renderers.forEach(r => r.render());
  }

  /**
   * Pause the tick cycle. While paused, calling {@linkcode tick} will
   * be a no-op unless you use {@linkcode step} to advance manually.
   * @since 0.5.22
   */
  pause(): void {
    this.playing = false;
  }

  /**
   * Resume the tick cycle after it has been paused.
   * @since 0.5.22
   */
  resume(): void {
    this.playing = true;
  }

  /**
   * Toggle the tick cycle between playing and paused.
   * @since 0.5.22
   */
  toggle(): void {
    this.playing = !this.playing;
  }

  /**
   * Advance the `Environment` by exactly one tick, regardless of whether
   * it is paused. This is useful for stepping through the simulation
   * frame-by-frame while paused.
   *
   * ```js
   * environment.pause();
   * environment.step(); // advances one tick
   * ```
   *
   * @since 0.5.22
   */
  step(opts?: number | TickOptions): void {
    // Temporarily mark as playing so tick executes, then restore
    const wasPlaying = this.playing;
    this.playing = true;
    this.tick(opts);
    this.playing = wasPlaying;
  }

  /**
   * Advance the `Environment` to the next scheduled event time.
   * Only works with schedulers that support `nextScheduledTime()` (e.g., PriorityScheduler).
   * This enables event-driven simulation where empty time steps are skipped.
   *
   * ```js
   * const scheduler = new PriorityScheduler();
   * const env = new Environment({ scheduler });
   *
   * // Run until next scheduled agent activates
   * env.tickNext();
   * ```
   *
   * @returns The time that was advanced to, or null if nothing was scheduled
   * @since 0.6.0
   */
  tickNext(): number | null {
    if (!this.scheduler) {
      // Fall back to regular tick if no scheduler
      this.tick();
      return this.time;
    }

    const nextTime = this.scheduler.nextScheduledTime();
    if (nextTime === null) {
      return null;
    }

    // Jump time forward to the next scheduled event
    // Note: Unlike tick(), tickNext() does NOT auto-increment time.
    // In discrete event simulation, time advances to scheduled events only.
    this.time = nextTime;

    const wasPlaying = this.playing;
    this.playing = true;

    // Emit tick:start event
    if (this.events) {
      this.events.emit("tick:start", { time: this.time }, this);
    }

    const agentsToTick = this.scheduler.getAgentsForTick(this.time);
    this._executeAgentRules(agentsToTick);
    this._executeEnqueuedAgentRules(agentsToTick);

    if (this.helpers.kdtree) this.helpers.kdtree.rebalance();

    // Handle Terrain if present
    const { terrain } = this.helpers;
    if (terrain && terrain.rule) {
      terrain._loop({ randomizeOrder: false });
    }

    // Emit tick:end event (same time as tick:start for DES - the tick occurred at this time)
    if (this.events) {
      this.events.emit("tick:end", { time: this.time }, this);
    }

    this.renderers.forEach(r => r.render());
    this.playing = wasPlaying;

    return this.time;
  }

  /**
   * Run the simulation until the specified time is reached.
   * Uses `tickNext()` for event-driven simulation with a PriorityScheduler,
   * or regular `tick()` otherwise.
   *
   * ```js
   * const env = new Environment({ scheduler: new PriorityScheduler() });
   *
   * // Run simulation until time = 1000
   * env.tickUntil(1000);
   * ```
   *
   * @param targetTime - The time to run until
   * @param maxIterations - Maximum number of iterations (safety limit, default 1000000)
   * @returns The final time reached
   * @since 0.6.0
   */
  tickUntil(targetTime: number, maxIterations: number = 1000000): number {
    let iterations = 0;

    while (this.time < targetTime && iterations < maxIterations) {
      // Use tickNext() if scheduler supports discrete event times
      const nextScheduled = this.scheduler?.nextScheduledTime();
      if (nextScheduled !== null && nextScheduled !== undefined) {
        const nextTime = this.tickNext();
        if (nextTime === null) break; // Nothing more scheduled
      } else {
        this.tick();
      }
      iterations++;
    }

    return this.time;
  }

  /**
   * Schedule a one-time action to run at a specific time.
   * The action will be executed during the tick at that time.
   *
   * ```js
   * // Spawn reinforcements at time 100
   * environment.scheduleAction(100, () => {
   *   for (let i = 0; i < 10; i++) {
   *     environment.addAgent(new Agent({ type: 'reinforcement' }));
   *   }
   * });
   * ```
   *
   * @param time - The time at which to execute the action
   * @param action - The function to execute
   * @since 0.6.0
   */
  scheduleAction(time: number, action: () => void): void {
    if (!this.events) {
      console.warn("Environment.scheduleAction requires an EventBus. Create environment with { events: new EventBus() }");
      return;
    }

    // Use a one-time event listener on tick:end (time is already incremented)
    const unsubscribe = this.events.on("tick:end", (event) => {
      if (event.time >= time) {
        unsubscribe();
        action();
      }
    });
  }

  /**
   * Schedule a one-time action to run after a delay.
   * Shorthand for `scheduleAction(environment.time + delay, action)`.
   *
   * ```js
   * // Trigger weather event in 50 time steps
   * environment.scheduleActionIn(50, () => {
   *   environment.events.emit('weather:storm', { severity: 0.8 });
   * });
   * ```
   *
   * @param delay - Number of time steps to wait
   * @param action - The function to execute
   * @since 0.6.0
   */
  scheduleActionIn(delay: number, action: () => void): void {
    this.scheduleAction(this.time + delay, action);
  }

  /**
   * Use a helper with this environment. A helper can be one of:
   * - {@linkcode KDTree}
   * - {@linkcode Network}
   * - {@linkcode Terrain}
   * @since 0.1.3
   */
  use(helper: EnvironmentHelper) {
    if (helper instanceof KDTree) this.helpers.kdtree = helper;
    if (helper instanceof Network) this.helpers.network = helper;
    if (helper instanceof Terrain) this.helpers.terrain = helper;
  }

  /**
   * Get an array of data associated with agents in the environment by key.
   * Calling `environment.stat('name')` is equivalent to calling
   * `environment.getAgents().map(agent => agent.get('name'));`
   *
   * By default, calling this will calculate the result at most once
   * per time cycle, and return the cached value on subsequent calls (until
   * the next time cycle, when it will recalculate).
   *
   * @param key - The key for which to retrieve data.
   * @param useCache - Whether or not to cache the result.
   * @returns Array of data associated with `agent.get(key)` across all agents.
   *
   * ```js
   * environment.addAgent(new Agent({ name: "Alice" }));
   * environment.addAgent(new Agent({ name: "Bob" }));
   * environment.addAgent(new Agent({ name: "Chaz" }));
   *
   * environment.stat('name'); // returns ['Alice', 'Bob', 'Chaz']
   * ```
   *
   * @since 0.3.14
   */
  stat(key: string, useCache: boolean = true): any[] {
    const mapAndFilter = () => {
      const output: any[] = [];
      this.getAgents().forEach(a => {
        if (a.get(key) === null) return;
        output.push(a.get(key));
      });
      return output;
    };
    if (useCache) return this.memo(mapAndFilter, key);
    return mapAndFilter();
  }

  /**
   * Pass a function to cache and use the return value within the same environment tick.
   * @param fn - The function to memoize.
   * @return The return value of the function that was passed.
   * @since 0.3.14
   *
   * ```js
   * // Within the same time cycle, this function will only be called once.
   * // The cached value will be used on subsequent calls.
   * const blueAgents = environment.memo(() => {
   *   return environment.getAgents().filter(a => a.get('color') === 'blue');
   * });
   * ```
   */
  memo(fn: Function, key?: string): any {
    const serialized = (key ? key + "-" : "") + fn.toString();
    const memoValue = this.cache.get(serialized);
    if (memoValue && this.time === memoValue.time) return memoValue.value;

    // if does not exist in cache or time has elapsed, cache new value
    const value = fn();
    const newMemoValue: MemoValue = { value, time: this.time };
    this.cache.set(serialized, newMemoValue);
    return value;
  }
}

export { Environment };
