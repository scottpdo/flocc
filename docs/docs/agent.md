---
title: Agent
---

The base `flocc.Agent` class (from here on, just `Agent`) contains data about an individual agent in an environment.

An empty agent can be instantiated by calling: `const agent = new Agent();`

## Methods

### .set(_key_, _value_)

Set a piece of data associated with an agent. `key` should be a (unique) string, and `value` can be any type, from numbers and strings to arrays to other agents.

```js
agent.set('color', 'blue');
agent.set('size', 101);
agent.set('friend', otherAgent);
```

### .get(_key_)

Get a piece of data associated with an agent. `key` should be a string corresponding to the piece of data. If the data doesn't exist, will return `undefined`.

```.js
agent.get('color'); // returns 'blue'
```

### .increment(_key_, _n = 1_)

If a piece of data is a (integer) number, calling this will increase the value by 1 (or `n`, if given). If the value has not yet been set, this will automatically set it to 1.

```js
agent.increment('size'); // size is now 102
```

### .decrement(_key_)

The opposite of `.increment`, this will decrease the value by 1 (or `n`, if given). If the value has not yet been set, this will automatically set it to -1.

```js
agent.decrement('size'); // size is now 101
```

### .addRule(_rule_)

Add a rule (a function) to this agent, to be run with every tick of the environment. Multiple rules can be added to the same agent, and they will be invoked in the order they were added. The agent is always passed as the first parameter to the rule function, but additional parameters can be added to be referenced inside the rule function.

```js
agent.addRule(agt => {
    agt.set('color', 'red');
    agt.decrement('size');
});
```

Note that, in the above example, the agent's color and size haven't yet changed &mdash; they're still the values they were prior to adding this rule. However, when the agent's environment ticks (and every time it ticks), this rule function will run, and will update the agent.

### .enqueue(_rule_)

Add a rule function to be run on the _next_ (or at the end of the current) tick of the environment, to be discarded afterward.

If an environment has three agents, each with one rule function, then when the environment ticks, agent #1's rule function runs, followed by #2, followed by #3. Suppose #1's rule function changes something about #1 such that it affects the outcome of #2's rule function. You might instead want all the agents to change something about themselves independent of what the others are _going_ to do on this tick. In that case, you could add a rule (with `.addRule`) that enqueues another rule function to be run and then discarded.

```js
function tick(agent) {
    const average = calculateAverageValue();
    agent.enqueue(agent => {
        agent.set('target', average);
    });
}

agent.addRule(tick);
```

In the above example, each agent calculates some average value, and sets its `target` value to that average. If we had not called `.enqueue` within the rule function (`tick`), then when the first agent in the environment calculates the average and sets its `target`, the second agent might not get the same average value!

Next, read up on [environments]({{ site.baseurl }}/docs/environment).