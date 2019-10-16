const { Agent, Environment } = require("../dist/flocc");

const environment = new Environment();

it("Inherits all agent methods.", () => {
  environment.set("test", 1);
  expect(environment.get("test")).toBe(1);
  const { test } = environment.getData();
  expect(test).toBe(1);
  environment.increment("test");
  expect(environment.get("test")).toBe(2);

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
  const a0 = environment.getAgents()[0];
  environment.removeAgent(a0);
  expect(environment.getAgents()).toHaveLength(5);
  expect(a0.environment).toBe(null);

  environment.clear();
  expect(environment.getAgents()).toHaveLength(0);

  // removing an agent not in the environment does nothing
  environment.removeAgent(a0);
  expect(environment.getAgents()).toHaveLength(0);
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
