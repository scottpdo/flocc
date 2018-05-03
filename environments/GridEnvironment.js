import Environment from './Environment';
import SpatialAgent from '../agents/SpatialAgent';

const hash = (x, y) => x.toString() + ',' + y.toString();

export default class GridEnvironment extends Environment {

    constructor(width, height) {
        
        super();
        
        this.height = height;
        this.width = width;

        this.cells = new Map();
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
}