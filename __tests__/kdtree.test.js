const { Agent, Environment, Vector, KDTree, utils } = require("../dist/flocc");

utils.seed(1);

const environment = new Environment({
  torus: false,
  width: 25,
  height: 25
});

for (let x = 0; x < 25; x++) {
  for (let y = 0; y < 25; y++) {
    for (let z = 0; z < 25; z++) {
      const agent = new Agent();
      agent.set({ x, y, z });
      environment.addAgent(agent);
    }
  }
}

const tree = new KDTree(environment.getAgents(), 3);
environment.use(tree);

it("Has the same number agents as environment at top level.", () => {
  expect(tree.agents).toHaveLength(environment.getAgents().length);
});

it("Has depth 0 at the top level", () => {
  expect(tree.depth).toBe(0);
});

it("Creates a median", () => {
  expect(tree.median).toBeGreaterThanOrEqual(0);
  expect(tree.median).toBeLessThanOrEqual(25);
});

it("Has two child subtrees", () => {
  expect(tree.left).toBeInstanceOf(KDTree);
  expect(tree.right).toBeInstanceOf(KDTree);
  expect(tree.left.depth).toBe(1);
  expect(tree.right.depth).toBe(1);
});

it("Finds the subtree an agent or point is in.", () => {
  const agent = utils.sample(environment.getAgents());
  let subtree = tree.locateSubtree(agent);
  expect(subtree).toBeInstanceOf(KDTree);
  expect(subtree.depth).toBeGreaterThan(0);

  const point = { x: 5.2, y: 2.1, z: 3 };
  subtree = tree.locateSubtree(point);
  expect(subtree).toBeInstanceOf(KDTree);
  expect(subtree.depth).toBeGreaterThan(0);
});

it("Throws an error when trying to find subtree of a point out of bounds.", () => {
  expect(() => tree.locateSubtree({ x: -1, y: 1, z: 1 })).toThrow();
  expect(() => tree.locateSubtree({ x: 1, y: -1, z: 1 })).toThrow();
  expect(() => tree.locateSubtree(new Vector(1, 1, -1))).toThrow();
});

it("Finds the nearest neighbor of agents.", () => {
  const agent = utils.sample(environment.getAgents());
  const nearest = tree.nearestNeighbor(agent);
  expect(nearest).toBeInstanceOf(Agent);
});

it("Finds the nearest neighbor of points.", () => {
  const point = { x: 5.2, y: 2.1, z: 3 };
  const nearest = tree.nearestNeighbor(point);
  expect(nearest).toBeInstanceOf(Agent);
});

it("Finds all agents within a given distance.", () => {
  const agent = environment.getAgents()[0]; // at 0, 0, 0
  let neighbors = tree.agentsWithinDistance(agent, 1); // should be (1, 0, 0), (0, 1, 0), (0, 0, 1)
  expect(neighbors.includes(agent)).toBe(false);
  expect(neighbors.length).toBe(3);

  let point = { x: 5.2, y: 2.1, z: 3 };
  neighbors = tree.agentsWithinDistance(point, 1);
  expect(neighbors.length).toBeGreaterThan(0);

  point = new Vector(5.2, 2.1, 3);
  neighbors = tree.agentsWithinDistance(point, 1);
  expect(neighbors.length).toBeGreaterThan(0);
});

it("Handles adding and removing agents", () => {
  const point = { x: 5.2, y: 2.1, z: 3 };
  let nearest = tree.nearestNeighbor(point);
  expect(tree.agents.includes(nearest)).toBe(true);
  expect(nearest.get("x")).toBe(5);
  expect(nearest.get("y")).toBe(2);
  expect(nearest.get("z")).toBe(3);

  // now remove that nearest one
  environment.removeAgent(nearest);
  expect(tree.agents.includes(nearest)).toBe(false);
  nearest = tree.nearestNeighbor(point);
  expect(nearest.get("x")).toBe(6);
  expect(nearest.get("y")).toBe(2);
  expect(nearest.get("z")).toBe(3);

  // now add an even closer one
  const agent = new Agent({ x: 5.1, y: 2, z: 3 });
  environment.addAgent(agent);
  nearest = tree.nearestNeighbor(point);
  expect(nearest).toBe(agent);
});

it(".__subtree member is correctly set for agents", () => {
  const agent = environment.getAgents()[0]; // at 0, 0, 0
  expect(agent.__subtree).toBeInstanceOf(KDTree);
});

it("nearestNeighbor with filterFn skips agents that don't pass the filter", () => {
  const point = { x: 5.2, y: 2.1, z: 3 };
  // Find the current nearest (state may be modified by earlier tests)
  const nearest = tree.nearestNeighbor(point);
  expect(nearest).toBeInstanceOf(Agent);

  // With a filter that rejects the nearest, a different agent should be returned
  const filtered = tree.nearestNeighbor(point, a => a !== nearest);
  expect(filtered).toBeInstanceOf(Agent);
  expect(filtered).not.toBe(nearest);
});

it("nearestNeighbor with filterFn works when filtered agent is in a different subtree", () => {
  // Use an agent at the corner; its nearest neighbor is filtered away,
  // so the search must expand into adjacent subtrees to find the answer.
  const corner = environment.getAgents().find(
    a => a.get("x") === 0 && a.get("y") === 0 && a.get("z") === 0
  );
  const unfiltered = tree.nearestNeighbor(corner);

  // Confirm there IS a nearest (dist = 1)
  expect(unfiltered).toBeInstanceOf(Agent);

  // Filter out all agents at distance 1 from the corner
  const skipClose = a => {
    const dx = a.get("x") - 0;
    const dy = a.get("y") - 0;
    const dz = a.get("z") - 0;
    return Math.sqrt(dx * dx + dy * dy + dz * dz) > 1;
  };

  const result = tree.nearestNeighbor(corner, skipClose);
  expect(result).toBeInstanceOf(Agent);
  // Nearest at dist > 1 from (0,0,0) in this grid is sqrt(2) away
  const dx = result.get("x");
  const dy = result.get("y");
  const dz = result.get("z");
  expect(Math.sqrt(dx * dx + dy * dy + dz * dz)).toBeGreaterThan(1);
});

it("nearestNeighbor with filterFn that accepts all agents behaves identically to no filter", () => {
  const point = { x: 12, y: 7, z: 19 };
  const withoutFilter = tree.nearestNeighbor(point);
  const withFilter = tree.nearestNeighbor(point, () => true);
  expect(withFilter).toBe(withoutFilter);
});

it("nearestNeighbor uses __subtree for agent lookups", () => {
  const agent = environment.getAgents().find(
    a => a.get("x") === 10 && a.get("y") === 10 && a.get("z") === 10
  );
  expect(agent.__subtree).toBeInstanceOf(KDTree);

  // Agent path (uses __subtree) must not return the agent itself,
  // and must return an adjacent grid neighbor at distance 1.
  const viaAgent = tree.nearestNeighbor(agent);
  expect(viaAgent).toBeInstanceOf(Agent);
  expect(viaAgent).not.toBe(agent);
  const dx = viaAgent.get("x") - 10;
  const dy = viaAgent.get("y") - 10;
  const dz = viaAgent.get("z") - 10;
  expect(Math.sqrt(dx * dx + dy * dy + dz * dz)).toBeCloseTo(1, 5);
});

it("agentsWithinDistance with filterFn excludes filtered agents", () => {
  const agent = environment.getAgents()[0]; // at 0, 0, 0
  // Without filter: nearest axis-aligned neighbors at distance 1
  const all = tree.agentsWithinDistance(agent, 1);
  expect(all.length).toBeGreaterThan(0);

  // Filter that rejects the first neighbor
  const excluded = all[0];
  const filtered = tree.agentsWithinDistance(agent, 1, a => a !== excluded);
  expect(filtered).not.toContain(excluded);
  expect(filtered.length).toBe(all.length - 1);
});

it("agentsWithinDistance with filterFn that accepts all agents behaves identically to no filter", () => {
  const point = { x: 5, y: 5, z: 5 };
  const unfiltered = tree.agentsWithinDistance(point, 2);
  const filtered = tree.agentsWithinDistance(point, 2, () => true);
  expect(filtered).toEqual(unfiltered);
});
