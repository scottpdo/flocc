import { Environment } from "../environments/Environment";
import { Agent } from "../agents/Agent";

interface OperatorArity {
  min: number;
  max: number;
}

interface RuleDiagnostic {
  path: string;
  level: "error" | "warning";
  message: string;
}

declare class Rule {
  environment: Environment;
  locals: { [key: string]: any };
  steps: any[];

  static operatorInfo: { [key: string]: OperatorArity };

  constructor(environment: Environment, steps: any[]);

  evaluate(agent: Agent, step: any[]): any;
  call(agent: Agent): any;
  validate(): RuleDiagnostic[];
}

export { Rule, RuleDiagnostic };
