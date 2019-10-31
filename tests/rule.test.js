const { Agent, Environment, Rule } = require("../dist/flocc");

const agent = new Agent();
const environment = new Environment();

it("Correctly adds.", () => {
  let steps = ["add", 1, 1];
  let rule = new Rule(environment, steps);
  expect(rule.call()).toBe(2);

  steps = ["add", 0, -999];
  rule = new Rule(environment, steps);
  expect(rule.call()).toBe(-999);
});

it("Correctly subtracts.", () => {
  let steps = ["subtract", 1, 1];
  let rule = new Rule(environment, steps);
  expect(rule.call()).toBe(0);

  steps = ["subtract", 0, -999];
  rule = new Rule(environment, steps);
  expect(rule.call()).toBe(999);
});

it("Correctly multiplies.", () => {
  let steps = ["multiply", 10, 10];
  let rule = new Rule(environment, steps);
  expect(rule.call()).toBe(100);

  steps = ["multiply", 0, 5];
  rule = new Rule(environment, steps);
  expect(rule.call()).toBe(0);
});

it("Correctly divides.", () => {
  let steps = ["divide", 100, 10];
  let rule = new Rule(environment, steps);
  expect(rule.call()).toBe(10);

  steps = ["divide", 4, 0];
  rule = new Rule(environment, steps);
  expect(rule.call()).toBe(Infinity);
});

it("Correctly takes modulos.", () => {
  let steps = ["mod", 17, 10];
  let rule = new Rule(environment, steps);
  expect(rule.call()).toBe(7);

  steps = ["mod", 3, 3];
  rule = new Rule(environment, steps);
  expect(rule.call()).toBe(0);
});

it("Correctly exponentiates.", () => {
  let steps = ["power", 2, 5];
  let rule = new Rule(environment, steps);
  expect(rule.call()).toBe(32);

  steps = ["power", 2, -1];
  rule = new Rule(environment, steps);
  expect(rule.call()).toBe(0.5);
});

it("Correctly retrieves agent data.", () => {
  agent.set("x", 123);
  agent.set("y", "asdf");
  let steps = ["get", "x"];
  let rule = new Rule(environment, steps);
  expect(rule.call(agent)).toBe(123);

  steps = ["get", "y"];
  rule = new Rule(environment, steps);
  expect(rule.call(agent)).toBe("asdf");

  steps = ["get", "z"];
  rule = new Rule(environment, steps);
  expect(rule.call(agent)).toBeNull();
});

it("Correctly sets agent data.", () => {
  let steps = ["set", "x", 999];
  let rule = new Rule(environment, steps);
  rule.call(agent);
  expect(agent.get("x")).toBe(999);
});

it("Correctly sets and gets local variables.", () => {
  let steps = [["local", "i", 1], ["local", "i"]];
  let rule = new Rule(environment, steps);
  expect(rule.call()).toBe(1);

  steps = [
    ["local", "x", 1],
    ["local", "y", 3],
    ["local", "z", ["add", ["local", "x"], ["local", "y"]]],
    ["local", "z"]
  ];
  rule = new Rule(environment, steps);
  expect(rule.call()).toBe(4);
});

it("Correctly matches conditionals.", () => {
  let steps = ["if", true, 1, 2];
  let rule = new Rule(environment, steps);
  expect(rule.call()).toBe(1);

  steps = ["if", false, 1, 2];
  rule = new Rule(environment, steps);
  expect(rule.call()).toBe(2);
});

it("Correctly does numeric comparisons.", () => {
  let steps = ["gt", 1, 2];
  let rule = new Rule(environment, steps);
  expect(rule.call()).toBe(false);

  steps = ["gt", 2, 1];
  rule = new Rule(environment, steps);
  expect(rule.call()).toBe(true);

  steps = ["gte", 2, 2];
  rule = new Rule(environment, steps);
  expect(rule.call()).toBe(true);

  steps = ["gte", 2, 3];
  rule = new Rule(environment, steps);
  expect(rule.call()).toBe(false);

  steps = ["lt", 2, 3];
  rule = new Rule(environment, steps);
  expect(rule.call()).toBe(true);

  steps = ["lt", 3, 2];
  rule = new Rule(environment, steps);
  expect(rule.call()).toBe(false);

  steps = ["lte", 3, 2];
  rule = new Rule(environment, steps);
  expect(rule.call()).toBe(false);

  steps = ["eq", 2, 3];
  rule = new Rule(environment, steps);
  expect(rule.call()).toBe(false);

  steps = ["eq", 3, 3];
  rule = new Rule(environment, steps);
  expect(rule.call()).toBe(true);
});
