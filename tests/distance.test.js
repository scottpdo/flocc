/**
 * Test distance (Euclidean) and Manhattan distance utility functions.
 */

const { Agent, Environment, utils } = require('../flocc');
const { distance, manhattanDistance } = utils;

const nonToroidalEnv = new Environment({ torus: false });
const toroidalEnv = new Environment();
toroidalEnv.width = 10;
toroidalEnv.height = 10;

const p1 = { x: 0, y: 0 };
const p2 = { x: 1, y: 1 };
const p3 = { x: 3, y: 4 };

const a1 = new Agent(); 
a1.set('x', 0);
a1.set('y', 0);

const a2 = new Agent(); 
a2.set({ x: 1, y: 1 });

const a3 = new Agent(); 
a3.set('x', 3);
a3.set('y', 4);

const a4 = new Agent(); 
a4.set('x', 9);
a4.set('y', 9);

const a5 = new Agent();
a5.set('x', 10);
a5.set('y', 10);

it('Correctly finds the distance between two non-Agent points.', () => {
  expect(distance(p1, p2)).toBeCloseTo(Math.sqrt(2));
  expect(distance(p1, p3)).toBeCloseTo(5);
  expect(distance(p2, p3)).toBeCloseTo(Math.sqrt(13));
});

it('Correctly finds the distance between an Agent and a non-Agent point.', () => {
  expect(distance(p1, a2)).toBeCloseTo(Math.sqrt(2));
  expect(distance(p2, a3)).toBeCloseTo(Math.sqrt(13));
  expect(distance(a1, p2)).toBeCloseTo(Math.sqrt(2));
});

it('Correctly finds the distance between two Agents.', () => {
  expect(distance(a1, a2)).toBeCloseTo(Math.sqrt(2));
  expect(distance(a1, a3)).toBeCloseTo(5);
  expect(distance(a2, a3)).toBeCloseTo(Math.sqrt(13));
});

it('Correctly finds the Manhattan distance between two non-Agent points.', () => {
  expect(manhattanDistance(p1, p2)).toBe(2);
  expect(manhattanDistance(p1, p3)).toBe(7);
  expect(manhattanDistance(p2, p3)).toBe(5);
});

it('Correctly finds the Manhattan distance between an Agent and a non-Agent point.', () => {
  expect(manhattanDistance(p1, a2)).toBe(2);
  expect(manhattanDistance(p2, a3)).toBe(5);
  expect(manhattanDistance(a1, p2)).toBe(2);
});

it('Correctly finds the Manhattan distance between two Agents.', () => {
  expect(manhattanDistance(a1, a2)).toBe(2);
  expect(manhattanDistance(a1, a3)).toBe(7);
  expect(manhattanDistance(a2, a3)).toBe(5);
});

it('Correctly finds distance and Manhattan distance between Agents in a non-toroidal Environment.', () => {
  nonToroidalEnv.addAgent(a1);
  nonToroidalEnv.addAgent(a2);
  nonToroidalEnv.addAgent(a3);
  nonToroidalEnv.addAgent(a4);

  expect(distance(a1, a2)).toBeCloseTo(Math.sqrt(2));
  expect(distance(a1, a3)).toBeCloseTo(5);
  expect(distance(a2, a4)).toBeCloseTo(Math.sqrt(128));

  expect(manhattanDistance(a1, a2)).toBe(2);
  expect(manhattanDistance(a1, a3)).toBe(7);
  expect(manhattanDistance(a2, a4)).toBe(16);
});

it('Correctly finds distance and Manhattan distance between Agents in a toroidal Environment.', () => {
  nonToroidalEnv.removeAgent(a1);
  nonToroidalEnv.removeAgent(a2);
  nonToroidalEnv.removeAgent(a3);
  nonToroidalEnv.removeAgent(a4);

  toroidalEnv.addAgent(a1);
  toroidalEnv.addAgent(a2);
  toroidalEnv.addAgent(a3);
  toroidalEnv.addAgent(a4);
  toroidalEnv.addAgent(a5);

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