/// <reference path="../environments/Environment.d.ts" />

interface RuleObj {
  rule: Function;
  args: Array<any>;
}

declare class Agent {

  environment: Environment | null;
  rules: Array<RuleObj>;
  queue: Array<RuleObj>;
  data: Object;
  whatever: number;
  
  get(name: string): any;
  getData(): Object;
  set(name: string | Object, value: any): void;
  increment(name: string, n?: number): void;
  decrement(name: string, n?: number): void;
  addRule(rule: Function, ...args: Array<any>): void;
  enqueue(rule: Function, ...args: Array<any>): void;
}