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
         * associated with this agent. If the value has not yet been set,
         * initializes it to 1.
         * @param {number} value 
         */
        increment(value) {
            if (!this.get(value)) this.set(value, 0);
            this.set(value, this.get(value) + 1);
        }

        /**
         * Decremenet a numeric (assume integer) piece of data
         * associated with this agent. If the value has not yet been set,
         * initializes it to -1.
         * @param {number} value 
         */
        decrement(value) {
            if (!this.get(value)) this.set(value, 0);
            this.set(value, this.get(value) - 1);
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

            if (n > 1) this.tick(n - 1);
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
    const unhash = (str) => { return {
            x: +(str.split(',')[0]),
            y: +(str.split(',')[1])
        };
    };

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
     * Finds the distance between `p1` and `p2`.
     * Expects that p1 and p2 each contain `x`, `y`, and `z`
     * keys that have numeric values.
     * @param {*} p1 
     * @param {*} p2 
     * @return {number} The distance between p1 and p2.
     */
    function distance(p1, p2) {

        const a = {};
        const b = {};

        if (p1 instanceof Agent) {
            a.x = p1.get('x');
            a.y = p1.get('y');
            a.z = p1.get('z');
        }

        if (p2 instanceof Agent) {
            b.x = p2.get('x');
            b.y = p2.get('y');
            b.z = p2.get('z');
        }

        if (!p1.x) p1.x = 0;
        if (!p1.y) p1.y = 0;
        if (!p1.z) p1.z = 0;
        if (!p2.x) p2.x = 0;
        if (!p2.y) p2.y = 0;
        if (!p2.z) p2.z = 0;

        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const dz = p2.z - p1.z;
        
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
        remap,
        sample,
        shuffle
    };

    exports.Agent = Agent;
    exports.Environment = Environment;
    exports.GridEnvironment = GridEnvironment;
    exports.utils = utils;

    Object.defineProperty(exports, '__esModule', { value: true });

})));
