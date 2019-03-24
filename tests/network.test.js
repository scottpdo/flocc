const { Agent, Network } = require("../dist/flocc");

const network = new Network();
const a0 = new Agent();
const a1 = new Agent();
const a2 = new Agent();
const a3 = new Agent();

it("Correctly instantiates an empty network.", () => {
  expect(network.size()).toEqual(0);
});

it("Correctly adds agents to a network.", () => {
  network.addAgent(a0);
  expect(network.size()).toEqual(1);
});

it("Correctly removes an agent from the network.", () => {
  network.removeAgent(a0);
  expect(network.size()).toEqual(0);
});

it("Correctly detects whether agents are in the network or not..", () => {
  network.addAgent(a0);
  expect(network.isInNetwork(a0)).toBe(true);
  expect(network.isInNetwork(a1)).toBe(false);
  expect(network.isInNetwork(a2)).toBe(false);
});

it("Correctly connects agents.", () => {
  network.addAgent(a1);
  network.addAgent(a2);

  // successful connection returns true
  expect(network.connect(a0, a1)).toBe(true);

  // unsuccessful connections return false
  // - connecting an agent to itself
  expect(network.connect(a0, a0)).toBe(false);

  // - connecting an agent to an agent not in the network
  const dummy = new Agent();
  expect(network.connect(a0, dummy)).toBe(false);
});

it("Correctly detects whether agents are connected or not.", () => {
  expect(network.areConnected(a0, a1)).toBe(true);
  expect(network.areConnected(a0, a2)).toBe(false);
  expect(network.areConnected(a1, a2)).toBe(false);
});

it("Correctly returns the neighbors of an agent in the network.", () => {
  expect(network.neighbors(a0)).toHaveLength(1);
  expect(network.neighbors(a0)).toContain(a1);
  expect(network.neighbors(a1)).toHaveLength(1);
  expect(network.neighbors(a1)).toContain(a0);
  expect(network.neighbors(a2)).toHaveLength(0);
});

it("Correctly disconnects agents.", () => {
  // successful disconnect returns true
  expect(network.disconnect(a0, a1)).toBe(true);
  expect(network.neighbors(a0)).toHaveLength(0);

  // unsuccessful connections return false
  // - connecting an agent to itself
  expect(network.disconnect(a0, a0)).toBe(false);

  // - connecting an agent to an agent not in the network
  const dummy = new Agent();
  expect(network.disconnect(a0, dummy)).toBe(false);
});

it("Correctly completes a network (connecting every agent).", () => {
  network.addAgent(a3);
  network.complete();
  const agents = [a0, a1, a2, a3];
  agents.forEach((a, i) => {
    const next = agents[i + 1 === agents.length ? 0 : i + 1];
    const areConnected = network.areConnected(a, next);
    expect(areConnected).toBe(true);
  });
});
