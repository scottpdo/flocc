/// <reference path="../src/environments/Environment.d.ts" />
/// <reference path="../src/types/RuleObj.d.ts" />
/// <reference path="../src/types/Data.d.ts" />
declare class Agent {
    /**
     * @member {Environment|null} environment
     * @member {RuleObj[]} rules
     * @member {RuleObj[]} queue
     * @member {Object} data
     */
    environment: Environment | null;
    rules: Array<RuleObj>;
    queue: Array<RuleObj>;
    data: Data;
    constructor();
    /**
     * Retrieve an arbitrary piece of data associated
     * with this agent by name.
     * @param {string} name
     */
    get(name: string): any;
    /**
     * Retrieve all the data associated with this agent
     * (useful for destructuring properties).
     */
    getData(): Data;
    /**
     * Set a piece of data associated with this agent.
     * Name should be a string while value can be any valid type.
     * Alternatively, the first parameter can be an object, which merges
     * the current data with the new data (adding new values and overwriting existing).
     * Ex. agent.set('x', 5); agent.set('color', 'red');
     * @param {string|Data} name
     * @param {*} value
     */
    set(name: string | Data, value?: any): void;
    /**
     * Increment a numeric (assume integer) piece of data
     * associated with this agent. If `n` is included, increments by
     * `n`. If the value has not yet been set, initializes it to 1.
     * @param {string} name
     * @param {number} n
     */
    increment(name: string, n?: number): void;
    /**
     * Decrement a numeric (assume integer) piece of data
     * associated with this agent. If `n` is included, decrements by
     * `n`. If the value has not yet been set,
     * initializes it to -1.
     * @param {string} name
     */
    decrement(name: string, n?: number): void;
    /**
     * Add a rule to be executed during the agent's
     * environment's tick cycle. When executed, the
     * @param {Function} rule
     */
    addRule(rule: Function, ...args: Array<any>): void;
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
    enqueue(rule: Function, ...args: Array<any>): void;
}
export { Agent };
