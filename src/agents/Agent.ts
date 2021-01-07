/// <reference path="../types/Data.d.ts" />
/// <reference path="../types/DataObj.d.ts" />
import { Environment } from "../environments/Environment";
import type { KDTree } from "../helpers/KDTree";
import uuid from "../utils/uuid";
import { Rule } from "../helpers/Rule";
import torusNormalize from '../utils/internal/torusNormalize'

declare interface RuleObj {
  rule: Function | Rule;
  args: Array<any>;
}

const disallowed: string[] = ["tick", "queue"];

const dataHandler = {
  get(target: Data, key: string) {
    return target.hasOwnProperty(key) ? target[key] : null;
  }
}

class Agent implements DataObj {
  /**
   * @member {Environment|null} environment
   * @member {RuleObj[]} rules
   * @member {RuleObj[]} queue
   * @member {Object} data
   */
  environment: Environment = null;
  rules: Array<RuleObj> = [];
  queue: Array<RuleObj> = [];
  data: Data = {};
  id: string = uuid();

  // This is used as a temporary store for data that
  // gets returned from rules. When enqueued rules are executed,
  // even if there aren't any enqueued rules, .set gets called
  // on any data that was placed here.
  __newData: Data = {};

  // When agent.get('key') is called, this pseudo-private member is set to 'key'.
  // Once it is retrieved, it is reset to null. If agent.get('key') is called before
  // this has been reset, that means that there is an infinite loop, and the call
  // will throw an error.
  __retrievingData: string = null;

  __subtree: KDTree = null;

  constructor(data: Data = {}) {
    this.set(data);
  }

  /**
   * Set a function value. `tick` and `queue` are not automatically called,
   * but any other named value will automatically be called when referenced.
   * @param {string} name 
   * @param {Function} fn 
   */
  _setFunctionValue(name: string, fn: Function): void {
    if (disallowed.includes(name)) {
      this.data[name] = fn;
    } else {
      const { data } = this;
      Object.defineProperty(data, name, {
        get: () => fn(this),
        configurable: true
      });
    }
  }

  /**
   * Retrieve an arbitrary piece of data associated
   * with this agent by name.
   * @param {string} name
   */
  get(name: string): any {
    // return null if it doesn't exist or if is disallowed
    if (!this.data.hasOwnProperty(name) || disallowed.includes(name)) return null;

    // avoid infinite loops and give the user a hint if one is encountered
    if (this.__retrievingData === name) {
      throw new Error(
        `A reference to an agent's \`${name}\` resulted in a recursive call to get that same data.\n\nThis results in an infinite loop, since the agent will keep requesting that data, which requests itself, and so on forever. You should probably try to restructure your data function so this doesn't happen!`
      );
    }
    this.__retrievingData = name;
    const data = this.data[name];

    // Once the data has been retrieved, reset the pseudo-private member
    this.__retrievingData = null;
    return data;
  }

  /**
   * Retrieve all the data associated with this agent
   * (useful for destructuring properties).
   */
  getData(): Data {
    return new Proxy(this.data, dataHandler);
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
    // if just receiving a single key-value pair, simply set it
    if (typeof name === "string") {
      this._setKeyValue(name, value);
      // if receiving an object of key-value pairs (i.e. data object),
      // loop over keys and call setKeyValue for each
    } else {
      Object.keys(name).forEach(key => {
        const value = name[key];
        this._setKeyValue(key, value);
      });
    }
  }

  /** 
   * Helper function to set key-value pair depending on whether value
   * is a function (callable) or not
   */
  _setKeyValue(key: string, value: any) {
    if (typeof value === "function") {
      this._setFunctionValue(key, value);
    } else {
      this.data[key] = value;

      // automatically handle wrapping for toroidal environments
      if (this.environment && this.environment.opts.torus) {
        const { width, height } = this.environment;
        if (key === "x") this.data[key] = torusNormalize(value, width);
        if (key === "y") this.data[key] = torusNormalize(value, height);
      }

      // update environment dimension, if necessary
      if (this.environment) {
        const { environment } = this;
        const { dimension } = environment;
        if (key === 'x' && dimension < 1) environment.dimension = 1;
        if (key === 'y' && dimension < 2) environment.dimension = 2;
        if (key === 'z' && dimension < 3) environment.dimension = 3;
      }

      if (this.environment && this.environment.helpers.kdtree) {
        let subtree = this.__subtree;
        let bbox = subtree.bbox;
        // if the agent is no longer contained within its
        // subtree's bounding box, then
        // traverse the tree and mark the highest level
        // tree that will need to rebalance, starting with the parent
        // of the agent's current subtree
        while (!bbox.contains(this)) {
          if (subtree === this.environment.helpers.kdtree) break;
          subtree = subtree.parent;
          bbox = subtree.bbox;
        }
        subtree.needsUpdating = true;
      }
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
   * @param {Function | Rule} rule
   * @deprecated since version 0.5.14
   */
  addRule(rule: Function | Rule, ...args: Array<any>): void {
    console.warn("As of Flocc v0.5.14, Agent.addRule is **DEPRECATED**. It will be **REMOVED** in v0.7.0. Instead, add the Agent's update rule by calling `Agent.set('tick', ...);`");

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
   * @deprecated since version 0.5.14
   */
  enqueue(rule: Function, ...args: Array<any>): void {
    console.warn("As of Flocc v0.5.14, Agent.enqueue is **DEPRECATED**. It will be **REMOVED** in v0.7.0. Instead, add a rule to be executed at the end of this tick by calling `Agent.set('queue', ...);`");

    this.queue.push({
      args,
      rule
    });
  }

  /**
   * From a RuleObj, execute a single rule (function or structured Rule).
   * @param {RuleObj} ruleObj
   */
  executeRule(ruleObj: RuleObj): Data {
    const { rule, args } = ruleObj;
    if (rule instanceof Rule) {
      rule.call(this);
      return {};
    } else {
      const data = rule(this, ...args);
      return data || {};
    }
  }

  /**
   * Execute all rules.
   */
  executeRules() {
    const { tick } = this.data;
    if (tick && (typeof tick === 'function' || tick instanceof Rule)) {
      Object.assign(this.__newData, this.executeRule({
        rule: tick,
        args: []
      }));
    }
    
    this.rules.forEach(ruleObj => {
      Object.assign(this.__newData, this.executeRule(ruleObj));
    });
  }

  /**
   * Execute all enqueued rules.
   */
  executeEnqueuedRules() {
    // if new data from the rules
    // exists, set it
    this.set(this.__newData);
    this.__newData = {};

    const { queue } = this.data;
    if (queue && (typeof queue === 'function' || queue instanceof Rule)) {
      const data = this.executeRule({
        rule: queue,
        args: []
      });
      if (data) this.set(data);
      // remove once done
      delete this.data.queue;
    }
    
    // run through the queue and remove once done
    while (this.queue.length > 0) {
      const ruleObj = this.queue.shift();
      const data = this.executeRule(ruleObj);
      if (data) this.set(data);
    }
  }
}

export { Agent };
