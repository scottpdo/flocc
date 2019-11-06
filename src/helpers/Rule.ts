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
  if (!obj[name] || !(obj[name] instanceof Function)) return null;
  return obj[name](...args);
};

class Rule {
  environment: Environment;
  steps: Step[] = [];
  locals: { [key: string]: any } = {};

  constructor(environment: Environment, steps: Step[]) {
    this.environment = environment;
    this.steps = steps;
  }

  // interpret single array step
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
      if (!value) return this.evaluate(agent, [this.locals[key]]);
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

  call(agent: Agent): any {
    return this.evaluate(agent, this.steps);
  }
}

export { Rule };
