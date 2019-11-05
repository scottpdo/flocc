import { Environment } from "../environments/Environment";
import { Agent } from "../agents/Agent";

enum Operators {
  add = "add",
  subtract = "subtract",
  multiply = "multiply",
  divide = "divide",
  mod = "mod",
  power = "power",
  get = "get",
  set = "set",
  local = "local",
  if = "if",
  gt = "gt",
  gte = "gte",
  lt = "lt",
  lte = "lte",
  eq = "eq",
  map = "map",
  filter = "filter"
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
    const first = step[0];
    if (!first) return null;

    if (first instanceof Array) {
      const innerStep = this.evaluate(agent, first);
      if (innerStep === null) return this.evaluate(agent, step.slice(1));
      return innerStep;
    }

    if (!(first in Operators) && step.length > 1) {
      return step;
    }

    const a = step.length > 1 ? this.evaluate(agent, [step[1]]) : undefined;
    const b = step.length > 2 ? this.evaluate(agent, [step[2]]) : undefined;
    const c = step.length > 3 ? this.evaluate(agent, [step[3]]) : undefined;

    if (first === Operators.add) return add(a, b);
    if (first === Operators.subtract) return subtract(a, b);
    if (first === Operators.multiply) return multiply(a, b);
    if (first === Operators.divide) return divide(a, b);
    if (first === Operators.mod) return mod(a, b);
    if (first === Operators.power) return power(a, b);
    if (first === Operators.get) return get(agent, a);
    if (first === Operators.set) return set(agent, a, b);
    if (first === Operators.local) {
      const key = a;
      const value = b;
      // get
      if (!value) return this.evaluate(agent, [this.locals[key]]);
      // set
      this.locals[key] = value;
      return null;
    }
    if (first === Operators.if) return a ? b : c;
    if (first === Operators.gt) return a > b;
    if (first === Operators.gte) return a >= b;
    if (first === Operators.lt) return a < b;
    if (first === Operators.lte) return a <= b;
    if (first === Operators.eq) return a === b;
    if (first === Operators.map) {
      const arr = a;
      const lambda = step[2]; // before evaluation
      const mapped = [];
      for (let i in arr) {
        const el = arr[i];
        const withEl = Array.from(lambda);
        withEl.splice(1, 0, el);
        mapped.push(this.evaluate(agent, withEl));
      }
      return mapped;
    } else if (first === Operators.filter) {
      const arr = a;
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

    return first;
  };

  call(agent: Agent): any {
    return this.evaluate(agent, this.steps);
  }
}

export { Rule };
