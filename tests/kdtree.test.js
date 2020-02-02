const { NewEnvironment, Vector, KDTree, utils } = require("../dist/flocc");

const environment = new NewEnvironment({
  torus: false,
  width: 25,
  height: 25
});

for (let x = 0; x < 25; x++) {
  for (let y = 0; y < 25; y++) {
    for (let z = 0; z < 25; z++) {
      environment.addAgent({ x, y, z });
    }
  }
}

const tree = new KDTree(environment.getAgents(), 3);
environment.use(tree);

it("Has the same agents as environment at top level.", () => {
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
  expect(NewEnvironment.isAgent(nearest)).toBe(true);
});

it("Finds the nearest neighbor of points.", () => {
  const point = { x: 5.2, y: 2.1, z: 3 };
  const nearest = tree.nearestNeighbor(point);
  expect(NewEnvironment.isAgent(nearest)).toBe(true);
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
