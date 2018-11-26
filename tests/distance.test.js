/**
 * Test distance (Euclidean) and Manhattan distance utility functions.
 */

const { Agent, utils } = require('../flocc');
const { distance, manhattanDistance } = utils;

const p1 = { x: 0, y: 0 };
const p2 = { x: 1, y: 1 };
const p3 = { x: -3, y: 4 };

const a1 = new Agent(); 
a1.set('x', 0);
a1.set('y', 0);

const a2 = new Agent(); 
a2.set('x', 1);
a2.set('y', 1);

const a3 = new Agent(); 
a3.set('x', -3);
a3.set('y', 4);

it('Correctly finds the distance between two non-Agent points.', () => {
  expect(distance(p1, p2)).toBeCloseTo(Math.sqrt(2));
  expect(distance(p1, p3)).toBeCloseTo(5);
  expect(distance(p2, p3)).toBeCloseTo(5);
});

it('Correctly finds the distance between an Agent and a non-Agent point.', () => {
  expect(distance(p1, a2)).toBeCloseTo(Math.sqrt(2));
  expect(distance(p2, a3)).toBeCloseTo(5);
  expect(distance(a1, p2)).toBeCloseTo(Math.sqrt(2));
});

it('Correctly finds the distance between two Agents.', () => {
  expect(distance(a1, a2)).toBeCloseTo(Math.sqrt(2));
  expect(distance(a1, a3)).toBeCloseTo(5);
  expect(distance(a2, a3)).toBeCloseTo(5);
});

it('Correctly finds the Manhattan distance between two non-Agent points.', () => {
  expect(manhattanDistance(p1, p2)).toBe(2);
  expect(manhattanDistance(p1, p3)).toBe(7);
  expect(manhattanDistance(p2, p3)).toBe(7);
});

it('Correctly finds the Manhattan distance between an Agent and a non-Agent point.', () => {
  expect(manhattanDistance(p1, a2)).toBe(2);
  expect(manhattanDistance(p2, a3)).toBe(7);
  expect(manhattanDistance(a1, p2)).toBe(2);
});

it('Correctly finds the Manhattan distance between two Agents.', () => {
  expect(manhattanDistance(a1, a2)).toBe(2);
  expect(manhattanDistance(a1, a3)).toBe(7);
  expect(manhattanDistance(a2, a3)).toBe(7);
});