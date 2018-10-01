(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) :
    (factory((global.flocc = {})));
}(this, (function (exports) { 'use strict';

    class Agent {

        constructor() {
            /**
             * @member {Environment} environment
             * @member {Function[]} rules
             * @member {Function[]} queue
             * @member {Object} data
             */
            this.environment = null;
            this.rules = [];
            this.queue = [];
            this.data = {};
        }

        /**
         * Retrieve an arbitrary piece of data associated 
         * with this agent by name.
         * @param {string} name 
         */
        get(name) {
            return this.data[name];
        }

        /**
         * Set a piece of data associated with this agent.
         * Name should be a string while value can be any valid type.
         * Ex. agent.set('x', 5); agent.set('color', 'red');
         * @param {string} name 
         * @param {*} value 
         */
        set(name, value) {
            this.data[name] = value;
        }

        /**
         * Increment a numeric (assume integer) piece of data
         * associated with this agent. If `n` is included, increments by
         * `n`. If the value has not yet been set,
         * initializes it to 1.
         * @param {number} value 
         */
        increment(value, n = 1) {
            if (!this.get(value)) this.set(value, 0);
            this.set(value, this.get(value) + n);
        }

        /**
         * Decrement a numeric (assume integer) piece of data
         * associated with this agent. If `n` is included, decrements by
         * `n`. If the value has not yet been set,
         * initializes it to -1.
         * @param {number} value 
         */
        decrement(value, n = 1) {
            if (!this.get(value)) this.set(value, 0);
            this.set(value, this.get(value) - n);
        }

        /**
         * Add a rule to be executed during the agent's 
         * environment's tick cycle. When executed, the 
         * @param {Function} rule 
         */
        addRule(rule, ...args) {
            this.rules.push({
                args,
                rule
            });
        }

        /**
         * Enqueue a function to be executed at the end of
         * the agent's environment's tick cycle (for example,
         * if agents in an environment should perform their 
         * calculations and updates separately). Additional/external 
         * data passed in as arguments to the enqueued function will
         * be remembered and passed through when the function is executed.
         * 
         * The `queue` array is cleared at the very end of 
         * the environment's tick cycle.
         * @param {Function} enqueuedRule
         */
        enqueue(rule, ...args) {
            this.queue.push({
                args,
                rule
            });
        }
    }

    class Environment {
        
        constructor() {
            /** @member {Agent[]} */
            this.agents = [];
            this.renderer = null;
        }

        /**
         * Add an agent to the environment. Automatically sets the
         * agent's environment to be this environment.
         * @param {Agent} agent 
         */
        addAgent(agent) {
            agent.environment = this;
            this.agents.push(agent);
        }

        /**
         * Remove an agent from the environment.
         * @param {Agent} agent 
         */
        removeAgent(agent) {
            agent.environment = null;
            const index = this.agents.indexOf(agent);
            this.agents.splice(index, 1);
        }

        /**
         * Get an array of all the agents in the environment.
         * @return {Agent[]}
         */
        getAgents() {
            return this.agents;
        }

        /**
         * Moves the environment `n` ticks forward in time,
         * executing all agent's rules sequentially, followed by
         * any enqueued rules (which are removed with every tick).
         * If `n` is left empty, defaults to 1.
         * @param {number} n - Number of times to tick.
         */
        tick(n = 1) {
            
            this.agents.forEach(agent => {
                agent.rules.forEach(ruleObj => {
                    const { rule, args } = ruleObj;
                    rule(agent, ...args);
                });
            });
            
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

    /**
     * Gets a random element from `array`. (This is lodash's implementation).
     * @param {Array} array 
     * @returns {*} Returns the random element.
     */
    function sample(array) {
        const length = array == null ? 0 : array.length;
        return length ? array[Math.floor(Math.random() * length)] : undefined;
    }

    /**
     * Copies the values of `source` to `array`. (This is lodash's implementation).
     *
     * @private
     * @param {Array} source The array to copy values from.
     * @param {Array} [array=[]] The array to copy values to.
     * @returns {Array} Returns `array`.
     */
    function copyArray(source, array) {
        let index = -1;
        const length = source.length;
      
        array || (array = new Array(length));

        while (++index < length) {
            array[index] = source[index];
        }

        return array;
    }

    /**
     * Creates an array of shuffled values, using a version of the
     * [Fisher-Yates shuffle](https://en.wikipedia.org/wiki/Fisher-Yates_shuffle).
     * (This is lodash's implementation).
     *
     * @since 0.1.0
     * @category Array
     * @param {Array} array The array to shuffle.
     * @returns {Array} Returns the new shuffled array.
     */
    function shuffle(array) {

        const length = array == null ? 0 : array.length;

        if (!length) return [];
        
        let index = -1;
        const lastIndex = length - 1;
        const result = copyArray(array);
        while (++index < length) {
            const rand = index + Math.floor(Math.random() * (lastIndex - index + 1));
            const value = result[rand];
            result[rand] = result[index];
            result[index] = value;
        }

        return result;
    }

    const hash = (x, y) => x.toString() + ',' + y.toString();

    class Cell extends Agent {
        constructor(x, y) {
            super();
            this.set('x', x);
            this.set('y', y);
        }
    }
    class GridEnvironment extends Environment {

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

    class ASCIIRenderer {
        
        constructor(environment, opts = {}) {
            
            /** @member GridEnvironment */
            this.environment = environment;
            environment.renderer = this;

            /** @member HTMLPreElement */
            this.pre = document.createElement('pre');
        }

        mount(el) {
            const container = (typeof el === 'string') ? document.querySelector(el) : el;
            container.appendChild(this.pre);
        }

        render() {
            this.pre.innerHTML = '';
            this.environment.loop((x, y, agent) => {
                let value = ' ';
                const cell = this.environment.getCell(x, y);
                if (agent && agent.get('value')) {
                    value = agent.get('value');
                } else if (cell.get('value')) {
                    value = cell.get('value');
                }
                this.pre.innerHTML += value;
                if (x === this.environment.width - 1) this.pre.innerHTML += '\n';
            });
        }
    }

    class CanvasRenderer {
        
        constructor(environment, opts = {}) {
            
            /** @member Environment */
            this.environment = environment;
            environment.renderer = this;

            this.opts = opts;

            /** @member HTMLCanvasElement */
            this.canvas = document.createElement('canvas');
            this.context = this.canvas.getContext('2d');
            
            this.width = opts.width || 500;
            this.height = opts.height || 500;

            this.canvas.width = this.width;
            this.canvas.height = this.height;
        }

        mount(el) {
            const container = (typeof el === 'string') ? document.querySelector(el) : el;
            container.appendChild(this.canvas);
        }

        render() {
            const { context, environment, width, height } = this;
            
            // if "trace" is truthy, don't clear the canvas with every frame
            // to trace the paths of agents
            if (!this.opts.trace) context.clearRect(0, 0, width, height);
            
            environment.getAgents().forEach(agent => {
                const x = agent.get('x') || 0;
                const y = agent.get('y') || 0;
                context.beginPath();
                context.moveTo(x, y);
                context.fillStyle = agent.get('color') || 'black';
                context.arc(
                    x, 
                    y, 
                    agent.get('radius') || 1, 
                    0, 
                    2 * Math.PI
                );
                context.fill();
            });
        }
    }

    /**
     * Restricts a number x to the range min --> max.
     * @param {number} x 
     * @param {number} min 
     * @param {number} max
     * @return {number} The clamped value.
     */
    function clamp(x, min, max) {
        if (x < min) return min;
        if (x > max) return max;
        return x;
    }

    /**
     * Finds the distance between `p1` and `p2`. The inputs may be plain objects
     * with `x`, `y`, and/or `z` keys, or Agent-like objects who have
     * `x`, `y`, and/or `z` data.
     * @param {*} p1 
     * @param {*} p2 
     * @return {number} The distance between p1 and p2.
     */
    function distance(p1, p2) {

        let x1 = (p1 instanceof Agent ? p1.get('x') : p1.x) || 0;
        let y1 = (p1 instanceof Agent ? p1.get('y') : p1.y) || 0;
        let z1 = (p1 instanceof Agent ? p1.get('z') : p1.z) || 0;

        let x2 = (p2 instanceof Agent ? p2.get('x') : p2.x) || 0;
        let y2 = (p2 instanceof Agent ? p2.get('y') : p2.y) || 0;
        let z2 = (p2 instanceof Agent ? p2.get('z') : p2.z) || 0;

        let dx = Math.abs(x2 - x1);
        let dy = Math.abs(y2 - y1);
        let dz = Math.abs(z2 - z1);
        
        if (p1.environment && p1.environment.width && p1.environment.height) {
            const { width, height } = p1.environment;
            if (dx > width / 2) dx = width - dx;
            if (dy > height / 2) dy = height - dy;
        }
        
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
    }

    function gaussian(mean, sd) {
        
        let y, x1, x2, w;
        
        do {
            x1 = 2 * Math.random() - 1;
            x2 = 2 * Math.random() - 1;
            w = x1 * x1 + x2 * x2;
        } while (w >= 1);
        
        w = Math.sqrt(-2 * Math.log(w) / w);
        y = x1 * w;
      
        const m = mean || 0;
        const s = sd || 1;

        return y * s + m;
    }

    /**
     * Finds the Manhattan distance between `p1` and `p2`.
     * The inputs may be plain objects
     * with `x`, `y`, and/or `z` keys, or Agent-like objects who have
     * `x`, `y`, and/or `z` data.
     * @param {*} p1 
     * @param {*} p2 
     * @return {number} The Manhattan distance between p1 and p2.
     */
    function manhattanDistance(p1, p2) {

        let x1 = (p1 instanceof Agent ? p1.get('x') : p1.x) || 0;
        let y1 = (p1 instanceof Agent ? p1.get('y') : p1.y) || 0;
        let z1 = (p1 instanceof Agent ? p1.get('z') : p1.z) || 0;

        let x2 = (p2 instanceof Agent ? p2.get('x') : p2.x) || 0;
        let y2 = (p2 instanceof Agent ? p2.get('y') : p2.y) || 0;
        let z2 = (p2 instanceof Agent ? p2.get('z') : p2.z) || 0;

        let dx = Math.abs(x2 - x1);
        let dy = Math.abs(y2 - y1);
        let dz = Math.abs(z2 - z1);
        
        if (p1.environment && p1.environment.width && p1.environment.height) {
            const { width, height } = p1.environment;
            if (dx > width / 2) dx = width - dx;
            if (dy > height / 2) dy = height - dy;
        }
        
        return dx + dy + dz;
    }

    /**
     * Maps a number x, from the given domain aMin --> aMax,
     * onto the given range bMin --> bMax.
     * Ex: remap(5, 0, 10, 0, 100) => 50.
     * @param {number} x 
     * @param {number} aMin 
     * @param {number} aMax 
     * @param {number} bMin 
     * @param {number} bMax 
     * @return {number} The remapped value.
     */
    function remap(x, aMin, aMax, bMin, bMax) {
        return bMin + (bMax - bMin) * (x - aMin) / (aMax - aMin);
    }

    const utils = {
        clamp,
        distance,
        gaussian,
        manhattanDistance,
        remap,
        sample,
        shuffle
    };

    exports.Agent = Agent;
    exports.Environment = Environment;
    exports.GridEnvironment = GridEnvironment;
    exports.ASCIIRenderer = ASCIIRenderer;
    exports.CanvasRenderer = CanvasRenderer;
    exports.utils = utils;

    Object.defineProperty(exports, '__esModule', { value: true });

})));
