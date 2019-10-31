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
