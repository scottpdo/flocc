/// <reference path="./Environment.d.ts" />
/// <reference path="../agents/Cell.d.ts" />
/// <reference path="../types/Point.d.ts" />

declare class GridEnvironment extends Environment {

  constructor(width: number, height: number);

  cells: Map<string, Cell>;
  _cellHashes: Array<string>;

  fill(): void;
  normalize(x: number, y: number): Point;
  addAgentAt(x: number, y: number, agent?: Agent): Agent;
  removeAgentAt(x: number, y: number): void;
  getCell(x: number, y: number): Cell | null;
  getCells(): Array<Cell>;
  getAgent(x: number, y: number): Agent | null;
  loop(callback: Function): void;
  swap(x1: number, y1: number, x2: number, y2: number): void;
  getRandomOpenCell(): Cell | null;
}
