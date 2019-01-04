/// <reference path="../src/agents/Cell.d.ts" />
/// <reference path="../src/types/Point.d.ts" />
import { Agent } from '../agents/Agent';
import { Environment } from './Environment';
declare class GridEnvironment extends Environment {
    cells: Map<string, Cell>;
    _cellHashes: Array<string>;
    constructor(width?: number, height?: number);
    /**
     * Fill every cell of the grid with an agent
     * and set that agent's position to its x/y coordinate.
     */
    fill(): void;
    normalize(x: number, y: number): Point;
    /**
     * For GridEnvironments, `addAgent` takes `x` and `y` values
     * and automatically adds a Agent to that cell coordinate.
     * @param {number} x
     * @param {number} y
     * @returns {Agent} The agent that was added at the specified coordinate.
     */
    addAgentAt(x_?: number, y_?: number, agent?: Agent): Agent;
    /**
     * For GridEnvironments, `removeAgent` takes `x` and `y` values
     * and removes the Agent (if there is one) at that cell coordinate.
     * @param {number} x
     * @param {number} y
     */
    removeAgentAt(x_?: number, y_?: number): void;
    /**
     * Retrieve the cell at the specified coordinate.
     * @param {number} x
     * @param {number} y
     * @return {Cell}
     */
    getCell(x_: number, y_: number): Cell | null;
    /**
     * Get all cells of the environment, in a flat array.
     * @return {Cell[]}
     */
    getCells(): Array<Cell>;
    /**
     * Retrieve the agent at the specified cell coordinate.
     * @param {number} x
     * @param {number} y
     * @return {undefined | Agent}
     */
    getAgent(x_: number, y_: number): Agent | null;
    /**
     * `loop` is like `tick`, but the callback is invoked with every
     * cell coordinate, not every agent.
     *
     * The callback is invoked with arguments `x`, `y`, and `agent`
     * (if there is one at that cell coordinate).
     * @param {Function} callback
     */
    loop(callback?: Function): void;
    /**
     * Given two pairs of cell coordinates, swap the agents at those cells.
     * If both are empty, nothing happens. If one is empty and the other has an agent,
     * this is equivalent to moving that agent to the new cell coordinate.
     * @param {number} x1
     * @param {number} y1
     * @param {number} x2
     * @param {number} y2
     */
    swap(x1_: number, y1_: number, x2_: number, y2_: number): void;
    /**
     * Find a random open cell in the GridEnvironment.
     * @returns {{ x: number, y: number }} The coordinate of the open cell.
     */
    getRandomOpenCell(): Cell | null;
    /**
     * Override/extend Environment.tick to include the
     * GridEnvironment's cells.
     * @override
     * @param {number} n - Number of times to tick.
     */
    tick(n?: number): void;
}
export { GridEnvironment };
