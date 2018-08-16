import Agent from '../agents/Agent';
import Environment from './Environment';

import sample from '../utils/sample';
import shuffle from '../utils/shuffle';

const hash = (x, y) => x.toString() + ',' + y.toString();
const unhash = (str) => { 
    return {
        x: +(str.split(',')[0]),
        y: +(str.split(',')[1])
    };
};

class Cell extends Agent {
    constructor(x, y) {
        super();
        this.set('x', x);
        this.set('y', y);
    }
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
     */
    fill() {
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                this.addAgent(x, y);
            }
        }
    }

    normalize(x, y) {
        while (x < 0) x += this.width;
        while (x >= this.width) x -= this.width;
        while (y < 0) y += this.height;
        while (y >= this.height) y -= this.height;
        return { x, y };
    }

    /**
     * For GridEnvironments, `addAgent` takes `x` and `y` values
     * and automatically adds a Agent to that cell coordinate.
     * @override
     * @param {number} x
     * @param {number} y
     * @returns {Agent} The agent that was added at the specified coordinate.
     */
    addAgent(x_ = 0, y_ = 0, agent = new Agent()) {

        const { x, y } = this.normalize(x_, y_);
        const id = hash(x, y);

        // If there is already an agent at this location,
        // overwrite it (with a warning). Remove the existing agent...
        if (this.cells.get(id).get('agent')) {
            console.warn(`Overwriting agent at ${x}, ${y}.`);
            this.removeAgent(x, y);
        }
        
        // ...and add a new one
        agent.set('x', x);
        agent.set('y', y);

        this.agents.push(agent);
        this.cells.get(id).set('agent', agent);

        return agent;
    }

    /**
     * For GridEnvironments, `removeAgent` takes `x` and `y` values
     * and removes the Agent (if there is one) at that cell coordinate.
     * @override
     * @param {number} x
     * @param {number} y
     */
    removeAgent(x_ = 0, y_ = 0) {

        const { x, y } = this.normalize(x_, y_);
        const id = hash(x, y);
        const agent = this.cells.get(id).get('agent');
        
        if (!agent) return;

        agent.environment = null;

        const indexAmongAgents = this.agents.indexOf(agent);
        this.agents.splice(indexAmongAgents, 1);

        this.cells.get(id).set('agent', null);
    }
    /**
     * Retrieve the cell at the specified coordinate.
     * @param {number} x 
     * @param {number} y 
     * @return {Cell}
     */
    getCell(x_, y_) {
        const { x, y } = this.normalize(x_, y_);
        const id = hash(x, y);
        return this.cells.get(id);
    }

    /**
     * Get all cells of the environment, in a flat array.
     * @return {Cell[]}
     */
    getCells() {
        return [...this.cells.values()];
    }

    /**
     * Retrieve the agent at the specified cell coordinate.
     * @param {number} x 
     * @param {number} y 
     * @return {undefined | Agent}
     */
    getAgent(x_, y_) {
        const { x, y } = this.normalize(x_, y_);
        const id = hash(x, y);
        return this.cells.get(id).get('agent');
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
    swap(x1_, y1_, x2_, y2_) {
        
        const a = this.normalize(x1_, y1_);
        const x1 = a.x;
        const y1 = a.y;
        const b = this.normalize(x2_, y2_);
        const x2 = b.x;
        const y2 = b.y;

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

        this.cells.get(hash(x1, y1)).set('agent', maybeAgent2);
        this.cells.get(hash(x2, y2)).set('agent', maybeAgent1);
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
            const id = hashes.pop();
            const cell = this.cells.get(id);
            const maybeAgent = cell.get('agent');
            if (!maybeAgent) return cell;
        }

        // once there are no hashes left, that means that there are no open cells
        return null;
    }

    /**
     * Override/extend Environment.tick to include the 
     * GridEnvironment's cells.
     * @override
     * @param {number} n - Number of times to tick.
     */
    tick(n = 1) {

        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const cell = this.getCell(x, y);
                cell.rules.forEach(ruleObj => {
                    const { rule, args } = ruleObj;
                    rule(cell, ...args);
                });
            }
        }
        
        this.agents.forEach(agent => {
            agent.rules.forEach(ruleObj => {
                const { rule, args } = ruleObj;
                rule(agent, ...args);
            });
        });

        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const cell = this.getCell(x, y);
                while (cell.queue.length > 0) {
                    const { rule, args } = cell.queue.shift();
                    rule(cell, ...args);
                }
            }
        }
        
        this.agents.forEach(agent => {
            while (agent.queue.length > 0) {
                const { rule, args } = agent.queue.shift();
                rule(agent, ...args);
            }
        });

        if (n > 1) {
            this.tick(n - 1);
            return;
        }
        
        if (this.renderer !== null) this.renderer.render();
    }
}