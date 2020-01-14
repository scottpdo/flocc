const { Agent, Environment } = require("../dist/flocc");
const argv = require("yargs").argv;
let numAgents = argv.agents || 1000;

if (typeof numAgents === "string") {
  if (numAgents.slice(numAgents.length - 1).toLowerCase() === "m") {
    numAgents = +numAgents.slice(0, numAgents.length - 1) * 1000000;
  } else if (numAgents.slice(numAgents.length - 1).toLowerCase() === "k") {
    numAgents = +numAgents.slice(0, numAgents.length - 1) * 1000;
  }
}

function sinceLast() {
  const timing = `${(new Date() - t) / 1000}s`;
  t = new Date();
  return timing;
}

console.log("\n");
console.log(`testing performance with ${numAgents} agents`);
console.log("\n");
let t = new Date();

function profileEnqueue() {
  function increment(agent) {
    agent.increment("x");
  }
  function rule(agent) {
    agent.enqueue(increment);
  }
  const environment = new Environment();
  for (let i = 0; i < numAgents; i++) {
    const agent = new Agent({ x: 0 });
    agent.addRule(rule);
    environment.addAgent(agent);
  }
  console.log(`ENQUEUE: instantiating took ${sinceLast()}`);

  environment.tick(10);
  console.log(`ENQUEUE: ticking took ${sinceLast()}`);
  console.log("\n");
}

function profileReturnValue() {
  function rule(agent) {
    return {
      x: agent.get("x") + 1
    };
  }
  const environment = new Environment();
  for (let i = 0; i < numAgents; i++) {
    const agent = new Agent({ x: 0 });
    agent.addRule(rule);
    environment.addAgent(agent);
  }
  console.log(`RETURN VALUE: instantiating took ${sinceLast()}`);

  environment.tick(10);
  console.log(`RETURN VALUE: ticking took ${sinceLast()}`);
  console.log("\n");
}

profileEnqueue();
profileReturnValue();
