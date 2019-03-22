/// <reference path="../types/Data.d.ts" />

declare interface DataObj {
  data: Data;
  set(name: string | Data, value?: any): void;
  get(name: string): any;
  getData(): Data;
}
