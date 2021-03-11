import { Environment } from "../environments/Environment";
import { Agent } from "../agents/Agent";
import { Vector } from "./Vector";

enum Operators {
  add = "add",
  subtract = "subtract",
  multiply = "multiply",
  divide = "divide",
  mod = "mod",
  power = "power",
  get = "get",
  set = "set",
  enqueue = "enqueue",
  local = "local",
  if = "if",
  and = "and",
  or = "or",
  gt = "gt",
  gte = "gte",
  lt = "lt",
  lte = "lte",
  eq = "eq",
  map = "map",
  filter = "filter",
  key = "key",
  method = "method",
  agent = "agent",
  environment = "environment",
  vector = "vector"
}

type StepToken = number | string | Step;
interface Step extends Array<StepToken> {}

const add = (a: number, b: number): number => a + b;
const subtract = (a: number, b: number): number => a - b;
const multiply = (a: number, b: number): number => a * b;
const divide = (a: number, b: number): number => a / b;
const power = (a: number, b: number): number => a ** b;
const mod = (a: number, b: number): number => a % b;

const get = (agent: Agent, key: string): any => agent.get(key);
const set = (agent: Agent, key: string, value: any): null => {
  agent.set(key, value);
  return null;
};

const key = (obj: { [key: string]: any }, k: string): any => {
  return obj[k];
};
const method = (
  obj: { [key: string]: Function },
  name: string,
  ...args: any[]
): any => {
  if (!obj || !obj[name] || !(obj[name] instanceof Function)) return null;
  return obj[name](...args);
};

/**
 * The `Rule` class is an experimental interface for adding behavior to {@linkcode Agent}s. A `Rule` object may be used in place of a `tick` function to be added as `Agent` behavior using `agent.set('tick', tickRule)`. As a trivial example, consider the following `Rule`, which increments the `Agent`'s `x` value with every time step:
 *
 * ```js
 * const rule = new Rule(environment, [
 *   "set", "x", [
 *     "add", 1, [
 *       "get", "x"
 *     ]
 *   ]
 * ]);
 * agent.set("tick", rule);
 * ```
 *
 * Reading from the outer arrays inward, the steps of this `Rule` instructs the `Agent` to:
 * - `set` the `Agent`'s `"x"` value to...
 *   - The result of `add`ing `1` and...
 *     - The `Agent`'s current `"x"` value
 *
 * Generally, `Rule` steps are a deeply nested array, where the first value of any given array is always an instruction or operator (e.g. `"set"`, `"add"`, `"filter"`). See the {@linkcode constructor} function for more information about steps.
 * @since 0.3.0
 */
class Rule {
  /**
   * Points to the {@linkcode Environment} that is passed in the `Rule`'s constructor function (should be the same `Environment` of the {@linkcode Agent} invoking this `Rule`)
   */
  environment: Environment;
  /** @hidden */
  steps: Step[] = [];
  /** @hidden */
  locals: { [key: string]: any } = {};

  /**
   * A single step may be as simple as `["get", "x"]`. This returns the `Agent`'s `"x"` value to the outer step that contains it. So, for example, the step `["add", 1, ["get", "x"]]`, working from the inside out, retrieves the `"x"` value and then adds `1` to it. More complex steps function similarly, always traversing to the deepest nested step, evaluating it, and 'unwrapping' until all steps have been executed.
   *
   * A step's first element should be a string that is one of the allowed operators, followed by a certain number of arguments.
   *
   * |Operator|Arguments|Notes|
   * |---|---|---|
   * |`"add"`|`2`|Pass 2 numbers, or two steps that evaluate to numbers|
   * |`"subtract"`|`2`|""|
   * |`"multiply"`|`2`|""|
   * |`"divide"`|`2`|""|
   * |`"mod"`|`2`|""|
   * |`"power"`|`2`|""|
   * |`"get"`|`1`|Pass the key of `Agent` data to retrieve|
   * |`"set"`|`2`|Pass the key and value to set|
   * |`"enqueue"`|`2`|Pass the key and value to enqueue|
   * |`"local"`|`2`|Pass the key and value to set as local variables|
   * |`"if"`|`3`|Pass the conditional (usually a step that evaluates to a boolean), the step to run when `true`, and the step to run when `false|
   * |`"and"`|`2`|Pass the two steps to logically evaluate|
   * |`"or"`|`2`|""|
   * |`"gt"`|`2`|""|
   * |`"gte"`|`2`|""|
   * |`"lt"`|`2`|""|
   * |`"lte"`|`2`|""|
   * |`"eq"`|`2`|""|
   * |`"map"`|`2`|Pass an array (or step that evaluates to an array) and a lambda to invoke for each element|
   * |`"filter"`|`2`|""|
   * |`"key"`|`2`|Pass an object (or step that evaluates to an object) and the key to retrieve from that object|
   * |`"agent"`|`0`|No arguments; returns the `Agent`|
   * |`"environment"`|`0`|No arguments, returns the `Environment`|
   * |`"vector"`|`any`|Creates an n-dimensional {@linkcode Vector} from the supplied arguments|
   */
  constructor(environment: Environment, steps: Step[]) {
    this.environment = environment;
    this.steps = steps;
  }

  /**
   * interpret single array step
   * @since 0.3.0
   * @hidden
   */
  evaluate = (agent: Agent, step: any[]): any => {
    const first = step && step.length > 0 ? step[0] : null;
    if (first === undefined || first === null) return null;

    if (first instanceof Array) {
      const innerStep = this.evaluate(agent, first);
      if (innerStep === null) return this.evaluate(agent, step.slice(1));
      return innerStep;
    }

    if (first === "log") {
      console.log(
        "logging",
        step.slice(1),
        this.evaluate(agent, step.slice(1))
      );
      return null;
    }

    if (!(first in Operators) && step.length > 1) {
      return step;
    }

    const a = step.length > 1 ? [step[1]] : undefined;
    const b = step.length > 2 ? [step[2]] : undefined;
    const c = step.length > 3 ? [step[3]] : undefined;

    if (first === Operators.add)
      return add(this.evaluate(agent, a), this.evaluate(agent, b));
    if (first === Operators.subtract)
      return subtract(this.evaluate(agent, a), this.evaluate(agent, b));
    if (first === Operators.multiply)
      return multiply(this.evaluate(agent, a), this.evaluate(agent, b));
    if (first === Operators.divide)
      return divide(this.evaluate(agent, a), this.evaluate(agent, b));
    if (first === Operators.mod)
      return mod(this.evaluate(agent, a), this.evaluate(agent, b));
    if (first === Operators.power)
      return power(this.evaluate(agent, a), this.evaluate(agent, b));
    if (first === Operators.get) return get(agent, this.evaluate(agent, a));
    if (first === Operators.set)
      return set(agent, this.evaluate(agent, a), this.evaluate(agent, b));
    if (first === Operators.enqueue) {
      agent.enqueue(() =>
        set(agent, this.evaluate(agent, a), this.evaluate(agent, b))
      );
      return null;
    }
    if (first === Operators.local) {
      const key = this.evaluate(agent, a);
      const value = this.evaluate(agent, b);
      // get
      if (!value) return this.locals[key];
      // set
      this.locals[key] = value;
      return null;
    }
    if (first === Operators.if) {
      return this.evaluate(agent, a)
        ? this.evaluate(agent, b)
        : this.evaluate(agent, c);
    }
    if (first === Operators.and) {
      if (!this.evaluate(agent, a) || !this.evaluate(agent, b)) return false;
      return true;
    }
    if (first === Operators.or) {
      if (!this.evaluate(agent, a) && !this.evaluate(agent, b)) return false;
      return true;
    }
    if (first === Operators.gt)
      return this.evaluate(agent, a) > this.evaluate(agent, b);
    if (first === Operators.gte)
      return this.evaluate(agent, a) >= this.evaluate(agent, b);
    if (first === Operators.lt)
      return this.evaluate(agent, a) < this.evaluate(agent, b);
    if (first === Operators.lte)
      return this.evaluate(agent, a) <= this.evaluate(agent, b);
    if (first === Operators.eq)
      return this.evaluate(agent, a) === this.evaluate(agent, b);
    if (first === Operators.map) {
      const arr = this.evaluate(agent, a);
      const lambda = step[2]; // before evaluation
      const mapped = [];
      for (let i in arr) {
        const el = arr[i];
        const withEl = Array.from(lambda);
        withEl.splice(1, 0, el);
        mapped.push(this.evaluate(agent, withEl));
      }
      return mapped;
    }
    if (first === Operators.filter) {
      const arr = this.evaluate(agent, a);
      const lambda = step[2]; // before evaluation
      const mapped = [];
      for (let i in arr) {
        const el = arr[i];
        const withEl = Array.from(lambda);
        withEl.splice(1, 0, el);
        if (this.evaluate(agent, withEl)) {
          mapped.push(el);
        }
      }
      return mapped;
    }
    if (first === Operators.key)
      return key(this.evaluate(agent, a), this.evaluate(agent, b));
    if (first === Operators.method) {
      const args = step.length > 3 ? [this.evaluate(agent, step.slice(3))] : [];
      return method(this.evaluate(agent, a), this.evaluate(agent, b), ...args);
    }
    if (first === Operators.agent) return agent;
    if (first === Operators.environment) return this.environment;
    if (first === Operators.vector) {
      return new Vector(...this.evaluate(agent, step.slice(1)));
    }

    return first;
  };

  /**
   * @since 0.3.0
   * @hidden
   */
  call(agent: Agent): any {
    return this.evaluate(agent, this.steps);
  }
}

export { Rule };
