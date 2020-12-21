const { Agent, Environment, Rule } = require("../dist/flocc");

const agent = new Agent();
agent.set("x", 12);
agent.set("y", 23);
agent.set("z", () => 41);

it("Correctly gets data associated with an agent.", () => {
  expect(agent.get("x")).toEqual(12);
  expect(agent.get("y")).toEqual(23);
  expect(agent.get("z")).toEqual(41);

  expect(agent.get("w")).toBeNull();

  const { x, y, z } = agent.getData();
  expect([x, y, z]).toEqual([12, 23, 41]);
});

it("Correctly sets new data.", () => {
  agent.set("x", 65);
  expect(agent.get("x")).toEqual(65);

  agent.set({
    x: 100,
    y: false,
    z: () => "asdf"
  });

  expect(agent.get("x")).toEqual(100);
  expect(agent.get("y")).toEqual(false);
  expect(agent.get("z")).toEqual("asdf");

  const { x, y, z } = agent.getData();
  expect([x, y, z]).toEqual([100, false, "asdf"]);
});

it("Instantiates agents with data", () => {
  const a = new Agent({
    x: 0,
    y: 12,
    z: 24
  });
  expect(a.get("x")).toBe(0);
  expect(a.get("y")).toBe(12);
  expect(a.get("z")).toBe(24);
});

it("Correctly retrieves function values that reference other values.", () => {
  agent.set("alias", agt => agt.get("z"));
  expect(agent.get("alias")).toBe("asdf");
  expect(agent.get("alias")).toBe(agent.get("z"));
  agent.set("z", () => 9999);
  expect(agent.get("alias")).toBe(9999);
  expect(agent.get("alias")).toBe(agent.get("z"));
});

it("Retrieves a null value for data that does not exist.", () => {
  expect(agent.get("notfound")).toBeNull();
});

it("Increments and decrements data.", () => {
  const a = new Agent();
  a.set("x", 4);
  a.increment("x");
  expect(a.get("x")).toEqual(5);
  a.decrement("x");
  expect(a.get("x")).toEqual(4);
});

it(`Throws an error if an agent's data tries to call itself.`, () => {
  const a = new Agent();
  const b = new Agent();
  a.set("value", () => b.get("value"));
  b.set("value", () => a.get("value"));
  expect(() => a.get("value")).toThrow();
});

it("Sets new data based on return value of rules", () => {
  const a = new Agent();
  a.set("x", 100);
  expect(a.get("x")).toBe(100);
  function rule(agt) {
    return {
      x: agt.get("x") + 1
    };
  }
  a.addRule(rule);
  const e = new Environment();
  e.addAgent(a);
  e.tick();
  expect(a.get("x")).toBe(101);
});

it("Sets new data based on return value of rules asynchronously.", () => {
  const a = new Agent();
  const b = new Agent();
  const e = new Environment();
  e.addAgent(a);
  e.addAgent(b);
  a.set("x", 100);
  b.set("x", 200);
  function rule(agt) {
    const mean =
      e
        .getAgents()
        .map(_ => _.get("x"))
        .reduce((x, y) => x + y, 0) / e.getAgents().length;
    return {
      x: (agt.get("x") + mean) / 2
    };
  }
  a.addRule(rule);
  b.addRule(rule);
  e.tick();
  expect(a.get("x")).toBe(125);
  expect(b.get("x")).toBe(175);
});

it("Executes function rules when adding a `tick` value.", () => {
  const e = new Environment();
  const a = new Agent({
    x: 1,
    tick(a) {
      a.increment("x");
    }
  });
  e.addAgent(a);
  e.tick();
  expect(a.get("x")).toBe(2);
});

it("Executes class rules when adding a `tick` value.", () => {
  const e = new Environment();
  const a = new Agent({
    x: 1,
    tick: new Rule(e, ["set", "x", ["add", ["get", "x"], 1]])
  });
  e.addAgent(a);
  e.tick();
  expect(a.get("x")).toBe(2);
});

it("Still executes rules added via `addRule` when there is a `tick` value.", () => {
  const e = new Environment();
  const a = new Agent({
    x: 1,
    tick(a) {
      a.increment("x"); // 2
    }
  });
  a.addRule(function(a) {
    a.set("x", a.get("x") * 10); // 20
  });
  a.addRule(function(a) {
    a.decrement("x", 5); // 15
  });
  e.addAgent(a);
  e.tick();
  expect(a.get("x")).toBe(15);
});

it("Executes enqueued function rules when adding a `queue` value.", () => {
  const e = new Environment();
  const a = new Agent({
    x: 1,
    tick(a) {
      a.increment("x"); // 2
      a.set("queue", a => a.increment("x")); // 3
    }
  });
  e.addAgent(a);
  e.tick();
  expect(a.get("x")).toBe(3);
});

it("Executes enqueued class rules when adding a `queue` value.", () => {
  const e = new Environment();
  const a = new Agent({
    x: 1,
    tick(a) {
      a.increment("x"); // 2
      a.set("queue", new Rule(e, ["set", "x", ["multiply", ["get", "x"], 3]])); // 6
    }
  });
  e.addAgent(a);
  e.tick();
  expect(a.get("x")).toBe(6);
});

it("Returns null if attempting to access `tick` or `queue` values.", () => {
  const tick = () => {};
  const queue = () => {};
  const a = new Agent({
    tick,
    queue
  });
  expect(a.get("tick")).not.toBe(tick);
  expect(a.get("tick")).toBeNull();
  expect(a.get("queue")).not.toBe(queue);
  expect(a.get("queue")).toBeNull();
});
