/// <reference path="../renderers/Renderer.d.ts" />
/// <reference path="./EnvironmentOptions.d.ts" />
/// <reference path="./EnvironmentHelper.d.ts" />
/// <reference path="../types/Data.d.ts" />
import { Agent } from "../agents/Agent";
import { Network } from "../helpers/Network";

interface Helpers {
  network: Network;
}

/**
 * An environment provides the space and time in which agents interact.
 * Environments, like agents, can store data in key-value pairs
 * that can be updated over time.
 */
class Environment implements DataObj {
  /** @member {Agent[]} */
  agents: Array<Agent>;
  agentsById: Map<string, Agent>;
  data: Data;
  helpers: Helpers;
  /** @member {Renderer[]} */
  renderers: Renderer[];
  opts: EnvironmentOptions;
  width: number;
  height: number;
  time: number;

  constructor(opts: EnvironmentOptions = { torus: true }) {
    this.agents = [];
    this.agentsById = new Map();
    this.data = {};
    this.renderers = [];
    this.opts = opts;
    this.width = 0;
    this.height = 0;
    this.helpers = {
      network: null
    };
    this.time = 0;
  }

  /**
   * Retrieve an arbitrary piece of data associated
   * with this environment by name.
   * @param {string} name
   */
  get(name: string): any {
    return this.data.hasOwnProperty(name) ? this.data[name] : null;
  }

  /**
   * Retrieve all the data associated with this environment
   * (useful for destructuring properties).
   */
  getData(): Data {
    return this.data;
  }

  /**
   * Set a piece of data associated with this environment.
   * Name should be a string while value can be any valid type.
   * Alternatively, the first parameter can be an object, which merges
   * the current data with the new data (adding new values and overwriting existing).
   * @param {string|Data} name
   * @param {*} value
   */
  set(name: string | Data, value?: any): void {
    if (typeof name === "string") {
      this.data[name] = value;
    } else {
      this.data = Object.assign(this.data, name);
    }
  }

  /**
   * Add an agent to the environment. Automatically sets the
   * agent's environment to be this environment.
   * @param {Agent} agent
   */
  addAgent(agent: Agent): void {
    if (!(agent instanceof Agent)) return;
    agent.environment = this;
    this.agents.push(agent);
    this.agentsById.set(agent.id, agent);
  }

  /**
   * Remove an agent from the environment.
   * @param {Agent} agent
   */
  removeAgent(agent: Agent): void {
    agent.environment = null;
    const index = this.agents.indexOf(agent);
    this.agents.splice(index, 1);
    this.agentsById.delete(agent.id);
  }

  /**
   * Remove an agent from the environment by its ID.
   * @param {string} id
   */
  removeAgentById(id: string): void {
    const agent = this.getAgentById(id);
    if (!agent) return;
    this.removeAgent(agent);
  }

  /**
   * Get an array of all the agents in the environment.
   * @return {Agent[]}
   */
  getAgents(): Array<Agent> {
    return this.agents;
  }

  /**
   * Get an agent in the environment by its ID.
   * @param {string} id
   * @returns {Agent|null}
   */
  getAgentById(id: string): Agent | null {
    return this.agentsById.get(id) || null;
  }

  /**
   * Removes all agents from the environment.
   */
  clear(): void {
    while (this.getAgents().length > 0) {
      const a0 = this.getAgents()[0];
      this.removeAgent(a0);
    }
  }

  /**
   * Moves the environment `n` ticks forward in time,
   * executing all agent's rules sequentially, followed by
   * any enqueued rules (which are removed with every tick).
   * If `n` is left empty, defaults to 1.
   * @param {number} n - Number of times to tick.
   */
  tick(n: number = 1): void {
    this.agents.forEach(agent => {
      agent.rules.forEach(ruleObj => {
        const { rule, args } = ruleObj;
        rule(agent, ...args);
      });
    });

    this.agents.forEach(agent => {
      while (agent.queue.length > 0) {
        const { rule, args } = agent.queue.shift();
        rule(agent, ...args);
      }
    });

    this.time++;

    if (n > 1) {
      this.tick(n - 1);
      return;
    }

    this.renderers.forEach(r => r.render());
  }

  /**
   * Use a helper with this environment.
   * @param {EnvironmentHelper} e
   */
  use(e: EnvironmentHelper) {
    if (e instanceof Network) this.helpers.network = e;
  }
}

export { Environment };
