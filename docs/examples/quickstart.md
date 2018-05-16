---
title: Quick Start
---

The quickest way to get started is to simply include this in the `<head>` of your web page:

```html
<script src="/path/to/flocc.js"></script>
```

This gives you access to `flocc` as a global object. Everything you need &mdash; agents, environments, utility functions &mdash; is available off of the `flocc` object. For example, say you want to set up a basic environment and add 20 agents to. In your JavaScript code, you could write this:

```js
const env = new flocc.Environment();
for (let i = 0; i < 20; i++) {
    const agent = new flocc.Agent();
    env.addAgent(agent);
}
```

Right now none of these agents have any data associated with them, other than the environment they are in. But we could also initialize them with, say, an age. For now, this could be a number pulled from a [normal distribution](https://en.wikipedia.org/wiki/Normal_distribution), so that there are a lot of middle-aged agents and only a few young and old ones.

```js
for (let i = 0; i < 20; i++) {
    const agent = new flocc.Agent();
    
    // flocc.utils.gaussian generates a bell-shaped curve,
    // in this case centered at 40 with most values falling within
    // 10 of the mean (i.e. most between 30 and 50)
    let age = flocc.utils.gaussian(40, 10);
    age = Math.round(age);
    agent.set('age', age);

    env.addAgent(agent);
}
```

The last step is to add some sort of rule for how agents behave with each tick of the simulation. What happens over time? Age increases! So let's write a rule for that, and add it to our agents.

```js
function tick(agent) {
    agent.increment('age');
}

// and, again, add this somewhere in the initial for loop:
agent.addRule(tick);
```

Now, suppose that our initialization gave us agents with these ages:

```
30, 34, 35, 38, 30, 38, 53, 42, 17, 32, 33, 42, 59, 40, 54, 36, 59, 18, 34, 27
```

Then, after you tell the environment to update:

```js
env.tick();
```

The agents will have these new ages:

```
31, 35, 36, 39, 31, 39, 54, 43, 18, 33, 34, 43, 60, 41, 55, 37, 60, 19, 35, 28
```

`.tick()` can also take as a parameter the number of units of time you want to progress, so if you call `env.tick(20)` after above, your environment's agents will have these new ages:

```
51, 55, 56, 59, 51, 59, 74, 63, 38, 53, 54, 63, 80, 61, 75, 57, 80, 39, 55, 48
```

How else could we extend this model? Agents could have additional rules that allow them to interact with each other or the environment. Their health could deteriorate as they age, and eventually they might die and be removed from the environment.

At this point, it might be helpful to read through the [documentation]({{ site.baseurl }}/docs) to see what else you can do with agents and environments.