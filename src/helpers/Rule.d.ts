import { Environment } from "../environments/Environment";
import { Agent } from "../agents/Agent";

declare interface Rule {
  environment: Environment;
  locals: { [key: string]: any };
  steps: any[];

  evaluate(agent: Agent, step: any[]): any;
  call(agent: Agent): void;
}
