---
title: Quick Start
---

In this example, we'll create an environment with fifty agents of various ages. We'll include a rule for _life expectancy_ &mdash; agents will generally die around a certain age, but there will be plenty of variation.

The quickest way to get started with `flocc` is to simply download the source file and include this in the `<head>` of your web page:

```html
<script src="/path/to/flocc.js"></script>
```

This gives you access to `flocc` as a global object. Everything you need &mdash; agents, environments, utility functions &mdash; is available off of the `flocc` object. 

We'll create a new basic environment and call it `env`. Then, we'll use a native JavaScript `for` loop to add 50 agents to the environment.

```js
// create the environment
const env = new flocc.Environment();

// loop 50 times...
for (let i = 0; i < 50; i++) {

    // and each time, add a new agent to the environment
    const agent = new flocc.Agent();
    env.addAgent(agent);
}
```

Now we have an environment with 50 agents. But right now, none of these agents have any data associated with them, other than the environment they are in. Let's initialize them with an age. For now, this could be a number pulled from a [normal distribution](https://en.wikipedia.org/wiki/Normal_distribution), so that there are a lot of middle-aged agents and only a few young and old ones.

```js
for (let i = 0; i < 50; i++) {
    const agent = new flocc.Agent();
    
    // flocc.utils.gaussian generates a bell-shaped curve.
    // In this case it's centered at 40 with most values falling within
    // 10 of the mean (i.e. most between 30 and 50)
    let age = flocc.utils.gaussian(40, 10);
    age = Math.round(age);
    agent.set('age', age);

    env.addAgent(agent);
}
```

The last step is to add some sort of rule for how agents behave with each tick of the simulation. A rule is a native JavaScript function that takes as a single parameter the `Agent` for whom the rule is executing.

For our environment, we'll again use a normal distribution to model life expectancy/age of death for our agents. The rule will also increase age.

```js
function tick(agent) {

    // Let the mean age of death be around 80, with most
    // falling between 75 and 85.
    const ageOfDeath = flocc.utils.gaussian(80, 5);

    // If the agent's current age is at or above the age of
    // their death (which changes with each tick of the simulation!),
    // they are dead, so remove them from the simulation.
    if (agent.get('age') >= ageOfDeath) {
        
        env.removeAgent(agent);

    // Otherwise, they live on, but older and wiser.
    } else {
        agent.increment('age');
    }
}

// And don't forget to add this somewhere in the initial `for` loop:
agent.addRule(tick);
```

Now, suppose that our initialization gave us agents with these ages:

```
30, 34, 35, 38, 30, 38, 53, 42, 17, 32, 33, 42, 59, 40, 54, 36, 59, 18, 34, 27...
```

Then, after you tell the environment to update:

```js
env.tick();
```

The agents will have these new ages:

```
31, 35, 36, 39, 31, 39, 54, 43, 18, 33, 34, 43, 60, 41, 55, 37, 60, 19, 35, 28...
```

`.tick()` can also take as a parameter the number of units of time you want to progress, so if you call `env.tick(20)` after above, your environment's agents will have these new ages:

```
51, 55, 56, 59, 51, 59, 74, 63, 38, 53, 54, 63, 80, 61, 75, 57, 80, 39, 55, 48...
```

After enough time, agents will begin dying off as they reach the age of their death. How else could we extend this model? Agents could have additional rules that allow them to interact with each other or the environment. There might also be a rule to add new agents to the environment, whether by birth or by migration.

At this point, it might be helpful to read through the [documentation]({{ site.baseurl }}/docs) to see what else you can do with agents and environments.