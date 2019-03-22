/// <reference path="../renderers/Renderer.d.ts" />
/// <reference path="./EnvironmentOptions.d.ts" />
/// <reference path="../types/Data.d.ts" />
import { Agent } from "../agents/Agent";

class Environment implements DataObj {
  /** @member {Agent[]} */
  agents: Array<Agent>;
  data: Data;
  /** @member {Renderer} */
  renderer: Renderer | null;
  opts: EnvironmentOptions;
  width: number;
  height: number;

  constructor(opts: EnvironmentOptions = { torus: true }) {
    this.agents = [];
    this.data = {};
    this.renderer = null;
    this.opts = opts;
    this.width = 0;
    this.height = 0;
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
  }

  /**
   * Remove an agent from the environment.
   * @param {Agent} agent
   */
  removeAgent(agent: Agent): void {
    // $FlowFixMe
    agent.environment = null;
    const index = this.agents.indexOf(agent);
    this.agents.splice(index, 1);
  }

  /**
   * Get an array of all the agents in the environment.
   * @return {Agent[]}
   */
  getAgents(): Array<Agent> {
    return this.agents;
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

    if (n > 1) {
      this.tick(n - 1);
      return;
    }

    if (this.renderer !== null) this.renderer.render();
  }
}

export { Environment };
