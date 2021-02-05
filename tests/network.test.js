const { Agent, Environment, Network } = require("../dist/flocc");

let network;
let environment;

beforeEach(() => {
  network = new Network();
  environment = new Environment();
});

it("Correctly instantiates an empty network.", () => {
  expect(network.size()).toEqual(0);
});

it("Correctly adds agents to a network.", () => {
  const a = new Agent();
  let success = network.addAgent(a);
  expect(success).toBe(true);
  expect(network.size()).toEqual(1);

  success = network.addAgent(a);
  expect(success).toBe(false);
});

it("Correctly removes an agent from the network.", () => {
  const a = new Agent();
  network.addAgent(a);

  let success = network.removeAgent(a);
  expect(success).toBe(true);
  expect(network.size()).toEqual(0);

  success = network.removeAgent(a);
  expect(success).toBe(false);
});

it("Correctly detects whether agents are in the network or not.", () => {
  const [a, b, c] = [new Agent(), new Agent(), new Agent()];
  network.addAgent(a);
  expect(network.isInNetwork(a)).toBe(true);
  expect(network.isInNetwork(b)).toBe(false);
  expect(network.isInNetwork(c)).toBe(false);
});

it("Correctly connects agents.", () => {
  const [a, b] = [new Agent(), new Agent()];
  network.addAgent(a);
  network.addAgent(b);

  // successful connection returns true
  expect(network.connect(a, b)).toBe(true);

  // unsuccessful connections return false
  // - connecting an agent to itself
  expect(network.connect(a, a)).toBe(false);

  // - connecting an agent to an agent not in the network
  const dummy = new Agent();
  expect(network.connect(a, dummy)).toBe(false);
});

it("Correctly detects whether agents are connected or not.", () => {
  const [a, b, c] = [new Agent(), new Agent(), new Agent()];
  network.addAgent(a);
  network.addAgent(b);
  network.addAgent(c);
  network.connect(a, b);
  expect(network.areConnected(a, b)).toBe(true);
  expect(network.areConnected(a, c)).toBe(false);
  expect(network.areConnected(b, c)).toBe(false);
});

it("Returns null when trying to get neighbors of an agent not in the network.", () => {
  const b = new Agent();
  expect(network.neighbors(b)).toBeNull();
});

it("Correctly returns the neighbors of an agent in the network.", () => {
  const [a, b, c] = [new Agent(), new Agent(), new Agent()];
  network.addAgent(a);
  network.addAgent(b);
  network.addAgent(c);
  network.connect(a, b);
  expect(network.neighbors(a)).toHaveLength(1);
  expect(network.neighbors(a)).toContain(b);
  expect(network.neighbors(b)).toHaveLength(1);
  expect(network.neighbors(b)).toContain(a);
  expect(network.neighbors(c)).toHaveLength(0);
});

// it("Correctly disconnects agents.", () => {
//   // successful disconnect returns true
//   expect(network.disconnect(a0, a1)).toBe(true);
//   expect(network.neighbors(a0)).toHaveLength(0);

//   // unsuccessful connections return false
//   // - connecting an agent to itself
//   expect(network.disconnect(a0, a0)).toBe(false);

//   // - connecting an agent to an agent not in the network
//   const dummy = new Agent();
//   expect(network.disconnect(a0, dummy)).toBe(false);
// });

// it("Correctly completes a network (connecting every agent).", () => {
//   network.addAgent(a3);
//   network.complete();
//   const agents = [a0, a1, a2, a3];
//   agents.forEach((a, i) => {
//     const next = agents[i + 1 === agents.length ? 0 : i + 1];
//     const areConnected = network.areConnected(a, next);
//     expect(areConnected).toBe(true);
//   });
// });

// it("Calling .clear() clears the network of all agents.", () => {
//   network.clear();
//   expect(network.agents).toHaveLength(0);
// });

// it("Correctly adds agents from an environment.", () => {
//   environment.addAgent(a0);
//   environment.addAgent(a1);
//   network.addFromEnvironment(environment);
//   expect(network.agents).toHaveLength(2);
//   expect(network.agents).toContain(a0);
//   expect(network.agents).toContain(a1);
// });

it("Correctly computes clustering coefficients for agents.", () => {
  // null for agents not in the network
  const dne = new Agent();
  expect(network.clusteringCoefficient(dne)).toBeNull();

  const a = new Agent({ key: "a" });
  const b = new Agent({ key: "b" });
  const c = new Agent({ key: "c" });
  const d = new Agent({ key: "d" });
  [a, b, c, d].forEach(agent => network.addAgent(agent));

  // null when an agent has no neighbors
  expect(network.clusteringCoefficient(a)).toBeNull();

  network.complete();
  [(a, b, c, d)].forEach(agent => {
    expect(network.clusteringCoefficient(agent)).toBe(1);
  });

  network.disconnect(b, c);
  network.disconnect(b, d);
  expect(network.clusteringCoefficient(a)).toBe(1 / 3); // 1 connection out of 3 possible

  const e = new Agent({ key: "e" });
  network.addAgent(e);
  network.connect(a, e);
  network.connect(b, e);
  expect(network.clusteringCoefficient(a)).toBe(1 / 3); // 2 connections out of 6 possible
});
