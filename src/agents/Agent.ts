/// <reference path="../types/RuleObj.d.ts" />
/// <reference path="../types/Data.d.ts" />
/// <reference path="../types/DataObj.d.ts" />
import { Environment } from "../environments/Environment";
import uuid from "../utils/uuid";

// Given a data object, a name, and a function value,
// force the object to call the function whenever data[name] is referenced
const setFunctionValue = (data: Data, name: string, fn: Function) => {
  Object.defineProperty(data, name, { get: () => fn() });
};

class Agent implements DataObj {
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
  id: string;

  constructor() {
    this.environment = null;
    this.rules = [];
    this.queue = [];
    this.data = {};
    this.id = uuid();
  }

  /**
   * Retrieve an arbitrary piece of data associated
   * with this agent by name.
   * @param {string} name
   */
  get(name: string): any {
    // return null if it doesn't exist
    if (!this.data.hasOwnProperty(name)) return null;
    return this.data[name];
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
    // helper function to set key-value pair depending on whether value
    // is a function (callable) or not
    const setKeyValue = (key: string, value: any) => {
      if (typeof value === "function") {
        setFunctionValue(this.data, key, value);
      } else {
        this.data[key] = value;
      }
    };

    // if just receiving a single key-value pair, simply set it
    if (typeof name === "string") {
      setKeyValue(name, value);
      // if receiving an object of key-value pairs (i.e. data object),
      // loop over keys and call setKeyValue for each
    } else {
      Object.keys(name).forEach(key => {
        const value = name[key];
        setKeyValue(key, value);
      });
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
}

export { Agent };
