/// <reference path="../types/Data.d.ts" />
/// <reference path="../environments/NewEnvironment.d.ts" />

declare interface Agent {
  environment: NewEnvironment;
  id: string;
  get(key: string): any;
  getData(): Data;
  set(key: string | Data, value?: any): void;
  increment(key: string, n: number): void;
  decrement(key: string, n: number): void;
}
