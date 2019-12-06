const { Agent, Environment, KDTree, utils } = require("../dist/flocc");

const environment = new Environment();
for (let i = 0; i < 100; i++) {
  const agent = new Agent();
  agent.set({
    x: utils.random(-1000, 1000),
    y: utils.random(-1000, 1000),
    z: utils.random(-1000, 1000)
  });
  environment.addAgent(agent);
}

const tree = new KDTree(environment.getAgents(), 3);
it("Creates a median", () => {
  // console.log(tree);
  // expect(tree.median).toBe(0);
});
