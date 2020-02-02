/// <reference path="../agents/Agent.d.ts" />
/// <reference path="../types/Point.d.ts" />

import {
  NewEnvironment,
  TickOptions,
  getTickOptions,
  defaultTickOptions
} from "./NewEnvironment";

import shuffle from "../utils/shuffle";
import { Rule } from "../helpers/Rule";
import { utils } from "../utils/utils";

const hash = (x: number, y: number): string =>
  x.toString() + "," + y.toString();
const unhash = (str: string): Point => {
  return {
    x: +str.split(",")[0],
    y: +str.split(",")[1]
  };
};

interface Cell {
  [key: string]: any;
}

class GridEnvironment extends NewEnvironment {
  cells: Map<string, Cell>;
  _cellHashes: Array<string>;

  constructor(width: number = 2, height: number = 2) {
    super();

    this.height = height;
    this.width = width;

    this.cells = new Map();

    // store hashes of all possible cells internally
    this._cellHashes = [];

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const id = hash(x, y);
        this._cellHashes.push(id);

        const cell: Cell = { x, y };
        cell.environment = this;
        this.cells.set(id, cell);
      }
    }
  }

  /**
   * Fill every cell of the grid with an agent
   * and set that agent's position to its x/y coordinate.
   */
  fill(): void {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        this.addAgentAt(x, y);
      }
    }
  }

  normalize(x: number, y: number): Point {
    while (x < 0) x += this.width;
    while (x >= this.width) x -= this.width;
    while (y < 0) y += this.height;
    while (y >= this.height) y -= this.height;
    return { x, y };
  }

  /**
   * For GridEnvironments, `addAgent` takes `x` and `y` values
   * and automatically adds a Agent to that cell coordinate.
   * @param {number} x_
   * @param {number} y_
   * @returns {Agent} The agent that was added at the specified coordinate.
   */
  addAgentAt(x_: number = 0, y_: number = 0, agent: Data = {}): Agent {
    const { x, y } = this.normalize(x_, y_);
    const id = hash(x, y);

    const cell = this.cells.get(id);
    if (!cell) throw new Error("Can't add an Agent to a non-existent Cell!");

    // If there is already an agent at this location,
    // overwrite it (with a warning). Remove the existing agent...
    if (cell.agent) {
      console.warn(`Overwriting agent at ${x}, ${y}.`);
      this.removeAgentAt(x, y);
    }

    const _agent = super.addAgent(agent);
    _agent.set({ x, y });

    cell.agent = _agent;

    return _agent;
  }

  /**
   * For GridEnvironments, `removeAgent` takes `x` and `y` values
   * and removes the Agent (if there is one) at that cell coordinate.
   * @param {number} x_
   * @param {number} y_
   */
  removeAgentAt(x_: number = 0, y_: number = 0): void {
    const { x, y } = this.normalize(x_, y_);
    const id = hash(x, y);

    const cell = this.cells.get(id);
    if (!cell)
      throw new Error("Can't remove an Agent from a non-existent Cell!");

    const { agent } = cell;
    if (!agent) return;

    super.removeAgentById(agent.id);

    cell.agent = null;
  }

  /**
   * Retrieve the cell at the specified coordinate.
   * @param {number} x_
   * @param {number} y_
   * @return {Cell}
   */
  getCell(x_: number, y_: number): Cell | null {
    const { x, y } = this.normalize(x_, y_);
    const id = hash(x, y);
    return this.cells.get(id) || null;
  }

  /**
   * Get all cells of the environment, in a flat array.
   * @return {Cell[]}
   */
  getCells(): Array<Cell> {
    return Array.from(this.cells.values());
  }

  /**
   * Retrieve the agent at the specified cell coordinate.
   * @param {number} x_
   * @param {number} y_
   * @return {null | Agent}
   */
  getAgentAt(x_: number, y_: number): Agent | null {
    const { x, y } = this.normalize(x_, y_);
    const id = hash(x, y);
    const cell = this.cells.get(id);
    if (!cell) return null;
    return cell.agent || null;
  }

  /**
   * `loop` is like `tick`, but the callback is invoked with every
   * cell coordinate, not every agent.
   *
   * The callback is invoked with arguments `x`, `y`, and `agent`
   * (if there is one at that cell coordinate).
   * @param {Function} callback
   */
  loop(callback: Function = function() {}): void {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const agent = this.getAgentAt(x, y);
        callback(x, y, agent);
      }
    }
  }

  /**
   * Given two pairs of cell coordinates, swap the agents at those cells.
   * If both are empty, nothing happens. If one is empty and the other has an agent,
   * this is equivalent to moving that agent to the new cell coordinate.
   * @param {number} x1_
   * @param {number} y1_
   * @param {number} x2_
   * @param {number} y2_
   */
  swap(x1_: number, y1_: number, x2_: number, y2_: number): void {
    const a = this.normalize(x1_, y1_);
    const x1 = a.x;
    const y1 = a.y;
    const b = this.normalize(x2_, y2_);
    const x2 = b.x;
    const y2 = b.y;

    const maybeAgent1 = this.getAgentAt(x1, y1);
    const maybeAgent2 = this.getAgentAt(x2, y2);

    if (maybeAgent1) {
      maybeAgent1.set({
        x: x2,
        y: y2
      });
    }

    if (maybeAgent2) {
      maybeAgent2.set({
        x: x1,
        y: y1
      });
    }

    const cell1 = this.cells.get(hash(x1, y1));
    const cell2 = this.cells.get(hash(x2, y2));
    if (cell1) cell1.agent = maybeAgent2;
    if (cell2) cell2.agent = maybeAgent1;
  }

  /**
   * Find a random open cell in the GridEnvironment.
   * @returns {Cell | null} The coordinate of the open cell.
   */
  getRandomOpenCell(): Cell | null {
    // randomize order of cell hashes
    const hashes = shuffle(this._cellHashes);

    // keep looking for an empty one until we find it
    while (hashes.length > 0) {
      const id = hashes.pop();
      const cell = this.cells.get(id);
      const maybeAgent = cell ? cell.agent : null;
      if (cell && !maybeAgent) return cell;
    }

    // once there are no hashes left, that means that there are no open cells
    return null;
  }

  /**
   * Get the neighbors of an agent within a certain radius.
   * Depending on the third parameter, retrieves either the von Neumann neighborhood
   * (https://en.wikipedia.org/wiki/Von_Neumann_neighborhood) or the Moore neighborhood
   * (https://en.wikipedia.org/wiki/Moore_neighborhood).
   *
   * @param {Agent} agent - the agent whose neighbors to retrieve
   * @param {number} radius - how far to look for neighbors
   * @param {boolean} moore - whether to use the Moore neighborhood or von Neumann (defaults to von Neumann)
   */
  neighbors(agent: Agent, radius: number = 1, moore: boolean = false): Agent[] {
    const { x, y } = agent.getData();
    const neighbors: Array<Agent> = [];

    if (radius < 1) return neighbors;

    for (let ny = -radius; ny <= radius; ny++) {
      for (let nx = -radius; nx <= radius; nx++) {
        if (nx === 0 && ny === 0) continue;
        const manhattan = Math.abs(ny) + Math.abs(nx);
        if (moore || manhattan <= radius) {
          neighbors.push(this.getAgentAt(x + nx, y + ny));
        }
      }
    }

    return neighbors;
  }

  /**
   * Execute all cell rules.
   * @param { boolean } randomizeOrder
   */
  _executeCellRules(randomizeOrder: boolean) {
    if (randomizeOrder) {
      utils.shuffle(this._cellHashes).forEach(hash => {
        const { x, y } = unhash(hash);
        const cell = this.getCell(x, y);
        if (!cell) return;
        cell.executeRules();
      });
    } else {
      for (let y = 0; y < this.height; y++) {
        for (let x = 0; x < this.width; x++) {
          const cell = this.getCell(x, y);
          if (!cell) continue;
          cell.executeRules();
        }
      }
    }
  }

  /**
   * Execute all enqueued cell rules.
   * @param { boolean } randomizeOrder
   */
  _executeEnqueuedCellRules(randomizeOrder: boolean) {
    if (randomizeOrder) {
      utils.shuffle(this._cellHashes).forEach(hash => {
        const { x, y } = unhash(hash);
        const cell = this.getCell(x, y);
        if (!cell) return;
        cell.executeEnqueuedRules();
      });
    } else {
      for (let y = 0; y < this.height; y++) {
        for (let x = 0; x < this.width; x++) {
          const cell = this.getCell(x, y);
          if (!cell) continue;
          cell.executeEnqueuedRules();
        }
      }
    }
  }

  /**
   * Override/extend Environment.tick to include the
   * GridEnvironment's cells.
   * @override
   * @param {number} opts
   */
  tick(opts?: number | TickOptions): void {
    const { count, randomizeOrder } = getTickOptions(opts);

    if (this.rule) {
      // TODO: randomize order
      if (randomizeOrder) {
      } else {
        while (this.current < this.agents) {
          this.enqueue(this.current, this.rule(this.getAgent(this.current)));
        }
        // update current data with next data
        Array.from(this.nextData.keys()).forEach(key => {
          this.data.set(key, Array.from(this.nextData.get(key)));
        });
        // reset current agent
        this.current = 0;
      }
    }

    this.time++;

    if (count > 1) return this.tick(count - 1);

    this.renderers.forEach(r => r.render());
  }
}

export { GridEnvironment };
