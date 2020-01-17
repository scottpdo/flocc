const { NewEnvironment } = require("../dist/flocc");

let environment;

beforeEach(() => {
  environment = new NewEnvironment();
});

it("Instantiates with zero agents.", () => {
  expect(environment.agents).toBe(0);
});

it("Correctly adds agents.", () => {
  environment.addAgent();
  const agent = environment.getAgent(0);
  expect(agent.get).toBeDefined();
  expect(agent.getData).toBeDefined();
  expect(agent.set).toBeDefined();
});

it("Correctly sets and gets agent data.", () => {
  environment.addAgent();
  const agent = environment.getAgent(0);
  agent.set("x", 12);
  agent.set("y", 100);
  expect(agent.get("x")).toBe(12);
  expect(agent.get("y")).toBe(100);
  expect(agent.getData()).toEqual({ x: 12, y: 100 });
});

it("Instantiates agents with data.", () => {
  const agent = environment.addAgent({ x: 12, y: 100 });
  expect(agent.get("x")).toBe(12);
  expect(agent.get("y")).toBe(100);
  expect(agent.getData()).toEqual({ x: 12, y: 100 });
});

it("Returns null for agents out of bounds.", () => {
  environment.addAgent();
  const agent = environment.getAgent(1);
  expect(agent).toBeNull();
});

it("Returns null values if they don't exist.", () => {
  const a1 = environment.addAgent({ x: 12, y: 100 });
  const a2 = environment.addAgent();
  expect(a1.get("x")).toBe(12);
  expect(a1.get("y")).toBe(100);

  expect(a2.get("x")).toBeNull();
  expect(a2.get("y")).toBeNull();
});

it("Adds and executes rules.", () => {
  function rule(agent) {
    agent.set("x", agent.get("x") + 1);
  }
  environment.addRule(rule);
  const agent = environment.addAgent({ x: 12 });
  environment.tick();
  expect(agent.get("x")).toBe(13);

  environment.tick(3);
  expect(agent.get("x")).toBe(16);
});
