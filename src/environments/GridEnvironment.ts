/// <reference path="../types/Point.d.ts" />

import { Agent } from "../agents/Agent";
import { Cell } from "../agents/Cell";
import { Environment, TickOptions, defaultTickOptions } from "./Environment";

import shuffle from "../utils/shuffle";

const hash = (x: number, y: number): string =>
  x.toString() + "," + y.toString();
const unhash = (str: string): Point => {
  return {
    x: +str.split(",")[0],
    y: +str.split(",")[1]
  };
};

/**
 * @since 0.0.5
 */
class GridEnvironment extends Environment {
  cells: Map<string, Cell>;
  _cellHashes: Array<string>;

  constructor(width: number = 2, height: number = 2) {
    super();

    console.warn(
      "As of Flocc v0.5.0, GridEnvironment is **DEPRECATED**. It will be **REMOVED** in v0.6.0. The Terrain helper should be used for 2-dimensional grid-like data. Read more about Terrains here: https://flocc.network/docs/terrain"
    );

    this.height = height;
    this.width = width;

    this.cells = new Map();

    // store hashes of all possible cells internally
    this._cellHashes = [];

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const id = hash(x, y);
        this._cellHashes.push(id);

        const cell = new Cell(x, y);
        cell.environment = this;
        this.cells.set(id, cell);
      }
    }
  }

  /**
   * Fill every cell of the grid with an agent
   * and set that agent's position to its x/y coordinate.
   * @since 0.0.5
   */
  fill(): void {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        this.addAgentAt(x, y);
      }
    }
  }

  /**
   * @since 0.1.0
   */
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
   * @since 0.1.0
   */
  addAgentAt(
    x_: number = 0,
    y_: number = 0,
    agent: Agent = new Agent()
  ): Agent {
    const { x, y } = this.normalize(x_, y_);
    const id = hash(x, y);

    const cell = this.cells.get(id);
    if (!cell) throw new Error("Can't add an Agent to a non-existent Cell!");

    // If there is already an agent at this location,
    // overwrite it. Remove the existing agent...
    if (cell.get("agent")) {
      this.removeAgentAt(x, y);
    }

    // ...and add a new one
    agent.set({ x, y });
    agent.environment = this;

    this.agents.push(agent);
    cell.set("agent", agent);

    return agent;
  }

  /**
   * For GridEnvironments, `removeAgent` takes `x` and `y` values
   * and removes the Agent (if there is one) at that cell coordinate.
   * @param {number} x_
   * @param {number} y_
   * @since 0.1.0
   */
  removeAgentAt(x_: number = 0, y_: number = 0): void {
    const { x, y } = this.normalize(x_, y_);
    const id = hash(x, y);

    const cell = this.cells.get(id);
    if (!cell)
      throw new Error("Can't remove an Agent from a non-existent Cell!");

    const agent = cell.get("agent");
    if (!agent) return;

    agent.environment = null;

    const indexAmongAgents = this.agents.indexOf(agent);
    this.agents.splice(indexAmongAgents, 1);

    cell.set("agent", null);
  }

  /**
   * Retrieve the cell at the specified coordinate.
   * @param {number} x_
   * @param {number} y_
   * @return {Cell}
   * @since 0.1.0
   */
  getCell(x_: number, y_: number): Cell | null {
    const { x, y } = this.normalize(x_, y_);
    const id = hash(x, y);
    return this.cells.get(id) || null;
  }

  /**
   * Get all cells of the environment, in a flat array.
   * @return {Cell[]}
   * @since 0.1.0
   */
  getCells(): Array<Cell> {
    return Array.from(this.cells.values());
  }

  /**
   * Retrieve the agent at the specified cell coordinate.
   * @param {number} x_
   * @param {number} y_
   * @return {null | Agent}
   * @since 0.1.0
   */
  getAgentAt(x_: number, y_: number): Agent | null {
    const { x, y } = this.normalize(x_, y_);
    const id = hash(x, y);
    const cell = this.cells.get(id);
    if (!cell) return null;
    return cell.get("agent") || null;
  }

  /**
   * `loop` is like `tick`, but the callback is invoked with every
   * cell coordinate, not every agent.
   *
   * The callback is invoked with arguments `x`, `y`, and `agent`
   * (if there is one at that cell coordinate).
   * @param {Function} callback
   * @since 0.0.5
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
   * @since 0.0.7
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
    if (cell1) cell1.set("agent", maybeAgent2);
    if (cell2) cell2.set("agent", maybeAgent1);
  }

  /**
   * Find a random open cell in the GridEnvironment.
   * @returns {Cell | null} The coordinate of the open cell.
   * @since 0.0.7
   */
  getRandomOpenCell(): Cell | null {
    // randomize order of cell hashes
    const hashes = shuffle(this._cellHashes);

    // keep looking for an empty one until we find it
    while (hashes.length > 0) {
      const id = hashes.pop();
      const cell = this.cells.get(id);
      const maybeAgent = cell ? cell.get("agent") : null;
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
   * @since 0.1.4
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
      shuffle(this._cellHashes).forEach(hash => {
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
      shuffle(this._cellHashes).forEach(hash => {
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
  tick(opts?: number | TickOptions) {
    const { count, randomizeOrder } = this._getTickOptions(opts);

    // execute all cell rules
    this._executeCellRules(randomizeOrder);

    // execute all agent rules
    this._executeAgentRules(randomizeOrder);

    // execute all enqueued cell rules
    this._executeEnqueuedCellRules(randomizeOrder);

    // execute all enqueued agent rules
    this._executeEnqueuedAgentRules(randomizeOrder);

    this.time++;

    if (count > 1) {
      this.tick(count - 1);
      return;
    }

    this.renderers.forEach(r => r.render());
  }
}

export { GridEnvironment };
