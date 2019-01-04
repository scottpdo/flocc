/// <reference path="../environments/Environment.d.ts" />
/// <reference path="../types/RuleObj.d.ts" />
/// <reference path="../types/Data.d.ts" />

class Agent {

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

  constructor() {
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
  get(name: string): any {
    return this.data.hasOwnProperty(name) ? this.data[name] : null;
  }

  /**
   * Retrieve all the data associated with this agent
   * (useful for destructuring properties).
   */
  getData(): Data {
    return this.data;
  }

  /**
   * Set a piece of data associated with this agent.
   * Name should be a string while value can be any valid type.
   * Alternatively, the first parameter can be an object, which merges
   * the current data with the new data (adding new values and overwriting existing).
   * Ex. agent.set('x', 5); agent.set('color', 'red');
   * @param {string|Data} name
   * @param {*} value
   */
  set(name: string | Data, value?: any): void {
    if (typeof name === 'string') {
      this.data[name] = value;
    } else {
      this.data = Object.assign(this.data, name);
    }
  }

  /**
   * Increment a numeric (assume integer) piece of data
   * associated with this agent. If `n` is included, increments by
   * `n`. If the value has not yet been set, initializes it to 1.
   * @param {string} name
   * @param {number} n
   */
  increment(name: string, n: number = 1): void {
    if (!this.get(name)) this.set(name, 0);
    this.set(name, this.get(name) + n);
  }

  /**
   * Decrement a numeric (assume integer) piece of data
   * associated with this agent. If `n` is included, decrements by
   * `n`. If the value has not yet been set,
   * initializes it to -1.
   * @param {string} name
   */
  decrement(name: string, n: number = 1): void {
    this.increment(name, -n);
  }

  /**
   * Add a rule to be executed during the agent's
   * environment's tick cycle. When executed, the
   * @param {Function} rule
   */
  addRule(rule: Function, ...args: Array<any>): void {
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
  enqueue(rule: Function, ...args: Array<any>): void {
    this.queue.push({
      args,
      rule
    });
  }
};

export { Agent };
