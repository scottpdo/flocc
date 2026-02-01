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
  vector = "vector",
  log = "log"
}

type StepToken = number | string | Step;
interface Step extends Array<StepToken> {}

interface RuleDiagnostic {
  path: string;
  level: "error" | "warning";
  message: string;
}

/**
 * Operator info: maps operator names to their expected argument counts.
 * `min` and `max` define the valid range. If `max` is Infinity, the operator is variadic.
 */
interface OperatorArity {
  min: number;
  max: number;
}

const operatorInfo: { [key: string]: OperatorArity } = {
  add: { min: 2, max: 2 },
  subtract: { min: 2, max: 2 },
  multiply: { min: 2, max: 2 },
  divide: { min: 2, max: 2 },
  mod: { min: 2, max: 2 },
  power: { min: 2, max: 2 },
  get: { min: 1, max: 1 },
  set: { min: 2, max: 2 },
  enqueue: { min: 2, max: 2 },
  local: { min: 1, max: 2 },
  if: { min: 2, max: 3 },
  and: { min: 2, max: 2 },
  or: { min: 2, max: 2 },
  gt: { min: 2, max: 2 },
  gte: { min: 2, max: 2 },
  lt: { min: 2, max: 2 },
  lte: { min: 2, max: 2 },
  eq: { min: 2, max: 2 },
  map: { min: 2, max: 2 },
  filter: { min: 2, max: 2 },
  key: { min: 2, max: 2 },
  method: { min: 2, max: Infinity },
  agent: { min: 0, max: 0 },
  environment: { min: 0, max: 0 },
  vector: { min: 1, max: Infinity },
  log: { min: 1, max: Infinity }
};

const ARITHMETIC_OPS = new Set(["add", "subtract", "multiply", "divide", "mod", "power"]);

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
 * Format a step into a readable string representation for logging.
 */
function formatStep(step: any): string {
  if (step === null || step === undefined) return String(step);
  if (typeof step === "number" || typeof step === "boolean") return String(step);
  if (typeof step === "string") return JSON.stringify(step);
  if (step instanceof Array) {
    if (step.length === 0) return "[]";
    const parts = step.map((s: any) => formatStep(s));
    return "(" + parts.join(" ") + ")";
  }
  if (typeof step === "object") {
    try {
      return JSON.stringify(step);
    } catch {
      return String(step);
    }
  }
  return String(step);
}

function validOperatorNames(): string {
  return Object.keys(operatorInfo).join(", ");
}

function checkArity(op: string, argCount: number, strict: boolean = false): string | null {
  const info = operatorInfo[op];
  if (!info) return null;
  if (info.min === info.max) {
    if (argCount < info.min) {
      return `Rule: "${op}" expects ${info.min} argument${info.min !== 1 ? "s" : ""}, got ${argCount}`;
    }
    if (strict && argCount > info.max) {
      return `Rule: "${op}" expects ${info.min} argument${info.min !== 1 ? "s" : ""}, got ${argCount}`;
    }
  } else if (info.max === Infinity) {
    if (argCount < info.min) {
      return `Rule: "${op}" expects at least ${info.min} argument${info.min !== 1 ? "s" : ""}, got ${argCount}`;
    }
  } else {
    if (argCount < info.min) {
      return `Rule: "${op}" expects ${info.min}-${info.max} arguments, got ${argCount}`;
    }
    if (strict && argCount > info.max) {
      return `Rule: "${op}" expects ${info.min}-${info.max} arguments, got ${argCount}`;
    }
  }
  return null;
}

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
   * Static operator info mapping operator names to their expected argument counts.
   */
  static operatorInfo: { [key: string]: OperatorArity } = operatorInfo;

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
   * |`"log"`|`any`|Logs expression(s) and returns the last evaluated value|
   */
  constructor(environment: Environment, steps: Step[]) {
    this.environment = environment;
    this.steps = steps;
  }

  /**
   * Validate the rule's step tree and return an array of diagnostics.
   * Does not throw — returns diagnostics for inspection.
   * @since 0.6.0
   */
  validate(): RuleDiagnostic[] {
    const diagnostics: RuleDiagnostic[] = [];

    if (!this.steps || (Array.isArray(this.steps) && this.steps.length === 0)) {
      diagnostics.push({
        path: "root",
        level: "warning",
        message: "Empty steps array"
      });
      return diagnostics;
    }

    // Check if steps is a single step (first element is a string operator)
    // or an array of steps (first element is an array)
    const isMultiStep = Array.isArray(this.steps[0]);

    if (isMultiStep) {
      // Multiple top-level steps
      for (let i = 0; i < this.steps.length; i++) {
        const step = this.steps[i];
        if (!Array.isArray(step)) {
          diagnostics.push({
            path: `[${i}]`,
            level: "warning",
            message: `Step is a bare value (${typeof step}: ${JSON.stringify(step)}) instead of an array`
          });
        } else {
          this._validateStep(step, `[${i}]`, diagnostics);
        }
      }
    } else {
      // Single step (the steps array IS the step)
      this._validateStep(this.steps, "root", diagnostics);
    }

    return diagnostics;
  }

  /** @hidden */
  private _validateStep(step: any[], path: string, diagnostics: RuleDiagnostic[]): void {
    if (step.length === 0) {
      diagnostics.push({
        path,
        level: "warning",
        message: "Empty step array"
      });
      return;
    }

    const first = step[0];

    // If first element is an array, it's a nested step sequence
    if (Array.isArray(first)) {
      this._validateStep(first, path + "[0]", diagnostics);
      for (let i = 1; i < step.length; i++) {
        if (Array.isArray(step[i])) {
          this._validateStep(step[i] as any[], path + `[${i}]`, diagnostics);
        }
      }
      return;
    }

    if (typeof first === "string") {
      const argCount = step.length - 1;

      // Check if operator is known
      if (!(first in Operators)) {
        if (step.length > 1) {
          diagnostics.push({
            path,
            level: "error",
            message: `Unknown operator "${first}". Valid operators: ${validOperatorNames()}`
          });
        }
        return;
      }

      // Check arity (strict: also warn on too many args)
      const arityMsg = checkArity(first, argCount, true);
      if (arityMsg) {
        diagnostics.push({
          path,
          level: "error",
          message: arityMsg
        });
      }

      // Recurse into sub-steps
      for (let i = 1; i < step.length; i++) {
        if (Array.isArray(step[i])) {
          this._validateStep(step[i] as any[], path + `[${i}]`, diagnostics);
        }
      }
    }
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

    if (first === Operators.log) {
      const args = step.slice(1);
      if (args.length === 0) {
        console.warn(`Rule: "log" expects at least 1 argument, got 0`);
        return null;
      }
      let lastValue: any = null;
      for (let i = 0; i < args.length; i++) {
        const expr = args[i];
        const evaluated = this.evaluate(agent, [expr]);
        console.log(`Rule log: ${formatStep(expr)} → ${formatStep(evaluated)}`);
        lastValue = evaluated;
      }
      return lastValue;
    }

    if (!(first in Operators) && step.length > 1) {
      if (typeof first === "string") {
        console.warn(`Rule: unknown operator "${first}". Valid operators: ${validOperatorNames()}`);
      }
      return step;
    }

    const argCount = step.length - 1;

    // Arity check at runtime for known operators
    if (typeof first === "string" && first in Operators) {
      const arityMsg = checkArity(first, argCount);
      if (arityMsg) {
        console.warn(arityMsg);
      }
    }

    const a = step.length > 1 ? [step[1]] : undefined;
    const b = step.length > 2 ? [step[2]] : undefined;
    const c = step.length > 3 ? [step[3]] : undefined;

    // Arithmetic operators with type checking
    if (ARITHMETIC_OPS.has(first)) {
      const va = this.evaluate(agent, a);
      const vb = this.evaluate(agent, b);
      if (typeof va !== "number" || typeof vb !== "number") {
        console.warn(`Rule: "${first}" expects numeric arguments, got ${typeof va} and ${typeof vb}`);
      }
      if (first === Operators.add) return add(va, vb);
      if (first === Operators.subtract) return subtract(va, vb);
      if (first === Operators.multiply) return multiply(va, vb);
      if (first === Operators.divide) return divide(va, vb);
      if (first === Operators.mod) return mod(va, vb);
      if (first === Operators.power) return power(va, vb);
    }

    if (first === Operators.get) {
      const keyName = this.evaluate(agent, a);
      const result = get(agent, keyName);
      if (result === null || result === undefined) {
        console.warn(`Rule: "get" returned null for key "${keyName}" — key may not exist on agent`);
      }
      return result;
    }
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

export { Rule, RuleDiagnostic };
