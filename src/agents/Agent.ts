/// <reference path="../types/Data.d.ts" />
/// <reference path="../types/DataObj.d.ts" />
import { Environment } from "../environments/Environment";
import type { KDTree } from "../helpers/KDTree";
import type { FloccEvent, EventHandler } from "../events/EventBus";
import uuid from "../utils/uuid";
import { Rule } from "../helpers/Rule";
import once from "../utils/once";

declare interface RuleObj {
  rule: Function | Rule;
  args: Array<any>;
}

const disallowed: string[] = ["tick", "queue"];

const warnOnce1 = once(console.warn.bind(console));
const warnOnce2 = once(console.warn.bind(console));

/**
 * This class puts the `Agent` in 'agent-based modeling.' More specifically,
 * an `Agent` represents an individual unit of data and its associated
 * behaviors.
 * @since 0.0.5
 */
class Agent implements DataObj {
  /**
   * An `Agent` can only belong to a single {@linkcode Environment}. When
   * `environment.addAgent(agent);` is called, this is value is updated
   * to point to that `Environment`.
   *
   * ```js
   * const environment = new Environment();
   * const agent = new Agent();
   * agent.environment; // returns `null`
   *
   * environment.addAgent(agent);
   * agent.environment === environment; // returns `true`
   */
  environment: Environment = null;
  /** @hidden */
  rules: Array<RuleObj> = [];
  /** @hidden */
  queue: Array<RuleObj> = [];
  /** @hidden */
  data: Data = {};
  /**
   * `Agent`s are automatically assigned a unique ID when they are created.
   * This can be useful when you need to refer to a specific `Agent`, and
   * they can be retrieved using their ID from their `Environment` by calling
   * {@link Environment.getAgentById | `environment.getAgentById(id);`}
   * ```js
   * const agent = new Agent();
   * const id = agent.id; // returns "59B4F928-46C8-..." (for example)
   * ```
   */
  id: string = uuid();

  /**
   * This is used as a temporary store for data that
   * gets returned from rules. When enqueued rules are executed,
   * even if there aren't any enqueued rules, .set gets called
   * on any data that was placed here.
   * @hidden
   */
  __newData: Data = {};

  /**
   * Event handler subscriptions for this agent.
   * @hidden
   */
  private __eventHandlers: Map<string, Array<(agent: Agent, event: FloccEvent) => void>> = new Map();

  /**
   * Unsubscribe functions for event bus subscriptions.
   * @hidden
   */
  private __eventUnsubscribers: Array<() => void> = [];

  /** When agent.get('key') is called, this pseudo-private member is set to 'key'.
   * Once it is retrieved, it is reset to null. If agent.get('key') is called before
   * this has been reset, that means that there is an infinite loop, and the call
   * will throw an error.
   * @hidden
   */
  __retrievingData: string = null;

  /** @hidden */
  __subtree: KDTree = null;

  /**
   * `Agent`s can be instantiated with or without data. Instantiating
   * with data is equivalent to creating an `Agent` and immediately
   * calling {@linkcode Agent.set} to add data.
   *
   * ```js
   * // instantiates an Agent without data
   * const a = new Agent();
   *
   * // instantiates an Agent with data
   * const b = new Agent({
   *   x: 50,
   *   y: 100
   * });
   * ```
   * @param data
   */
  constructor(data: Data = {}) {
    this.set(data);
  }

  /**
   * Set a function value. `tick` and `queue` are not automatically called,
   * but any other named value will automatically be called when referenced.
   * @hidden
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
   * Retrieve an arbitrary piece of data associated by name.
   * If the data has not been {@linkcode set}, returns `null`.
   * @since 0.0.5
   */
  get(name: string): any {
    // return null if it doesn't exist or if is disallowed
    if (!this.data.hasOwnProperty(name) || disallowed.includes(name))
      return null;

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
   * Retrieve all the data associated with this `Agent` at once.
   *
   * ```js
   * agent.set('x', 3);
   * agent.set('color', 'blue');
   * agent.set('active', false);
   *
   * agent.getData();
   * // returns {
   * //   x: 3,
   * //   color: 'blue',
   * //   active: false
   * // }
   * ```
   * @since 0.1.0
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
   * @since 0.0.5
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
   * @hidden
   */
  _setKeyValue(key: string, value: any) {
    if (typeof value === "function") {
      this._setFunctionValue(key, value);
    } else {
      this.data[key] = value;
      // automatically handle wrapping for toroidal environments
      if (this.environment && this.environment.opts.torus) {
        const { width, height } = this.environment;
        if (key === "x" && value > width) this.data[key] -= width;
        if (key === "x" && value < 0) this.data[key] += width;
        if (key === "y" && value > height) this.data[key] -= height;
        if (key === "y" && value < 0) this.data[key] += height;
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
   * increment a numeric piece of data associated with this `Agent`
   * (increasing its value by 1). This method is *synchronous* &mdash;
   * it immediately increases the value (to *asynchronously* increase it,
   * the rule function should instead return a new value.
   *
   * ```js
   * agent.set('x', 50);
   * agent.increment('x');
   * agent.get('x'); // returns 51
   * ```
   *
   * If the second parameter `n` is included, decrements by that amount.
   *
   * ```js
   * agent.set('x', 50);
   * agent.increment('x', 10);
   * agent.get('x'); // returns 60
   * ```
   *
   * If the value has not yet been set, calling this method sets it to `1`
   * (or to `n`).
   * @since 0.0.8
   */
  increment(name: string, n: number = 1): void {
    if (this.get(name) === null) this.set(name, 0);
    this.set(name, this.get(name) + n);
  }

  /**
   * Decrement a numeric piece of data associated with this `Agent`
   * (decreasing its value by 1). This method is *synchronous* &mdash;
   * it immediately decreases the value (to *asynchronously* decrease it,
   * the rule function should instead return a new value.
   *
   * ```js
   * agent.set('x', 50);
   * agent.decrement('x');
   * agent.get('x'); // returns 49
   * ```
   *
   * If the second parameter `n` is included, decrements by that amount.
   *
   * ```js
   * agent.set('x', 50);
   * agent.decrement('x', 10);
   * agent.get('x'); // returns 40
   * ```
   *
   * If the value has not yet been set, calling this method sets it to `-1`
   * (or to `-n`).
   * @since 0.0.8
   */
  decrement(name: string, n: number = 1): void {
    this.increment(name, -n);
  }

  /**
   * Until v0.5.14, this was the preferred way to add behavior to `Agent`s.
   * Now, the preferred method is by setting the `Agent`'s `"tick"` value (i.e. `agent.set({ tick: function(agt) { ... }})`).
   * This method will still be allowed until v0.7.0.
   *
   * Adds a rule (a function taking an `Agent` as a callback or a {@linkcode Rule} object) that may be run with every {@linkcode Environment.tick}.
   * It is possible to add *more than one rule* to an `Agent`, although it
   * is generally easier to write a longer function or to break it apart
   * into multiple functions.
   *
   * ```js
   * // adds a rule that *synchronously* increments the Agent's "x" value
   * agent.addRule(function(agt) {
   *   agent.increment('x');
   * });
   *
   * // adds a rule that *asynchronously* increments the Agent's "x" value
   * agent.addRule(function(agt) {
   *   return {
   *     x: agt.get('x') + 1
   *   };
   * });
   * ```
   *
   * @deprecated since version 0.5.14
   * @since 0.0.5
   */
  addRule(rule: Function | Rule, ...args: Array<any>): void {
    warnOnce1(
      "As of Flocc v0.5.14, Agent.addRule is **DEPRECATED**. It will be **REMOVED** in v0.7.0. Instead, add the Agent's update rule by calling `Agent.set('tick', ...);`"
    );

    this.rules.push({
      args,
      rule
    });
  }

  /**
   * Like {@linkcode Agent.addRule}, this method is deprecated and the
   * recommended way is to now call
   * `agent.set('queue', function(agt) { ... });`
   *
   * Calling this method enqueues a function to be executed
   * *asynchronously* (at the end of the {@linkcode Environment}'s tick cycle).
   * This is useful if a 'cleanup pass' should be performed between
   * time steps to adjust `Agent` data.
   *
   * Below, the `Agent` sets its `"x"` value to `30` whenever it is
   * activated during the `Environment`'s tick cycle. After all of that
   * cycle's `Agent`s have been activated, this `Agent` sets its `"x"`
   * value to `20`. So if any other `Agent` references its `"x"` value
   * during a tick cycle after it has been activated, it will return `30`,
   * but in between tick cycles it will return `20`.
   *
   * ```js
   * agent.addRule(agt => {
   *   agt.set("x", 30);
   *   agt.enqueue(a => {
   *     a.set("x", 20);
   *   });
   * });
   * ```
   *
   * Any additional parameters passed to the enqueued function will
   * be remembered and passed through when the function is executed.
   *
   * @deprecated since version 0.5.14
   * @since 0.0.5
   */
  enqueue(rule: Function, ...args: Array<any>): void {
    warnOnce2(
      "As of Flocc v0.5.14, Agent.enqueue is **DEPRECATED**. It will be **REMOVED** in v0.7.0. Instead, add a rule to be executed at the end of this tick by calling `Agent.set('queue', ...);`"
    );

    this.queue.push({
      args,
      rule
    });
  }

  /**
   * From a RuleObj, execute a single rule (function or structured Rule).
   * @hidden
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
   * @hidden
   */
  executeRules() {
    const { tick } = this.data;
    if (tick && (typeof tick === "function" || tick instanceof Rule)) {
      Object.assign(
        this.__newData,
        this.executeRule({
          rule: tick,
          args: []
        })
      );
    }

    this.rules.forEach(ruleObj => {
      Object.assign(this.__newData, this.executeRule(ruleObj));
    });
  }

  /**
   * Execute all enqueued rules.
   * @hidden
   */
  executeEnqueuedRules() {
    // if new data from the rules
    // exists, set it
    this.set(this.__newData);
    this.__newData = {};

    const { queue } = this.data;
    if (queue && (typeof queue === "function" || queue instanceof Rule)) {
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

  // ============================================================
  // Event System Methods
  // ============================================================

  /**
   * Subscribe to an event type. The handler receives the agent as the first
   * argument and the event object as the second.
   *
   * @param type - Event type to listen for
   * @param handler - Function to call when event is emitted
   * @returns Unsubscribe function
   *
   * @example
   * ```js
   * agent.on('food:nearby', (agent, event) => {
   *   agent.set('target', event.data.location);
   *   agent.set('state', 'foraging');
   * });
   * ```
   *
   * @since 0.6.0
   */
  on<T = any>(type: string, handler: (agent: Agent, event: FloccEvent<T>) => void): () => void {
    // Store handler locally
    if (!this.__eventHandlers.has(type)) {
      this.__eventHandlers.set(type, []);
    }
    this.__eventHandlers.get(type)!.push(handler as (agent: Agent, event: FloccEvent) => void);

    // If attached to environment with event bus, also subscribe there
    if (this.environment?.events) {
      const unsubscribe = this.environment.events.on(type, (event) => {
        handler(this, event);
      });
      this.__eventUnsubscribers.push(unsubscribe);
      return unsubscribe;
    }

    // Return a no-op unsubscribe if not yet attached to environment
    return () => {
      const handlers = this.__eventHandlers.get(type);
      if (handlers) {
        const index = handlers.indexOf(handler as (agent: Agent, event: FloccEvent) => void);
        if (index !== -1) handlers.splice(index, 1);
      }
    };
  }

  /**
   * Emit an event to the environment's event bus.
   *
   * @param type - Event type
   * @param data - Event payload
   *
   * @example
   * ```js
   * // In tick function
   * agent.set('tick', (a) => {
   *   if (a.get('health') < 10) {
   *     a.emit('agent:lowHealth', { health: a.get('health') });
   *   }
   * });
   * ```
   *
   * @since 0.6.0
   */
  emit<T = any>(type: string, data: T): void {
    if (this.environment?.events) {
      this.environment.events.emit(type, data, this);
    }
  }

  /**
   * Re-register all event handlers with the environment's event bus.
   * Called automatically when agent is added to an environment.
   * @hidden
   */
  __registerEventHandlers(): void {
    if (!this.environment?.events) return;

    // Clear old unsubscribers
    for (const unsub of this.__eventUnsubscribers) {
      unsub();
    }
    this.__eventUnsubscribers = [];

    // Re-register all handlers
    this.__eventHandlers.forEach((handlers, type) => {
      handlers.forEach(handler => {
        const unsubscribe = this.environment.events.on(type, (event) => {
          handler(this, event);
        });
        this.__eventUnsubscribers.push(unsubscribe);
      });
    });
  }

  /**
   * Clean up event subscriptions when agent is removed.
   * @hidden
   */
  __unregisterEventHandlers(): void {
    for (const unsub of this.__eventUnsubscribers) {
      unsub();
    }
    this.__eventUnsubscribers = [];
  }

  // ============================================================
  // Scheduling Methods
  // ============================================================

  /**
   * Schedule this agent to tick at a specific environment time.
   * Only has an effect if the environment uses a scheduler that supports
   * explicit scheduling (e.g., PriorityScheduler).
   *
   * @param time - The environment time at which to tick
   *
   * @example
   * ```js
   * agent.set('tick', (a) => {
   *   // Do something...
   *   
   *   // Schedule next tick at time 150
   *   a.scheduleAt(150);
   * });
   * ```
   *
   * @since 0.6.0
   */
  scheduleAt(time: number): void {
    if (this.environment?.scheduler) {
      this.environment.scheduler.schedule(this, time);
    }
  }

  /**
   * Schedule this agent to tick after a delay (relative to current time).
   * Shorthand for `agent.scheduleAt(environment.time + delay)`.
   *
   * @param delay - Number of ticks to wait before next activation
   *
   * @example
   * ```js
   * agent.set('tick', (a) => {
   *   const energy = a.get('energy');
   *   a.set('energy', energy - 10);
   *   
   *   // Lower energy = longer wait until next action
   *   const delay = Math.ceil(100 / energy);
   *   a.scheduleIn(delay);
   * });
   * ```
   *
   * @since 0.6.0
   */
  scheduleIn(delay: number): void {
    const currentTime = this.environment?.time ?? 0;
    this.scheduleAt(currentTime + delay);
  }
}

export { Agent };

