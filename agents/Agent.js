export default class Agent {

    constructor() {
        this.environment = null;
        this.rules = [];
        this.queue = [];
    }

    /**
     * Add a rule to be executed during the agent's 
     * environment's tick cycle.
     * @param {Function} rule 
     */
    addRule(rule) {
        this.rules.push(rule);
    }

    /**
     * Enqueue a function to be executed at the end of
     * the agent's environment's tick cycle (for example,
     * if agents in an environment should perform their 
     * calculations and updates separately). 
     * 
     * The `queue` array is cleared at the very end of 
     * the environment's tick cycle.
     * @param {Function} enqueuedRule
     */
    enqueue(enqueuedRule) {
        this.queue.push(enqueuedRule);
    }
};