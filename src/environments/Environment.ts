/// <reference path="./EnvironmentOptions.d.ts" />
/// <reference path="./EnvironmentHelper.d.ts" />
/// <reference path="../types/Data.d.ts" />
import { Agent } from "../agents/Agent";
import shuffle from "../utils/shuffle";
import { Network } from "../helpers/Network";
import { KDTree } from "../helpers/KDTree";
import { Terrain } from "../helpers/Terrain";
import type { AbstractRenderer } from "../renderers/AbstractRenderer";
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
  /** @member {Agent[]} */
  agents: Array<Agent> = [];
  agentsById: Map<string, Agent> = new Map();
  cache: Map<string, MemoValue> = new Map();
  helpers: Helpers = {
    kdtree: null,
    network: null,
    terrain: null
  };
  /** @member {AbstractRenderer[]} */
  renderers: AbstractRenderer[] = [];
  opts: EnvironmentOptions;
  width: number;
  height: number;
  /**
   * @member {number} time - The number of `ticks` that have occurred in this Environment's lifetime.
   * @since 0.1.4
   * */
  time: number = 0;

  constructor(opts: EnvironmentOptions = defaultEnvironmentOptions) {
    super();
    this.opts = Object.assign({}, defaultEnvironmentOptions);
    this.opts = Object.assign(this.opts, opts);
    this.width = this.opts.width;
    this.height = this.opts.height;
  }

  /**
   * Add an agent to the environment. Automatically sets the
   * agent's environment to be this environment.
   * @param {Agent} agent
   * @param {boolean} rebalance - Whether to rebalance if there is a KDTree (defaults to true)
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
  }

  /**
   * Remove an agent from the environment.
   * @param {Agent} agent
   * @param {boolean} [rebalance] - Whether to rebalance if there is a KDTree (defaults to true)
   * @since 0.0.8
   */
  removeAgent(agent: Agent, rebalance: boolean = true): void {
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
   * Removes all agents from the environment.
   * @since 0.1.3
   */
  clear(): void {
    while (this.getAgents().length > 0) {
      const a0 = this.getAgents()[0];
      this.removeAgent(a0);
    }
  }

  /**
   * From the parameter passed to .tick, get a structured TickOptions object.
   * @param {number | TickOptions} opts
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
   */
  _executeAgentRules(agents: Agent[]): void {
    agents.forEach(agent => agent?.executeRules());
  }

  /**
   * For all agents passed, execute enqueued agent rules
   */
  _executeEnqueuedAgentRules(agents: Agent[]): void {
    agents.forEach(agent => agent?.executeEnqueuedRules());
  }

  /**
   * Moves the environment forward in time,
   * executing all agent's rules sequentially, followed by
   * any enqueued rules (which are removed with every tick).
   * `opts` can be either a number (# of ticks) or config object.
   * @param {number | TickOptions} opts - Either the # of ticks or a config object
   * @param {"uniform" | "random"} opts.activation - The activation regime (defaults to "uniform")
   * @param {number} opts.count - The # of ticks
   * @param {boolean} randomizeOrder - For uniform activation, whether to randomize the order. Currently defaults to `false` but will default to `true` in v0.6.0.
   * @since 0.0.5
   */
  tick(opts?: number | TickOptions): void {
    const {
      activation,
      activationCount,
      count,
      randomizeOrder
    } = this._getTickOptions(opts);

    // for uniform activation, every agent is always activated
    if (activation === "uniform") {
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

    if (count > 1) {
      this.tick(count - 1);
      return;
    }

    this.renderers.forEach(r => r.render());
  }

  /**
   * Use a helper with this environment.
   * @param {EnvironmentHelper} e
   * @since 0.1.3
   */
  use(e: EnvironmentHelper) {
    if (e instanceof KDTree) this.helpers.kdtree = e;
    if (e instanceof Network) this.helpers.network = e;
    if (e instanceof Terrain) this.helpers.terrain = e;
  }

  /**
   * Get an array of data associated with agents in the environment by key.
   * Equivalent to calling `environment.getAgents().map(agent => agent.get(key));`
   * Defaults to calculating and storing the result within the same environment tick.
   * If the 2nd parameter is set to `false`, will recalculate and return the result every time.
   * @param {string} key - The key for which to retrieve data.
   * @param {boolean} useCache - Whether or not to cache the result (defaults to true).
   * @return {any[]} Array of data associated with `agent.get(key)` across all agents.
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
   * @param {Function} fn - The function to memoize.
   * @return {any} The return value of the function that was passed.
   * @since 0.3.14
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
