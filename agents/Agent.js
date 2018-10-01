class Agent {

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
     * Increment a numeric (assume integer) piece of data
     * associated with this agent. If `n` is included, increments by
     * `n`. If the value has not yet been set,
     * initializes it to 1.
     * @param {number} value 
     */
    increment(value, n = 1) {
        if (!this.get(value)) this.set(value, 0);
        this.set(value, this.get(value) + n);
    }

    /**
     * Decrement a numeric (assume integer) piece of data
     * associated with this agent. If `n` is included, decrements by
     * `n`. If the value has not yet been set,
     * initializes it to -1.
     * @param {number} value 
     */
    decrement(value, n = 1) {
        if (!this.get(value)) this.set(value, 0);
        this.set(value, this.get(value) - n);
    }

    /**
     * Add a rule to be executed during the agent's 
     * environment's tick cycle. When executed, the 
     * @param {Function} rule 
     */
    addRule(rule, ...args) {
        this.rules.push({
            args,
            rule
        });
    }

    /**
     * Enqueue a function to be executed at the end of
     * the agent's environment's tick cycle (for example,
     * if agents in an environment should perform their 
     * calculations and updates separately). Additional/external 
     * data passed in as arguments to the enqueued function will
     * be remembered and passed through when the function is executed.
     * 
     * The `queue` array is cleared at the very end of 
     * the environment's tick cycle.
     * @param {Function} enqueuedRule
     */
    enqueue(rule, ...args) {
        this.queue.push({
            args,
            rule
        });
    }
};

export { Agent };