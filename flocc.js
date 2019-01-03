(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (factory((global.flocc = {})));
}(this, (function (exports) { 'use strict';

  /// <reference path="../environments/Environment.d.ts" />
  /// <reference path="../types/RuleObj.d.ts" />
  /// <reference path="../types/Data.d.ts" />
  var Agent = /** @class */ (function () {
      function Agent() {
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
      Agent.prototype.get = function (name) {
          return this.data.hasOwnProperty(name) ? this.data[name] : null;
      };
      /**
       * Retrieve all the data associated with this agent
       * (useful for destructuring properties).
       */
      Agent.prototype.getData = function () {
          return this.data;
      };
      /**
       * Set a piece of data associated with this agent.
       * Name should be a string while value can be any valid type.
       * Alternatively, the first parameter can be an object, which merges
       * the current data with the new data (adding new values and overwriting existing).
       * Ex. agent.set('x', 5); agent.set('color', 'red');
       * @param {string|Data} name
       * @param {*} value
       */
      Agent.prototype.set = function (name, value) {
          if (typeof name === 'string') {
              this.data[name] = value;
          }
          else {
              this.data = Object.assign(this.data, name);
          }
      };
      /**
       * Increment a numeric (assume integer) piece of data
       * associated with this agent. If `n` is included, increments by
       * `n`. If the value has not yet been set, initializes it to 1.
       * @param {string} name
       * @param {number} n
       */
      Agent.prototype.increment = function (name, n) {
          if (n === void 0) { n = 1; }
          if (!this.get(name))
              this.set(name, 0);
          this.set(name, this.get(name) + n);
      };
      /**
       * Decrement a numeric (assume integer) piece of data
       * associated with this agent. If `n` is included, decrements by
       * `n`. If the value has not yet been set,
       * initializes it to -1.
       * @param {string} name
       */
      Agent.prototype.decrement = function (name, n) {
          if (n === void 0) { n = 1; }
          this.increment(name, -n);
      };
      /**
       * Add a rule to be executed during the agent's
       * environment's tick cycle. When executed, the
       * @param {Function} rule
       */
      Agent.prototype.addRule = function (rule) {
          var args = [];
          for (var _i = 1; _i < arguments.length; _i++) {
              args[_i - 1] = arguments[_i];
          }
          this.rules.push({
              args: args,
              rule: rule
          });
      };
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
      Agent.prototype.enqueue = function (rule) {
          var args = [];
          for (var _i = 1; _i < arguments.length; _i++) {
              args[_i - 1] = arguments[_i];
          }
          this.queue.push({
              args: args,
              rule: rule
          });
      };
      return Agent;
  }());

  /// <reference path="../agents/Agent.d.ts" />
  /// <reference path="../renderers/Renderer.d.ts" />
  /// <reference path="../types/EnvironmentOptions.d.ts" />
  var Environment = /** @class */ (function () {
      function Environment(opts) {
          if (opts === void 0) { opts = { torus: true }; }
          this.agents = [];
          this.renderer = null;
          this.opts = opts;
          this.width = 0;
          this.height = 0;
      }
      /**
       * Add an agent to the environment. Automatically sets the
       * agent's environment to be this environment.
       * @param {Agent} agent
       */
      Environment.prototype.addAgent = function (agent) {
          agent.environment = this;
          this.agents.push(agent);
      };
      /**
       * Remove an agent from the environment.
       * @param {Agent} agent
       */
      Environment.prototype.removeAgent = function (agent) {
          // $FlowFixMe
          agent.environment = null;
          var index = this.agents.indexOf(agent);
          this.agents.splice(index, 1);
      };
      /**
       * Get an array of all the agents in the environment.
       * @return {Agent[]}
       */
      Environment.prototype.getAgents = function () {
          return this.agents;
      };
      /**
       * Moves the environment `n` ticks forward in time,
       * executing all agent's rules sequentially, followed by
       * any enqueued rules (which are removed with every tick).
       * If `n` is left empty, defaults to 1.
       * @param {number} n - Number of times to tick.
       */
      Environment.prototype.tick = function (n) {
          if (n === void 0) { n = 1; }
          this.agents.forEach(function (agent) {
              agent.rules.forEach(function (ruleObj) {
                  var rule = ruleObj.rule, args = ruleObj.args;
                  rule.apply(void 0, [agent].concat(args));
              });
          });
          this.agents.forEach(function (agent) {
              while (agent.queue.length > 0) {
                  var _a = agent.queue.shift(), rule = _a.rule, args = _a.args;
                  rule.apply(void 0, [agent].concat(args));
              }
          });
          if (n > 1) {
              this.tick(n - 1);
              return;
          }
          if (this.renderer !== null)
              this.renderer.render();
      };
      return Environment;
  }());

  /*! *****************************************************************************
  Copyright (c) Microsoft Corporation. All rights reserved.
  Licensed under the Apache License, Version 2.0 (the "License"); you may not use
  this file except in compliance with the License. You may obtain a copy of the
  License at http://www.apache.org/licenses/LICENSE-2.0

  THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
  KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
  WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
  MERCHANTABLITY OR NON-INFRINGEMENT.

  See the Apache Version 2.0 License for specific language governing permissions
  and limitations under the License.
  ***************************************************************************** */
  /* global Reflect, Promise */

  var extendStatics = function(d, b) {
      extendStatics = Object.setPrototypeOf ||
          ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
          function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
      return extendStatics(d, b);
  };

  function __extends(d, b) {
      extendStatics(d, b);
      function __() { this.constructor = d; }
      d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  }

  /**
   * Copies the values of `source` to `arr`
   * or to a new Array.
   *
   * @private
   * @param {Array} source The Array to copy values from.
   * @param {Array} [arr=[]] The Array to copy values to.
   * @returns {Array}
   */
  function copyArray(source, arr) {
      var index = -1;
      var length = source.length;
      if (!arr)
          arr = new Array(length);
      while (++index < length)
          arr[index] = source[index];
      return arr;
  }

  /**
   * Creates an array of shuffled values, using a version of the
   * [Fisher-Yates shuffle](https://en.wikipedia.org/wiki/Fisher-Yates_shuffle).
   * (This is lodash's implementation).
   *
   * @param {Array} array The array to shuffle.
   * @returns {Array} Returns the new shuffled array.
   */
  function shuffle(array) {
      var length = array ? array.length : 0;
      if (!length)
          return [];
      var index = -1;
      var lastIndex = length - 1;
      var result = copyArray(array);
      while (++index < length) {
          var rand = index + Math.floor(Math.random() * (lastIndex - index + 1));
          var value = result[rand];
          result[rand] = result[index];
          result[index] = value;
      }
      return result;
  }

  /// <reference path="../agents/Cell.d.ts" />
  var hash = function (x, y) { return x.toString() + ',' + y.toString(); };
  var GridEnvironment = /** @class */ (function (_super) {
      __extends(GridEnvironment, _super);
      function GridEnvironment(width, height) {
          if (width === void 0) { width = 2; }
          if (height === void 0) { height = 2; }
          var _this = _super.call(this) || this;
          _this.height = height;
          _this.width = width;
          _this.cells = new Map();
          // store hashes of all possible cells internally
          _this._cellHashes = [];
          for (var y = 0; y < _this.height; y++) {
              for (var x = 0; x < _this.width; x++) {
                  var id = hash(x, y);
                  _this._cellHashes.push(id);
                  var cell = new Cell(x, y);
                  // $FlowFixMe
                  cell.environment = _this;
                  _this.cells.set(id, cell);
              }
          }
          return _this;
      }
      /**
       * Fill every cell of the grid with an agent
       * and set that agent's position to its x/y coordinate.
       */
      GridEnvironment.prototype.fill = function () {
          for (var y = 0; y < this.height; y++) {
              for (var x = 0; x < this.width; x++) {
                  this.addAgentAt(x, y);
              }
          }
      };
      GridEnvironment.prototype.normalize = function (x, y) {
          while (x < 0)
              x += this.width;
          while (x >= this.width)
              x -= this.width;
          while (y < 0)
              y += this.height;
          while (y >= this.height)
              y -= this.height;
          return { x: x, y: y };
      };
      /**
       * For GridEnvironments, `addAgent` takes `x` and `y` values
       * and automatically adds a Agent to that cell coordinate.
       * @param {number} x
       * @param {number} y
       * @returns {Agent} The agent that was added at the specified coordinate.
       */
      GridEnvironment.prototype.addAgentAt = function (x_, y_, agent) {
          if (x_ === void 0) { x_ = 0; }
          if (y_ === void 0) { y_ = 0; }
          if (agent === void 0) { agent = new Agent(); }
          var _a = this.normalize(x_, y_), x = _a.x, y = _a.y;
          var id = hash(x, y);
          var cell = this.cells.get(id);
          if (!cell)
              throw new Error("Can't add an Agent to a non-existent Cell!");
          // If there is already an agent at this location,
          // overwrite it (with a warning). Remove the existing agent...
          if (cell.get('agent')) {
              console.warn("Overwriting agent at " + x + ", " + y + ".");
              this.removeAgentAt(x, y);
          }
          // ...and add a new one
          agent.set({ x: x, y: y });
          this.agents.push(agent);
          cell.set('agent', agent);
          return agent;
      };
      /**
       * For GridEnvironments, `removeAgent` takes `x` and `y` values
       * and removes the Agent (if there is one) at that cell coordinate.
       * @param {number} x
       * @param {number} y
       */
      GridEnvironment.prototype.removeAgentAt = function (x_, y_) {
          if (x_ === void 0) { x_ = 0; }
          if (y_ === void 0) { y_ = 0; }
          var _a = this.normalize(x_, y_), x = _a.x, y = _a.y;
          var id = hash(x, y);
          var cell = this.cells.get(id);
          if (!cell)
              throw new Error("Can't remove an Agent from a non-existent Cell!");
          var agent = cell.get('agent');
          if (!agent)
              return;
          agent.environment = null;
          var indexAmongAgents = this.agents.indexOf(agent);
          this.agents.splice(indexAmongAgents, 1);
          cell.set('agent', null);
      };
      /**
       * Retrieve the cell at the specified coordinate.
       * @param {number} x
       * @param {number} y
       * @return {Cell}
       */
      GridEnvironment.prototype.getCell = function (x_, y_) {
          var _a = this.normalize(x_, y_), x = _a.x, y = _a.y;
          var id = hash(x, y);
          return this.cells.get(id) || null;
      };
      /**
       * Get all cells of the environment, in a flat array.
       * @return {Cell[]}
       */
      GridEnvironment.prototype.getCells = function () {
          return Array.from(this.cells.values());
      };
      /**
       * Retrieve the agent at the specified cell coordinate.
       * @param {number} x
       * @param {number} y
       * @return {undefined | Agent}
       */
      GridEnvironment.prototype.getAgent = function (x_, y_) {
          var _a = this.normalize(x_, y_), x = _a.x, y = _a.y;
          var id = hash(x, y);
          var cell = this.cells.get(id);
          if (!cell)
              return null;
          return cell.get('agent') || null;
      };
      /**
       * `loop` is like `tick`, but the callback is invoked with every
       * cell coordinate, not every agent.
       *
       * The callback is invoked with arguments `x`, `y`, and `agent`
       * (if there is one at that cell coordinate).
       * @param {Function} callback
       */
      GridEnvironment.prototype.loop = function (callback) {
          if (callback === void 0) { callback = function () { }; }
          for (var y = 0; y < this.height; y++) {
              for (var x = 0; x < this.width; x++) {
                  var agent = this.getAgent(x, y);
                  callback(x, y, agent);
              }
          }
      };
      /**
       * Given two pairs of cell coordinates, swap the agents at those cells.
       * If both are empty, nothing happens. If one is empty and the other has an agent,
       * this is equivalent to moving that agent to the new cell coordinate.
       * @param {number} x1
       * @param {number} y1
       * @param {number} x2
       * @param {number} y2
       */
      GridEnvironment.prototype.swap = function (x1_, y1_, x2_, y2_) {
          var a = this.normalize(x1_, y1_);
          var x1 = a.x;
          var y1 = a.y;
          var b = this.normalize(x2_, y2_);
          var x2 = b.x;
          var y2 = b.y;
          var maybeAgent1 = this.getAgent(x1, y1);
          var maybeAgent2 = this.getAgent(x2, y2);
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
          var cell1 = this.cells.get(hash(x1, y1));
          var cell2 = this.cells.get(hash(x2, y2));
          if (cell1)
              cell1.set('agent', maybeAgent2);
          if (cell2)
              cell2.set('agent', maybeAgent1);
      };
      /**
       * Find a random open cell in the GridEnvironment.
       * @returns {{ x: number, y: number }} The coordinate of the open cell.
       */
      GridEnvironment.prototype.getRandomOpenCell = function () {
          // randomize order of cell hashes
          var hashes = shuffle(this._cellHashes);
          // keep looking for an empty one until we find it
          while (hashes.length > 0) {
              var id = hashes.pop();
              var cell = this.cells.get(id);
              var maybeAgent = cell ? cell.get('agent') : null;
              if (cell && !maybeAgent)
                  return cell;
          }
          // once there are no hashes left, that means that there are no open cells
          return null;
      };
      /**
       * Override/extend Environment.tick to include the
       * GridEnvironment's cells.
       * @override
       * @param {number} n - Number of times to tick.
       */
      GridEnvironment.prototype.tick = function (n) {
          if (n === void 0) { n = 1; }
          for (var y = 0; y < this.height; y++) {
              var _loop_1 = function (x) {
                  var cell = this_1.getCell(x, y);
                  if (!cell)
                      return "continue";
                  cell.rules.forEach(function (ruleObj) {
                      var rule = ruleObj.rule, args = ruleObj.args;
                      rule.apply(void 0, [cell].concat(args));
                  });
              };
              var this_1 = this;
              for (var x = 0; x < this.width; x++) {
                  _loop_1(x);
              }
          }
          this.agents.forEach(function (agent) {
              agent.rules.forEach(function (ruleObj) {
                  var rule = ruleObj.rule, args = ruleObj.args;
                  rule.apply(void 0, [agent].concat(args));
              });
          });
          for (var y = 0; y < this.height; y++) {
              for (var x = 0; x < this.width; x++) {
                  var cell = this.getCell(x, y);
                  if (!cell)
                      continue;
                  while (cell.queue.length > 0) {
                      var _a = cell.queue.shift(), rule = _a.rule, args = _a.args;
                      rule.apply(void 0, [cell].concat(args));
                  }
              }
          }
          this.agents.forEach(function (agent) {
              while (agent.queue.length > 0) {
                  var _a = agent.queue.shift(), rule = _a.rule, args = _a.args;
                  rule.apply(void 0, [agent].concat(args));
              }
          });
          if (n > 1) {
              this.tick(n - 1);
              return;
          }
          if (this.renderer !== null)
              this.renderer.render();
      };
      return GridEnvironment;
  }(Environment));

  /// <reference path="./Renderer.d.ts" />
  /// <reference path="../environments/GridEnvironment.d.ts" />
  var ASCIIRenderer = /** @class */ (function () {
      function ASCIIRenderer(environment, opts) {
          if (opts === void 0) { opts = {}; }
          this.environment = environment;
          // $FlowFixMe
          environment.renderer = this;
          this.pre = document.createElement('pre');
      }
      ASCIIRenderer.prototype.mount = function (el) {
          var container = (typeof el === 'string') ? document.querySelector(el) : el;
          if (container)
              container.appendChild(this.pre);
      };
      ASCIIRenderer.prototype.render = function () {
          var _this = this;
          this.pre.innerHTML = '';
          this.environment.loop(function (x, y, agent) {
              var value = ' ';
              var cell = _this.environment.getCell(x, y);
              if (agent && agent.get('value')) {
                  value = agent.get('value');
              }
              else if (cell && cell.get('value')) {
                  value = cell.get('value');
              }
              _this.pre.innerHTML += value;
              if (x === _this.environment.width - 1)
                  _this.pre.innerHTML += '\n';
          });
      };
      return ASCIIRenderer;
  }());

  /// <reference path="./Renderer.d.ts" />
  /// <reference path="./CanvasRendererOptions.d.ts" />
  /// <reference path="../environments/Environment.d.ts" />
  var CanvasRenderer = /** @class */ (function () {
      function CanvasRenderer(environment, opts) {
          if (opts === void 0) { opts = { width: 500, height: 500, trace: false }; }
          this.environment = environment;
          environment.renderer = this;
          this.opts = opts;
          this.canvas = document.createElement('canvas');
          this.context = this.canvas.getContext('2d');
          this.width = opts.width;
          this.height = opts.height;
          this.canvas.width = this.width;
          this.canvas.height = this.height;
      }
      CanvasRenderer.prototype.mount = function (el) {
          var container = (typeof el === 'string') ? document.querySelector(el) : el;
          if (container)
              container.appendChild(this.canvas);
      };
      CanvasRenderer.prototype.render = function () {
          var _a = this, context = _a.context, environment = _a.environment, width = _a.width, height = _a.height;
          // if "trace" is truthy, don't clear the canvas with every frame
          // to trace the paths of agents
          if (!this.opts.trace)
              context.clearRect(0, 0, width, height);
          environment.getAgents().forEach(function (agent) {
              var _a = agent.getData(), x = _a.x, y = _a.y, vx = _a.vx, vy = _a.vy, color = _a.color, shape = _a.shape, _b = _a.size, size = _b === void 0 ? 1 : _b;
              context.beginPath();
              context.moveTo(x, y);
              context.fillStyle = color || 'black';
              if (shape === 'arrow' && vx !== null && vy !== null) {
                  var norm = Math.sqrt(Math.pow(vx, 2) + Math.pow(vy, 2));
                  var _vx = 3 * size * (vx / norm);
                  var _vy = 3 * size * (vy / norm);
                  context.beginPath();
                  context.moveTo(x + 1.5 * _vx, y + 1.5 * _vy);
                  context.lineTo(x + _vy / 2, y - _vx / 2);
                  context.lineTo(x - _vy / 2, y + _vx / 2);
              }
              else {
                  context.arc(x, y, size, 0, 2 * Math.PI);
              }
              context.fill();
          });
      };
      return CanvasRenderer;
  }());

  /**
   * Restricts a number x to the range min --> max.
   * @param {number} x
   * @param {number} min
   * @param {number} max
   * @return {number} The clamped value.
   */
  function clamp(x, min, max) {
      if (x < min)
          return min;
      if (x > max)
          return max;
      return x;
  }

  /// <reference path="../types/Point.d.ts" />
  /**
   * Finds the distance between `p1` and `p2`. The inputs may be plain objects
   * with `x`, `y`, and/or `z` keys, or Agent-like objects who have
   * `x`, `y`, and/or `z` data.
   * @param {Point|Agent} p1
   * @param {Point|Agent} p2
   * @return {number} The distance between p1 and p2.
   */
  function distance(p1, p2) {
      var x1 = (p1 instanceof Agent ? p1.get('x') : p1.x) || 0;
      var y1 = (p1 instanceof Agent ? p1.get('y') : p1.y) || 0;
      var z1 = (p1 instanceof Agent ? p1.get('z') : p1.z) || 0;
      var x2 = (p2 instanceof Agent ? p2.get('x') : p2.x) || 0;
      var y2 = (p2 instanceof Agent ? p2.get('y') : p2.y) || 0;
      var z2 = (p2 instanceof Agent ? p2.get('z') : p2.z) || 0;
      var dx = Math.abs(x2 - x1);
      var dy = Math.abs(y2 - y1);
      var dz = Math.abs(z2 - z1);
      // distance for toroidal environments
      if (p1 instanceof Agent &&
          p2 instanceof Agent &&
          p1.environment &&
          p2.environment &&
          p1.environment === p2.environment &&
          p1.environment.width &&
          p1.environment.height &&
          p1.environment.opts.torus) {
          var environment = p1.environment;
          var width = environment.width, height = environment.height;
          if (dx > width / 2)
              dx = width - dx;
          if (dy > height / 2)
              dy = height - dy;
      }
      return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  /**
   * Given a mean and standard deviation,
   * returns a value from a normal/Gaussian distribution.
   * @param {number} mean
   * @param {number} sd
   * @returns {number}
   */
  function gaussian(mean, sd) {
      if (mean === void 0) { mean = 0; }
      if (sd === void 0) { sd = 1; }
      var y, x1, x2, w;
      do {
          x1 = 2 * Math.random() - 1;
          x2 = 2 * Math.random() - 1;
          w = x1 * x1 + x2 * x2;
      } while (w >= 1);
      w = Math.sqrt(-2 * Math.log(w) / w);
      y = x1 * w;
      return y * sd + mean;
  }

  /// <reference path="../types/Point.d.ts" />
  /**
   * Finds the Manhattan distance between `p1` and `p2`.
   * The inputs may be plain objects
   * with `x`, `y`, and/or `z` keys, or Agent-like objects who have
   * `x`, `y`, and/or `z` data.
   * @param {Point|Agent} p1
   * @param {Point|Agent} p2
   * @return {number} The Manhattan distance between p1 and p2.
   */
  function manhattanDistance(p1, p2) {
      var x1 = (p1 instanceof Agent ? p1.get('x') : p1.x) || 0;
      var y1 = (p1 instanceof Agent ? p1.get('y') : p1.y) || 0;
      var z1 = (p1 instanceof Agent ? p1.get('z') : p1.z) || 0;
      var x2 = (p2 instanceof Agent ? p2.get('x') : p2.x) || 0;
      var y2 = (p2 instanceof Agent ? p2.get('y') : p2.y) || 0;
      var z2 = (p2 instanceof Agent ? p2.get('z') : p2.z) || 0;
      var dx = Math.abs(x2 - x1);
      var dy = Math.abs(y2 - y1);
      var dz = Math.abs(z2 - z1);
      // distance for toroidal environments
      if (p1 instanceof Agent &&
          p2 instanceof Agent &&
          p1.environment &&
          p2.environment &&
          p1.environment === p2.environment &&
          p1.environment.width &&
          p1.environment.height &&
          p1.environment.opts.torus) {
          var environment = p1.environment;
          var width = environment.width, height = environment.height;
          if (dx > width / 2)
              dx = width - dx;
          if (dy > height / 2)
              dy = height - dy;
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
   * @returns {number} The remapped value.
   */
  function remap(x, aMin, aMax, bMin, bMax) {
      return bMin + (bMax - bMin) * (x - aMin) / (aMax - aMin);
  }

  /**
   * Gets a random element from `array`.
   * @param {Array} array
   * @returns {*} Returns the random element.
   */
  function sample(array) {
      var length = array ? array.length : 0;
      return length ? array[Math.floor(Math.random() * length)] : null;
  }

  /**
   * Find the sum of an Array of numbers.
   * @param {Array<number>} arr
   * @returns {number}
   */
  function sum(arr) {
      return arr.reduce(function (a, b) { return a + b; }, 0);
  }

  /**
   * Find the mean value of an Array of numbers.
   * @param {Array<number>} arr
   * @returns {number}
   */
  function mean(arr) {
      return sum(arr) / arr.length;
  }

  /**
   * Find the standard deviation of an Array of numbers.
   * @param {Array<number>} arr
   * @returns {number}
   */
  function stdDev(arr) {
      var ave = mean(arr);
      return Math.sqrt(mean(arr.map(function (x) { return (x - ave) * (x - ave); })));
  }

  var utils = {
      clamp: clamp,
      distance: distance,
      gaussian: gaussian,
      manhattanDistance: manhattanDistance,
      remap: remap,
      sample: sample,
      shuffle: shuffle,
      sum: sum,
      mean: mean,
      stdDev: stdDev
  };

  exports.Agent = Agent;
  exports.Environment = Environment;
  exports.GridEnvironment = GridEnvironment;
  exports.ASCIIRenderer = ASCIIRenderer;
  exports.CanvasRenderer = CanvasRenderer;
  exports.utils = utils;

  Object.defineProperty(exports, '__esModule', { value: true });

})));
