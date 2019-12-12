const { Agent, Environment, KDTree, utils } = require("../dist/flocc");

const environment = new Environment();

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

it("Has the same agents as environment at top level.", () => {
  expect(tree.agents).toBe(environment.getAgents());
});

it("Creates a median", () => {
  expect(tree.median).toBeGreaterThanOrEqual(0);
  expect(tree.median).toBeLessThanOrEqual(25);
});

it("Has two child subtrees", () => {
  expect(tree.left).toBeInstanceOf(KDTree);
  expect(tree.right).toBeInstanceOf(KDTree);
});
