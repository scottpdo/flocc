const { Agent, Environment, Rule, Vector } = require("../dist/flocc");

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

it("Correctly enqueues setting agent data.", () => {
  let steps = ["enqueue", "x", 999];
  let rule = new Rule(environment, steps);
  const a = new Agent();
  a.set("x", 100);
  a.addRule(rule);
  environment.addAgent(a);
  expect(a.get("x")).toBe(100);
  environment.tick();
  expect(a.get("x")).toBe(999);
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

  const obj = { key1: 10, key2: 25 };
  steps = [["local", "obj", obj], ["local", "obj"]];
  rule = new Rule(environment, steps);
  expect(rule.call()).toEqual(obj);

  const arr = [1, 2, 3, 4, 5];
  steps = [["local", "arr", arr], ["local", "arr"]];
  rule = new Rule(environment, steps);
  expect(rule.call()).toEqual(arr);
});

it("Correctly matches conditionals.", () => {
  let steps = ["if", true, 1, 2];
  let rule = new Rule(environment, steps);
  expect(rule.call()).toBe(1);

  steps = ["if", false, 1, 2];
  rule = new Rule(environment, steps);
  expect(rule.call()).toBe(2);
});

it("Correctly matches 'and' statements.", () => {
  let steps = ["and", true, true];
  let rule = new Rule(environment, steps);
  expect(rule.call()).toBe(true);

  steps = ["and", ["gt", 2, 3], ["gt", 2, 1]];
  rule = new Rule(environment, steps);
  expect(rule.call()).toBe(false);
});

it("Correctly matches 'or' statements.", () => {
  let steps = ["or", false, false];
  let rule = new Rule(environment, steps);
  expect(rule.call()).toBe(false);

  steps = ["or", ["gt", ["add", 2, 2], 1], ["gt", 2, 1]];
  rule = new Rule(environment, steps);
  expect(rule.call()).toBe(true);
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

  steps = ["eq", 0, ["subtract", 1, 1]];
  rule = new Rule(environment, steps);
  expect(rule.call()).toBe(true);

  steps = ["eq", 2, 3];
  rule = new Rule(environment, steps);
  expect(rule.call()).toBe(false);

  steps = ["eq", 3, 3];
  rule = new Rule(environment, steps);
  expect(rule.call()).toBe(true);
});

it("Correctly maps arrays.", () => {
  const arr = [1, 2, 3];
  let rule = new Rule(environment, arr);

  // when given an array, returns the same object
  expect(rule.call()).toBe(arr);

  let steps = ["map", arr, ["add", 2]];
  rule = new Rule(environment, steps);
  expect(rule.call()).toEqual([3, 4, 5]);

  // does not mutate original
  expect(arr).toEqual([1, 2, 3]);

  steps = ["map", arr, ["multiply", ["add", 1, 1]]];
  rule = new Rule(environment, steps);
  expect(rule.call()).toEqual([2, 4, 6]);
});

it("Correctly filters arrays.", () => {
  const arr = [1, 2, 3, 4, 5];

  let steps = ["filter", arr, ["gte", 2]];
  let rule = new Rule(environment, steps);
  expect(rule.call()).toEqual([2, 3, 4, 5]);

  // does not mutate original
  expect(arr).toEqual([1, 2, 3, 4, 5]);

  steps = ["filter", arr, ["eq", 1, ["mod", 2]]];
  rule = new Rule(environment, steps);
  expect(rule.call()).toEqual([1]);
});

it("Filters with compound predicates using local '_' syntax.", () => {
  const arr = [1, 2, 3, 4, 5];

  // Filter using AND with local "_" syntax
  let steps = ["filter", arr, ["and", ["gte", ["local", "_"], 2], ["lte", ["local", "_"], 4]]];
  let rule = new Rule(environment, steps);
  expect(rule.call()).toEqual([2, 3, 4]);

  // Filter using OR
  steps = ["filter", arr, ["or", ["lt", ["local", "_"], 2], ["gt", ["local", "_"], 4]]];
  rule = new Rule(environment, steps);
  expect(rule.call()).toEqual([1, 5]);

  // Filter using nested IF
  steps = ["filter", arr, ["if", ["eq", ["local", "_"], 3], true, false]];
  rule = new Rule(environment, steps);
  expect(rule.call()).toEqual([3]);
});

it("Maps with compound expressions using local '_' syntax.", () => {
  const arr = [1, 2, 3, 4, 5];

  // Map using IF to conditionally transform
  let steps = ["map", arr, ["if", ["gt", ["local", "_"], 2], ["multiply", ["local", "_"], 10], ["local", "_"]]];
  let rule = new Rule(environment, steps);
  expect(rule.call()).toEqual([1, 2, 30, 40, 50]);
});

it("Handles multiple calls with same rule (no state corruption).", () => {
  const arr = [1, 2, 3, 4, 5];

  // Old syntax
  let rule = new Rule(environment, ["filter", arr, ["gte", 3]]);
  expect(rule.call()).toEqual([3, 4, 5]);
  expect(rule.call()).toEqual([3, 4, 5]);
  expect(rule.call()).toEqual([3, 4, 5]);

  // New syntax
  rule = new Rule(environment, ["filter", arr, ["and", ["gte", ["local", "_"], 2], ["lte", ["local", "_"], 4]]]);
  expect(rule.call()).toEqual([2, 3, 4]);
  expect(rule.call()).toEqual([2, 3, 4]);
  expect(rule.call()).toEqual([2, 3, 4]);
});

it(`Correctly retrieves values from an object's key.`, () => {
  let steps = ["key", { abc: "123" }, "abc"];
  let rule = new Rule(environment, steps);
  expect(rule.call()).toEqual("123");

  steps = ["map", [{ a: 1 }, { a: 2 }, { a: 3 }], ["key", "a"]];
  rule = new Rule(environment, steps);
  expect(rule.call()).toEqual([1, 2, 3]);
});

it("Correctly calls methods on an object.", () => {
  let steps = [
    [
      "local",
      "obj",
      {
        double(a) {
          return 2 * a;
        }
      }
    ],
    ["method", ["local", "obj"], "double", 10]
  ];
  let rule = new Rule(environment, steps);
  expect(rule.call()).toEqual(20);

  steps = [["set", "x", 5], ["key", ["method", ["agent"], "getData"], "x"]];
  rule = new Rule(environment, steps);
  expect(rule.call(agent)).toEqual(5);

  steps = [
    ["set", "v", new Vector(3, 4)],
    ["local", "dummy", ["method", ["get", "v"], "rotateZ", Math.PI]],
    ["key", ["get", "v"], "x"]
  ];
  rule = new Rule(environment, steps);
  expect(rule.call(agent)).toBeCloseTo(-3);
});

it("Correctly instantiates Vectors.", () => {
  let steps = [
    ["local", "v", ["vector", 2, 3, 4]],
    ["key", ["local", "v"], "yz"]
  ];
  let rule = new Rule(environment, steps);
  expect(rule.call()).toEqual([3, 4]);
});
