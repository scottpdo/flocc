const { Agent, Environment, utils } = require("../dist/flocc");

let environment;

beforeEach(() => {
  environment = new Environment();
});

it("Inherits all agent methods.", () => {
  environment.set("test", 1);
  expect(environment.get("test")).toBe(1);

  const { test } = environment.getData();
  expect(test).toBe(1);

  environment.increment("test");
  expect(environment.get("test")).toBe(2);

  environment.decrement("test");
  expect(environment.get("test")).toBe(1);

  expect(environment.get("nada")).toBeNull();
});

it("Has zero agents upon instantiating.", () => {
  expect(environment.getAgents()).toHaveLength(0);
});

it("Has time zero upon instantiating.", () => {
  expect(environment.time).toEqual(0);
});

it("Correctly increments time on each tick.", () => {
  environment.tick();
  expect(environment.time).toEqual(1);
  environment.tick(5);
  expect(environment.time).toEqual(6);

  environment.tick({ count: 1 });
  expect(environment.time).toEqual(7);

  environment.tick({ count: 10 });
  expect(environment.time).toEqual(17);
});

it("Has zero width and height upon instantiating.", () => {
  expect(environment.width).toEqual(0);
  expect(environment.height).toEqual(0);
});

it("Correctly adds agents.", () => {
  const a0 = new Agent();
  environment.addAgent(a0);
  expect(environment.getAgents()).toHaveLength(1);
  expect(a0.environment).toEqual(environment);

  // does nothing if attempting to add non-agent
  environment.addAgent(null);
  expect(environment.getAgents()).toHaveLength(1);

  for (let i = 0; i < 5; i++) environment.addAgent(new Agent());
  expect(environment.getAgents()).toHaveLength(6);
});

it("Correctly removes agents.", () => {
  const a0 = new Agent();
  environment.addAgent(a0);
  environment.removeAgent(a0);
  expect(environment.getAgents()).toHaveLength(0);
  expect(a0.environment).toBe(null);

  for (let i = 0; i < 5; i++) environment.addAgent(new Agent());
  expect(environment.getAgents()).toHaveLength(5);

  environment.clear();
  expect(environment.getAgents()).toHaveLength(0);

  // removing an agent not in the environment does nothing
  environment.removeAgent(a0);
  expect(environment.getAgents()).toHaveLength(0);
});

it("Correctly loops over agents in the order they were added.", () => {
  const order = [];
  function tick(agent) {
    order.push(agent.get("i"));
  }
  for (let i = 0; i < 10; i++) {
    const agent = new Agent();
    agent.set("i", i);
    agent.addRule(tick);
    environment.addAgent(agent);
  }
  environment.tick();
  expect(order).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);

  environment.clear();
});

it("Correctly loops over agents in random order.", () => {
  const order = [];
  function tick(agent) {
    order.push(agent.get("i"));
  }
  for (let i = 0; i < 10; i++) {
    const agent = new Agent();
    agent.set("i", i);
    agent.addRule(tick);
    environment.addAgent(agent);
  }
  environment.tick({ randomizeOrder: true });

  /**
   * NOTE: Since this tests for randomness, there is a 1 / (10 factorial)
   * ~ 1 in a million chance that this might not pass.
   */
  expect(order).not.toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
});

it("Activates only a single random agent with activation = `random`", () => {
  const activated = [];
  const tick = agent => activated.push(agent.get("i"));
  for (let i = 0; i < 11; i++) {
    environment.addAgent(
      new Agent({
        i,
        tick
      })
    );
  }
  environment.tick({ activation: "random" });
  expect(activated).toHaveLength(1);

  for (let i = 0; i < 1000; i++) {
    environment.tick({ activation: "random" });
  }
  expect(activated).toHaveLength(1001);
  expect(utils.median(activated)).toBe(5); // 5 = median of 0, 1, 2, ... 11
  expect(utils.mean(activated)).toBeGreaterThan(4);
  expect(utils.mean(activated)).toBeLessThan(6);
});

it("Only loops over `n` agents when calling `tick` with an `activationCount`", () => {
  let count = 0;
  const tick = () => count++;
  for (let i = 0; i < 10; i++) {
    environment.addAgent(
      new Agent({
        i,
        tick
      })
    );
  }
  environment.tick({ activation: "random", activationCount: 5 });
  expect(count).toBe(5);

  // reset
  count = 0;

  // when passing zero or a negative number for activationCount,
  // no agents should activate
  environment.tick({ activation: "random", activationCount: 0 });
  expect(count).toBe(0);
  environment.tick({ activation: "random", activationCount: -5 });
  expect(count).toBe(0);

  // when passing more than the total # of agents, should activate
  // exactly as many as there are in the environment
  const environment2 = new Environment();
  const activated = [];
  const tick2 = agent => {
    activated.push(agent.get("i"));
    count++;
  };
  for (let i = 0; i < 10; i++) {
    environment2.addAgent(
      new Agent({
        i,
        tick: tick2
      })
    );
  }
  environment2.tick({ activation: "random", activationCount: 9999 });
  expect(count).toBe(10);
  expect(activated).toHaveLength(10);
  /**
   * NOTE: Since this tests for randomness, there is a 1 / (10 factorial)
   * ~ 1 in a million chance that this might not pass.
   */
  expect(activated).not.toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
});

it("Correctly retrieves agents by ID.", () => {
  const a0 = new Agent();
  const { id } = a0;
  environment.addAgent(a0);
  expect(environment.getAgentById(id)).toBe(a0);
  environment.clear();
});

it("Correctly removes agents by ID.", () => {
  const a0 = new Agent();
  const { id } = a0;
  environment.addAgent(a0);
  expect(environment.getAgents()).toHaveLength(1);
  environment.removeAgentById(id);
  expect(environment.getAgents()).toHaveLength(0);
});

it("Memoizes values", () => {
  expect(environment.memo(() => 5)).toBe(5);
  expect(environment.memo(() => true)).toBe(true);

  const expensiveFunction = jest.fn(() => 123);
  const tick = agent => {
    agent.set("s", environment.memo(expensiveFunction));
  };
  for (let i = 0; i < 5; i++) {
    const agent = new Agent({ i });
    agent.addRule(tick);
    environment.addAgent(agent);
  }
  environment.tick();
  // should be called only once even though it runs for every agent
  expect(expensiveFunction.mock.calls).toHaveLength(1);
  expect(environment.getAgents()[0].get("s")).toBe(123);

  environment.tick(3);
  // should be called exactly once per environment tick
  expect(expensiveFunction.mock.calls).toHaveLength(4);
  expect(environment.getAgents()[3].get("s")).toBe(123);
});

it("Returns array of agent stats", () => {
  for (let i = 0; i < 101; i++) {
    const agent = new Agent({ i });
    environment.addAgent(agent);
  }

  expect(environment.stat("i")).toHaveLength(101);
  expect(utils.mean(environment.stat("i"))).toBe(50);

  // after having been called once, uses cached value
  environment.getAgents()[0].set("i", 9999);
  expect(environment.stat("i")[0]).toBe(0);
  expect(utils.mean(environment.stat("i"))).toBe(50);

  // if called with `false` parameter, does not use cached value
  expect(environment.stat("i", false)[0]).toBe(9999);
  expect(utils.mean(environment.stat("i", false))).toBe(149);

  // cache is cleared after ticking
  environment.tick();
  expect(environment.stat("i")[0]).toBe(9999);
  expect(utils.mean(environment.stat("i"))).toBe(149);
});
