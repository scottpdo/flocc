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

interface RuleFormatOptions {
  indent?: string;
  maxLineWidth?: number;
}

declare class Rule {
  environment: Environment;
  locals: { [key: string]: any };
  steps: any[];
  trace: boolean;
  traceLog: string[];

  static operatorInfo: { [key: string]: OperatorArity };
  static formatSteps(steps: any[], options?: RuleFormatOptions): string;

  constructor(environment: Environment, steps: any[]);

  evaluate(agent: Agent, step: any[]): any;
  call(agent: Agent): any;
  validate(): RuleDiagnostic[];
  format(options?: RuleFormatOptions): string;
  toString(): string;
}

export { Rule, RuleDiagnostic, RuleFormatOptions };
