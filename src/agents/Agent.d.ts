/// <reference path="../types/Data.d.ts" />

declare interface Agent {
  get(key: string): any;
  getData(): Data;
  set(key: string, value: any): void;
  increment(key: string, n: number): void;
  decrement(key: string, n: number): void;
}
