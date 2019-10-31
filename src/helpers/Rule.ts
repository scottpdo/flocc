import { Environment } from "../environments/Environment";
import { Agent } from "../agents/Agent";

class Rule {
  environment: Environment;
  steps: any[] = [];
  locals: { [key: string]: any } = {};
  _log: boolean;

  constructor(environment: Environment, steps: any[], log = false) {
    this.environment = environment;
    this.steps = steps;
    this._log = log;
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

    const a = this.evaluate(agent, [step[1]]);
    const b = this.evaluate(agent, [step[2]]);

    if (first === "add") {
      this.log("Add", a, "and", b);
      return a + b;
    } else if (first === "subtract") {
      this.log("Subtract", b, "from", a);
      return a - b;
    } else if (first === "multiply") {
      this.log("Multiply", a, "and", b);
      return a * b;
    } else if (first === "divide") {
      this.log("Divide", a, "by", b);
      return a / b;
    } else if (first === "mod") {
      this.log(a, "module", b);
      return a % b;
    } else if (first === "power") {
      this.log(a, "to the", b, "power");
      return a ** b;
    } else if (first === "get") {
      const key = a;
      const value = agent.get(key);
      this.log("Retrieve agent data", key, "with value", value);
      return value;
    } else if (first === "set") {
      const key = a;
      const value = b;
      agent.set(key, value);
      this.log("Set agent variable", key, "with the value", value);
      return null;
    } else if (first === "local") {
      const key = a;
      const value = b;
      // get
      if (!value) {
        this.log(
          "Retrieve local variable",
          key,
          "with value",
          this.locals[key]
        );
        return this.evaluate(agent, [this.locals[key]]);
      }
      // set
      this.locals[key] = value;
      this.log("Set local variable", key, "with value", value);
      return null;
    } else if (first === "if") {
      const condition = a;
      const matchTrue = b;
      const matchFalse = this.evaluate(agent, [step[3]]);
      return condition ? matchTrue : matchFalse;
    } else if (first === "gt") {
      return a > b;
    } else if (first === "gte") {
      return a >= b;
    } else if (first === "lt") {
      return a < b;
    } else if (first === "lte") {
      return a <= b;
    } else if (first === "eq") {
      return a === b;
    }

    return first;
  };

  log(...args: any[]): void {
    if (this._log) console.log.apply(console, args);
  }

  call(agent: Agent): any {
    return this.evaluate(agent, this.steps);
  }
}

export { Rule };
