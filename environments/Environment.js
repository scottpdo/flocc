import Agent from '../agents/Agent';

export default class Environment {
    
    constructor() {
        /** @member {Agent[]} */
        this.agents = [];
    }

    /**
     * Add an agent to the environment. Automatically sets the
     * agent's environment to be this environment.
     * @param {Agent} agent 
     */
    addAgent(agent) {
        agent.environment = this;
        this.agents.push(agent);
    }

    /**
     * Get an array of all the agents in the environment.
     * @return {Agent[]}
     */
    getAgents() {
        return this.agents;
    }

    /**
     * Moves the environment `n` ticks forward in time,
     * executing all agent's rules sequentially, followed by
     * any enqueued rules (which are removed with every tick).
     * If `n` is left empty, defaults to 1.
     * @param {number} n - Number of times to tick.
     */
    tick(n = 1) {
        
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

        if (n > 1) this.tick(n - 1);
    }
};