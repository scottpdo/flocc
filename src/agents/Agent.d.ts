/// <reference path="../environments/Environment.d.ts" />
/// <reference path="../types/RuleObj.d.ts" />
/// <reference path="../types/Data.d.ts" />

declare class Agent {
  environment: Environment | null;
  rules: Array<RuleObj>;
  queue: Array<RuleObj>;
  data: Data;

  get(name: string): any;
  getData(): Data;
  set(name: string | Data, value?: any): void;
  increment(name: string, n?: number): void;
  decrement(name: string, n?: number): void;
  addRule(rule: Function, ...args: Array<any>): void;
  enqueue(rule: Function, ...args: Array<any>): void;
}
