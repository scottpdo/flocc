const { Agent, Environment, utils } = require("../dist/flocc");
const { distance, manhattanDistance, random } = utils;

const population = 1000;

const environment = new Environment();

for (let i = 0; i < population; i++) {
  const agent = new Agent();
  agent.set({
    x: random(0, 1000, true),
    y: random(0, 1000, true)
  });
  environment.addAgent(agent);
}

let iters = 0;
const t = Date.now();

for (let a = 0; a < population; a++) {
  for (let b = 0; b < population; b++) {
    distance(environment.getAgents()[a], environment.getAgents()[b]);
    iters++;
  }
}

console.log(`Found ${iters} distances in ${Date.now() - t}ms`);
