import Environment from './Environment';
import SpatialAgent from '../agents/SpatialAgent';

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
     * Fill every cell of the grid with a SpatialAgent
     * and set that agent's position to its x/y coordinate.
     */
    fill() {
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const agent = new SpatialAgent(x, y);
                this.agents.push(agent);
                this.cells.set(hash(x, y), agent);
            }
        }
    }

    /**
     * @override
     */
    addAgent(x = 0, y = 0) {

        // If there is already an agent at this location,
        // overwrite it (with a warning). Remove the existing agent...
        if (this.cells.get(hash(x, y))) {
            console.warn(`Overwriting agent at ${x}, ${y}.`);
            this.removeAgent(x, y);
        }
        
        // ...and add a new one
        const agent = new SpatialAgent(x, y);
        this.agents.push(agent);
        this.cells.set(hash(x, y), agent);

        return agent;
    }

    removeAgent(x = 0, y = 0) {

        const agent = this.cells.get(hash(x, y));
        
        if (!agent) return;

        agent.environment = null;

        const indexAmongAgents = this.agents.indexOf(agent);
        this.agents.splice(indexAmongAgents, 1);

        this.cells.delete(hash(x, y));
    }

    /**
     * 
     * @param {*} x 
     * @param {*} y 
     * @return {undefined | SpatialAgent}
     */
    getAgent(x, y) {
        
        while (x < 0) x += size;
        while (x >= size) x -= size;
        while (y < 0) y += size;
        while (y >= size) y -= size;

        return this.cells.get(hash(x, y));
    }

    loop(callback = function() {}) {
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const agent = this.getAgent(x, y);
                callback(x, y, agent);
            }
        }
    }

    swap(x1, y1, x2, y2) {
        
        const maybeAgent1 = this.getAgent(x1, y1);
        const maybeAgent2 = this.getAgent(x2, y2);
        
        if (maybeAgent1) {
            maybeAgent1.x = x2;
            maybeAgent1.y = y2;
        }

        if (maybeAgent2) {
            maybeAgent1.x = x1;
            maybeAgent1.y = y1;
        }

        this.cells.set(hash(x1, y1), maybeAgent2);
        this.cells.set(hash(x2, y2), maybeAgent1);
    }

    getRandomOpenCell() {

        // randomize order of cell hashes
        const hashes = shuffle(this._cellHashes);
        
        while (hashes.length > 0) {
            const hash = hashes.pop();
            const maybeAgent = this.cells.get(hash);
            if (!maybeAgent) return unhash(hash);
        }

        return null;
    }
}