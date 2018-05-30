---
title: GridEnvironment
---

The class `flocc.GridEnvironment` (from here on, just `GridEnvironment`) is a special case of the [`Environment` class]({{ site.baseurl }}/docs/environment).

A new `GridEnvironment` of size x/y can be instantiated by calling: `const environment = new GridEnvironment(x, y);`

## Methods

Unless indicated otherwise, `GridEnvironment` inherits all the methods from `Environment`.

### .addAgent(_x_, _y_, _agent = new Agent()_)

__This methods overrides `Environment`'s `.addAgent` method.__ The `x` and `y` parameters are required. If the third parameter is left empty, it defaults to an empty agent, on which `.set('x', x)` and `.set('y', y)` are called.

```js
environment.addAgent(0, 0);
// implicitly adds an agent to the cell at 0, 0

const agent = new Agent();
environment.addAgent(3, 2, agent);
// explicitly adds `agent` to the cell at 3, 2
```

### .getAgent(_x_, _y_)

Returns the agent at the cell `x, y`, or `undefined` if the cell is empty.

### .removeAgent(_x_, _y_)

__This methods overrides `Environment`'s `.removeAgent` method.__ Instead of removing agents by reference (as in `Environment`), the agent at the cell `x, y` is removed from the environment.

### .fill()

Fills every cell of the environment with a new, empty agent.

```js
environment.fill();

// this is equivalent to...
for (let x = 0; x < environment.width; x++) {
    for (let y = 0; y < environment.height; y++) {
        environment.addAgent(x, y);
    }
}
```

### .loop(_callback_)

Loops over every cell in the environment, running the callback function at each cell. This is handy if not every cell contains an agent, but you still want to run some code on a cell-by-cell basis.

`callback` is invoked with three parameters: `x`, `y`, and `agent` (if there is one at that cell).

```js
// Loop over every cell. For cells with an x-value greater than 5,
// if there is an agent at that cell, set its color to yellow. If there
// is no agent at that cell, create a new, yellow agent, and add it.
environment.loop((x, y, agent) => {
    if (x > 5) {
        if (agent) {
            agent.set('color', 'yellow');
        } else {
            const agt = new Agent();
            agt.set('color', 'yellow');
            environment.addAgent(x, y, agt);
        }
    }
});
```

### .swap(_x1_, _y1_, _x2_, _y2_)

Swap the agents at the cells with coordinates `x1, y1`, and `x2, y2`, respectively. If both cells are empty, nothing happens. If only one cell is empty, this just moves the agent to the previously empty cell.

```js
const A = environment.get(0, 0);
const B = environment.get(3, 4);

environment.swap(0, 0, 3, 4);
// now B will be the result of calling environment.get(0, 0)
// and A of calling environment.get(3, 4)
```

### .getRandomOpenCell()

If there is at least one open cell, returns an object like `{ x: number, y: number }` corresponding to that cell. Internally, cells are shuffled so that the returned cell should be randomized. 

If every cell already contains an agent, returns `null`.

Next, read how to render a `GridEnvironment` onto a web page using the [`ASCIIRenderer`]({{ site.baseurl }}/docs/asciirenderer).