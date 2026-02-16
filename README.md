# Flocc

[![npm version](https://badge.fury.io/js/flocc.svg)](https://www.npmjs.com/package/flocc)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)

**Agent-based modeling in JavaScript.** Build interactive simulations that run in the browser, on the server, or anywhere JavaScript runs.

<p align="center">
  <img src="https://cms.flocc.network/wp-content/uploads/2019/12/flocking-1.gif" alt="Flocking Model" width="400" />
</p>

Flocc makes it easy to create simulations where many autonomous agents interact with each other and their environment, producing emergent behaviors and complex dynamics. Whether you're a researcher, educator, or curious developer, Flocc provides the building blocks to explore complex systems.

**[Examples](https://flocc.net)** · **[Documentation + API Reference](https://docs.flocc.net)**

---

## What is Agent-Based Modeling?

Agent-based modeling (ABM) is a computational technique for simulating systems composed of autonomous, interacting entities called *agents*. Each agent follows simple rules, but their collective behavior can produce surprisingly complex, emergent patterns — much like how flocking birds, traffic jams, or market dynamics emerge from individual decisions.

ABM is used across many fields:
- **Ecology** — predator-prey dynamics, ecosystem modeling
- **Social Science** — opinion formation, segregation patterns, crowd behavior
- **Economics** — market simulations, supply chain dynamics
- **Epidemiology** — disease spread, vaccination strategies
- **Urban Planning** — traffic flow, pedestrian movement

Unlike equation-based models, ABM lets you model heterogeneous agents with different behaviors, observe spatial patterns, and explore "what-if" scenarios interactively.

---

## Features

- 🌐 **Browser-native** — Build interactive, shareable simulations that run anywhere
- 🚀 **Lightweight** — ~150KB minified, no dependencies
- 📊 **Built-in visualization** — Canvas renderer, heatmaps, charts, and tables
- 🗺️ **Spatial environments** — Continuous space, grids, networks, and terrains
- ⏱️ **Flexible scheduling** — Sequential, random, or priority-based agent activation
- 📡 **Event system** — Agents can emit and listen to events
- 🎲 **Seeded randomness** — Reproducible simulations for research
- 📜 **Rule DSL** — Define agent behaviors as composable, declarative data

---

## Quick Start

### Installation

```bash
npm install flocc
```

Or include directly in a browser:

```html
<script src="https://unpkg.com/flocc"></script>
```

### Your First Model: Random Walkers

```javascript
import { Agent, Environment, CanvasRenderer } from 'flocc';

// Create an environment
const environment = new Environment({ width: 400, height: 400 });

// Create 50 agents with random positions
for (let i = 0; i < 50; i++) {
  const agent = new Agent({
    x: Math.random() * 400,
    y: Math.random() * 400,
  });
  
  // Each tick, move in a random direction
  agent.set('tick', (a) => {
    const angle = Math.random() * Math.PI * 2;
    a.set('x', a.get('x') + Math.cos(angle) * 2);
    a.set('y', a.get('y') + Math.sin(angle) * 2);
  });
  
  environment.addAgent(agent);
}

// Render to a canvas
const renderer = new CanvasRenderer(environment, {
  canvas: document.getElementById('canvas'),
  background: '#1a1a2e',
});
renderer.render();

// Run the simulation
function loop() {
  environment.tick();
  renderer.render();
  requestAnimationFrame(loop);
}
loop();
```

That's it! You have agents moving around a 2D space.

---

## Core Concepts

### Agents

Agents are the entities in your simulation. They have properties (data) and behaviors (rules that run each tick).

```javascript
const agent = new Agent({
  x: 100,
  y: 100,
  energy: 50,
  speed: 2,
});

// Access and modify properties
agent.get('energy');        // 50
agent.set('energy', 45);
agent.increment('energy', -5);  // Decrease by 5
```

### Environments

Environments hold agents and define the world they inhabit.

```javascript
const env = new Environment({
  width: 800,
  height: 600,
});

env.addAgent(agent);
env.tick();  // Advance simulation by one step
env.getAgents();  // Get all agents
```

### Behaviors

Define what agents do each tick:

```javascript
// Function-based behavior
agent.set('tick', (agent) => {
  // Your logic here
  agent.set('x', agent.get('x') + 1);
});

// Or use the Rule DSL for declarative behaviors
import { Rule } from 'flocc';

const rule = new Rule(environment, [
  ["set", "x", ["add", ["get", "x"], ["random", -2, 2]]]
]);
agent.set('tick', rule);
```

### Renderers

Visualize your simulation:

```javascript
import { CanvasRenderer, Heatmap, Histogram } from 'flocc';

// 2D canvas for agents
const canvas = new CanvasRenderer(env, { canvas: document.querySelector('canvas') });

// Heatmap for density
const heatmap = new Heatmap(env, { property: 'temperature' });

// Histogram for distributions
const histogram = new Histogram(env, { property: 'energy' });
```

---

## Examples

Explore interactive examples at **[flocc.net](https://flocc.net)**:

- **Flocking** — Boids algorithm with alignment, cohesion, and separation
- **Schelling Segregation** — How mild preferences lead to spatial segregation
- **Predator-Prey** — Lotka-Volterra dynamics with wolves and sheep
- **Epidemic (SIR)** — Disease spread through a population
- **Game of Life** — Conway's cellular automaton
- **Ant Foraging** — Stigmergic behavior with pheromone trails

---

## Resources

- **[Examples Gallery](https://flocc.net)** — Interactive demos and tutorials
- **[API Documentation](https://docs.flocc.net)** — Full API reference
- **[GitHub Discussions](https://github.com/scottpdo/flocc/discussions)** — Ask questions and share ideas
- **[Changelog](./CHANGELOG.md)** — Recent updates and releases

---

## Contributing

Contributions are welcome! Whether it's bug reports, feature requests, documentation improvements, or code contributions:

1. Check [existing issues](https://github.com/scottpdo/flocc/issues) or open a new one
2. Fork the repository
3. Create a branch for your changes
4. Submit a pull request

See the codebase for development setup — it uses Rollup for bundling and Jest for tests.

---

## Citing Flocc

If you use Flocc in academic work, please cite:

> Donaldson, Scott (2021). "Flocc: From Agent-Based Models to Interactive Simulations on the Web." *Northeast Journal of Complex Systems (NEJCS)*, Vol. 3, No. 1, Article 6. DOI: [10.22191/nejcs/vol3/iss1/6](https://doi.org/10.22191/nejcs/vol3/iss1/6)

```bibtex
@article{donaldson2021flocc,
  title={Flocc: From Agent-Based Models to Interactive Simulations on the Web},
  author={Donaldson, Scott},
  journal={Northeast Journal of Complex Systems (NEJCS)},
  volume={3},
  number={1},
  pages={6},
  year={2021},
  doi={10.22191/nejcs/vol3/iss1/6}
}
```

---

## License

[ISC License](./LICENSE) — free for personal and commercial use.
