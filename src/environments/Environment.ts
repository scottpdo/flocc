/// <reference path="../renderers/Renderer.d.ts" />
/// <reference path="./EnvironmentOptions.d.ts" />
/// <reference path="./EnvironmentHelper.d.ts" />
/// <reference path="../types/Data.d.ts" />
import { Agent } from "../agents/Agent";
import { Network } from "../helpers/Network";
import { Rule } from "../helpers/Rule";
import shuffle from "../utils/shuffle";

interface Helpers {
  network: Network;
}

export interface TickOptions {
  count?: number;
  randomizeOrder?: boolean;
}

export const defaultTickOptions: TickOptions = {
  count: 1,
  randomizeOrder: false
};

/**
 * An environment provides the space and time in which agents interact.
 * Environments, like agents, can store data in key-value pairs
 * that can be updated over time.
 */
class Environment extends Agent {
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
    super();
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
   * Moves the environment forward in time,
   * executing all agent's rules sequentially, followed by
   * any enqueued rules (which are removed with every tick).
   * Can take either a number or a configuration object as a parameter.
   * If a number, the environment will tick forward that many times.
   * @param {number | TickOptions} opts
   */
  tick(opts?: number | TickOptions): void {
    let count: number = 1;
    if (typeof opts === "number") {
      count = opts;
    } else if (!!opts) {
      count = opts.count || 1;
    }

    let randomizeOrder: boolean = false;
    if (
      opts &&
      typeof opts !== "number" &&
      opts.hasOwnProperty("randomizeOrder")
    )
      randomizeOrder = opts.randomizeOrder;

    (randomizeOrder ? shuffle(this.agents) : this.agents).forEach(agent => {
      agent.rules.forEach(ruleObj => {
        const { rule, args } = ruleObj;
        if (rule instanceof Rule) {
          rule.call(agent);
        } else {
          rule(agent, ...args);
        }
      });
    });

    (randomizeOrder ? shuffle(this.agents) : this.agents).forEach(agent => {
      while (agent.queue.length > 0) {
        const { rule, args } = agent.queue.shift();
        if (rule instanceof Rule) {
          rule.call(agent);
        } else {
          rule(agent, ...args);
        }
      }
    });

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
   */
  use(e: EnvironmentHelper) {
    if (e instanceof Network) this.helpers.network = e;
  }
}

export { Environment };
