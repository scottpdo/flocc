export default class Agent {

    constructor() {
        /**
         * @member {Environment} environment
         * @member {Function[]} rules
         * @member {Function[]} queue
         * @member {Object} data
         */
        this.environment = null;
        this.rules = [];
        this.queue = [];
        this.data = {};
    }

    /**
     * Retrieve an arbitrary piece of data associated 
     * with this agent by name.
     * @param {string} name 
     */
    get(name) {
        return this.data[name];
    }

    /**
     * Set a piece of data associated with this agent.
     * Name should be a string while value can be any valid type.
     * Ex. agent.set('x', 5); agent.set('color', 'red');
     * @param {string} name 
     * @param {*} value 
     */
    set(name, value) {
        this.data[name] = value;
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