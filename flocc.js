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
         * Add a rule to be executed during the agent's 
         * environment's tick cycle.
         * @param {Function} rule 
         */
        addRule(rule) {
            this.rules.push(rule);
        }

        /**
         * Enqueue a function to be executed at the end of
         * the agent's environment's tick cycle (for example,
         * if agents in an environment should perform their 
         * calculations and updates separately). 
         * 
         * The `queue` array is cleared at the very end of 
         * the environment's tick cycle.
         * @param {Function} enqueuedRule
         */
        enqueue(enqueuedRule) {
            this.queue.push(enqueuedRule);
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
                agent.rules.forEach(rule => rule());
            });
            
            this.agents.forEach(agent => {
                while (agent.queue.length > 0) {
                    agent.queue.shift()();
                }
            });

            if (n > 1) this.tick(n - 1);
        }
    }

    class GridEnvironment extends Environment {

        constructor(size) {
            
            super();

            this.size = size;

            for (let y = 0; y < size; y++) {
                for (let x = 0; x < size; x++) {
                    const agent = new Agent();
                    agent.x = x;
                    agent.y = y;
                    this.agents.push(agent);
                }
            }
        }

        getAgent(x, y) {

            const { size } = this;
            
            while (x < 0) x += size;
            while (x >= size) x -= size;
            while (y < 0) y += size;
            while (y >= size) y -= size;

            return this.agents[x + size * y];
        }

        log() {
            
            let output = '';
            this.agents.forEach(agent => {
                output += agent.get('value') || '-';
                if (agent.x === this.size - 1) output += '\n';
            });

            console.log(output);
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
        remap
    };

    exports.Agent = Agent;
    exports.Environment = Environment;
    exports.GridEnvironment = GridEnvironment;
    exports.utils = utils;

    Object.defineProperty(exports, '__esModule', { value: true });

})));
