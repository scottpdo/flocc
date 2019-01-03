/// <reference path="../src/agents/Agent.d.ts" />
/// <reference path="../src/renderers/Renderer.d.ts" />
/// <reference path="../src/types/EnvironmentOptions.d.ts" />
declare class Environment {
    /** @member {Agent[]} */
    agents: Array<Agent>;
    /** @member {Renderer} */
    renderer: Renderer | null;
    opts: EnvironmentOptions;
    width: number;
    height: number;
    constructor(opts?: EnvironmentOptions);
    /**
     * Add an agent to the environment. Automatically sets the
     * agent's environment to be this environment.
     * @param {Agent} agent
     */
    addAgent(agent: Agent): void;
    /**
     * Remove an agent from the environment.
     * @param {Agent} agent
     */
    removeAgent(agent: Agent): void;
    /**
     * Get an array of all the agents in the environment.
     * @return {Agent[]}
     */
    getAgents(): Array<Agent>;
    /**
     * Moves the environment `n` ticks forward in time,
     * executing all agent's rules sequentially, followed by
     * any enqueued rules (which are removed with every tick).
     * If `n` is left empty, defaults to 1.
     * @param {number} n - Number of times to tick.
     */
    tick(n?: number): void;
}
export { Environment };
