/**
 * Test distance (Euclidean) and Manhattan distance utility functions.
 */

const { NewEnvironment, utils } = require("../dist/flocc");
const { distance, manhattanDistance } = utils;

const nonToroidalEnv = new NewEnvironment({ torus: false });
const toroidalEnv = new NewEnvironment();
toroidalEnv.width = 10;
toroidalEnv.height = 10;

const p1 = { x: 0, y: 0 };
const p2 = { x: 1, y: 1 };
const p3 = { x: 3, y: 4 };

let a1 = nonToroidalEnv.addAgent({ x: 0, y: 0 });
let a2 = nonToroidalEnv.addAgent({ x: 1, y: 1 });
let a3 = nonToroidalEnv.addAgent({ x: 3, y: 4 });
let a4 = nonToroidalEnv.addAgent({ x: 9, y: 9 });
let a5 = nonToroidalEnv.addAgent({ x: 10, y: 10 });

it("Correctly finds the distance between two non-Agent points.", () => {
  expect(distance(p1, p2)).toBeCloseTo(Math.sqrt(2));
  expect(distance(p1, p3)).toBeCloseTo(5);
  expect(distance(p2, p3)).toBeCloseTo(Math.sqrt(13));
});

it("Correctly finds the distance between an Agent and a non-Agent point.", () => {
  expect(distance(p1, a2)).toBeCloseTo(Math.sqrt(2));
  expect(distance(p2, a3)).toBeCloseTo(Math.sqrt(13));
  expect(distance(a1, p2)).toBeCloseTo(Math.sqrt(2));
});

it("Correctly finds the distance between two Agents.", () => {
  expect(distance(a1, a2)).toBeCloseTo(Math.sqrt(2));
  expect(distance(a1, a3)).toBeCloseTo(5);
  expect(distance(a2, a3)).toBeCloseTo(Math.sqrt(13));
});

it("Correctly finds the Manhattan distance between two non-Agent points.", () => {
  expect(manhattanDistance(p1, p2)).toBe(2);
  expect(manhattanDistance(p1, p3)).toBe(7);
  expect(manhattanDistance(p2, p3)).toBe(5);
});

it("Correctly finds the Manhattan distance between an Agent and a non-Agent point.", () => {
  expect(manhattanDistance(p1, a2)).toBe(2);
  expect(manhattanDistance(p2, a3)).toBe(5);
  expect(manhattanDistance(a1, p2)).toBe(2);
});

it("Correctly finds the Manhattan distance between two Agents.", () => {
  expect(manhattanDistance(a1, a2)).toBe(2);
  expect(manhattanDistance(a1, a3)).toBe(7);
  expect(manhattanDistance(a2, a3)).toBe(5);
});

it("Correctly finds distance and Manhattan distance between Agents in a non-toroidal Environment.", () => {
  expect(distance(a1, a2)).toBeCloseTo(Math.sqrt(2));
  expect(distance(a1, a3)).toBeCloseTo(5);
  expect(distance(a2, a4)).toBeCloseTo(Math.sqrt(128));

  expect(manhattanDistance(a1, a2)).toBe(2);
  expect(manhattanDistance(a1, a3)).toBe(7);
  expect(manhattanDistance(a2, a4)).toBe(16);
});

it("Correctly finds distance and Manhattan distance between Agents in a toroidal Environment.", () => {
  nonToroidalEnv.removeAgent(a1);
  nonToroidalEnv.removeAgent(a2);
  nonToroidalEnv.removeAgent(a3);
  nonToroidalEnv.removeAgent(a4);
  nonToroidalEnv.removeAgent(a5);

  a1 = toroidalEnv.addAgent({ x: 0, y: 0 });
  a2 = toroidalEnv.addAgent({ x: 1, y: 1 });
  a3 = toroidalEnv.addAgent({ x: 3, y: 4 });
  a4 = toroidalEnv.addAgent({ x: 9, y: 9 });
  a5 = toroidalEnv.addAgent({ x: 10, y: 10 });

  expect(distance(a1, a2)).toBeCloseTo(Math.sqrt(2));
  expect(distance(a1, a3)).toBeCloseTo(5);
  expect(distance(a1, a4)).toBeCloseTo(Math.sqrt(2));
  expect(distance(a4, a5)).toBeCloseTo(Math.sqrt(2));
  expect(distance(a1, a5)).toBe(0);

  expect(manhattanDistance(a1, a2)).toBe(2);
  expect(manhattanDistance(a1, a3)).toBe(7);
  expect(manhattanDistance(a1, a4)).toBe(2);
  expect(manhattanDistance(a4, a5)).toBe(2);
  expect(manhattanDistance(a1, a5)).toBe(0);
});
