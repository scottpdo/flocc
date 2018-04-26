(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) :
    (factory((global.index = {})));
}(this, (function (exports) { 'use strict';

    class Agent {

        constructor() {
            this.environment = null;
            this.rules = [];
            this.queue = [];
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
            this.agents = [];
        }

        addAgent(agent) {
            agent.environment = this;
            this.agents.push(agent);
        }

        tick() {
            this.agents.forEach(agent => {
                agent.rules.forEach(rule => rule());
            });
            this.agents.forEach(agent => {
                while (agent.queue.length > 0) {
                    agent.queue.shift()();
                }
            });
        }
    }

    class Grid extends Environment {

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
                output += agent.value || '-';
                if (agent.x === this.size - 1) output += '\n';
            });

            console.log(output);
        }
    }

    exports.Agent = Agent;
    exports.Environment = Environment;
    exports.Grid = Grid;

    Object.defineProperty(exports, '__esModule', { value: true });

})));
