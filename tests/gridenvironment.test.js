const { Agent, GridEnvironment } = require("../dist/flocc");

const grid = new GridEnvironment();
const a = new Agent();
const b = new Agent();
const c = new Agent();
const d = new Agent();
const e = new Agent();
const f = new Agent();

it("Defaults to width 2 and height 2.", () => {
  expect(grid.width).toEqual(2);
  expect(grid.height).toEqual(2);
});

it("Has zero agents upon instantiating.", () => {
  expect(grid.getAgents()).toHaveLength(0);
});

it("Has 4 (2x2) cells upon instantiating.", () => {
  expect(grid.getCells()).toHaveLength(4);
});

it("Correctly increments time on each tick.", () => {
  grid.tick();
  expect(grid.time).toEqual(1);
  grid.tick(5);
  expect(grid.time).toEqual(6);

  grid.tick({ count: 1 });
  expect(grid.time).toEqual(7);

  grid.tick({ count: 10 });
  expect(grid.time).toEqual(17);
});

it("Correctly fills the environment with agents.", () => {
  grid.fill();
  expect(grid.getAgents()).toHaveLength(4);
});

const grid2 = new GridEnvironment(10, 10);

it("Correctly adds agents to the environment.", () => {
  grid2.addAgentAt(3, 3, a);
  expect(grid2.getAgents()).toHaveLength(1);
  expect(grid2.getCell(3, 3).get("agent")).toEqual(a);
});

it("Correctly removes agents to the environment.", () => {
  grid2.removeAgentAt(3, 3);
  expect(grid2.getAgents()).toHaveLength(0);
});

it("Correctly loops over all cells in the environment.", () => {
  let i = 0;
  grid2.loop((x, y, agent) => i++);
  expect(i).toEqual(100);
});

it("Correctly swaps two agents in the environment.", () => {
  grid2.addAgentAt(2, 2, a);
  grid2.addAgentAt(6, 6, b);
  grid2.swap(2, 2, 6, 6);
  expect(grid2.getAgentAt(2, 2)).toBe(b);
  expect(grid2.getAgentAt(6, 6)).toBe(a);

  grid2.swap(2, 2, 4, 4);
  expect(grid2.getAgentAt(4, 4)).toBe(b);
  expect(grid2.getAgentAt(2, 2)).toBeNull();
});

// reset
grid2.removeAgentAt(4, 4);
grid2.removeAgentAt(6, 6);

it("Correctly finds both von Neumann and Moore neighbors.", () => {
  grid2.addAgentAt(0, 0, a);
  grid2.addAgentAt(0, 1, b);
  grid2.addAgentAt(1, 0, c);
  grid2.addAgentAt(9, 0, d);
  grid2.addAgentAt(0, 9, e);
  grid2.addAgentAt(1, 1, f);
  [b, c, d, e].forEach(agt => expect(grid2.neighbors(a)).toContain(agt));
  expect(grid2.neighbors(a)).not.toContain(f);
  expect(grid2.neighbors(a, 1, true)).toContain(f);

  grid2.removeAgentAt(0, 1);
  grid2.removeAgentAt(1, 0);
  grid2.removeAgentAt(9, 0);
  grid2.removeAgentAt(0, 9);
  grid2.removeAgentAt(1, 1);

  grid2.fill();
  expect(grid2.neighbors(a)).toHaveLength(4);
  expect(grid2.neighbors(a, 2)).toHaveLength(12);
  expect(grid2.neighbors(a, 3)).toHaveLength(24);
  expect(grid2.neighbors(a, 1, true)).toHaveLength(8);
  expect(grid2.neighbors(a, 2, true)).toHaveLength(24);
  expect(grid2.neighbors(a, 3, true)).toHaveLength(48);
});
