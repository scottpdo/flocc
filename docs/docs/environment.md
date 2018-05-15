---
title: Environment
---

The base `flocc.Environment` class (from here on, just `Environment`) stores agents and runs the simulation over time.

An empty environment can be instantiated by calling: `const environment = new Environment();`

## Methods

### .addAgent(_agent_)

Add an agent to the environment. Since most of the time you will want to add many agents to an environment, doing it within a for loop is most useful:

```js
for (let i = 0; i < 100; i++) {
    environment.addAgent(new Agent());
}
```

### .removeAgent(_agent_)

Remove a previously referenced agent from the environment.

```js
const agent = new Agent();

environment.addAgent(agent);
// the environment now has 101 agents

environment.removeAgent(agent);
// the environment now has 100 agents
```

### .getAgents()

Returns an array of all the agents in the environment, in the order they were added.

### .tick(_n = 1_)

When `.tick` is called, each agent's rule function(s) is/are invoked. If an agent has multiple rule functions, they are all run before moving on to the next agent. After all agents' rule functions have been invoked, any enqueued functions are run.

Agents are looped through in the order they were added to the environment.

If `.tick` is called with no parameters, the environment ticks once. If a parameter 2 or greater is passed, the environment will tick that many times.