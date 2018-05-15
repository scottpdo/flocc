import Agent from '../agents/Agent';
import Environment from './Environment';

import sample from '../utils/sample';
import shuffle from '../utils/shuffle';

const hash = (x, y) => x.toString() + ',' + y.toString();
const unhash = (str) => { return {
        x: +(str.split(',')[0]),
        y: +(str.split(',')[1])
    };
};

export default class GridEnvironment extends Environment {

    constructor(width = 2, height = 2) {
        
        super();
        
        this.height = height;
        this.width = width;

        this.cells = new Map();

        // store hashes of all possible cells internally
        this._cellHashes = [];
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                this._cellHashes.push(hash(x, y));
            }
        }
    }

    /**
     * Fill every cell of the grid with an agent
     * and set that agent's position to its x/y coordinate.
     */
    fill() {
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                this.addAgent(x, y);
            }
        }
    }

    /**
     * For GridEnvironments, `addAgent` takes `x` and `y` values
     * and automatically adds a Agent to that cell coordinate.
     * @override
     * @param {number} x
     * @param {number} y
     * @returns {Agent} The agent that was added at the specified coordinate.
     */
    addAgent(x = 0, y = 0, agent = new Agent()) {

        // If there is already an agent at this location,
        // overwrite it (with a warning). Remove the existing agent...
        if (this.cells.get(hash(x, y))) {
            console.warn(`Overwriting agent at ${x}, ${y}.`);
            this.removeAgent(x, y);
        }
        
        // ...and add a new one
        agent.set('x', x);
        agent.set('y', y);
        this.agents.push(agent);
        this.cells.set(hash(x, y), agent);

        return agent;
    }

    /**
     * For GridEnvironments, `removeAgent` takes `x` and `y` values
     * and removes the Agent (if there is one) at that cell coordinate.
     * @override
     * @param {number} x
     * @param {number} y
     */
    removeAgent(x = 0, y = 0) {

        const agent = this.cells.get(hash(x, y));
        
        if (!agent) return;

        agent.environment = null;

        const indexAmongAgents = this.agents.indexOf(agent);
        this.agents.splice(indexAmongAgents, 1);

        this.cells.delete(hash(x, y));
    }

    /**
     * Retrieve the agent at the specified cell coordinate.
     * @param {number} x 
     * @param {number} y 
     * @return {undefined | Agent}
     */
    getAgent(x, y) {
        
        while (x < 0) x += this.width;
        while (x >= this.width) x -= this.width;
        while (y < 0) y += this.height;
        while (y >= this.height) y -= this.height;

        return this.cells.get(hash(x, y));
    }

    /**
     * `loop` is like `tick`, but the callback is invoked with every
     * cell coordinate, not every agent. 
     * 
     * The callback is invoked with arguments `x`, `y`, and `agent`
     * (if there is one at that cell coordinate).
     * @param {Function} callback 
     */
    loop(callback = function() {}) {
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const agent = this.getAgent(x, y);
                callback(x, y, agent);
            }
        }
    }

    /**
     * Given two pairs of cell coordinates, swap the agents at those cells.
     * If both are empty, nothing happens. If one is empty and the other has an agent,
     * this is equivalent to moving that agent to the new cell coordinate.
     * @param {number} x1 
     * @param {number} y1 
     * @param {number} x2 
     * @param {number} y2 
     */
    swap(x1, y1, x2, y2) {
        
        const maybeAgent1 = this.getAgent(x1, y1);
        const maybeAgent2 = this.getAgent(x2, y2);
        
        if (maybeAgent1) {
            maybeAgent1.set('x', x2);
            maybeAgent1.set('y', y2);
        }

        if (maybeAgent2) {
            maybeAgent1.set('x', x1);
            maybeAgent1.set('y', y1);
        }

        this.cells.set(hash(x1, y1), maybeAgent2);
        this.cells.set(hash(x2, y2), maybeAgent1);
    }

    /**
     * Find a random open cell in the GridEnvironment.
     * @returns {{ x: number, y: number }} The coordinate of the open cell.
     */
    getRandomOpenCell() {

        // randomize order of cell hashes
        const hashes = shuffle(this._cellHashes);
        
        // keep looking for an empty one until we find it
        while (hashes.length > 0) {
            const hash = hashes.pop();
            const maybeAgent = this.cells.get(hash);
            if (!maybeAgent) return unhash(hash);
        }

        // once there are no hashes left, that means that there are no open cells
        return null;
    }
}