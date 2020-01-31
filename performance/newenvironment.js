const { NewEnvironment } = require("../dist/flocc");
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

function profileReturnValue() {
  function rule(agent) {
    return {
      x: agent.get("x") + 1
    };
  }
  const environment = new NewEnvironment();
  environment.addRule(rule);
  for (let i = 0; i < numAgents; i++) {
    environment.addAgent({ x: 0 });
  }
  console.log(`instantiating took ${sinceLast()}`);

  environment.tick(10);
  console.log(`ticking took ${sinceLast()}`);
  console.log("\n");
}

function getAgents() {
  function rule(agent) {
    return {
      x: agent.get("x") + 1
    };
  }
  const environment = new NewEnvironment();
  environment.addRule(rule);
  for (let i = 0; i < numAgents; i++) {
    environment.addAgent({ x: 0 });
  }
  console.log(`instantiating took ${sinceLast()}`);

  const agents = environment.getAgents();
  console.log(`getting agents took ${sinceLast()}`);
  console.log("\n");
}

// profileReturnValue();
getAgents();
