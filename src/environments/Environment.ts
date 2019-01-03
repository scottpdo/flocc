/// <reference path="../agents/Agent.d.ts" />
/// <reference path="../renderers/Renderer.d.ts" />
/// <reference path="../types/EnvironmentOptions.d.ts" />

class Environment {

  /** @member {Agent[]} */
  agents: Array<Agent>;
  /** @member {Renderer} */
  renderer: Renderer | null;
  opts: EnvironmentOptions;
  width: number;
  height: number;

  constructor(opts: EnvironmentOptions = { torus: true }) {
    this.agents = [];
    this.renderer = null;
    this.opts = opts;
    this.width = 0;
    this.height = 0;
  }

  /**
   * Add an agent to the environment. Automatically sets the
   * agent's environment to be this environment.
   * @param {Agent} agent
   */
  addAgent(agent: Agent): void {
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
};

export { Environment };
