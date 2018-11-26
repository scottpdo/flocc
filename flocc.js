(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (factory((global.flocc = {})));
}(this, (function (exports) { 'use strict';

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  function _defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  function _createClass(Constructor, protoProps, staticProps) {
    if (protoProps) _defineProperties(Constructor.prototype, protoProps);
    if (staticProps) _defineProperties(Constructor, staticProps);
    return Constructor;
  }

  function _inherits(subClass, superClass) {
    if (typeof superClass !== "function" && superClass !== null) {
      throw new TypeError("Super expression must either be null or a function");
    }

    subClass.prototype = Object.create(superClass && superClass.prototype, {
      constructor: {
        value: subClass,
        writable: true,
        configurable: true
      }
    });
    if (superClass) _setPrototypeOf(subClass, superClass);
  }

  function _getPrototypeOf(o) {
    _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) {
      return o.__proto__ || Object.getPrototypeOf(o);
    };
    return _getPrototypeOf(o);
  }

  function _setPrototypeOf(o, p) {
    _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) {
      o.__proto__ = p;
      return o;
    };

    return _setPrototypeOf(o, p);
  }

  function _assertThisInitialized(self) {
    if (self === void 0) {
      throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
    }

    return self;
  }

  function _possibleConstructorReturn(self, call) {
    if (call && (typeof call === "object" || typeof call === "function")) {
      return call;
    }

    return _assertThisInitialized(self);
  }

  function _toConsumableArray(arr) {
    return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread();
  }

  function _arrayWithoutHoles(arr) {
    if (Array.isArray(arr)) {
      for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) arr2[i] = arr[i];

      return arr2;
    }
  }

  function _iterableToArray(iter) {
    if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter);
  }

  function _nonIterableSpread() {
    throw new TypeError("Invalid attempt to spread non-iterable instance");
  }

  var Agent =
  /*#__PURE__*/
  function () {
    function Agent() {
      _classCallCheck(this, Agent);

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


    _createClass(Agent, [{
      key: "get",
      value: function get(name) {
        return this.data[name];
      }
      /**
       * Set a piece of data associated with this agent.
       * Name should be a string while value can be any valid type.
       * Ex. agent.set('x', 5); agent.set('color', 'red');
       * @param {string} name 
       * @param {*} value 
       */

    }, {
      key: "set",
      value: function set(name, value) {
        this.data[name] = value;
      }
      /**
       * Increment a numeric (assume integer) piece of data
       * associated with this agent. If `n` is included, increments by
       * `n`. If the value has not yet been set,
       * initializes it to 1.
       * @param {number} value 
       */

    }, {
      key: "increment",
      value: function increment(value) {
        var n = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 1;
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

    }, {
      key: "decrement",
      value: function decrement(value) {
        var n = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 1;
        if (!this.get(value)) this.set(value, 0);
        this.set(value, this.get(value) - n);
      }
      /**
       * Add a rule to be executed during the agent's 
       * environment's tick cycle. When executed, the 
       * @param {Function} rule 
       */

    }, {
      key: "addRule",
      value: function addRule(rule) {
        for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
          args[_key - 1] = arguments[_key];
        }

        this.rules.push({
          args: args,
          rule: rule
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

    }, {
      key: "enqueue",
      value: function enqueue(rule) {
        for (var _len2 = arguments.length, args = new Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
          args[_key2 - 1] = arguments[_key2];
        }

        this.queue.push({
          args: args,
          rule: rule
        });
      }
    }]);

    return Agent;
  }();

  var Environment =
  /*#__PURE__*/
  function () {
    function Environment() {
      _classCallCheck(this, Environment);

      /** @member {Agent[]} */
      this.agents = [];
      this.renderer = null;
    }
    /**
     * Add an agent to the environment. Automatically sets the
     * agent's environment to be this environment.
     * @param {Agent} agent 
     */


    _createClass(Environment, [{
      key: "addAgent",
      value: function addAgent(agent) {
        agent.environment = this;
        this.agents.push(agent);
      }
      /**
       * Remove an agent from the environment.
       * @param {Agent} agent 
       */

    }, {
      key: "removeAgent",
      value: function removeAgent(agent) {
        agent.environment = null;
        var index = this.agents.indexOf(agent);
        this.agents.splice(index, 1);
      }
      /**
       * Get an array of all the agents in the environment.
       * @return {Agent[]}
       */

    }, {
      key: "getAgents",
      value: function getAgents() {
        return this.agents;
      }
      /**
       * Moves the environment `n` ticks forward in time,
       * executing all agent's rules sequentially, followed by
       * any enqueued rules (which are removed with every tick).
       * If `n` is left empty, defaults to 1.
       * @param {number} n - Number of times to tick.
       */

    }, {
      key: "tick",
      value: function tick() {
        var n = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 1;
        this.agents.forEach(function (agent) {
          agent.rules.forEach(function (ruleObj) {
            var rule = ruleObj.rule,
                args = ruleObj.args;
            rule.apply(void 0, [agent].concat(_toConsumableArray(args)));
          });
        });
        this.agents.forEach(function (agent) {
          while (agent.queue.length > 0) {
            var _agent$queue$shift = agent.queue.shift(),
                rule = _agent$queue$shift.rule,
                args = _agent$queue$shift.args;

            rule.apply(void 0, [agent].concat(_toConsumableArray(args)));
          }
        });

        if (n > 1) {
          this.tick(n - 1);
          return;
        }

        if (this.renderer !== null) this.renderer.render();
      }
    }]);

    return Environment;
  }();

  /**
   * Gets a random element from `array`. (This is lodash's implementation).
   * @param {Array} array 
   * @returns {*} Returns the random element.
   */
  function sample(array) {
    var length = array == null ? 0 : array.length;
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
    var index = -1;
    var length = source.length;
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
    var length = array == null ? 0 : array.length;
    if (!length) return [];
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

  var hash = function hash(x, y) {
    return x.toString() + ',' + y.toString();
  };

  var Cell =
  /*#__PURE__*/
  function (_Agent) {
    _inherits(Cell, _Agent);

    function Cell(x, y) {
      var _this;

      _classCallCheck(this, Cell);

      _this = _possibleConstructorReturn(this, _getPrototypeOf(Cell).call(this));

      _this.set('x', x);

      _this.set('y', y);

      return _this;
    }

    return Cell;
  }(Agent);

  var GridEnvironment =
  /*#__PURE__*/
  function (_Environment) {
    _inherits(GridEnvironment, _Environment);

    function GridEnvironment() {
      var _this2;

      var width = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 2;
      var height = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 2;

      _classCallCheck(this, GridEnvironment);

      _this2 = _possibleConstructorReturn(this, _getPrototypeOf(GridEnvironment).call(this));
      _this2.height = height;
      _this2.width = width;
      _this2.cells = new Map(); // store hashes of all possible cells internally

      _this2._cellHashes = [];

      for (var y = 0; y < _this2.height; y++) {
        for (var x = 0; x < _this2.width; x++) {
          var id = hash(x, y);

          _this2._cellHashes.push(id);

          var cell = new Cell(x, y);
          cell.environment = _assertThisInitialized(_assertThisInitialized(_this2));

          _this2.cells.set(id, cell);
        }
      }

      return _this2;
    }
    /**
     * Fill every cell of the grid with an agent
     * and set that agent's position to its x/y coordinate.
     */


    _createClass(GridEnvironment, [{
      key: "fill",
      value: function fill() {
        for (var y = 0; y < this.height; y++) {
          for (var x = 0; x < this.width; x++) {
            this.addAgent(x, y);
          }
        }
      }
    }, {
      key: "normalize",
      value: function normalize(x, y) {
        while (x < 0) {
          x += this.width;
        }

        while (x >= this.width) {
          x -= this.width;
        }

        while (y < 0) {
          y += this.height;
        }

        while (y >= this.height) {
          y -= this.height;
        }

        return {
          x: x,
          y: y
        };
      }
      /**
       * For GridEnvironments, `addAgent` takes `x` and `y` values
       * and automatically adds a Agent to that cell coordinate.
       * @override
       * @param {number} x
       * @param {number} y
       * @returns {Agent} The agent that was added at the specified coordinate.
       */

    }, {
      key: "addAgent",
      value: function addAgent() {
        var x_ = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
        var y_ = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
        var agent = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : new Agent();

        var _this$normalize = this.normalize(x_, y_),
            x = _this$normalize.x,
            y = _this$normalize.y;

        var id = hash(x, y); // If there is already an agent at this location,
        // overwrite it (with a warning). Remove the existing agent...

        if (this.cells.get(id).get('agent')) {
          console.warn("Overwriting agent at ".concat(x, ", ").concat(y, "."));
          this.removeAgent(x, y);
        } // ...and add a new one


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

    }, {
      key: "removeAgent",
      value: function removeAgent() {
        var x_ = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
        var y_ = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;

        var _this$normalize2 = this.normalize(x_, y_),
            x = _this$normalize2.x,
            y = _this$normalize2.y;

        var id = hash(x, y);
        var agent = this.cells.get(id).get('agent');
        if (!agent) return;
        agent.environment = null;
        var indexAmongAgents = this.agents.indexOf(agent);
        this.agents.splice(indexAmongAgents, 1);
        this.cells.get(id).set('agent', null);
      }
      /**
       * Retrieve the cell at the specified coordinate.
       * @param {number} x 
       * @param {number} y 
       * @return {Cell}
       */

    }, {
      key: "getCell",
      value: function getCell(x_, y_) {
        var _this$normalize3 = this.normalize(x_, y_),
            x = _this$normalize3.x,
            y = _this$normalize3.y;

        var id = hash(x, y);
        return this.cells.get(id);
      }
      /**
       * Get all cells of the environment, in a flat array.
       * @return {Cell[]}
       */

    }, {
      key: "getCells",
      value: function getCells() {
        return _toConsumableArray(this.cells.values());
      }
      /**
       * Retrieve the agent at the specified cell coordinate.
       * @param {number} x 
       * @param {number} y 
       * @return {undefined | Agent}
       */

    }, {
      key: "getAgent",
      value: function getAgent(x_, y_) {
        var _this$normalize4 = this.normalize(x_, y_),
            x = _this$normalize4.x,
            y = _this$normalize4.y;

        var id = hash(x, y);
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

    }, {
      key: "loop",
      value: function loop() {
        var callback = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : function () {};

        for (var y = 0; y < this.height; y++) {
          for (var x = 0; x < this.width; x++) {
            var agent = this.getAgent(x, y);
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

    }, {
      key: "swap",
      value: function swap(x1_, y1_, x2_, y2_) {
        var a = this.normalize(x1_, y1_);
        var x1 = a.x;
        var y1 = a.y;
        var b = this.normalize(x2_, y2_);
        var x2 = b.x;
        var y2 = b.y;
        var maybeAgent1 = this.getAgent(x1, y1);
        var maybeAgent2 = this.getAgent(x2, y2);

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

    }, {
      key: "getRandomOpenCell",
      value: function getRandomOpenCell() {
        // randomize order of cell hashes
        var hashes = shuffle(this._cellHashes); // keep looking for an empty one until we find it

        while (hashes.length > 0) {
          var id = hashes.pop();
          var cell = this.cells.get(id);
          var maybeAgent = cell.get('agent');
          if (!maybeAgent) return cell;
        } // once there are no hashes left, that means that there are no open cells


        return null;
      }
      /**
       * Override/extend Environment.tick to include the 
       * GridEnvironment's cells.
       * @override
       * @param {number} n - Number of times to tick.
       */

    }, {
      key: "tick",
      value: function tick() {
        var _this3 = this;

        var n = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 1;

        for (var y = 0; y < this.height; y++) {
          var _loop = function _loop(x) {
            var cell = _this3.getCell(x, y);

            cell.rules.forEach(function (ruleObj) {
              var rule = ruleObj.rule,
                  args = ruleObj.args;
              rule.apply(void 0, [cell].concat(_toConsumableArray(args)));
            });
          };

          for (var x = 0; x < this.width; x++) {
            _loop(x);
          }
        }

        this.agents.forEach(function (agent) {
          agent.rules.forEach(function (ruleObj) {
            var rule = ruleObj.rule,
                args = ruleObj.args;
            rule.apply(void 0, [agent].concat(_toConsumableArray(args)));
          });
        });

        for (var _y = 0; _y < this.height; _y++) {
          for (var x = 0; x < this.width; x++) {
            var cell = this.getCell(x, _y);

            while (cell.queue.length > 0) {
              var _cell$queue$shift = cell.queue.shift(),
                  rule = _cell$queue$shift.rule,
                  args = _cell$queue$shift.args;

              rule.apply(void 0, [cell].concat(_toConsumableArray(args)));
            }
          }
        }

        this.agents.forEach(function (agent) {
          while (agent.queue.length > 0) {
            var _agent$queue$shift = agent.queue.shift(),
                rule = _agent$queue$shift.rule,
                args = _agent$queue$shift.args;

            rule.apply(void 0, [agent].concat(_toConsumableArray(args)));
          }
        });

        if (n > 1) {
          this.tick(n - 1);
          return;
        }

        if (this.renderer !== null) this.renderer.render();
      }
    }]);

    return GridEnvironment;
  }(Environment);

  var ASCIIRenderer =
  /*#__PURE__*/
  function () {
    function ASCIIRenderer(environment) {

      _classCallCheck(this, ASCIIRenderer);

      /** @member GridEnvironment */
      this.environment = environment;
      environment.renderer = this;
      /** @member HTMLPreElement */

      this.pre = document.createElement('pre');
    }

    _createClass(ASCIIRenderer, [{
      key: "mount",
      value: function mount(el) {
        var container = typeof el === 'string' ? document.querySelector(el) : el;
        container.appendChild(this.pre);
      }
    }, {
      key: "render",
      value: function render() {
        var _this = this;

        this.pre.innerHTML = '';
        this.environment.loop(function (x, y, agent) {
          var value = ' ';

          var cell = _this.environment.getCell(x, y);

          if (agent && agent.get('value')) {
            value = agent.get('value');
          } else if (cell.get('value')) {
            value = cell.get('value');
          }

          _this.pre.innerHTML += value;
          if (x === _this.environment.width - 1) _this.pre.innerHTML += '\n';
        });
      }
    }]);

    return ASCIIRenderer;
  }();

  var CanvasRenderer =
  /*#__PURE__*/
  function () {
    function CanvasRenderer(environment) {
      var opts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      _classCallCheck(this, CanvasRenderer);

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

    _createClass(CanvasRenderer, [{
      key: "mount",
      value: function mount(el) {
        var container = typeof el === 'string' ? document.querySelector(el) : el;
        container.appendChild(this.canvas);
      }
    }, {
      key: "render",
      value: function render() {
        var context = this.context,
            environment = this.environment,
            width = this.width,
            height = this.height; // if "trace" is truthy, don't clear the canvas with every frame
        // to trace the paths of agents

        if (!this.opts.trace) context.clearRect(0, 0, width, height);
        environment.getAgents().forEach(function (agent) {
          var x = agent.get('x') || 0;
          var y = agent.get('y') || 0;
          context.beginPath();
          context.moveTo(x, y);
          context.fillStyle = agent.get('color') || 'black';
          context.arc(x, y, agent.get('radius') || 1, 0, 2 * Math.PI);
          context.fill();
        });
      }
    }]);

    return CanvasRenderer;
  }();

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
    var x1 = (p1 instanceof Agent ? p1.get('x') : p1.x) || 0;
    var y1 = (p1 instanceof Agent ? p1.get('y') : p1.y) || 0;
    var z1 = (p1 instanceof Agent ? p1.get('z') : p1.z) || 0;
    var x2 = (p2 instanceof Agent ? p2.get('x') : p2.x) || 0;
    var y2 = (p2 instanceof Agent ? p2.get('y') : p2.y) || 0;
    var z2 = (p2 instanceof Agent ? p2.get('z') : p2.z) || 0;
    var dx = Math.abs(x2 - x1);
    var dy = Math.abs(y2 - y1);
    var dz = Math.abs(z2 - z1);

    if (p1.environment && p1.environment.width && p1.environment.height) {
      var _p1$environment = p1.environment,
          width = _p1$environment.width,
          height = _p1$environment.height;
      if (dx > width / 2) dx = width - dx;
      if (dy > height / 2) dy = height - dy;
    }

    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  function gaussian(mean, sd) {
    var y, x1, x2, w;

    do {
      x1 = 2 * Math.random() - 1;
      x2 = 2 * Math.random() - 1;
      w = x1 * x1 + x2 * x2;
    } while (w >= 1);

    w = Math.sqrt(-2 * Math.log(w) / w);
    y = x1 * w;
    var m = mean || 0;
    var s = sd || 1;
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
    var x1 = (p1 instanceof Agent ? p1.get('x') : p1.x) || 0;
    var y1 = (p1 instanceof Agent ? p1.get('y') : p1.y) || 0;
    var z1 = (p1 instanceof Agent ? p1.get('z') : p1.z) || 0;
    var x2 = (p2 instanceof Agent ? p2.get('x') : p2.x) || 0;
    var y2 = (p2 instanceof Agent ? p2.get('y') : p2.y) || 0;
    var z2 = (p2 instanceof Agent ? p2.get('z') : p2.z) || 0;
    var dx = Math.abs(x2 - x1);
    var dy = Math.abs(y2 - y1);
    var dz = Math.abs(z2 - z1);

    if (p1.environment && p1.environment.width && p1.environment.height) {
      var _p1$environment = p1.environment,
          width = _p1$environment.width,
          height = _p1$environment.height;
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

  /**
   * Sum the values of an array.
   * @param {Array[Number]} arr 
   */
  function sum(arr) {
    return arr.reduce(function (a, b) {
      return a + b;
    }, 0);
  }

  function mean(arr) {
    return sum(arr) / arr.length;
  }

  function stdDev(arr) {
    var ave = mean(arr);
    return Math.sqrt(mean(arr.map(function (x) {
      return (x - ave) * (x - ave);
    })));
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
